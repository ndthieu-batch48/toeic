import asyncio
import aiosmtplib
from email.message import EmailMessage
from app.const.email_const import (
    OTP_VERIFY_HTML, OTP_VERIFY_HTML_COMPACT, OTP_VERIFY_PLAIN, OTP_VERIFY_SUBJECT,
    PASSWORD_RESET_HTML, PASSWORD_RESET_PLAIN, PASSWORD_RESET_SUBJECT
)
from app.core.smtp_config import smtp_config

async def send_email_service_async(message: EmailMessage):
    """Async version of email sending using aiosmtplib"""
    try:
        await aiosmtplib.send(
            message,
            hostname=smtp_config.GMAIL_SMTP_SERVER,
            port=smtp_config.GMAIL_SMTP_PORT,
            start_tls=True,
            username=smtp_config.GMAIL_SENDER,
            password=smtp_config.GMAIL_PASSWORD,
        )
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise

def send_email_sync_wrapper(message: EmailMessage):
    """Sync wrapper to run async email sending inside a thread"""
    asyncio.run(send_email_service_async(message))

def build_password_reset_email(to_email: str, otp: str, expiry_minutes: str) -> EmailMessage:
    sender = smtp_config.GMAIL_SENDER
    
    msg = EmailMessage()
    msg["From"] = f"TMA TOEIC <{sender}>"
    msg["To"] = to_email
    msg["Subject"] = PASSWORD_RESET_SUBJECT

    # Format the templates with OTP data
    plain_body = PASSWORD_RESET_PLAIN.format(otp=otp, expiry_minutes=expiry_minutes).strip()
    html_body = PASSWORD_RESET_HTML.format(otp=otp, expiry_minutes=expiry_minutes)

    msg.set_content(plain_body)
    msg.add_alternative(html_body, subtype="html")

    return msg

def build_verify_email_mail(to_email: str, otp: str, expiry_minutes: str = "5") -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = OTP_VERIFY_SUBJECT
    msg["From"] = f"TMA TOEIC <{smtp_config.GMAIL_SENDER}>"
    msg["To"] = to_email
    
    # Use the new OTP templates
    plain_body = OTP_VERIFY_PLAIN.format(otp_code=otp, expiry_minutes=expiry_minutes)
    html_body = OTP_VERIFY_HTML.format(otp_code=otp, expiry_minutes=expiry_minutes)
    
    msg.set_content(plain_body)
    msg.add_alternative(html_body, subtype="html")

    return msg


# Alternative: If you prefer to use the compact version for verification
def build_verify_email_mail_compact(to_email: str, otp: str, expiry_minutes: str = "5") -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = OTP_VERIFY_SUBJECT
    msg["From"] = f"TMA TOEIC <{smtp_config.GMAIL_SENDER}>"
    msg["To"] = to_email
    
    # Use the compact OTP template
    plain_body = OTP_VERIFY_PLAIN.format(otp_code=otp, expiry_minutes=expiry_minutes)
    html_body = OTP_VERIFY_HTML_COMPACT.format(otp_code=otp, expiry_minutes=expiry_minutes)
    
    msg.set_content(plain_body)
    msg.add_alternative(html_body, subtype="html")

    return msg