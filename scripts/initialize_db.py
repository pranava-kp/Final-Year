# scripts/initialize_db.py

import os
import sys
from urllib.parse import urlparse

from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import SessionLocal to interact with the database
from interview_system.api.database import create_all_tables, SessionLocal
from interview_system.models.user import User  # Ensure User model is imported
from interview_system.config.db_config import db_settings

def create_database_if_not_exists():
    """
    Connects to the database server and creates the specified database if it doesn't exist.
    """
    db_url = db_settings.DATABASE_URL
    parsed_url = urlparse(db_url)
    db_name = parsed_url.path.lstrip('/')
    server_url = f"{parsed_url.scheme}://{parsed_url.netloc}/"
    
    if 'postgresql' in parsed_url.scheme:
        server_url += 'postgres'

    engine = create_engine(server_url, isolation_level="AUTOCOMMIT")

    try:
        with engine.connect() as connection:
            print(f"Checking if database '{db_name}' exists...")
            connection.execute(text(f"CREATE DATABASE {db_name}"))
            print(f"Database '{db_name}' created successfully.")
    except ProgrammingError as e:
        if "already exists" in str(e):
            print(f"Database '{db_name}' already exists. Skipping creation.")
        else:
            print(f"An unexpected database error occurred: {e}")
            raise

def add_initial_users():
    """
    Adds a default admin and candidate user to the database if they don't already exist.
    """
    db = SessionLocal()
    try:
        print("Checking for and adding initial users...")

        # User 1: Admin
        admin_email = "boss@xyz.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            new_admin = User(
                name="Pranava Admin",
                email=admin_email,
                hashed_password="$2b$12$kjJN2H8jvJGcE1a9FB6bBuFthsXyPeraDWuB9kYQtNjB1llTG3SiG",
                role="admin"
            )
            db.add(new_admin)
            print("- Admin user 'Pranava Admin' created.")
        else:
            print("- Admin user 'Pranava Admin' already exists.")

        # User 2: Candidate
        candidate_email = "corporatemajdoor@xyz.com"
        candidate_user = db.query(User).filter(User.email == candidate_email).first()
        if not candidate_user:
            new_candidate = User(
                name="Pranava Candidate",
                email=candidate_email,
                hashed_password="$2b$12$pcMd1nJGcWMaTiOtXxdrw.YmZHHEZlO0f.veeN8dlgbJbuC0ZD/WW"
                # Role will default to 'candidate' as defined in the model
            )
            db.add(new_candidate)
            print("- Candidate user 'Pranava Candidate' created.")
        else:
            print("- Candidate user 'Pranava Candidate' already exists.")

        db.commit()
    finally:
        db.close()

def main():
    """
    Main function to initialize the database, create tables, and add initial users.
    """
    # 1. Ensure the database itself exists
    create_database_if_not_exists()
    
    # 2. Create all the tables within the database
    print("Connecting to the database and creating tables...")
    create_all_tables()
    print("Tables created successfully!")

    # 3. Add the initial users to the users table
    add_initial_users()
    
    print("Database initialization complete!")

if __name__ == "__main__":
    main()