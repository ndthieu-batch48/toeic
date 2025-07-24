from jose import jwt, JWTError
from datetime import datetime, timedelta
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

def verify_otp_helper(otp: str, stored_otp: str, expires_at: datetime) -> bool:
    """Verifies the OTP against the stored OTP and checks if it has expired."""
    if otp != stored_otp:
        return False
    if datetime.now() > expires_at:
        return False
    return True

def generate_otp_action_token(email: str, action: str) -> str:
    expire = datetime.now() + timedelta(minutes=app_config.OTP_EXPIRES_MINUTES)
    to_encode = {
        "sub": email,
        "email": email,
        "action": action,
        "exp": expire
    }
    return jwt.encode(to_encode, app_config.SECRET_KEY, algorithm=app_config.ALGORITHM)

def verify_otp_action_token(token: str):
    try:
        payload = jwt.decode(token, app_config.SECRET_KEY, algorithms=[app_config.ALGORITHM])
        if payload["exp"] < datetime.now().timestamp():
            return None
        return payload
    except JWTError:
        return None