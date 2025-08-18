from datetime import datetime
from urllib import response
from fastapi import APIRouter, Depends, HTTPException, Response, status
from typing import Any, Dict, List, Optional
import json

from fastapi.responses import JSONResponse

from ...database.queries.question_queries import SELECT_COUNT_QUESTION_BY_TEST, select_count_question_by_multiple_part

from ...database.queries.history_queries import DELETE_SAVED_HISTORY, SELECT_HISTORY_BY_ID, SELECT_SUBMIT_HISTORY_BY_USER

from ...schemas.history import HistoryResponse, HistoryCreateRequest
from ...auth.dependencies import get_current_user
from ...database.connection import get_db_cursor, connect
from ...database.queries import (
    INSERT_HISTORY,
    UPDATE_HISTORY_BY_USER,
    SELECT_ALL_HISTORY,
    SELECT_HISTORY_BY_STATUS,
    GENERATE_RESULT,
    GET_CORRECT_ANSWER,
    GET_PART_IDS_FOR_TEST,
    GET_QUESTION_COUNT_OF_PART,
    GET_RESULT_BY_USER,
    GET_TITLE_OF_TEST,
    select_count_correct_incorrect_by_answer_id,
)

router = APIRouter()


@router.get("all", response_model=List[HistoryResponse])
async def get_all_user_history(_: dict = Depends(get_current_user)):
    with get_db_cursor() as cursor:
        cursor.execute(SELECT_ALL_HISTORY)
        history_list = cursor.fetchall()
        return history_list


@router.post("", response_model=dict)
async def create_submit_history(
    req: HistoryCreateRequest, 
    current_user: dict = Depends(get_current_user)
):
    try:
        user_id = current_user.get("user_id")
        dataprogress_json = json.dumps(req.dataprogress)
        part_json = json.dumps(req.part)

        with get_db_cursor() as cursor:
            # Check existing "save"
            cursor.execute(
                SELECT_HISTORY_BY_STATUS, 
                (user_id, req.test_id, "save")
            )
            existing_saved = cursor.fetchone()

            if existing_saved:
                cursor.execute(
                    UPDATE_HISTORY_BY_USER,
                    (
                        dataprogress_json,
                        req.type,
                        part_json,
                        req.time,
                        req.status,
                        user_id, req.test_id,
                    ),
                )
            else:
                cursor.execute(
                    INSERT_HISTORY,
                    (
                        dataprogress_json,
                        req.type,
                        part_json,
                        req.time,
                        req.test_id,
                        user_id,
                        req.status,
                    ),
                )

        # commit sẽ tự chạy khi ra khỏi with (commit_on_exit=True mặc định)
        return {"message": f"History {req.type} successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "An error occurred while processing history",
                "error": str(e),
            },
        )


@router.get("/save", response_model=Optional[HistoryResponse])
async def get_save_progress_history(test_id: int, current_user: dict = Depends(get_current_user)):
    try:
        with get_db_cursor() as cursor:
            user_id = current_user.get("user_id")
            cursor.execute(SELECT_HISTORY_BY_STATUS, (user_id, test_id, 'save'))
            save_progress = cursor.fetchone()
            
            if not save_progress:
                return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)

            return save_progress
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Error occurred in get submit history",
                "error": str(e),
            },
        )


@router.get("/result/list", response_model=Optional[List[HistoryResponse]])
async def get_submit_history(current_user: dict = Depends(get_current_user)):
    try:
        with get_db_cursor() as cursor:
            user_id = current_user.get("user_id")
            cursor.execute(SELECT_SUBMIT_HISTORY_BY_USER, (user_id,))
            submit_history = cursor.fetchall()
            
            if not submit_history:
                return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=[])

            return submit_history
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Error occurred in get submit history",
                "error": str(e),
            },
        )

# , _: dict = Depends(get_current_user)
@router.get("/result/detail")
async def get_result(history_id: int):
    try:
        with get_db_cursor() as cursor:
            print(history_id)
            cursor.execute(SELECT_HISTORY_BY_ID, (history_id,))
            history = cursor.fetchone()
            if not history: 
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User history not found"
                )
            
            # Prepare data
            dataprogress = json.loads(history.get("dataprogress"))
            part_orders = json.loads(history.get("part"))
            test_id = history.get("test_id")
            test_type = history.get("type")
            
            # Handle question count
            total_question = None
            
            # FullTest: count toàn bộ câu hỏi theo test_id
            if test_type == "FullTest":
                cursor.execute(SELECT_COUNT_QUESTION_BY_TEST, (test_id,))
                total_question = cursor.fetchone()
                
            # PracticeTest: count theo danh sách part_orders
            elif test_type == "Practice":
                query = select_count_question_by_multiple_part(part_orders)
                params = (test_id, *part_orders)
                cursor.execute(query, params)
                total_question = cursor.fetchone()
            
            answer_id_list = []
            correct_listening = 0
            correct_reading = 0
            for question_id, answer_id in dataprogress.items():
                answer_id_list.append(int(answer_id))
            
            #TODO: DEBUG "Unexpected database error: CMySQLCursor.execute() takes from 2 to 4 positional arguments but 32 were given"
            query = select_count_correct_incorrect_by_answer_id(answer_id_list)
            cursor.execute(query, *answer_id_list)
            correct_count, incorrect_count = cursor.fetchone()
            
            
            return {"dataprogress": dataprogress, "total_question": total_question, "test_type": test_type, "correct_count": correct_count, "incorrect_count": incorrect_count}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "An error occurred in reset password controller",
                "error": {e}
            }
        )


# @router.get("/generate_result")
# async def generate_result(
#     history_id: int, _: dict = Depends(get_current_user)
# ):
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)
#     cursor.execute(GENERATE_RESULT, (history_id,))
#     history = cursor.fetchone()
    
#     if not history:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, detail="History not found"
#         )

#     dataprogress = history.get("dataprogress")
#     if isinstance(dataprogress, str):
#         try:
#             dataprogress = json.loads(dataprogress)
#         except json.JSONDecodeError:
#             raise HTTPException(
#                 status_code=400, detail="Invalid JSON format in dataprogress"
#             )
#     elif not isinstance(dataprogress, dict):
#         raise HTTPException(
#             status_code=500,
#             detail="Invalid data format: dataprogress should be a dictionary",
#         )

#     cursor.execute(GET_CORRECT_ANSWER)
#     correct_answers = cursor.fetchall()
#     correct_answer_ids = {str(answer["id"]) for answer in correct_answers}

#     correct_count = 0
#     incorrect_count = 0
#     right_listening = 0
#     right_reading = 0

#     for question_id, answer_id in dataprogress.items():
#         if answer_id in correct_answer_ids:
#             correct_count += 1
#             if int(question_id) < 101 and int(question_id) > 0:
#                 right_listening += 1
#             else:
#                 right_reading += 1
#         else:
#             incorrect_count += 1

#     total_answered = correct_count + incorrect_count
#     no_answer = 0

#     if history["type"] == "FullTest":
#         total_questions = 200
#         no_answer = total_questions - total_answered
#     elif history["type"] == "Practice":
#         parts = json.loads(history["part"]) if history["part"] else []
#         cursor.execute(GET_PART_IDS_FOR_TEST, (history["test_id"],))
#         part_ids = cursor.fetchall()

#         part_question_count = {}
#         for part in part_ids:
#             part_id = part["part_id"]
#             part_order = part["part_order"]
#             if part_order in parts:
#                 cursor.execute(GET_QUESTION_COUNT_OF_PART, (part_order, part_id))
#                 question_count = cursor.fetchone()
#                 part_question_count[part_order] = (
#                     question_count.get("COUNT(toeicapp_question.id)", 0)
#                     if question_count
#                     else 0
#                 )
#         total_questions = sum(
#             part_question_count.get(part, 0) for part in part_question_count
#         )
#         no_answer = total_questions - total_answered
#     else:
#         total_questions = 0
#         no_answer = 0
    
#     accurate = (correct_count / total_answered) * 100 if total_answered > 0 else 0

#     cursor.close()
#     conn.close()

#     return {
#         "correct_count": correct_count,
#         "incorrect_count": incorrect_count,
#         "no_answer": no_answer,
#         "time": history["time"],
#         "id": history["id"],
#         "type": history["type"],
#         "test_id": history["test_id"],
#         "user_id": history["user_id"],
#         "part": history["part"],
#         "accurate": round(accurate, 2),
#         "right_listening": right_listening,
#         "right_reading": right_reading,
#     }


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


# @router.post("/save", response_model=HistoryResponse)
# async def create_or_update_history(history: HistoryCreateRequest, current_user: dict = Depends(get_current_user)):
#     user_id = current_user.get("user_id")
#     history.status = 'save'
#     existing_saved = execute_query(
#         query=SELECT_HISTORY_BY_STATUS, 
#         params=(user_id, history.test_id, 'save'), 
#         fetch_one=True
#     )
    
#     # Handle submit status - delete existing save
#     if history.status == "submit" and existing_saved:
#         execute_query(
#             "DELETE FROM toeicapp_history WHERE id = %s", 
#             (existing_saved["id"],)
#         )
#         existing_saved = None  # Reset for logic below
    
#     # Prepare data
#     dataprogress_json = json.dumps(history.dataprogress)
#     part_json = json.dumps(history.part)
#     time_left = getattr(history, 'time_left', None)
    
#     # Update existing save record
#     if existing_saved and history.status == "save":
#         execute_query(
#             """
#             UPDATE toeicapp_history 
#             SET dataprogress = %s, part = %s, time = %s, time_left = %s, create_at = NOW()
#             WHERE id = %s
#             """,
#             (dataprogress_json, part_json, history.time, time_left, existing_saved["id"])
#         )
        
#         # Return updated record
#         history_dict = history.model_dump()
#         history_dict["id"] = existing_saved["id"]
#         history_dict["create_at"] = datetime.now()
#         return history_dict
    
#     # Create new record
#     else:
#         with get_db_cursor() as cursor:
#             cursor.execute(
#                 """
#                 INSERT INTO toeicapp_history (dataprogress, part, test_id, time, type, user_id, status, time_left, create_at)
#                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
#                 """,
#                 (
#                     dataprogress_json,
#                     part_json,
#                     history.test_id,
#                     history.time,
#                     history.type,
#                     user_id,
#                     history.status,
#                     time_left,
#                 )
#             )
#             new_id = cursor.lastrowid
        
#         # Return created record
#         history_dict = history.model_dump()
#         history_dict["id"] = new_id
#         history_dict["create_at"] = datetime.now()
#         return history_dict