import os
from dotenv import load_dotenv

load_dotenv("/home/fred/dev/toeic/BACKEND/fastapi/.env")

class SmtpConfig:
    CLIENT_HOST = os.getenv("CLIENT_HOST", '')
    
    OUTLOOK_SENDER = os.getenv("OUTLOOK_SENDER", '')
    OUTLOOK_PASSWORD = os.getenv("OUTLOOK_PASSWORD", '')
    OUTLOOK_SMTP_SERVER = "smtp-mail.outlook.com"
    OUTLOOK_SMTP_PORT = 587

    GMAIL_SENDER = "nduongtrunghieu@gmail.com" # os.getenv("GMAIL_SENDER", "")
    GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD", "gqmc vpjd sthg jysz")
    GMAIL_SMTP_SERVER = "smtp.gmail.com"
    GMAIL_SMTP_PORT = 465

    YAHOO_SENDER = os.getenv("YAHOO_SENDER", '')
    YAHOO_PASSWORD = os.getenv("YAHOO_PASSWORD", '')
    YAHOO_SMTP_SERVER = "smtp.mail.yahoo.com"
    YAHOO_SMTP_PORT = 465
    
smtp_config = SmtpConfig()