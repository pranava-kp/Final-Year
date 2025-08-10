# src/interview_system/orchestration/state.py

from datetime import datetime
from typing import Any, TypedDict
from uuid import UUID

from pydantic import BaseModel, Field


# Using Pydantic for QuestionTurn to get validation within the list
class QuestionTurn(BaseModel):
    question_id: str | None = None
    question_text: str
    ideal_answer_snippet: str | None = None
    answer_text: str | None = None
    answer_audio_ref: str | None = None
    evals: dict[str, Any] | None = Field(default_factory=dict)
    feedback: dict[str, Any] | None = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Using TypedDict for the main graph state is standard for LangGraph
class SessionState(TypedDict):
    session_id: UUID
    user_id: UUID
    resume_summary: dict | None
    job_summary: dict | None
    question_history: list[QuestionTurn]
    current_question: QuestionTurn | None
    personalization_profile: dict | None
    # Timestamps can be managed by the repository layer
