"""User and authentication related queries"""

SELECT_USER_BY_EMAIL_OR_USERNAME = "SELECT * FROM toeicapp_user WHERE email = %s OR username = %s"


SELECT_USER_BY_EMAIL = "SELECT * FROM toeicapp_user WHERE email = %s"


INSERT_USER = "INSERT INTO toeicapp_user (username, email, password) VALUES (%s, %s, %s)"


SELECT_USER_BY_ID = """
    SELECT *
    FROM toeicapp_user
    WHERE id = %s
"""

UPDATE_USER_PASSWORD_BY_ID = """ 
  UPDATE toeicapp_user 
  SET password = %s
  WHERE id = %s
"""


UPDATE_USER_IS_VERIFIED = """
    UPDATE TABLE toeicapp_user
    SET is_verified = 1
    WHERE email = %s;
"""


INSERT_OTP = """
    INSERT INTO toeicapp_otp 
    (otp, purpose, expires_at, credential_type, credential_value, user_id)
    VALUES (%s, %s, %s, %s, %s, %s);
"""

SELECT_VALID_OTP = """
    SELECT * FROM toeicapp_otp 
    WHERE otp = %s 
    AND purpose = %s 
    AND is_used = 0 
    AND expires_at > NOW();
"""

UPDATE_USED_OTP = """
    UPDATE toeicapp_otp
    SET is_used = 1 
    WHERE user_id = %s AND otp = %s AND purpose = %s;
"""

DELETE_UNUSED_OTP = """
    DELETE FROM toeicapp_otp 
    WHERE user_id = %s AND purpose = %s AND is_used = 0;
"""


