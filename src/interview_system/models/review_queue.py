# src/interview_system/models/review_queue.py
import uuid
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from .base import Base


class ReviewQueue(Base):
    __tablename__ = "review_queue"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Stores the full JSON output from the fallback agent
    candidate_question_json = Column(JSONB, nullable=False)

    status = Column(
        String, nullable=False, default="pending", index=True
    )  # e.g., 'pending', 'approved', 'rejected'

    # Tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # You could also link this to the user/session that generated it
