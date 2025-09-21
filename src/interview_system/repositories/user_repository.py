# src/interview_system/repositories/user_repository.py

from sqlalchemy.orm import Session
from uuid import UUID
from interview_system.models.user import User
from interview_system.schemas.user import UserCreate
from interview_system.auth.password_utils import hash_password

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        """
        Retrieves a user from the database by their email.
        """
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: str | UUID) -> User | None:
        """
        Retrieves a user from the database by their ID.
        """
        return self.db.query(User).filter(User.id == user_id).first()

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