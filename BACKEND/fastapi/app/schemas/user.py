from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    date_joined: datetime = datetime.now()
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: Optional[str] = None


class TokenRequest(BaseModel):
    token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"


class AccessTokenPayload(BaseModel):
    sub: str 
    user_id: str
    role: str


class RefreshTokenPayload(BaseModel):
    sub: str
    user_id: str
    role: str
    token_type: str


# class ForgotPasswordResponse(BaseModel):
    