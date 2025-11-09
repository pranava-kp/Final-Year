import httpx
import tempfile
import os
import logging
from langchain_community.document_loaders import PyPDFLoader
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

async def extract_text_from_pdf_url(file_url: str) -> str:
    """
    Downloads a PDF from a URL, saves it temporarily, and extracts all text.
    """
    # Use httpx for asynchronous file downloading
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(file_url)
            response.raise_for_status() # Raise an error for bad responses (4xx, 5xx)
        except httpx.RequestError as e:
            logger.error(f"Failed to download file from URL: {file_url}. Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not retrieve the resume file from storage."
            )

    # Use a temporary file to store the PDF content
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(response.content)
            temp_file_path = temp_file.name

        # Use PyPDFLoader (from your example) to load the text
        loader = PyPDFLoader(temp_file_path)
        documents = loader.load()
        
        # Combine the text from all pages
        full_text = "\n".join([doc.page_content for doc in documents])

        return full_text

    except Exception as e:
        logger.error(f"Failed to parse PDF file from path: {temp_file_path}. Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse the content of the resume file."
        )
    finally:
        # Clean up the temporary file
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)