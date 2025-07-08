"""Part related queries"""

GET_ALL_PART = "SELECT * FROM toeicapp_part"

GET_PARTS_BY_TEST_QUERY = """
    SELECT p.* 
    FROM toeicapp_part p 
    JOIN toeicapp_testpart tp ON tp.part_id = p.id 
    WHERE tp.test_id = %s
"""

GET_QUESTION_COUNT_OF_PART = """
    SELECT COUNT(toeicapp_question.id) 
    FROM toeicapp_question 
    JOIN toeicapp_part ON toeicapp_question.part_id = toeicapp_part.id 
    WHERE toeicapp_part.part_order = %s AND toeicapp_part.id = %s
"""