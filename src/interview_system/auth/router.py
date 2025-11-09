# src/interview_system/auth/router.py

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session


# NOTE: You will need to create these files and functions
from interview_system.models.user import User
from interview_system.repositories.user_repository import UserRepository
from interview_system.api.database import get_db 

from interview_system.schemas.user import UserCreate, UserLogin, UserResponse, Token
from interview_system.auth.password_utils import hash_password, verify_password
from interview_system.auth.jwt_utils import create_access_token, create_refresh_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user and saves them to the database.
    """
    print("--- 1. REGISTER endpoint hit! ---")

    user_repo = UserRepository(db)
    print("--- 2. Database session acquired and repository created. ---")

    existing_user = user_repo.get_by_email(user_data.email)
    print(f"--- 3. Checked for existing user with email: {user_data.email} ---")

    if existing_user:
        print("--- 4a. User exists, raising conflict error. ---")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    new_user = user_repo.create(user_data)
    print("--- 4b. New user created in database. ---")
    return new_user


@router.post("/login", response_model=Token)
def login_for_access_token(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates a user against the database and returns tokens.
    """
    user_repo = UserRepository(db)
    user = user_repo.get_by_email(user_credentials.email)
    
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    token_data = {"user_id": str(user.id), "role": user.role}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data={"user_id": str(user.id)}) # Refresh token can stay simple
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")



@router.post("/logout")
def logout():
    """
    Handles user logout. In a JWT-based system, this is primarily a client-side action.
    This endpoint can be used to invalidate a refresh token if you store them in a denylist.
    """
    # The frontend should delete the tokens from its storage.
    return {"message": "Logout successful. Please delete your tokens."}