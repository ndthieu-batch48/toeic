from re import S
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


class UserRequestBase(BaseModel):
    username: str
    email: EmailStr


class RegisterRequest(UserRequestBase):
    password: str


class LoginRequest(BaseModel):
    credential: str
    password: str

    @field_validator('credential')
    def validate_username_or_email(cls, v, values):
        if not v and not values.get('credential'):
            raise ValueError('User name or email must be provided')
        return v.strip()


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


class OtpServiceRequest(BaseModel):
    credential_value: str
    credential_type: str
    purpose: str

    @field_validator("credential_value")
    @classmethod
    def validate_credential(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Credential must be a string")
        if not v.strip():
            raise ValueError("Username or email is required")
        return v.strip()


class VerifyOtpServiceRequest(BaseModel):
    otp: str
    purpose: str