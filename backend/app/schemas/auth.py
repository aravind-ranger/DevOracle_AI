from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    email: Optional[EmailStr] = None

class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    avatar_url: Optional[str] = None
    provider: str
    has_github_token: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class RefreshRequest(BaseModel):
    refresh_token: str
