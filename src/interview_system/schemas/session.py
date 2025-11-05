# src/interview_system/schemas/session.py

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Any, Dict # <-- Import Any, Dict
import uuid

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


class SubmitAnswerResponse(BaseModel):
    """
    Pydantic model for the response after submitting an answer.
    """
    feedback: str = Field(..., description="Immediate feedback on the answer.")
    next_question: Optional[str] = Field(
        None, 
        description="The next question in the interview."
    )
    follow_up_question: Optional[str] = Field(
        None, 
        description="A follow-up question, if needed."
    )
    # Adding a status to help the frontend
    status: str = Field("in_progress", description="Status: 'in_progress' or 'finished'")


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