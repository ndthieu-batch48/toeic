"""Test related queries"""

SELECT_ALL_TESTS_QUERY = "SELECT * FROM toeicapp_test WHERE visible = 1"

GET_TITLE_OF_TEST = "SELECT title FROM toeicapp_test WHERE id = %s"

GET_ALL_TESTPART = "SELECT * FROM toeicapp_testpart"

GET_PART_IDS_FOR_TEST = """
    SELECT * FROM toeicapp_testpart tp 
    JOIN toeicapp_part p ON tp.part_id = p.id 
    WHERE tp.test_id = %s
"""