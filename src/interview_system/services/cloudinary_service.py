import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, status
from fastapi.concurrency import run_in_threadpool
import logging

from interview_system.config.cloudinary_config import settings as cloudinary_settings

# Configure logging for this module
logger = logging.getLogger(__name__)

def configure_cloudinary():
    """Initializes the Cloudinary SDK with credentials from settings."""
    try:
        cloudinary.config(
            cloud_name=cloudinary_settings.CLOUDINARY_CLOUD_NAME,
            api_key=cloudinary_settings.CLOUDINARY_API_KEY,
            api_secret=cloudinary_settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        logger.info("Cloudinary SDK configured successfully.")
    except Exception as e:
        logger.critical(f"Failed to configure Cloudinary: {e}")

async def upload_resume_file(file_contents: bytes, file_name: str, user_id: str) -> str:
    """
    Uploads a resume file to a user-specific folder in Cloudinary.

    Args:
        file_contents: The resume file as bytes.
        file_name: The original name of the file.
        user_id: The ID of the user uploading the file.

    Returns:
        The secure URL of the uploaded file.
    """
    try:
        public_id = f"{cloudinary_settings.CLOUDINARY_FOLDER}/{user_id}/{file_name}"
        
        # Run the synchronous upload method in a thread pool
        upload_result = await run_in_threadpool(
            cloudinary.uploader.upload,
            file_contents,
            resource_type="raw", # Use "raw" for non-image files like PDF/DOCX
            public_id=public_id
        )

        return upload_result.get("secure_url")

    except Exception as e:
        logger.error(f"Cloudinary upload failed for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file."
        )