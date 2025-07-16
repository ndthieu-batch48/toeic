from datetime import timedelta, datetime
import random
import string

from ..core.app_config import app_config

def generate_expire_otp(length=6):
    """Generates a random OTP of specified length."""
    characters = string.digits
    otp = ''.join(random.choice(characters) for _ in range(length))
    otp_expire_time = datetime.now() + timedelta(minutes=app_config.OTP_EXPIRES_MINUTES)
    return (otp, otp_expire_time)