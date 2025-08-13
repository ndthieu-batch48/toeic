"""History and progress related queries"""

GET_ALL_HISTORY = "SELECT * FROM toeicapp_history"

CREATE_HISTORY = """
    INSERT INTO toeicapp_history (dataprogress, part, test_id, time, type, user_id)
    VALUES (%s, %s, %s, %s, %s, %s)
"""

CREATE_HISTORY_WITH_STATUS = """
    INSERT INTO toeicapp_history (dataprogress, part, test_id, time, type, user_id, status, create_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
"""

CHECK_SAVED_PROGRESS = """
    SELECT * FROM toeicapp_history 
    WHERE user_id = %s AND test_id = %s AND status = 'save' 
    ORDER BY create_at DESC LIMIT 1
"""

DELETE_SAVED_HISTORY = """
    DELETE FROM toeicapp_history 
    WHERE user_id = %s AND test_id = %s AND status = 'save'
"""

GENERATE_RESULT = "SELECT * FROM toeicapp_history WHERE id = %s"

GET_RESULT_BY_USER = "SELECT * FROM toeicapp_history WHERE user_id = %s"