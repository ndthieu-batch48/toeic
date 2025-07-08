"""Answer related queries"""

GET_ALL_ANSWER = "SELECT * FROM toeicapp_answer"

GET_CORRECT_ANSWER = "SELECT id FROM toeicapp_answer WHERE is_correct = 1"