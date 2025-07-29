from re import S
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional
from datetime import datetime


class UserRequestBase(BaseModel):
    username: str
    email: EmailStr


class RegisterRequest(UserRequestBase):
    password: str


class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str

    @field_validator('email')
    def validate_username_or_email(cls, v, values):
        if not v and not values.get('username'):
            raise ValueError('Either username or email must be provided')
        return v


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
    token: str
    new_password: str


class EmailServiceRequest(BaseModel):
    credential: str

    @field_validator('credential')
    @classmethod
    def validate_credential(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Username or email is required')
        return v.strip()


class VerifyOtpServiceRequest(BaseModel):
    otp: str
    request_email: str