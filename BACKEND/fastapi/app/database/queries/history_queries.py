"""History and progress related queries"""

SELECT_ALL_HISTORY = "SELECT * FROM toeicapp_history"


INSERT_HISTORY = """
    INSERT INTO toeicapp_history (dataprogress, type, part, time, test_id, user_id, create_at, status, time_left)
    VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s, NULL)
"""

UPDATE_HISTORY_BY_USER = """
    UPDATE toeicapp_history
    SET dataprogress = %s,
        type = %s,
        part = %s,
        time = %s,
        create_at = NOW(),
        status = %s,
        time_left = NULL
    WHERE user_id = %s AND test_id = %s;
"""


SELECT_HISTORY_BY_STATUS = """
    SELECT * FROM toeicapp_history 
    WHERE user_id = %s AND test_id = %s AND status = %s 
    ORDER BY create_at DESC 
"""


SELECT_SUBMIT_HISTORY_BY_USER = """
    SELECT * FROM toeicapp_history 
    WHERE user_id = %s 
    AND status = 'submit'
    ORDER BY create_at DESC
    LIMIT 5
"""

SELECT_HISTORY_BY_ID = """
    SELECT * FROM toeicapp_history 
    WHERE id = %s
"""


DELETE_SAVED_HISTORY = """
    DELETE FROM toeicapp_history 
    WHERE user_id = %s AND test_id = %s AND status = 'save'
"""


def select_count_correct_incorrect_by_answer_id(answer_id_list):
    placeholders = ", ".join(["%s"] * len(answer_id_list))
    return f"""
        SELECT
            SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_count,
            SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) AS incorrect_count
        FROM toeicapp_answer a
        WHERE a.id IN ({placeholders});
    """


SELECT_CALCULATE_DATAPROGRESS_RESULT_BY_HISTORY_ID = """
    SELECT
        SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_count,
        SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) AS incorrect_count,
        SUM(CASE WHEN a.is_correct = 1 AND CAST(k.question_id AS UNSIGNED) BETWEEN 1 AND 100
                THEN 1 ELSE 0 END) AS correct_listening,
        SUM(CASE WHEN a.is_correct = 1 AND CAST(k.question_id AS UNSIGNED) >= 101
                THEN 1 ELSE 0 END) AS correct_reading
    FROM toeicapp_history h
    JOIN JSON_TABLE(
        JSON_KEYS(h.dataprogress),
        '$[*]' COLUMNS(question_id VARCHAR(64) PATH '$')
    ) AS k
    JOIN toeicapp_answer a 
        ON a.id = JSON_UNQUOTE(
                    JSON_EXTRACT(h.dataprogress, CONCAT('$."', k.question_id, '"'))
                )
    WHERE h.id = %s;
"""


SELECT_CALCULATE_CORRECT_ANSWER_BY_HISTORY_ID = """
    SELECT
        SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_count
    FROM toeicapp_history h
    JOIN JSON_TABLE(
        JSON_KEYS(h.dataprogress),
        '$[*]' COLUMNS(question_id VARCHAR(64) PATH '$')
    ) AS k
    JOIN toeicapp_answer a 
        ON a.id = JSON_UNQUOTE(
                    JSON_EXTRACT(h.dataprogress, CONCAT('$."', k.question_id, '"'))
                )
    WHERE h.id = %s;
"""
