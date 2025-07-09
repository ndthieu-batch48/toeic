from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import json

from ...schemas.history import History, HistoryCreate
from ...auth.dependencies import get_current_user
from ...database.connection import connect
from ...database.queries import (
    GET_ALL_HISTORY,
    CHECK_SAVED_PROGRESS,
    CREATE_HISTORY_WITH_STATUS,
    GENERATE_RESULT,
    GET_CORRECT_ANSWER,
    GET_PART_IDS_FOR_TEST,
    GET_QUESTION_COUNT_OF_PART,
    GET_RESULT_BY_USER,
    GET_TITLE_OF_TEST
)

router = APIRouter()

@router.get("/", response_model=List[History])
async def get_all_user_history(current_user: dict = Depends(get_current_user)):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GET_ALL_HISTORY)
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    for row in results:
        if isinstance(row["dataprogress"], str):
            row["dataprogress"] = json.loads(row["dataprogress"])
        if isinstance(row["part"], str):
            row["part"] = json.loads(row["part"])

    return [History(**row) for row in results]

@router.post("/", response_model=History)
async def create_or_update_history(
    history: HistoryCreate, current_user: dict = Depends(get_current_user)
):
    conn = connect()
    cursor = conn.cursor(dictionary=True)

    try:
        dataprogress_json = json.dumps(history.dataprogress)
        part_json = json.dumps(history.part)
        time_left = history.time_left if hasattr(history, "time_left") else None

        cursor.execute(CHECK_SAVED_PROGRESS, (history.user_id, history.test_id))
        existing_saved = cursor.fetchone()

        if history.status == "submit" and existing_saved:
            cursor.execute(
                "DELETE FROM toeicapp_history WHERE id = %s", (existing_saved["id"],)
            )
            conn.commit()

        if existing_saved and history.status == "save":
            cursor.execute(
                """
                UPDATE toeicapp_history 
                SET dataprogress = %s, part = %s, time = %s, time_left = %s, create_at = NOW()
                WHERE id = %s
                """,
                (
                    dataprogress_json,
                    part_json,
                    history.time,
                    time_left,
                    existing_saved["id"],
                ),
            )
            conn.commit()
            history_dict = history.model_dump()
            history_dict["id"] = existing_saved["id"]
        else:
            cursor.execute(
                """
                INSERT INTO toeicapp_history (dataprogress, part, test_id, time, type, user_id, status, time_left, create_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """,
                (
                    dataprogress_json,
                    part_json,
                    history.test_id,
                    history.time,
                    history.type,
                    history.user_id,
                    history.status,
                    time_left,
                ),
            )
            conn.commit()
            new_id = cursor.lastrowid
            history_dict = history.model_dump()
            history_dict["id"] = new_id

        cursor.close()
        conn.close()
        return history_dict

    except Exception as e:
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=400, detail=f"Error processing history: {str(e)}"
        )

@router.get("/saved", response_model=History)
async def get_saved_progress(
    user_id: int, test_id: int, current_user: dict = Depends(get_current_user)
):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(CHECK_SAVED_PROGRESS, (user_id, test_id))
    saved_progress = cursor.fetchone()
    cursor.close()
    conn.close()

    if not saved_progress:
        raise HTTPException(status_code=404, detail="No saved progress found")

    if isinstance(saved_progress["dataprogress"], str):
        saved_progress["dataprogress"] = json.loads(saved_progress["dataprogress"])
    if isinstance(saved_progress["part"], str):
        saved_progress["part"] = json.loads(saved_progress["part"])

    return History(**saved_progress)

@router.delete("/saved")
async def delete_saved_progress(
    user_id: int, test_id: int, current_user: dict = Depends(get_current_user)
):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM toeicapp_history WHERE user_id = %s AND test_id = %s AND status = 'save'",
        (user_id, test_id),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Saved progress deleted successfully"}

@router.get("/generate_result")
async def generate_result(
    history_id: int, current_user: dict = Depends(get_current_user)
):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GENERATE_RESULT, (history_id,))
    history = cursor.fetchone()
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="History not found"
        )

    dataprogress = history.get("dataprogress")
    if isinstance(dataprogress, str):
        try:
            dataprogress = json.loads(dataprogress)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400, detail="Invalid JSON format in dataprogress"
            )
    elif not isinstance(dataprogress, dict):
        raise HTTPException(
            status_code=500,
            detail="Invalid data format: dataprogress should be a dictionary",
        )

    cursor.execute(GET_CORRECT_ANSWER)
    correct_answers = cursor.fetchall()
    correct_answer_ids = {str(answer["id"]) for answer in correct_answers}

    correct_count = 0
    incorrect_count = 0
    right_listening = 0
    right_reading = 0

    for question_id, answer_id in dataprogress.items():
        if answer_id in correct_answer_ids:
            correct_count += 1
            if int(question_id) < 101 and int(question_id) > 0:
                right_listening += 1
            else:
                right_reading += 1
        else:
            incorrect_count += 1

    total_answered = correct_count + incorrect_count
    no_answer = 0

    if history["type"] == "FullTest":
        total_questions = 200
        no_answer = total_questions - total_answered
    elif history["type"] == "Practice":
        parts = json.loads(history["part"]) if history["part"] else []
        cursor.execute(GET_PART_IDS_FOR_TEST, (history["test_id"],))
        part_ids = cursor.fetchall()

        part_question_count = {}
        for part in part_ids:
            part_id = part["part_id"]
            part_order = part["part_order"]
            if part_order in parts:
                cursor.execute(GET_QUESTION_COUNT_OF_PART, (part_order, part_id))
                question_count = cursor.fetchone()
                part_question_count[part_order] = (
                    question_count.get("COUNT(toeicapp_question.id)", 0)
                    if question_count
                    else 0
                )
        total_questions = sum(
            part_question_count.get(part, 0) for part in part_question_count
        )
        no_answer = total_questions - total_answered
    else:
        total_questions = 0
        no_answer = 0
    
    accurate = (correct_count / total_answered) * 100 if total_answered > 0 else 0

    cursor.close()
    conn.close()

    return {
        "correct_count": correct_count,
        "incorrect_count": incorrect_count,
        "no_answer": no_answer,
        "time": history["time"],
        "id": history["id"],
        "type": history["type"],
        "test_id": history["test_id"],
        "user_id": history["user_id"],
        "part": history["part"],
        "accurate": round(accurate, 2),
        "right_listening": right_listening,
        "right_reading": right_reading,
    }

@router.get("/get_result")
async def get_user_result(user_id: int, current_user: dict = Depends(get_current_user)):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GET_RESULT_BY_USER, (user_id,))
    histories = cursor.fetchall()

    if not histories:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="History not found"
        )

    results = []

    for history in histories:
        dataprogress = history.get("dataprogress")
        if isinstance(dataprogress, str):
            try:
                dataprogress = json.loads(dataprogress)
            except json.JSONDecodeError:
                results.append(
                    {
                        "id": history["id"],
                        "error": "Invalid JSON format in dataprogress",
                    }
                )
                continue

        cursor.execute(GET_CORRECT_ANSWER)
        correct_answers = cursor.fetchall()
        correct_answer_ids = {str(answer["id"]) for answer in correct_answers}

        correct_count = 0
        for question_id, answer_id in dataprogress.items():
            if answer_id in correct_answer_ids:
                correct_count += 1

        cursor.execute(GET_TITLE_OF_TEST, (history["test_id"],))
        test = cursor.fetchone()
        testname = test["title"] if test else "Unknown Test"

        if history["type"] == "FullTest":
            total_questions = 200
            parts = None
        elif history["type"] == "Practice":
            parts = json.loads(history["part"]) if history["part"] else []
            cursor.execute(GET_PART_IDS_FOR_TEST, (history["test_id"],))
            part_ids = cursor.fetchall()

            part_question_count = {}
            for part in part_ids:
                part_id = part["part_id"]
                part_order = part["part_order"]
                cursor.execute(GET_QUESTION_COUNT_OF_PART, (part_order, part_id))
                question_count = cursor.fetchone()
                part_question_count[part_order] = (
                    question_count.get("COUNT(toeicapp_question.id)", 0)
                    if question_count
                    else 0
                )
            total_questions = sum(part_question_count.get(part, 0) for part in parts)
        else:
            total_questions = 0
            parts = None

        score = f"{correct_count}/{total_questions}" if total_questions > 0 else "0/0"

        result = {
            "test_id": history["test_id"],
            "history_id": history["id"],
            "testname": testname,
            "type": history["type"],
            "date": history["create_at"],
            "duration": history["time"],
            "score": score,
        }

        if history["type"] == "Practice":
            result["parts"] = parts

        results.append(result)

    cursor.close()
    conn.close()
    return results