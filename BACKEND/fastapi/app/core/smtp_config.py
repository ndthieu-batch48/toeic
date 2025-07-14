import os
from dotenv import load_dotenv

load_dotenv()

class SmtpConfig:
    CLIENT_HOST = os.getenv("CLIENT_HOST", '')

    GMAIL_SENDER = os.getenv("GMAIL_SENDER", "")
    GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD", "")
    GMAIL_SMTP_SERVER = "smtp.gmail.com"
    GMAIL_SMTP_PORT = 587

smtp_config = SmtpConfig()