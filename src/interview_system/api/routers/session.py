from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from interview_system.auth.dependencies import get_current_user
# Import the updated response model
from interview_system.schemas.session import ResumeUploadResponse, StartInterviewRequest, StartInterviewResponse
from interview_system.services.cloudinary_service import upload_resume_file
from interview_system.services.pdf_parser import extract_text_from_pdf_url
# We no longer need the agent
# from interview_system.agents.resume_analyzer import analyze_resume

router = APIRouter(
    prefix="/session",
    tags=["Session Management"],
    responses={404: {"description": "Not found"}},
)

@router.post(
    "/upload_resume",
    response_model=ResumeUploadResponse,
    summary="Upload a Resume File to Cloudinary"
)
async def upload_resume(
    file: UploadFile = File(..., description="The candidate's resume (PDF or DOCX)."),
    current_user: dict = Depends(get_current_user),
):
    # ... (This function remains unchanged)
    if file.content_type not in [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type. Please upload a PDF or DOCX file."
        )
    file_contents = await file.read()
    if len(file_contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 5MB limit."
        )
    file_url = await upload_resume_file(
        file_contents=file_contents,
        file_name=file.filename,
        user_id=str(current_user["user_id"])
    )
    return ResumeUploadResponse(
        message="Resume uploaded successfully.",
        file_url=file_url
    )


@router.post(
    "/start-interview",
    response_model=StartInterviewResponse, # <-- Use the simpler response model
    summary="Parse resume from a file URL or text"
)
async def start_interview(
    request: StartInterviewRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Parses the resume and returns the raw text.
    - If a `file_url` is provided, it downloads and parses the PDF.
    - If `resume_text` is provided, it uses that directly.
    """
    resume_text = ""

    if request.file_url:
        resume_text = await extract_text_from_pdf_url(str(request.file_url))
    elif request.resume_text:
        resume_text = request.resume_text
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'file_url' or 'resume_text' must be provided."
        )

    if not resume_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The provided resume appears to be empty."
        )

    # Return the raw text directly
    return StartInterviewResponse(
        raw_text=resume_text
    )