"""User and authentication related queries"""

SELECT_USER_BY_USERNAME = """
    SELECT id, username, email, password, role, date_joined 
    FROM toeicapp_user 
    WHERE username = %s
"""

SELECT_USER_BY_EMAIL_OR_USERNAME = "SELECT * FROM toeicapp_user WHERE email = %s OR username = %s"

CREATE_USER = "INSERT INTO toeicapp_user (username, email, password) VALUES (%s, %s, %s)"

SELECT_USER_BY_EMAIL = "SELECT * FROM toeicapp_user WHERE email = %s"

SELECT_USER_BY_ID = """
    SELECT id, username, email, role, date_joined
    FROM toeic.toeicapp_user
    WHERE id = %s
"""

UPDATE_USER_PASSWORD_BY_EMAIL = """ 
  UPDATE toeicapp_user 
  SET password = %s
  WHERE email = %s
"""

CREATE_RESET_PASSWORD_OTP = """
    INSERT INTO toeicapp_otp (user_id, code, purpose, expires_at)
    VALUES (%s, %s, 'reset_password', %s)
"""

CREATE_VERIFY_EMAIL_OTP = """
    INSERT INTO toeicapp_otp (user_id, code, purpose, expires_at)
    VALUES (%s, %s, 'verify_email', %s)
"""