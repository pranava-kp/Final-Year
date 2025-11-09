# src/interview_system/api/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# This fixes the 'GOOGLE_API_KEY environment variable not set' error.
from dotenv import load_dotenv
load_dotenv()

# Import routers from the application
from interview_system.auth import router as auth_router
from interview_system.api.routers import interview as interview_router
from interview_system.api.routers import admin as admin_router
# Import the new router for session-related endpoints
from interview_system.api.routers import session as session_router 

# Import the service function to configure Cloudinary
from interview_system.services.cloudinary_service import configure_cloudinary

# Configure logging at the application's entry point
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Create the FastAPI app instance
app = FastAPI(
    title="Multi-Agentic RAG Interview System",
    description="An AI-powered system to help users prepare for interviews.",
    version="1.0.0"
)

# --- CORS (Cross-Origin Resource Sharing) Middleware ---
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Application Startup Event ---
@app.on_event("startup")
def startup_event():
    """
    Actions to perform on application startup.
    This is the ideal place to initialize services.
    """
    logging.info("Application is starting up...")
    configure_cloudinary() # Initialize the Cloudinary SDK

# --- Include API Routers ---
#
# This section is reverted to the "old" style that was working.
# The `prefix="/api"` has been removed.
#
app.include_router(auth_router.router)
app.include_router(interview_router.router)
app.include_router(admin_router.router)
app.include_router(session_router.router) 

@app.get("/", tags=["Root"])
def read_root():
    """
    A simple root endpoint to confirm the API is running.
    """
    return {"status": "API is running"}