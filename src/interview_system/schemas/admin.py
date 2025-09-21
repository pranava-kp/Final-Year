# src/interview_system/schemas/admin.py

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class ReviewQueueItemResponse(BaseModel):
    """Response model for review queue items"""
    id: UUID
    candidate_question_json: Dict[str, Any]
    question_text: str
    domain: Optional[str] = None
    difficulty: Optional[int] = None
    ideal_answer_snippet: Optional[str] = None
    rubric_id: Optional[UUID] = None
    suggested_by: Optional[str] = None
    status: str
    reviewed_by: Optional[UUID] = None
    review_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReviewQueueItemCreate(BaseModel):
    """Request model for creating review queue items"""
    candidate_question_json: Dict[str, Any]
    question_text: str
    domain: Optional[str] = None
    difficulty: Optional[int] = Field(None, ge=1, le=10)
    ideal_answer_snippet: Optional[str] = None
    rubric_id: Optional[UUID] = None
    suggested_by: Optional[str] = None


class ReviewQueueItemUpdate(BaseModel):
    """Request model for updating review queue items"""
    candidate_question_json: Optional[Dict[str, Any]] = None
    question_text: Optional[str] = None
    domain: Optional[str] = None
    difficulty: Optional[int] = Field(None, ge=1, le=10)
    ideal_answer_snippet: Optional[str] = None
    rubric_id: Optional[UUID] = None
    review_notes: Optional[str] = None


class ReviewAction(BaseModel):
    """Request model for approve/reject actions"""
    review_notes: Optional[str] = None


class RubricResponse(BaseModel):
    """Response model for rubrics"""
    id: UUID
    name: str
    domain: Optional[str] = None
    criteria: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RubricCreate(BaseModel):
    """Request model for creating rubrics"""
    name: str
    domain: Optional[str] = None
    criteria: Dict[str, Any]


class RubricUpdate(BaseModel):
    """Request model for updating rubrics"""
    name: Optional[str] = None
    domain: Optional[str] = None
    criteria: Optional[Dict[str, Any]] = None


class AdminStatsResponse(BaseModel):
    """Response model for admin statistics"""
    total_pending: int
    total_approved: int
    total_rejected: int
    approval_rate: float
    total_rubrics: int
    rubrics_by_domain: Dict[str, int]