from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import json

from app.helpers.safe_type import safe_int, safe_str
from ...schemas.test import Test, Part, TestPart
from ...schemas.question import Question, PartQuestionsResponse, TestPartQuestion, Answer2, Answer
from ...schemas.media import Media
from ...auth.dependencies import get_current_user
from ...database.connection import connect
# from ...database.test_pool import get_cursor_from_pool
from ...database.queries import (
    SELECT_ALL_TESTS_QUERY, 
    GET_PARTS_BY_TEST_QUERY,
    GET_ALL_TESTPART,
    GET_ALL_MEDIA,
    GET_ALL_ANSWER,
    GET_ALL_PART,
    GET_QUESTION_COUNT_OF_PART,
    GET_QUESTION_BY_PART_AND_TEST,
    GET_ALL_QUESTION_OF_TEST,
    GET_MEDIA_BY_TEST
)

router = APIRouter()

# @router.get("/", response_model=List[Test])
# async def get_all_tests():
#     async with get_cursor_from_pool() as (cursor, conn):
#         await cursor.execute(SELECT_ALL_TESTS_QUERY)
#         results = await cursor.fetchall()
#     return results

@router.get("/{test_id}/parts", response_model=List[Part])
async def get_parts(test_id: int):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GET_PARTS_BY_TEST_QUERY, (test_id,))
    parts = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return [
        Part(
            id=safe_int(part["id"]),
            title=safe_str(part["title"]),
            part_order=safe_str(part["part_order"]),
            audio_url=safe_str(part["audio_url"]),
            questionCount=safe_int(part["questionCount"]),
            partOrderNum=safe_int(part["partOrderNum"])
        )
        for part in parts if isinstance(part, dict)
    ]

@router.get("/questions", response_model=List[PartQuestionsResponse])
async def get_questions(current_user: dict = Depends(get_current_user)):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT q.id, q.content, q.question_number, q.media_group_id, q.part_id, m.translate_script
        FROM toeicapp_question q
        LEFT JOIN toeicapp_media m ON q.media_group_id = m.id
        """
    )
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    transformed_results = []
    for row in results:
        translate_content = None
        if row["translate_script"]:
            try:
                translations = json.loads(row["translate_script"])
                for translation in translations:
                    if translation.get("question_id") == row["id"]:
                        translate_content = translation.get("translate_content")
                        break
            except json.JSONDecodeError:
                pass

        transformed_row = {
            "id": row["id"],
            "part_id": row["part_id"],
            "order": row["question_number"],
            "content": row["content"],
            "group_id": row["media_group_id"],
            "translate_content": translate_content,
        }
        transformed_results.append(transformed_row)

    return transformed_results

@router.get("/testpart", response_model=List[TestPart])
async def get_test_part():
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GET_ALL_TESTPART)
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return [TestPart(**row) for row in results]

@router.get("/groupmedia", response_model=List[Media])
async def get_all_media():
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GET_ALL_MEDIA)
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return [Media(**row) for row in results]

@router.get("/answer", response_model=List[Answer])
async def get_all_answer():
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GET_ALL_ANSWER)
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return [Answer(**row) for row in results]

@router.get("/part", response_model=List[Part])
async def get_all_parts(current_user: dict = Depends(get_current_user)):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GET_ALL_PART)
    results = cursor.fetchall()

    for row in results:
        part = Part(**row)
        cursor.execute(GET_QUESTION_COUNT_OF_PART, (part.part_order, part.id))
        question_count = cursor.fetchone()
        part.questionCount = (
            question_count.get("COUNT(toeicapp_question.id)", 0)
            if question_count
            else 0
        )

        if part.part_order == "Part 1":
            part.partOrderNum = 1
        elif part.part_order == "Part 2":
            part.partOrderNum = 2
        elif part.part_order == "Part 3":
            part.partOrderNum = 3
        elif part.part_order == "Part 4":
            part.partOrderNum = 4
        elif part.part_order == "Part 5":
            part.partOrderNum = 5
        elif part.part_order == "Part 6":
            part.partOrderNum = 6
        elif part.part_order == "Part 7":
            part.partOrderNum = 7
        else:
            part.questionCount = 0

        row["questionCount"] = part.questionCount
        row["partOrderNum"] = part.partOrderNum
    
    cursor.close()
    conn.close()
    return [Part(**row) for row in results]

@router.get("/{test_id}/parts/{part_id}/questions", response_model=TestPartQuestion)
async def get_questions_by_part_and_test(
    test_id: int, part_id: int, current_user: dict = Depends(get_current_user)
):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GET_QUESTION_BY_PART_AND_TEST, (part_id, test_id))
    results = cursor.fetchall()

    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No questions found for test_id={test_id} and part_id={part_id}.",
        )

    questions = []
    for row in results:
        question = next((q for q in questions if q.id == row["question_id"]), None)

        if not question:
            question = Question(
                id=row["question_id"], content=row["question_content"], answers=[]
            )
            questions.append(question)

        question.answers.append(
            Answer2(
                id=row["answer_id"],
                content=row["answer_content"],
                is_correct=row["is_correct"],
            )
        )

    cursor.close()
    conn.close()
    return TestPartQuestion(part_id=part_id, questions=questions)

@router.get("/{test_id}/review")
async def review_test(test_id: int, current_user: dict = Depends(get_current_user)):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GET_ALL_QUESTION_OF_TEST, (test_id,))
    questions = cursor.fetchall()

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Your test is not valid"
        )

    cursor.close()
    conn.close()
    return questions

@router.get("/{test_id}/media", response_model=List[Media])
async def get_media_by_test(test_id: int):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GET_MEDIA_BY_TEST, (test_id,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return [Media(**row) for row in results]


