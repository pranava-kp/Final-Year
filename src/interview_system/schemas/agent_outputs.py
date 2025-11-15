from typing import List
from pydantic import BaseModel, Field, field_validator


# --- NEW: A Generic Schema for Raw Question Data ---
# This is used by both retrieved and generated questions.
class RawQuestionData(BaseModel):
    question_id: str | None = Field(
        None, description="UUID of the question if from DB, null otherwise."
    )
    text: str = Field(..., description="The raw text of the interview question.")
    domain: str = Field(
        ..., description="The domain of the question, e.g., 'system-design'."
    )
    difficulty: int = Field(
        ..., ge=1, le=10, description="Difficulty score from 1 to 10."
    )
    ideal_answer_snippet: str = Field(
        ..., description="A snippet of the ideal answer to guide evaluation."
    )
    rubric_id: str | None = Field(
        None, description="UUID of the associated evaluation rubric."
    )
    relevance_score: float | None = Field(
        None, description="Relevance score from vector search, null if generated."
    )


# --- The output of any question generation/retrieval agent ---
# This now correctly uses the RawQuestionData schema.
class ConversationalQuestionOutput(BaseModel):
    conversational_text: str = Field(
        ..., description="The natural, conversational text to show to the user."
    )
    raw_question: RawQuestionData = Field(
        ..., description="The structured, raw data of the question."
    )


# --- ResumeAnalysisAgent ---
class Skill(BaseModel):
    name: str = Field(
        ..., description="The name of the skill, e.g., 'Python', 'React'."
    )
    confidence: float = Field(..., description="Confidence score from 0.0 to 1.0.")


class Project(BaseModel):
    title: str = Field(..., description="The title of the project.")
    summary: str = Field(..., description="A brief summary of the project.")


class ResumeAnalysisOutput(BaseModel):
    skills: list[Skill]
    topics: list[str]
    experience_summary: str
    projects: list[Project]


# --- JobDescAnalysisAgent ---
class JobDescriptionAnalysisOutput(BaseModel):
    required_skills: list[str] = Field(
        ..., description="List of required skills from the job description."
    )
    seniority: str | None = Field(
        None, description="Inferred seniority level, e.g., 'Junior', 'Senior'."
    )
    keywords: list[str] = Field(
        ..., description="List of must-have keywords or technologies."
    )


# --- FastEvalAgent ---
class FastEvalOutput(BaseModel):
    score: int = Field(
        ..., ge=0, le=100, description="A score from 0 to 100 for the user's answer."
    )
    quick_summary: str = Field(
        ..., description="A one-sentence summary of the feedback."
    )
    success_criteria_met: bool = Field(
        ..., description="Whether the core success criteria were met."
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="The model's confidence in its evaluation."
    )


# --- RubricEvalAgent ---
class RubricItem(BaseModel):
    score: int = Field(
        ..., ge=1, le=10, description="Score for this specific rubric item."
    )
    note: str = Field(..., description="A note explaining the score for this item.")


class RubricEvalOutput(BaseModel):
    per_rubric: dict[str, RubricItem]
    aggregate_score: int = Field(..., ge=0, le=100)
    success_criteria_met: bool
    user_input_needed: bool
    confidence: float = Field(..., ge=0.0, le=1.0)


# --- FeedbackGenAgent ---
class ImprovementPoint(BaseModel):
    bullet: str = Field(..., description="A concise bullet point for improvement.")
    actionable_step: str = Field(
        ..., description="A concrete, actionable step the user can take."
    )


class Resource(BaseModel):
    title: str = Field(
        ..., description="The title of the resource, e.g., an article or video."
    )
    url: str = Field(..., description="The URL to the resource.")


class FeedbackGenOutput(BaseModel):
    improvement_points: list[ImprovementPoint]
    resources: list[Resource]
    practice_exercises: list[str] = Field(
        ..., description="List of relevant practice question IDs."
    )


# --- FollowUpAgent ---
class FollowUpOutput(BaseModel):
    follow_up_required: bool
    question_text: str | None = Field(
        None, description="The text of the follow-up question, if required."
    )


# --- PersonalizationAgent ---
class SessionFocus(BaseModel):
    topic: str = Field(..., description="The topic to focus on in the next session.")
    reason: str = Field(..., description="The reason for this recommendation.")


class PersonalizationOutput(BaseModel):
    next_session_focus: list[SessionFocus]
    recommended_exercises: list[str] = Field(
        ..., description="List of recommended exercise/question IDs."
    )


class QuestionBreakdownItem(BaseModel):
    """A detailed analysis of a single interview question."""

    question_number: int = Field(..., description="The number of the question, e.g., 1")
    question_text: str = Field(..., description="The full text of the question asked.")
    candidate_answer: str = Field(
        ..., description="The candidate's full, verbatim answer."
    )
    evaluation_score: float = Field(
        ...,
        description="The numeric score for this question (e.g., 83.5). Do not include the '%' sign.",
    )
    evaluation_summary: str = Field(
        ..., description="A concise summary of the evaluation for this specific answer."
    )
    feedback_points: List[str] = Field(
        ..., description="A list of specific feedback bullet points for improvement."
    )


class ReportGenOutput(BaseModel):
    """The final structured JSON report for the interview session."""

    overall_summary: str = Field(
        ...,
        description="A comprehensive overview of the candidate's performance during the session.",
    )
    overall_score: float = Field(
        ...,
        description="The final overall numeric score (e.g., 93.35). Do not include the '%' sign.",
    )
    top_3_improvements: List[str] = Field(
        ...,
        description="A list of the top 3 most important areas for improvement for the candidate.",
    )
    question_breakdown: List[QuestionBreakdownItem] = Field(
        ...,
        description="A detailed list, with one entry for each question asked during the interview.",
    )
