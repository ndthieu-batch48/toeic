OTP_VERIFY_SUBJECT = "🔐 Your TMA TOEIC Verification Code"

OTP_VERIFY_HTML = """\
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TMA TOEIC - Verification Code</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">TMA TOEIC</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Your English Learning Partner</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px;">
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Verification Code</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          Hi there! 👋
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          To complete your account verification, please use the following 6-digit code:
        </p>
        
        <!-- OTP Code Box -->
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
          <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
            <span style="font-size: 36px; font-weight: 700; color: #333; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              {otp_code}
            </span>
          </div>
        </div>
        
        <!-- Timer and Instructions -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 25px 0;">
          <p style="color: #856404; font-size: 14px; margin: 0; font-weight: 600;">
            ⏰ This code will expire in <strong>{expiry_minutes} minutes</strong>
          </p>
        </div>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
          Simply enter this code in the app to verify your account and start your TOEIC preparation journey!
        </p>
        
        <!-- Security Notice -->
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 25px 0;">
          <h3 style="color: #1976d2; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
            🔒 Security Note
          </h3>
          <p style="color: #1976d2; font-size: 14px; margin: 0; line-height: 1.5;">
            Never share this code with anyone. TMA TOEIC staff will never ask for your verification code.
          </p>
        </div>
        
        <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
          If you didn't request this code, please ignore this email or contact our support team.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #666; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">
          Best regards,<br>
          <span style="color: #667eea;">The TMA TOEIC Team</span>
        </p>
        <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
          © 2025 TMA TOEIC. All rights reserved.
        </p>
      </div>
      
    </div>
  </body>
</html>
"""

OTP_VERIFY_PLAIN = """\
🔐 TMA TOEIC - Verification Code

Hi there! 👋

To complete your account verification, please use the following 6-digit code:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                {otp_code}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ This code will expire in {expiry_minutes} minutes.

Simply enter this code in the app to verify your account and start your TOEIC preparation journey!

🔒 Security Note:
Never share this code with anyone. TMA TOEIC staff will never ask for your verification code.

If you didn't request this code, please ignore this email or contact our support team.

Best regards,
The TMA TOEIC Team

© 2025 TMA TOEIC. All rights reserved.
"""

# Alternative shorter version if needed
OTP_VERIFY_HTML_COMPACT = """\
<html>
  <body style="font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px;">
    <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">TMA TOEIC</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Verification Code</p>
      </div>
      
      <div style="padding: 30px;">
        <p style="font-size: 16px; margin: 0 0 20px 0;">Hi! 👋</p>
        <p style="font-size: 16px; margin: 0 0 25px 0;">Your verification code is:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 6px; font-family: monospace;">
            {otp_code}
          </span>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center; margin: 20px 0;">
          ⏰ Expires in {expiry_minutes} minutes
        </p>
        
        <p style="font-size: 14px; color: #999; margin: 20px 0 0 0;">
          Don't share this code with anyone. If you didn't request this, please ignore this email.
        </p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          Best regards,<br><strong>The TMA TOEIC Team</strong>
        </p>
      </div>
      
    </div>
  </body>
</html>
"""

# Email Constants
PASSWORD_RESET_SUBJECT = "🔐 Reset Your TMA TOEIC Password"

PASSWORD_RESET_PLAIN = """\
🔐 TMA TOEIC - Password Reset Code

Hi there! 👋

To reset your password, please use the following 6-digit code:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                {otp}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ This code will expire in {expiry_minutes} minutes.

Simply enter this code in the app to reset your password and regain access to your account.

🔒 Security Note:
Never share this code with anyone. TMA TOEIC staff will never ask for your reset code.

If you didn't request this password reset, please ignore this email or contact our support team.

Best regards,
The TMA TOEIC Team

© 2025 TMA TOEIC. All rights reserved.
"""

PASSWORD_RESET_HTML = """\
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TMA TOEIC - Password Reset</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">TMA TOEIC</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Password Reset</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px;">
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">🔐 Reset Your Password</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          Hi there! 👋
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          To reset your password, please use the following 6-digit code:
        </p>
        
        <!-- OTP Code Box -->
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
          <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
            <span style="font-size: 36px; font-weight: 700; color: #333; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              {otp}
            </span>
          </div>
        </div>
        
        <!-- Timer and Instructions -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 25px 0;">
          <p style="color: #856404; font-size: 14px; margin: 0; font-weight: 600;">
            ⏰ This code will expire in <strong>{expiry_minutes} minutes</strong>
          </p>
        </div>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
          Simply enter this code in the app to reset your password and regain access to your account.
        </p>
        
        <!-- Security Notice -->
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 25px 0;">
          <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
            🔒 Security Note
          </h3>
          <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
            Never share this code with anyone. TMA TOEIC staff will never ask for your reset code.
          </p>
        </div>
        
        <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
          If you didn't request this password reset, please ignore this email or contact our support team.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #666; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">
          Best regards,<br>
          <span style="color: #dc3545;">The TMA TOEIC Team</span>
        </p>
        <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
          © 2025 TMA TOEIC. All rights reserved.
        </p>
      </div>
      
    </div>
  </body>
</html>
"""