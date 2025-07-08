"""Question related queries"""

GET_ALL_QUESTION = "SELECT * FROM toeicapp_question"

GET_QUESTION_BY_PART_AND_TEST = """
    SELECT q.id AS question_id, q.content AS question_content, 
           a.id AS answer_id, a.content AS answer_content, a.is_correct
    FROM toeicapp_question q
    JOIN toeicapp_answer a ON a.question_id = q.id
    JOIN toeicapp_testpart tp ON tp.part_id = q.part_id
    WHERE tp.part_id = %s AND tp.test_id = %s
"""

GET_ALL_QUESTION_OF_TEST = """
    SELECT qs.*, a.id AS answer_id, a.content AS answer_content, a.is_correct
    FROM toeicapp_question qs
    JOIN toeicapp_answer a ON a.question_id = qs.id
    JOIN toeicapp_part p ON p.id = qs.part_id
    JOIN toeicapp_testpart tp ON tp.part_id = p.id
    WHERE tp.test_id = %s
"""