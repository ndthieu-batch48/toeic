"""User and authentication related queries"""

LOGIN_QUERY = "SELECT id, username, email, password, role, date_joined FROM toeicapp_user WHERE username = %s"

REGISTER_QUERY_SL = "SELECT * FROM toeicapp_user WHERE email = %s OR username = %s"

REGISTER_QUERY_IS = "INSERT INTO toeicapp_user (username, email, password) VALUES (%s, %s, %s)"

GET_USER_BY_EMAIL_QUERY_SL = "SELECT * FROM toeicapp_user WHERE email = %s"

GET_USER_BY_ID = """
    SELECT id, username, email, role, date_joined
    FROM toeic.toeicapp_user
    WHERE id = %s
"""

CHANGE_PASSWORD_QUERY_UP = """ 
  UPDATE toeicapp_user 
  SET password = %s
  WHERE email = %s
"""
