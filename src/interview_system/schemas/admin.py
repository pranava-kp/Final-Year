# src/interview_system/schemas/admin.py
import uuid
from datetime import datetime
from typing import Any, List

from pydantic import BaseModel


class ReviewQueueItemResponse(BaseModel):
    id: uuid.UUID
    candidate_question_json: Any  # The full JSON from the agent
    status: str
    created_at: datetime

    class Config:
        from_attributes = True  # Renamed from orm_mode


class ApproveQuestionResponse(BaseModel):
    message: str
    question_id: str
    pinecone_upsert_status: str  # 'success' or 'failed'
