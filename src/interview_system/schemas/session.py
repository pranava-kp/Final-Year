# src/interview_system/schemas/session.py

import uuid
from typing import Optional, Any, Dict

from pydantic import BaseModel, Field, HttpUrl

# NEW IMPORT: Need the structured feedback output from agent_outputs
from .agent_outputs import FeedbackGenOutput 

# No longer importing ResumeAnalysisOutput

class ResumeUploadResponse(BaseModel):
    """
    Pydantic model for the response after uploading a resume PDF.
    """
    file_url: HttpUrl = Field(..., description="The public URL of the uploaded resume.")
    file_id: str = Field(..., description="The unique ID for the uploaded file.")
    message: str = "Resume uploaded successfully"

    class Config:
        from_attributes = True


class StartInterviewRequest(BaseModel):
    """
    Pydantic model for the request to start a new interview.
    """
    file_url: Optional[HttpUrl] = Field(
        None, 
        description="A URL to a PDF resume (e.g., from Cloudinary)."
    )
    resume_text: Optional[str] = Field(
        None, 
        description="Plain text of the resume."
    )
    job_description: Optional[str] = Field(
        None, 
        description="The job description to tailor the interview."
    )

    class Config:
        from_attributes = True


class StartInterviewResponse(BaseModel):
    """
    Pydantic model for the response after starting an interview.
    """
    session_id: str = Field(..., description="The unique ID for the new session.")
    first_question: str = Field(..., description="The first question for the user.")

    class Config:
        from_attributes = True


class SubmitAnswerRequest(BaseModel):
    """
    Pydantic model for the request to submit an answer.
    """
    answer_text: str = Field(..., description="The user's text answer.")

    class Config:
        from_attributes = True


# --- NEW CLASS FOR NESTED QUESTION DETAILS ---
class QuestionInSessionResponse(BaseModel):
    """
    Schema for a question object returned in the interview session response,
    including session-specific history fields from the full process.
    """
    question_id: Optional[str] = Field(None, description="UUID of the question if from DB, null otherwise.")
    conversational_text: str = Field(..., description="The natural, conversational text to show to the user.")
    raw_question_text: str = Field(..., description="The raw, un-formatted text of the interview question.")
    ideal_answer_snippet: str = Field(..., description="A snippet of the ideal answer for internal guidance/evaluation.")
    answer_text: Optional[str] = Field(None, description="The user's submitted text answer for this question.")
    answer_audio_ref: Optional[str] = Field(None, description="Reference to the user's submitted audio answer, if applicable.")
    evals: Dict[str, Any] = Field(..., description="A dictionary of all evaluation outputs for the last answer.")
    feedback: Dict[str, Any] = Field(..., description="A dictionary of aggregated feedback for the last answer.")
    timestamp: str = Field(..., description="ISO 8601 timestamp of when the question was processed.")

    class Config:
        from_attributes = True
# --- END OF NEW CLASS ---


class SubmitAnswerResponse(BaseModel):
    """
    Pydantic model for the response after submitting an answer.
    The response now includes structured feedback and a detailed next question object.
    """
    # Replaces simple string feedback with structured FeedbackGenOutput
    feedback: FeedbackGenOutput = Field(..., description="Structured feedback including improvement points, resources, and practice exercises.")
    # Replaces simple string next_question/follow_up_question with detailed object
    next_question: Optional[QuestionInSessionResponse] = Field(
        None,
        description="The detailed object for the next question in the interview."
    )
    # Replaces 'status' with the requested 'is_finished' boolean
    is_finished: bool = Field(..., description="True if the interview is finished, False otherwise.")


    class Config:
        from_attributes = True

# --- ADD THIS CLASS ---
class ReportResponse(BaseModel):
    """
    Pydantic model for the final interview report.
    """
    session_id: str
    final_report: Optional[Dict[str, Any]]
    personalization_profile: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True
# --- END OF ADDITION ---