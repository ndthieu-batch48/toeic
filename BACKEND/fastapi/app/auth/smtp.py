import logging
import smtplib
from ..core.config import settings
import asyncio
from email.message import EmailMessage
# from aiosmtplib import SMTP

mail = "tma-batch48@outlook.com"
password = settings.SMTP_PASSWORD
SMTP_SERVER = "smtp-mail.outlook.com" #"smtp.office365.com"
SMTP_PORT = 587

logger = logging.getLogger(__name__)

def send_email_service(to_email: str, subject: str, body: str):
    msg = EmailMessage()
    msg["From"] = "your_email@gmail.com"
    msg["To"] = "receiver@example.com"
    msg["Subject"] = "Test"
    msg.set_content("Hello!")
    
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(mail, "jxmzlxnbtrxflobc")
        smtp.send_message(msg)
        smtp.quit()
        logger.info(f"Email sent successfully to {to_email}")
    
