from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers from the application
from interview_system.auth import router as auth_router
from interview_system.api.routers import interview as interview_router
from interview_system.api.routers import admin as admin_router

# Create the FastAPI app instance
app = FastAPI(
    title="Multi-Agentic RAG Interview System",
    description="An AI-powered system to help users prepare for interviews.",
    version="1.0.0"
)

# --- CORS (Cross-Origin Resource Sharing) Middleware ---
# This is essential for allowing the React frontend (running on a different port)
# to communicate with this FastAPI backend.

# Define the list of allowed origins (your frontend's URL)
origins = [
    "http://localhost:3000",  # Default for create-react-app
    "http://localhost:5173",  # Default for Vite + React
    # Add your deployed frontend URL here when you have one
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


# --- Include API Routers ---

# Include the authentication router and other planned routers.
# All routes defined in these files will now be part of your application.
app.include_router(auth_router.router)
app.include_router(interview_router.router)
app.include_router(admin_router.router)


@app.get("/", tags=["Root"])
def read_root():
    """
    A simple root endpoint to confirm the API is running.
    """
    return {"status": "API is running"}
