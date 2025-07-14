import smtplib
from ..core.smtp_config import smtp_config
from email.message import EmailMessage

def send_email_service(to_email: str):
        msg = build_password_reset_email(smtp_config.GMAIL_SMTP_SERVER, to_email, '') 
        
        with smtplib.SMTP_SSL(smtp_config.GMAIL_SMTP_SERVER, smtp_config.GMAIL_SMTP_PORT) as smtp:
            # smtp.starttls()
            smtp.ehlo()
            print(smtp_config.GMAIL_SENDER, smtp_config.GMAIL_PASSWORD)
            smtp.login(smtp_config.GMAIL_SENDER, smtp_config.GMAIL_PASSWORD)
            smtp.ehlo()
            smtp.send_message(msg)


def build_password_reset_email(sender: str, to_email: str, reset_link: str) -> EmailMessage:
    msg = EmailMessage()
    
    msg["From"] = f"Your App Name {sender}"  # Hiển thị chuyên nghiệp
    msg["To"] = to_email
    msg["Subject"] = "🔐 Reset Your Password"

    msg.set_content(f"""
Hi,

You (or someone else) requested a password reset for your account.
To reset your password, please click the link below or paste it into your browser:

{reset_link}

If you didn’t request this, you can safely ignore this email.

Thanks,
Your App Team
    """.strip())

    return msg
