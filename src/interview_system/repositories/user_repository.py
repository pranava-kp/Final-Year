# src/interview_system/repositories/user_repository.py

import uuid
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.user import User  # Fixed relative import
from ..schemas.user import UserCreate
from ..auth.password_utils import hash_password

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def create(self, user_create: UserCreate) -> User:
        hashed = hash_password(user_create.password)
        new_user = User(
            name=user_create.name,
            email=user_create.email,
            hashed_password=hashed
            # Assuming 'role' defaults to 'candidate' in your model.
            # If not, add: role="candidate"
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user

    def update_personalization_profile(
        self, user_id: uuid.UUID, profile: Dict[str, Any]
    ) -> bool:
        user = self.get_by_id(user_id)
        if not user:
            return False
        user.personalization_profile = profile
        self.db.commit()
        return True

    def get_personalization_profile(
        self, user_id: uuid.UUID
    ) -> Optional[Dict[str, Any]]:
        user = self.get_by_id(user_id)
        if not user:
            return None
        return user.personalization_profile

    # --- NEW METHOD ---
    def count_by_role(self, role: str) -> int:
        """
        Returns the number of users with a specific role.
        """
        return self.db.query(User).filter(User.role == role).count()