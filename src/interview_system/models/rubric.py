# src/interview_system/models/rubric.py

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from .base import Base


class Rubric(Base):
    __tablename__ = "rubrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    criteria = Column(JSON, nullable=False)  # JSON object with rubric criteria
    domain = Column(String(100), nullable=True, index=True)  # e.g., "algorithms", "system-design"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), nullable=True)  # Reference to admin user who created it

    def __repr__(self):
        return f"<Rubric(id={self.id}, name='{self.name}', domain='{self.domain}')>"