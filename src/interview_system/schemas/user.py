# src/interview_system/schemas/user.py

from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    role:str

    # Updated from 'class Config: orm_mode = True'
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"