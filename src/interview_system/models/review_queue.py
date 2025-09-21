# src/interview_system/models/review_queue.py

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base


class ReviewQueueItem(Base):
    __tablename__ = "review_queue"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_question_json = Column(JSON, nullable=False)  # The full question data as JSON
    question_text = Column(Text, nullable=False)  # Extracted question text for easy display
    domain = Column(String(100), nullable=True, index=True)  # e.g., "algorithms", "system-design"
    difficulty = Column(Integer, nullable=True)  # 1-10 scale
    ideal_answer_snippet = Column(Text, nullable=True)
    rubric_id = Column(UUID(as_uuid=True), ForeignKey("rubrics.id"), nullable=True)
    
    # Metadata
    suggested_by = Column(String(100), nullable=True)  # Which agent/system suggested this
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, approved, rejected
    
    # Admin review fields
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)  # Admin user who reviewed
    review_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Relationships
    rubric = relationship("Rubric", backref="review_queue_items")

    def __repr__(self):
        return f"<ReviewQueueItem(id={self.id}, status='{self.status}', domain='{self.domain}')>"