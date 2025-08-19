from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import json

from fastapi.responses import JSONResponse

from ...schemas.history import HistoryResponse, HistoryCreateRequest, HistoryResultDetailResponse, HitoryResultListResponse
from ...auth.dependencies import get_current_user
from ...database.connection import get_db_cursor
from ...database.queries import (
    INSERT_HISTORY,
    UPDATE_HISTORY_BY_USER,
    SELECT_ALL_HISTORY,
    SELECT_HISTORY_BY_STATUS,
    SELECT_CALCULATE_DATAPROGRESS_RESULT_BY_HISTORY_ID,
    SELECT_CALCULATE_CORRECT_ANSWER_BY_HISTORY_ID,
    DELETE_SAVED_HISTORY, 
    SELECT_HISTORY_BY_ID, 
    SELECT_SUBMIT_HISTORY_BY_USER,
    SELECT_COUNT_QUESTION_BY_TEST, 
    GET_TITLE_OF_TEST,
    select_count_question_by_multiple_part,
    select_count_correct_incorrect_by_answer_id,
    # GET_CORRECT_ANSWER,
    # GET_PART_IDS_FOR_TEST,
    # GET_QUESTION_COUNT_OF_PART,
)


router = APIRouter()


@router.get("/all", response_model=List[HistoryResponse])
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
                "message": "Error in create history controller",
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
                "message": "Error in get save history",
                "error": str(e),
            },
        )


@router.get("/result/list", response_model=Optional[List[HitoryResultListResponse]])
async def get_result_list(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user.get("user_id")
        with get_db_cursor() as cursor:
            cursor.execute(SELECT_SUBMIT_HISTORY_BY_USER, (user_id,))
            submit_history_list = cursor.fetchall()
            
            if not submit_history_list:
                return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=[])

            results = []  # collect all histories here

            for history in submit_history_list:

                # Prepare data
                history_id = history.get("id")
                part = json.loads(history.get("part"))
                test_id = history.get("test_id")
                test_type = history.get("type")
                create_at = history.get("create_at")
                duration = history.get("time")
                
                # Get test info
                cursor.execute(GET_TITLE_OF_TEST, (test_id,))
                row = cursor.fetchone()
                testname = row.get("title")
                
                # Handle question count
                total_question = 0
                if test_type == "FullTest":
                    # FullTest: count toàn bộ câu hỏi theo test_id
                    cursor.execute(SELECT_COUNT_QUESTION_BY_TEST, (test_id,))
                    row = cursor.fetchone()
                    total_question = row.get("question_by_part_count")
                elif test_type == "Practice":
                    # PracticeTest: count theo danh sách part_orders
                    part_orders = [str(p) for p in part]
                    query = select_count_question_by_multiple_part(part_orders)
                    cursor.execute(query, (test_id, *part_orders))
                    row = cursor.fetchone()
                    total_question = row.get("question_by_multiple_part_count")
                
                # Handle calculating result
                cursor.execute(SELECT_CALCULATE_CORRECT_ANSWER_BY_HISTORY_ID, (history_id,))
                row = cursor.fetchone()
                correct_count = row.get("correct_count")
                score = f"{correct_count}/{total_question}" if total_question > 0 else "0/0"

                # Append result for this history
                results.append({
                    "history_id": history_id,
                    "test_id": test_id,
                    "type": test_type,
                    "create_at": create_at,
                    "duration": duration,
                    "testname": testname,
                    "score": score,
                    "part_list": part
                    
                })

        return results
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Error in get result list controller",
                "error": str(e),
            },
        )


@router.get("/result/detail", response_model=HistoryResultDetailResponse)
async def get_result_detail(history_id: int, _: dict = Depends(get_current_user)):
    try:
        with get_db_cursor() as cursor:
            cursor.execute(SELECT_HISTORY_BY_ID, (history_id,))
            history = cursor.fetchone()
            if not history: 
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User history not found"
                )
            
            # Prepare data
            part = json.loads(history.get("part"))
            test_id = history.get("test_id")
            test_type = history.get("type")
            create_at = history.get("create_at")
            
            # Handle question count
            total_question = 0
            # FullTest: count toàn bộ câu hỏi theo test_id
            if test_type == "FullTest":
                cursor.execute(SELECT_COUNT_QUESTION_BY_TEST, (test_id,))
                row = cursor.fetchone()
                total_question = row.get("question_by_part_count")
            # # PracticeTest: count theo danh sách part_orders
            elif test_type == "Practice":
                part_orders = [str(p) for p in part]
                query = select_count_question_by_multiple_part(part_orders)
                cursor.execute(query, (test_id, *part_orders))
                row = cursor.fetchone()
                total_question = row.get("question_by_multiple_part_count")

            # Handle calculating result
            cursor.execute(SELECT_CALCULATE_DATAPROGRESS_RESULT_BY_HISTORY_ID, (history_id,))
            row = cursor.fetchone()
            correct_count = row.get("correct_count")
            incorrect_count = row.get("incorrect_count")
            correct_listening = row.get("correct_listening")
            correct_reading = row.get("correct_reading")
            
            total_answer = incorrect_count + correct_count
            no_answer = total_question - total_answer
            accuracy = (correct_count / total_answer) * 100 if total_answer > 0 else 0
        
        return {
            "total_question": total_question,
            "test_type": test_type, 
            "correct_count": correct_count, 
            "incorrect_count": incorrect_count,
            "correct_listening": correct_listening,
            "correct_reading": correct_reading,
            "no_answer": no_answer,
            "accuracy": round(accuracy, 2),
            "create_at": create_at,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Error in get result detail controller",
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


# @router.get("/get_result")
# async def get_user_result(user_id: int, current_user: dict = Depends(get_current_user)):
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)
#     cursor.execute(GET_RESULT_BY_USER, (user_id,))
#     histories = cursor.fetchall()

#     if not histories:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, detail="History not found"
#         )

#     results = []

#     for history in histories:
#         dataprogress = history.get("dataprogress")
#         if isinstance(dataprogress, str):
#             try:
#                 dataprogress = json.loads(dataprogress)
#             except json.JSONDecodeError:
#                 results.append(
#                     {
#                         "id": history["id"],
#                         "error": "Invalid JSON format in dataprogress",
#                     }
#                 )
#                 continue

#         cursor.execute(GET_CORRECT_ANSWER)
#         correct_answers = cursor.fetchall()
#         correct_answer_ids = {str(answer["id"]) for answer in correct_answers}

#         correct_count = 0
#         for question_id, answer_id in dataprogress.items():
#             if answer_id in correct_answer_ids:
#                 correct_count += 1

#         cursor.execute(GET_TITLE_OF_TEST, (history["test_id"],))
#         test = cursor.fetchone()
#         testname = test["title"] if test else "Unknown Test"

#         if history["type"] == "FullTest":
#             total_questions = 200
#             parts = None
#         elif history["type"] == "Practice":
#             parts = json.loads(history["part"]) if history["part"] else []
#             cursor.execute(GET_PART_IDS_FOR_TEST, (history["test_id"],))
#             part_ids = cursor.fetchall()

#             part_question_count = {}
#             for part in part_ids:
#                 part_id = part["part_id"]
#                 part_order = part["part_order"]
#                 cursor.execute(GET_QUESTION_COUNT_OF_PART, (part_order, part_id))
#                 question_count = cursor.fetchone()
#                 part_question_count[part_order] = (
#                     question_count.get("COUNT(toeicapp_question.id)", 0)
#                     if question_count
#                     else 0
#                 )
#             total_questions = sum(part_question_count.get(part, 0) for part in parts)
#         else:
#             total_questions = 0
#             parts = None

#         score = f"{correct_count}/{total_questions}" if total_questions > 0 else "0/0"

#         result = {
#             "test_id": history["test_id"],
#             "history_id": history["id"],
#             "type": history["type"],
#             "date": history["create_at"],
#             "duration": history["time"],
#             "testname": testname,
#             "score": score,
#         }

#         if history["type"] == "Practice":
#             result["parts"] = parts

#         results.append(result)

#     cursor.close()
#     conn.close()
#     return results


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