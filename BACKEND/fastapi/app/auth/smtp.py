import aiosmtplib
from email.message import EmailMessage
from app.const.email_const import (
    EMAIL_VERIFY_PLAIN, EMAIL_VERIFY_SUBJECT, EMAIL_VERIFY_TEMPLATE,
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

def build_password_reset_email(to_email: str, reset_token: str) -> EmailMessage:
    sender = smtp_config.GMAIL_SENDER
    reset_link = f"{smtp_config.CLIENT_HOST}/reset-password?token={reset_token}"
    
    msg = EmailMessage()
    msg["From"] = f"TMA TOEIC {sender}"
    msg["To"] = to_email
    msg["Subject"] = PASSWORD_RESET_SUBJECT

    # Plain text fallback
    plain_body = PASSWORD_RESET_PLAIN.format(reset_link=reset_link).strip()
    html_body = PASSWORD_RESET_HTML.format(reset_link=reset_link)

    msg.set_content(plain_body)
    msg.add_alternative(html_body, subtype="html")

    return msg

def build_verify_email_mail(to_email: str, verify_token: str) -> EmailMessage:
    verify_url = f"{smtp_config.CLIENT_HOST}/verify-email?token={verify_token}"

    subject = EMAIL_VERIFY_SUBJECT
    plain_body = EMAIL_VERIFY_PLAIN.format(verify_url=verify_url)
    html_body = EMAIL_VERIFY_TEMPLATE.format(verify_url=verify_url)

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = smtp_config.GMAIL_SENDER
    msg["To"] = to_email
    msg.set_content(plain_body)
    msg.add_alternative(html_body, subtype="html")

    return msg