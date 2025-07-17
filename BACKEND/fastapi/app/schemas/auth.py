from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserRequestBase(BaseModel):
    username: str
    email: EmailStr


class RegisterRequest(UserRequestBase):
    password: str


class LoginRequest(BaseModel):
    username: str
    email: Optional[EmailStr] = None
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


class AccessTokenRequest(BaseModel):
    sub: str 
    user_id: str
    role: str


class RefreshTokenRequest(BaseModel):
    sub: str
    user_id: str
    role: str
    token_type: str


class ResetPasswordRequest(BaseModel):
    otp: str
    new_password: str


class EmailServiceRequest(BaseModel):
    request_email: str


class VerifyOtpServiceRequest(BaseModel):
    otp: str
    request_email: str