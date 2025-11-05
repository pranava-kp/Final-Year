# src\interview_system\schemas\session.py
from pydantic import BaseModel, HttpUrl
from typing import Optional
# No longer importing ResumeAnalysisOutput

class ResumeUploadResponse(BaseModel):
    """
    Defines the response structure after a resume is successfully uploaded.
    """
    message: str
    file_url: HttpUrl

class StartInterviewRequest(BaseModel):
    """
    Defines the request for starting an interview.
    Must provide one of file_url or resume_text.
    """
    file_url: Optional[HttpUrl] = None
    resume_text: Optional[str] = None

class StartInterviewResponse(BaseModel):
    """
    Defines the response for a successful text extraction.
    """
    raw_text: str