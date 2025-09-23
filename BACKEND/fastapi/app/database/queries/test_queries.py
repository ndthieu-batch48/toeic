"""Test related queries"""

SELECT_ALL_TESTS_QUERY = "SELECT * FROM toeicapp_test WHERE visible = 1"

GET_TITLE_OF_TEST = "SELECT title FROM toeicapp_test WHERE id = %s"

GET_ALL_TESTPART = "SELECT * FROM toeicapp_testpart"

GET_PART_IDS_FOR_TEST = """
    SELECT * FROM toeicapp_testpart tp 
    JOIN toeicapp_part p ON tp.part_id = p.id 
    WHERE tp.test_id = %s
"""


SELECT_QUESTION_BLOCK_JSON_BY_ID = """
    SELECT JSON_OBJECT(
        'question_id', q.id,
        'question_content', q.content,
        'answer_list', JSON_ARRAYAGG(a.content)
    ) AS question_block_json
    FROM toeicapp_question q
    JOIN toeicapp_answer a ON a.question_id = q.id
    WHERE q.id = %s
    GROUP BY q.id, q.content;
"""
