from fastapi import HTTPException, status
from jose import jwt, JWTError, ExpiredSignatureError
from datetime import timedelta, datetime
import random
import string

from ..core.app_config import app_config

def generate_expire_otp_helper(length=6):
    """Generates a random OTP of specified length."""
    characters = string.digits
    otp = ''.join(random.choice(characters) for _ in range(length))
    otp_expire_time = datetime.now() + timedelta(minutes=app_config.OTP_EXPIRES_MINUTES)
    return (otp, otp_expire_time)


def generate_otp_purpose_token(user_id: str, purpose: str) -> str:
    expire = datetime.now() + timedelta(minutes=app_config.OTP_EXPIRES_MINUTES)
    to_encode = {
        "sub": str(user_id),
        "purpose": purpose,
        "exp": expire.timestamp()
    }
    return jwt.encode(to_encode, app_config.SECRET_KEY, algorithm=app_config.ALGORITHM)


def verify_otp_action_token(token: str):
    try:
        payload=jwt.decode(token, app_config.SECRET_KEY, algorithms=[app_config.ALGORITHM])
    
        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token not found, session expired"
            )
        return payload
    except ExpiredSignatureError as e:
        raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Session expired",
                    "error": str(e),
                },
            )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Invalid token",
                "error": str(e),
            },
        )

