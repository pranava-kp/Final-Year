# src/interview_system/models/user.py
# alembic revision --autogenerate -m "Add personalization_profile to user"
import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, server_default='candidate')
    personalization_profile = Column(JSONB, nullable=True)