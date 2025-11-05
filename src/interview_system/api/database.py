# src/interview_system/api/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from interview_system.config.db_config import db_settings
from interview_system.models.base import Base
from sqlalchemy import create_engine
from contextlib import contextmanager # <-- This is now used

# Create the SQLAlchemy engine that will connect to the database
engine = create_engine(db_settings.DATABASE_URL)

# Create a configured "Session" class
# We make sure this is exported so other files can use it
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_all_tables():
    """
    A utility function to create all database tables based on the models.
    """
    Base.metadata.create_all(bind=engine)

def get_db():
    """
    FastAPI dependency to get a database session.
    It ensures the database session is always closed after the request.
    (This is your original, working 'core infra' function)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ADD THIS FUNCTION ---
@contextmanager
def get_db_session():
    """
    Provide a transactional scope around a series of operations
    for use outside of FastAPI dependencies (e.g., in graph nodes).
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
# --- END OF ADDITION ---