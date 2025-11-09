# src/interview_system/repositories/user_repository.py

import uuid
from typing import Dict, Any, Optional # <-- Import Optional
from sqlalchemy.orm import Session
from interview_system.models.user import User
from interview_system.schemas.user import UserCreate
from interview_system.auth.password_utils import hash_password

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: uuid.UUID) -> User | None:
        """
        Retrieves a user from the database by their ID.
        """
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        """
        Retrieves a user from the database by their email.
        """
        return self.db.query(User).filter(User.email == email).first()

    def create(self, user_create: UserCreate) -> User:
        """
        Creates a new user in the database.
        """
        hashed = hash_password(user_create.password)
        new_user = User(
            name=user_create.name,
            email=user_create.email,
            hashed_password=hashed
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user

    def update_personalization_profile(
        self, user_id: uuid.UUID, profile: Dict[str, Any]
    ) -> bool:
        """
        Finds a user by their ID and updates their personalization_profile.
        """
        user = self.get_by_id(user_id)
        if not user:
            return False
        
        # This writes to the new JSONB column
        user.personalization_profile = profile
        self.db.commit()
        return True

    # --- ADD THIS METHOD ---
    # This is missing but your interview.py router needs it.
    def get_personalization_profile(
        self, user_id: uuid.UUID
    ) -> Optional[Dict[str, Any]]:
        """
        Finds a user by their ID and returns only their personalization_profile.
        """
        user = self.get_by_id(user_id)
        if not user:
            return None
        return user.personalization_profile
    # --- END OF ADDITION ---