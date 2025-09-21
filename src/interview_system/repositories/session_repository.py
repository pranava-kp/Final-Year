# src/interview_system/repositories/session_repository.py

from typing import Optional, List
from sqlalchemy.orm import Session
from interview_system.models.session import InterviewSession
from interview_system.api.database import get_db

class SessionRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_session(self, session_data: dict) -> InterviewSession:
        """Create a new interview session"""
        session = InterviewSession(**session_data)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session
    
    def get_session_by_id(self, session_id: int) -> Optional[InterviewSession]:
        """Get session by ID"""
        return self.db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    
    def get_sessions_by_user(self, user_id: int) -> List[InterviewSession]:
        """Get all sessions for a user"""
        return self.db.query(InterviewSession).filter(InterviewSession.user_id == user_id).all()
    
    def update_session(self, session_id: int, update_data: dict) -> Optional[InterviewSession]:
        """Update session data"""
        session = self.get_session_by_id(session_id)
        if session:
            for key, value in update_data.items():
                setattr(session, key, value)
            self.db.commit()
            self.db.refresh(session)
        return session
    
    def delete_session(self, session_id: int) -> bool:
        """Delete a session"""
        session = self.get_session_by_id(session_id)
        if session:
            self.db.delete(session)
            self.db.commit()
            return True
        return False