"""User and authentication related queries"""

SELECT_USER_BY_USERNAME = """
    SELECT id, username, email, password, role, date_joined 
    FROM toeicapp_user 
    WHERE username = %s
"""

SELECT_USER_BY_EMAIL_OR_USERNAME = "SELECT * FROM toeicapp_user WHERE email = %s OR username = %s"

INSERT_USER = "INSERT INTO toeicapp_user (username, email, password) VALUES (%s, %s, %s)"

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

INSERT_RESET_PASSWORD_OTP = """
    INSERT INTO toeicapp_otp (email, code, purpose, expires_at)
    VALUES (%s, %s, 'reset_password', %s)
"""

SELECT_RESET_PASSWORD_OTP_BY_EMAIL = """
    SELECT code, expires_at FROM toeicapp_otp 
    WHERE email = %s AND purpose = 'reset_password' AND is_used = 0
"""

UPDATE_USED_RESET_PASSWORD_OTP = """
    UPDATE TABLE toeicapp_otp
    SET is_used = 1 
    WHERE email = %s AND code = %s AND purpose = 'reset_password';
"""

DELETE_UNUSED_RESET_PASSWORD_OTP = """
    DELETE FROM toeicapp_otp 
    WHERE email = %s AND purpose = 'reset_password' AND is_used = 0;
"""

INSERT_VERIFY_EMAIL_OTP = """
    INSERT INTO toeicapp_otp (email, code, purpose, expires_at)
    VALUES (%s, %s, 'verify_email', %s)
"""

SELECT_VERIFY_EMAIL_OTP_BY_EMAIL = """
    SELECT code, expires_at FROM toeicapp_otp 
    WHERE email = %s AND purpose = 'verify_email' AND is_used = 0
"""

UPDATE_USED_VERIFY_EMAIL_OTP = """
    UPDATE TABLE toeicapp_otp
    SET is_used = 1 
    WHERE email = %s AND code = %s AND purpose = 'verify_email';
"""

DELETE_UNUSED_VERIFY_EMAIL_OTP = """
    DELETE FROM toeicapp_otp 
    WHERE email = %s AND purpose = 'verify_email' AND is_used = 0;
"""

UPDATE_USER_IS_VERIFIED = """
    UPDATE TABLE toeicapp_user
    SET is_verified = 1
    WHERE email = %s;
"""