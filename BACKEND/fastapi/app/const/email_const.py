EMAIL_VERIFY_SUBJECT = "Verify Your Email Address"
EMAIL_VERIFY_TEMPLATE = """\
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <p>Hi,</p>
    <p>Thanks for signing up! Please confirm your email address by clicking the button below:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{verify_url}" 
         style="background-color: #007BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Verify Email
      </a>
    </p>
    <p>If the button doesn’t work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all;">{verify_url}</p>
    <br>
    <p>Best regards,<br>The TMA TOEIC Team</p>
  </body>
</html>
"""

EMAIL_VERIFY_PLAIN = """\
Hi,

Thanks for signing up! Please verify your email address by clicking the link below:

{verify_url}

If you didn't request this, you can ignore this email.

Best regards,
The TMA TOEIC Team
"""


PASSWORD_RESET_SUBJECT = "🔐 Reset Your Password"

PASSWORD_RESET_PLAIN = """\
Hi,

We received a request to reset the password for your account.
To proceed, click the link below or copy and paste it into your browser:

{reset_link}

If you didn't request this, please ignore this message. Your account remains safe and unchanged.

Best regards,  
TMA TOEIC Team
"""

PASSWORD_RESET_HTML = """\
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <p>Hi,</p>
    <p>We received a request to reset the password for your account.</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{reset_link}" 
         style="background-color: #DC3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Reset Password
      </a>
    </p>
    <p>If the button doesn’t work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all;">{reset_link}</p>
    <br>
    <p>Best regards,<br>TMA TOEIC Team</p>
  </body>
</html>
"""