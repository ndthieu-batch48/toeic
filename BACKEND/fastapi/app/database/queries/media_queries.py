"""Media related queries"""

GET_ALL_MEDIA = "SELECT * FROM toeicapp_media"

GET_MEDIA_BY_TEST = """
    SELECT *
    FROM toeic.toeicapp_media
    WHERE test_id = %s
"""

UPDATE_TRANSLATE_SCRIPT = """
    UPDATE toeic.toeicapp_media 
    SET translate_script = %s 
    WHERE id = %s
"""

UPDATE_EXPLAIN_QUESTION = """
    UPDATE toeic.toeicapp_media
    SET explain_question = %s
    WHERE id = %s
"""