# src/interview_system/api/routers/interview.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from interview_system.api.database import get_db
from interview_system.auth.dependencies import get_current_user
from interview_system.repositories.session_repository import SessionRepository
from interview_system.models.user import User

router = APIRouter(
    prefix="/interviews",
    tags=["Interviews"]
)

@router.get("/")
def get_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all interviews for the current user"""
    session_repo = SessionRepository(db)
    sessions = session_repo.get_sessions_by_user(current_user.id)
    return {"interviews": sessions}

@router.post("/")
def create_interview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new interview session"""
    session_repo = SessionRepository(db)
    session_data = {
        "user_id": current_user.id,
        "title": "New Interview Session",
        "description": "Interview session created",
        "status": "pending"
    }
    session = session_repo.create_session(session_data)
    return {"message": "Interview session created", "session_id": session.id}

@router.get("/{session_id}")
def get_interview(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific interview session"""
    session_repo = SessionRepository(db)
    session = session_repo.get_session_by_id(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {"session": session}