from datetime import datetime
from typing import Annotated, Any, TypedDict

from pydantic import BaseModel, Field


# Using Pydantic for QuestionTurn to get validation within the list
class QuestionTurn(BaseModel):
    question_id: str | None = None
    conversational_text: str
    raw_question_text: str
    ideal_answer_snippet: str | None = None
    answer_text: str | None = None
    answer_audio_ref: str | None = None
    evals: dict[str, Any] = Field(default_factory=dict)
    feedback: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


def merge_question_updates(
    left: QuestionTurn | None, right: QuestionTurn | dict | None
) -> QuestionTurn | None:
    """
    Reducer function to robustly merge updates to the current_question.
    It handles both full object updates and partial, nested updates from parallel nodes.
    """
    # If the new update is a full QuestionTurn object, it completely replaces the old one.
    # This is critical for the follow-up logic to work correctly.
    if isinstance(right, QuestionTurn):
        return right

    if right is None:
        return None

    if left is None:
        # This branch handles the CREATION of a new QuestionTurn object from a dict
        return QuestionTurn(**right)

    # This branch handles UPDATES to an existing QuestionTurn object from a dict
    right_dict = right
    merged = left.model_copy(deep=True)

    # Deep merge the 'evals' and 'feedback' dictionaries
    if "evals" in right_dict and right_dict["evals"]:
        merged.evals.update(right_dict["evals"])
    if "feedback" in right_dict and right_dict["feedback"]:
        merged.feedback.update(right_dict["feedback"])

    # Update any other top-level fields from the new update
    for key, value in right_dict.items():
        if key not in ["evals", "feedback"]:  # value can be None to clear fields
            setattr(merged, key, value)

    return merged


# Using TypedDict for the main graph state is standard for LangGraph
class SessionState(TypedDict):
    session_id: str
    user_id: str
    namespace: str | None
    initial_resume_text: str | None
    initial_job_description_text: str | None
    current_rubric: dict | None
    current_topic: str | None
    final_report: dict | None
    resume_summary: dict | None
    job_summary: dict | None
    interview_plan: list[str]
    question_history: list[QuestionTurn]
    personalization_profile: dict | None
    next_question_override: QuestionTurn | None  # For the robust follow-up logic

    # ANNOTATED KEY: This applies the reducer to the current_question field
    current_question: Annotated[
        QuestionTurn | None,
        merge_question_updates,
    ]
