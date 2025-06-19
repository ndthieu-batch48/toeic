# queries.py
SELECT_ALL_TESTS_QUERY = "SELECT * FROM toeicapp_test WHERE visible = 1"

GET_PARTS_BY_TEST_QUERY = """
                                SELECT p.* 
                                FROM toeicapp_part p 
                                JOIN toeicapp_testpart tp ON tp.part_id = p.id 
                                WHERE tp.test_id = %s
                            """

GET_ALL_QUESTION = "SELECT * from toeicapp_question"

GET_ALL_TESTPART = " SELECT * FROM toeicapp_testpart "

GET_ALL_MEIDA = """ SELECT * FROM toeicapp_media """

GET_ALL_ANSWER = """ SELECT * FROM toeicapp_answer """

GET_ALL_PART = """ SELECT * FROM toeicapp_part """

GET_QUESTION_BY_PART_AND_TEST = """
    SELECT q.id AS question_id, q.content AS question_content, 
           a.id AS answer_id, a.content AS answer_content, a.is_correct
    FROM toeicapp_question q
    JOIN toeicapp_answer a ON a.question_id = q.id
    JOIN toeicapp_testpart tp ON tp.part_id = q.part_id
    WHERE tp.part_id = %s AND tp.test_id = %s
    """

REGISTER_QUERY_SL = "SELECT * FROM toeicapp_user WHERE email = %s OR username = %s"
REGISTER_QUERY_IS = "INSERT INTO toeicapp_user (username, email, password) VALUES (%s, %s, %s)"

LOGIN_QUERY = "SELECT id, username, email, password, role, date_joined FROM toeicapp_user WHERE username = %s"

GET_ALL_QUESTION_OF_TEST = """
    SELECT qs.*, a.id AS answer_id, a.content AS answer_content, a.is_correct
    FROM toeicapp_question qs
    JOIN toeicapp_answer a ON a.question_id = qs.id
    JOIN toeicapp_part p ON p.id = qs.part_id
    JOIN toeicapp_testpart tp ON tp.part_id = p.id
    WHERE tp.test_id = %s
    """

GET_ALL_HISTORY = "SELECT * FROM toeicapp_history"



CREATE_HISTORY = """
            INSERT INTO toeicapp_history (dataprogress, part, test_id, time, type, user_id)
            VALUES (%s, %s, %s, %s, %s, %s)
        """

GENERATE_RESULT = "SELECT * FROM toeicapp_history WHERE id = %s"

GET_CORRECT_ANSWER = "SELECT id FROM toeicapp_answer WHERE is_correct = 1"

GET_RESULT_BY_USER = "SELECT * FROM toeicapp_history WHERE user_id = %s"

GET_TITLE_OF_TEST ="SELECT title FROM toeicapp_test WHERE id = %s"

GET_QUESTION_COUNT_OF_PART ="""SELECT COUNT(toeicapp_question.id) 
                            FROM toeicapp_question 
                            JOIN toeicapp_part 
                            ON toeicapp_question.part_id = toeicapp_part.id 
                            WHERE toeicapp_part.part_order = %s 
                            AND toeicapp_part.id = %s"""
GET_PART_IDS_FOR_TEST = """SELECT * FROM toeicapp_testpart tp JOIN toeicapp_part p
ON tp.part_id = p.id where tp.test_id = %s"""

# GET_MEDIA_BY_PART = """
# SELECT * FROM toeicapp_groupmedia
# WHERE id IN (
#     SELECT media_group_id FROM toeicapp_question WHERE part_id = %s
# )
# """

CREATE_HISTORY_WITH_STATUS = """
    INSERT INTO toeicapp_history (dataprogress, part, test_id, time, type, user_id, status, create_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
"""
CHECK_SAVED_PROGRESS = """
    SELECT * FROM toeicapp_history 
    WHERE user_id = %s AND test_id = %s AND status = 'save'
    ORDER BY create_at DESC LIMIT 1
"""

GET_MEDIA_BY_TEST = """
    SELECT *
    FROM toeic.toeicapp_media
    WHERE test_id = %s
    """


GET_USER_BY_ID = """
    SELECT id, username, email, role, date_joined
    FROM toeic.toeicapp_user
    WHERE id = %s
    """

UPDATE_TRANSLATE_SCRIPT = """
    UPDATE toeic.toeicapp_media 
    SET translate_script = %s 
    WHERE id = %s
"""

# queries.py
UPDATE_EXPLAIN_QUESTION = """
    UPDATE toeic.toeicapp_media
    SET explain_question = %s
    WHERE id = %s
"""

# queries.py
GET_ALL_LANGUAGES = "SELECT * FROM toeic.toeicapp_language"
