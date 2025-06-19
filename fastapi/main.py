from fastapi import FastAPI, Depends, HTTPException, status
from typing import List, Optional
import schemas, database
from database import connect
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    User,
    UserInDB,
    verify_token,
    UserLogin,
    create_refresh_token,
)
from fastapi.responses import JSONResponse
import json
from datetime import datetime
import queries
from fastapi.staticfiles import StaticFiles
import uvicorn
from fastapi.security import OAuth2PasswordBearer
from datetime import timedelta
from auth import ACCESS_TOKEN_EXPIRE_MINUTES
from auth import REFRESH_TOKEN_EXPIRE_DAYS
from gemini_service import ask_gemini, ask_gemini_with_image
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ACCESS_TOKEN_EXPIRE_MINUTES = 30

# def get_current_user(token: str = Depends(oauth2_scheme)):
#     # print(f"Received token: {token}")
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Could not validate credentials",
#         headers={"WWW-Authenticate": "Bearer"},
#     )

#     payload = verify_token(token)
#     # print(f"Decoded payload: {payload}")
#     if payload is None:
#         raise credentials_exception

#     username = payload.get("sub")
#     if username is None:
#         raise credentials_exception

#     return


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    username = payload.get("sub")
    user_id = payload.get("user_id")
    role = payload.get("role")

    if not username or not role:
        raise credentials_exception

    return {"username": username, "user_id": user_id, "role": role}


conn = connect()
cursor = conn.cursor()
# Mount thư mục chứa file media
app.mount(
    "/media",
    StaticFiles(
        directory="C:/Users/intern.ndthieu/Downloads/toeic-app/toeic_fe/test/test/client/public/media"
    ),
    name="media",
)


@app.get("/")
def read_root():
    return {"message": "FastAPI server is running!"}


# Allow connection from frontend
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000", "http://11.11.4.138:3000", "http://english-practice.tma.com.vn:3000", "http://192.168.34.128:3000"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/tests", response_model=List[schemas.Test])
# async def get_all_test(current_user: dict = Depends(get_current_user)):
async def get_all_test():
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    query = queries.SELECT_ALL_TESTS_QUERY
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    tests = [schemas.Test(**row) for row in results]

    return tests


# get part depend on test
@app.get("/tests/{test_id}/parts", response_model=List[schemas.Part])
async def get_parts(test_id: int):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(queries.GET_PARTS_BY_TEST_QUERY, (test_id,))
    parts = cursor.fetchall()
    cursor.close()
    conn.close()

    return [schemas.Part(**part) for part in parts]


# Get all questions
# @app.get("/questions", response_model=List[schemas.PartQuestionsResponse])
# async def get_questions(current_user: dict = Depends(get_current_user)):
# # async def get_questions():
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)
#     cursor.execute(queries.GET_ALL_QUESTION)
#     results = cursor.fetchall()
#     cursor.close()
#     conn.close()

#     transformed_results = []

#     for row in results:
#         transformed_row = {
#             'id': row["id"],
#             'part_id': row["part_id"],
#             'order': row["question_number"],
#             'content': row["content"],
#             'group_id':row["media_group_id"]
#         }
#         transformed_results.append(transformed_row)

#     return transformed_results


# moi sua
@app.get("/questions", response_model=List[schemas.PartQuestionsResponse])
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
        # Phân tích translate_script để lấy bản dịch khớp với question_id
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


# Get all testpart
@app.get("/testpart", response_model=List[schemas.TestPart])
async def get_test_part():
    conn = connect()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(queries.GET_ALL_TESTPART)

    results = cursor.fetchall()
    cursor.close()
    conn.close()

    return [schemas.TestPart(**row) for row in results]


# get all media
@app.get("/groupmedia", response_model=List[schemas.Media])
async def get_all_media():
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(queries.GET_ALL_MEIDA)
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    return [schemas.Media(**row) for row in results]


# Get all answer
@app.get("/answer", response_model=List[schemas.Answer])
async def get_all_answer():
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(queries.GET_ALL_ANSWER)
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    return [schemas.Answer(**row) for row in results]


# Get all part
@app.get("/part", response_model=List[schemas.Part])
async def get_all_answer(current_user: dict = Depends(get_current_user)):
    # async def get_all_answer():
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(queries.GET_ALL_PART)
    results = cursor.fetchall()

    for row in results:
        part = schemas.Part(**row)
        # Lấy số câu hỏi của part bằng cách thực hiện truy vấn GET_QUESTION_COUNT_OF_PART
        cursor.execute(queries.GET_QUESTION_COUNT_OF_PART, (part.part_order, part.id))
        question_count = cursor.fetchone()
        part.questionCount = (
            question_count.get("COUNT(toeicapp_question.id)", 0)
            if question_count
            else 0
        )

        if part.part_order == "Part 1":
            # part.questionCount = 6
            part.partOrderNum = 1
        elif part.part_order == "Part 2":
            # part.questionCount = 25
            part.partOrderNum = 2
        elif part.part_order == "Part 3":
            # part.questionCount = 39
            part.partOrderNum = 3
        elif part.part_order == "Part 4":
            # part.questionCount = 30
            part.partOrderNum = 4
        elif part.part_order == "Part 5":
            # part.questionCount = 30
            part.partOrderNum = 5
        elif part.part_order == "Part 6":
            # part.questionCount = 16
            part.partOrderNum = 6
        elif part.part_order == "Part 7":
            # part.questionCount = 54
            part.partOrderNum = 7
        else:
            part.questionCount = 0

        row["questionCount"] = part.questionCount
        row["partOrderNum"] = part.partOrderNum
    cursor.close()
    conn.close()

    return [schemas.Part(**row) for row in results]


# GET question theo part và test
@app.get(
    "/tests/{test_id}/parts/{part_id}/questions",
    response_model=schemas.TestPartQuestion,
)
# async def get_questions(test_id: int, part_id: int):
async def get_questions(
    test_id: int, part_id: int, current_user: dict = Depends(get_current_user)
):
    conn = connect()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(queries.GET_QUESTION_BY_PART_AND_TEST, (part_id, test_id))
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
            question = schemas.Question(
                id=row["question_id"], content=row["question_content"], answers=[]
            )
            questions.append(question)

        question.answers.append(
            schemas.Answer2(
                id=row["answer_id"],
                content=row["answer_content"],
                is_correct=row["is_correct"],
            )
        )

    cursor.close()
    conn.close()
    return schemas.TestPartQuestion(part_id=part_id, questions=questions)


@app.post("/register")
async def register(user: User):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(queries.REGISTER_QUERY_SL, (user.email, user.username))
    existing_user = cursor.fetchone()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or Username already taken")

    hashed_password = hash_password(user.password)
    cursor.execute(
        queries.REGISTER_QUERY_IS, (user.username, user.email, hashed_password)
    )
    conn.commit()

    return JSONResponse(content={"message": "User created successfully"})


@app.post("/login", response_model=schemas.UserResponse)
async def login(data: UserLogin):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(queries.LOGIN_QUERY, (data.username,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password!",
        )
    if not verify_password(data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password!",
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "user_id": user["id"], "role": user["role"]},
        expires_delta=access_token_expires,
    )
    # refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={
            "sub": user["username"],
            "user_id": user["id"],
            "role": user["role"],
            "token_type": "refresh",
        },
        # expires_delta=refresh_token_expires
    )
    response = schemas.UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"],
        date_joined=user["date_joined"],
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )
    print("Login response:", response.dict())
    cursor.close()
    conn.close()
    return response


# @app.post("/login", response_model=schemas.UserResponse)
# async def login(data: UserLogin):
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)
#     cursor.execute(queries.LOGIN_QUERY, (data.username,))
#     user = cursor.fetchone()

#     if not user:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password!")

#     if not verify_password(data.password, user['password']):
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password!")


#     access_token = create_access_token(data={"sub": user['username']})
#     refresh_token = create_refresh_token(data={"sub": user['username']})

#     cursor.close()
#     conn.close()

#     response_data = {**user, "access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
#     return schemas.UserResponse(**response_data)


@app.get("/tests/{test_id}/review")
# async def review_test(test_id: int):
async def review_test(test_id: int, current_user: dict = Depends(get_current_user)):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(queries.GET_ALL_QUESTION_OF_TEST, (test_id,))
    questions = cursor.fetchall()

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Your test is not valid"
        )

    cursor.close()
    conn.close()

    return questions


@app.get("/history", response_model=List[schemas.History])
# async def get_all_user_history():
async def get_all_user_history(current_user: dict = Depends(get_current_user)):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(queries.GET_ALL_HISTORY)
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    for row in results:
        if isinstance(row["dataprogress"], str):
            row["dataprogress"] = json.loads(row["dataprogress"])
        if isinstance(row["part"], str):
            row["part"] = json.loads(row["part"])

    return [schemas.History(**row) for row in results]


# @app.post("/history", response_model=schemas.History)
# async def create_history(history: schemas.HistoryCreate):
#     conn = connect()
#     cursor = conn.cursor()

#     try:

#         dataprogress_json = json.dumps(history.dataprogress)
#         part_json = json.dumps(history.part)
#         # cursor.execute(queries.CREATE_HISTORY, (dataprogress_json, part_json, history.test_id, history.time, history.type, history.user_id))
#         cursor.execute(
#             queries.CREATE_HISTORY_WITH_STATUS,  # Cập nhật query để thêm status
#             (dataprogress_json, part_json, history.test_id, history.time, history.type, history.user_id, history.status)
#         )
#         conn.commit()
#         new_id = cursor.lastrowid
#         history_dict = history.model_dump()
#         history_dict["id"] = new_id

#         cursor.close()
#         conn.close()

#         return history_dict

#     except Exception as e:
#         cursor.close()
#         conn.close()
#         raise HTTPException(status_code=400, detail=f"Error inserting history: {str(e)}")


@app.post("/history", response_model=schemas.History)
# async def create_or_update_history(history: schemas.HistoryCreate):
async def create_or_update_history(
    history: schemas.HistoryCreate, current_user: dict = Depends(get_current_user)
):
    conn = connect()
    cursor = conn.cursor(dictionary=True)

    try:
        dataprogress_json = json.dumps(history.dataprogress)
        part_json = json.dumps(history.part)
        time_left = history.time_left if hasattr(history, "time_left") else None

        cursor.execute(queries.CHECK_SAVED_PROGRESS, (history.user_id, history.test_id))
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
    conn = connect()
    cursor = conn.cursor(dictionary=True)

    try:
        dataprogress_json = json.dumps(history.dataprogress)
        part_json = json.dumps(history.part)

        # Kiểm tra xem có bản ghi "save" nào chưa
        cursor.execute(queries.CHECK_SAVED_PROGRESS, (history.user_id, history.test_id))
        existing_saved = cursor.fetchone()

        if history.status == "submit" and existing_saved:
            # Xóa bản ghi "save" trước khi tạo bản "submit"
            cursor.execute(
                "DELETE FROM toeicapp_history WHERE id = %s", (existing_saved["id"],)
            )
            conn.commit()

        if existing_saved and history.status == "save":
            # Ghi đè bản ghi "save" hiện tại
            cursor.execute(
                """
                UPDATE toeicapp_history 
                SET dataprogress = %s, part = %s, time = %s, create_at = NOW()
                WHERE id = %s
                """,
                (dataprogress_json, part_json, history.time, existing_saved["id"]),
            )
            conn.commit()
            history_dict = history.model_dump()
            history_dict["id"] = existing_saved["id"]
        else:
            # Tạo bản ghi mới (cho "save" hoặc "submit")
            cursor.execute(
                queries.CREATE_HISTORY_WITH_STATUS,
                (
                    dataprogress_json,
                    part_json,
                    history.test_id,
                    history.time,
                    history.type,
                    history.user_id,
                    history.status,
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


@app.get("/generate_result")
# async def generate_result(history_id: int):
async def generate_result(
    history_id: int, current_user: dict = Depends(get_current_user)
):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(queries.GENERATE_RESULT, (history_id,))
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

    cursor.execute(queries.GET_CORRECT_ANSWER)
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
        # Lấy danh sách các part_id từ bảng test_part thông qua test_id
        cursor.execute(queries.GET_PART_IDS_FOR_TEST, (history["test_id"],))
        part_ids = cursor.fetchall()

        part_question_count = {}
        for part in part_ids:
            part_id = part["part_id"]
            part_order = part["part_order"]
            if part_order in parts:
                # Truy vấn số câu hỏi cho từng phần từ toeicapp_question, với part_id và part_order
                cursor.execute(
                    queries.GET_QUESTION_COUNT_OF_PART, (part_order, part_id)
                )
                question_count = cursor.fetchone()
                print(question_count)
                print("***********************************************")
                part_question_count[part_order] = (
                    question_count.get("COUNT(toeicapp_question.id)", 0)
                    if question_count
                    else 0
                )
        total_questions = sum(
            part_question_count.get(part, 0) for part in part_question_count
        )
        print(part_question_count)
        print("===============================================")
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


@app.post("/refresh-token", response_model=schemas.TokenResponse)
async def refresh_token(request: schemas.TokenRequest):
    payload = verify_token(request.token)
    print(f"payload {payload}")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = {
        "sub": payload.get("sub"),
        "user_id": payload.get("user_id"),
        "role": payload.get("role"),
    }

    # access_token = create_access_token(data={"sub": username})
    # refresh_token = create_refresh_token(data={"sub": username})
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@app.get("/get_result")
# async def get_user_result(user_id: int):
async def get_user_result(user_id: int, current_user: dict = Depends(get_current_user)):
    conn = connect()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(queries.GET_RESULT_BY_USER, (user_id,))
    histories = cursor.fetchall()

    if not histories:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="History not found"
        )

    results = []

    part_question_count = {
        "Part 1": 6,
        "Part 2": 25,
        "Part 3": 39,
        "Part 4": 30,
        "Part 5": 30,
        "Part 6": 16,
        "Part 7": 54,
    }

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
        elif not isinstance(dataprogress, dict):
            results.append(
                {
                    "id": history["id"],
                    "error": "Invalid data format: dataprogress should be a dictionary",
                }
            )
            continue

        cursor.execute(queries.GET_CORRECT_ANSWER)
        correct_answers = cursor.fetchall()
        correct_answer_ids = {str(answer["id"]) for answer in correct_answers}

        correct_count = 0

        for question_id, answer_id in dataprogress.items():
            if answer_id in correct_answer_ids:
                correct_count += 1

        cursor.execute(queries.GET_TITLE_OF_TEST, (history["test_id"],))
        test = cursor.fetchone()
        testname = test["title"] if test else "Unknown Test"

        test_id = history["test_id"]
        history_id = history["id"]
        duration = history["time"]
        create_at = history["create_at"]

        if history["type"] == "FullTest":
            total_questions = 200
            parts = None
        elif history["type"] == "Practice":

            parts = json.loads(history["part"]) if history["part"] else []
            # Truy vấn danh sách part_id của test này
            cursor.execute(queries.GET_PART_IDS_FOR_TEST, (history["test_id"],))
            part_ids = cursor.fetchall()

            part_question_count = {}
            for part in part_ids:
                part_id = part["part_id"]
                part_order = part["part_order"]

                # Truy vấn số câu hỏi cho từng phần từ toeicapp_question
                cursor.execute(
                    queries.GET_QUESTION_COUNT_OF_PART, (part_order, part_id)
                )
                question_count = cursor.fetchone()

                # Nếu có kết quả, lấy số câu hỏi, nếu không thì mặc định 0
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
            "test_id": test_id,
            "history_id": history_id,
            "testname": testname,
            "type": history["type"],
            "date": create_at,
            "duration": duration,
            "score": score,
        }

        if history["type"] == "Practice":
            result["parts"] = parts

        results.append(result)

    cursor.close()
    conn.close()

    return results


# save progress
@app.get("/history/saved", response_model=schemas.History)
# async def get_saved_progress(user_id: int, test_id: int):
async def get_saved_progress(
    user_id: int, test_id: int, current_user: dict = Depends(get_current_user)
):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(queries.CHECK_SAVED_PROGRESS, (user_id, test_id))
    saved_progress = cursor.fetchone()
    cursor.close()
    conn.close()

    if not saved_progress:
        raise HTTPException(status_code=404, detail="No saved progress found")

    if isinstance(saved_progress["dataprogress"], str):
        saved_progress["dataprogress"] = json.loads(saved_progress["dataprogress"])
    if isinstance(saved_progress["part"], str):
        saved_progress["part"] = json.loads(saved_progress["part"])

    return schemas.History(**saved_progress)


@app.delete("/history/saved")
# async def delete_saved_progress(user_id: int, test_id: int):
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


@app.get("/tests/{test_id}/media", response_model=List[schemas.Media])
async def get_media_by_test(test_id: int):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(queries.GET_MEDIA_BY_TEST, (test_id,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return [schemas.Media(**row) for row in results]


@app.get("/users/{user_id}", response_model=schemas.UserResponse)
async def get_user(user_id: int, current_user: dict = Depends(get_current_user)):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(queries.GET_USER_BY_ID, (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return schemas.UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"],
        date_joined=user["date_joined"],
    )


# @app.post("/translate", response_model=dict)
# async def update_translate_script(
#     update_data: schemas.TranslateScriptUpdate,
#     current_user: dict = Depends(get_current_user)
# ):
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         # Lấy thông tin người dùng từ token
#         if not current_user or current_user.get("role") != "admin":
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Only admins can update translations"
#             )

#         # Cập nhật translate_script
#         cursor.execute(
#             queries.UPDATE_TRANSLATE_SCRIPT,
#             (update_data.translate_script, update_data.media_id)
#         )
#         if cursor.rowcount == 0:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Media not found"
#             )

#         conn.commit()
#         return {"message": "Translation updated successfully"}

#     except Exception as e:
#         conn.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Error updating translation: {str(e)}"
#         )
#     finally:
#         cursor.close()
#         conn.close()

# main.py
# @app.post("/translate", response_model=dict)
# async def update_translate_script(
#     update_data: schemas.TranslateScriptUpdate,
#     current_user: dict = Depends(get_current_user)
# ):
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         is_admin = current_user.get("role") == "admin"

#         # Kiểm tra xem media có tồn tại không
#         cursor.execute(
#             "SELECT translate_script, audio_script, paragrap_main FROM toeicapp_media WHERE id = %s",
#             (update_data.media_id,)
#         )
#         result = cursor.fetchone()
#         if not result:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Media not found"
#             )

#         # Nếu đã có bản dịch, trả về bản dịch hiện tại
#         if result["translate_script"]:
#             return {
#                 "message": "Translation already exists",
#                 "translation": result["translate_script"]
#             }

#         # Nếu yêu cầu auto_generate, tạo bản dịch mới
#         if update_data.translate_script == "auto_generate":
#             content_to_translate = result["audio_script"] or result["paragrap_main"] or ""
#             if not content_to_translate:
#                 raise HTTPException(
#                     status_code=status.HTTP_400_BAD_REQUEST,
#                     detail="No content available to translate"
#                 )

#             prompt = f"Translate the following English content into a concise Vietnamese sentence:/n/n{content_to_translate}"
#             translation = ask_gemini(prompt)

#             # Lưu bản dịch
#             cursor.execute(
#                 queries.UPDATE_TRANSLATE_SCRIPT,
#                 (translation, update_data.media_id)
#             )
#             conn.commit()

#             return {
#                 "message": "Translation generated and saved successfully",
#                 "translation": translation
#             }

#         # Nếu gửi bản dịch cụ thể, cho phép cả student và admin lưu
#         if update_data.translate_script:
#             cursor.execute(
#                 queries.UPDATE_TRANSLATE_SCRIPT,
#                 (update_data.translate_script, update_data.media_id)
#             )
#             conn.commit()
#             return {"message": "Translation saved successfully"}

#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="No translation or auto_generate flag provided"
#         )

#     except Exception as e:
#         conn.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Error processing translation: {str(e)}"
#         )
#     finally:
#         cursor.close()
#         conn.close()

# @app.post("/translate", response_model=dict)
# async def update_translate_script(
#     update_data: schemas.TranslateScriptUpdate,
#     current_user: dict = Depends(get_current_user)
# ):
#     print("Received payload:", update_data.dict())
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         # Validate media_id
#         if not update_data.media_id or update_data.media_id <= 0:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail="Invalid media_id"
#             )
#         if not update_data.question_id or update_data.question_id <= 0:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail="Invalid question_id"
#             )
#         if not update_data.translate_content:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail="translate_content cannot be empty"
#             )

#         # Fetch existing translations
#         cursor.execute(
#             "SELECT translate_script FROM toeicapp_media WHERE id = %s",
#             (update_data.media_id,)
#         )
#         result = cursor.fetchone()
#         if not result:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Media not found"
#             )

#         # Parse existing translations or initialize empty list
#         try:
#             translations = json.loads(result["translate_script"] or "[]")
#         except json.JSONDecodeError:
#             translations = []

#         # Update or append translation
#         updated = False
#         for translation in translations:
#             if translation.get("question_id") == update_data.question_id:
#                 translation["translate_content"] = update_data.translate_content
#                 updated = True
#                 break

#         if not updated:
#             translations.append({
#                 "question_id": update_data.question_id,
#                 "translate_content": update_data.translate_content
#             })

#         # Save updated translations
#         cursor.execute(
#             "UPDATE toeicapp_media SET translate_script = %s WHERE id = %s",
#             (json.dumps(translations), update_data.media_id)
#         )
#         if cursor.rowcount == 0:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Failed to update translation"
#             )

#         conn.commit()
#         return {"success": True, "message": "Translation updated successfully"}

#     except Exception as e:
#         conn.rollback()
#         print("Error details:", str(e))
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Error updating translation: {str(e)}"
#         )
#     finally:
#         cursor.close()
#         conn.close()

# hàm cũ

# @app.post("/translate", response_model=dict)
# async def update_translate_script(
#     update_data: schemas.TranslateScriptUpdate,
#     current_user: dict = Depends(get_current_user)
# ):
#     print("Received payload:", update_data.dict())
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         if not update_data.media_id or update_data.media_id <= 0:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail="Invalid media_id"
#             )
#         if not update_data.question_id or update_data.question_id <= 0:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail="Invalid question_id"
#             )
#         if not update_data.translate_content:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail="translate_content cannot be empty"
#             )

#         cursor.execute(
#             "SELECT id, translate_script FROM toeicapp_media WHERE id = %s",
#             (update_data.media_id,)
#         )
#         media = cursor.fetchone()
#         if not media:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Media not found"
#             )

#         cursor.execute(
#             "SELECT id FROM toeicapp_question WHERE id = %s",
#             (update_data.question_id,)
#         )
#         if not cursor.fetchone():
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Question not found"
#             )

#         try:
#             translations = json.loads(media["translate_script"] or "[]")
#             if not isinstance(translations, list):
#                 translations = []
#         except json.JSONDecodeError:
#             translations = []
#             print("Warning: Invalid JSON in translate_script, resetting to empty list")

#         updated = False
#         new_translation = None
#         current_time = datetime.now().isoformat()
#         for translation in translations:
#             if translation.get("question_id") == update_data.question_id:
#                 translation["translate_content"] = update_data.translate_content
#                 translation["updated_at"] = current_time
#                 translation["user_id"] = current_user["id"]
#                 new_translation = translation
#                 updated = True
#                 break

#         if not updated:
#             new_translation = {
#                 "question_id": update_data.question_id,
#                 "translate_content": update_data.translate_content,
#                 "created_at": current_time,
#                 "updated_at": current_time,
#                 "user_id": current_user["id"]
#             }
#             translations.append(new_translation)

#         try:
#             json.dumps(translations)
#         except (TypeError, ValueError) as e:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail=f"Invalid translation data: {str(e)}"
#             )

#         cursor.execute(
#             "UPDATE toeicapp_media SET translate_script = %s WHERE id = %s",
#             (json.dumps(translations), update_data.media_id)
#         )
#         if cursor.rowcount == 0:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Failed to update translation"
#             )

#         conn.commit()
#         return {
#             "success": True,
#             "message": "Translation updated successfully",
#             "data": {
#                 "question_id": new_translation["question_id"],
#                 "translate_content": new_translation["translate_content"],
#                 "created_at": new_translation["created_at"],
#                 "updated_at": new_translation["updated_at"]
#             }
#         }

#     except HTTPException:
#         conn.rollback()
#         raise
#     except Exception as e:
#         conn.rollback()
#         print("Error details:", str(e))
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error updating translation: {str(e)}"
#         )
#     finally:
#         cursor.close()
#         conn.close()

# @app.get("/translate", response_model=dict)
# async def get_translate_script(
#     media_id: int,
#     question_id: Optional[int] = None,
#     current_user: dict = Depends(get_current_user)
# ):
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         if media_id <= 0:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail="Invalid media_id"
#             )

#         cursor.execute(
#             "SELECT translate_script FROM toeicapp_media WHERE id = %s",
#             (media_id,)
#         )
#         media = cursor.fetchone()
#         if not media:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Media not found"
#             )

#         try:
#             translations = json.loads(media["translate_script"] or "[]")
#             if not isinstance(translations, list):
#                 translations = []
#         except json.JSONDecodeError:
#             translations = []

#         # Chuẩn hóa translations
#         cleaned_translations = []
#         for t in translations:
#             if isinstance(t, dict) and "question_id" in t:
#                 translate_content = t.get("translate_content", "")
#                 if isinstance(translate_content, (dict, list)):
#                     translate_content = json.dumps(translate_content)
#                 cleaned_translations.append({
#                     "question_id": t["question_id"],
#                     "translate_content": translate_content,
#                     "created_at": t.get("created_at"),
#                     "updated_at": t.get("updated_at"),
#                     "user_id": t.get("user_id")
#                 })

#         if question_id is not None:
#             for translation in cleaned_translations:
#                 if translation["question_id"] == question_id:
#                     return {
#                         "success": True,
#                         "data": {
#                             "question_id": translation["question_id"],
#                             "translate_content": translation["translate_content"],
#                             "created_at": translation["created_at"],
#                             "updated_at": translation["updated_at"]
#                         }
#                     }
#             return {
#                 "success": True,
#                 "data": None,
#                 "message": "No translation found for the specified question_id"
#             }

#         return {"success": True, "data": cleaned_translations}

#     except HTTPException:
#         raise
#     except Exception as e:
#         print("Error details:", str(e))
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error fetching translation: {str(e)}"
#         )
#     finally:
#         cursor.close()
#         conn.close()

# @app.delete("/translate", response_model=dict)
# async def delete_translate_script(
#     media_id: int,
#     question_id: int,
#     current_user: dict = Depends(get_current_user)
# ):
#     if not current_user or current_user.get("role") != "admin":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only admins can delete translations"
#         )

#     conn = connect()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         if media_id <= 0 or question_id <= 0:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail="Invalid media_id or question_id"
#             )

#         cursor.execute(
#             "SELECT translate_script FROM toeicapp_media WHERE id = %s",
#             (media_id,)
#         )
#         media = cursor.fetchone()
#         if not media:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Media not found"
#             )

#         try:
#             translations = json.loads(media["translate_script"] or "[]")
#             if not isinstance(translations, list):
#                 translations = []
#         except json.JSONDecodeError:
#             translations = []

#         # Lọc bỏ bản dịch có question_id
#         updated_translations = [
#             t for t in translations if t.get("question_id") != question_id
#         ]

#         # Nếu không có thay đổi, không cần cập nhật
#         if len(updated_translations) == len(translations):
#             return {"success": True, "message": "No translation found for the specified question_id"}

#         # Cập nhật lại translate_script
#         cursor.execute(
#             "UPDATE toeicapp_media SET translate_script = %s WHERE id = %s",
#             (json.dumps(updated_translations), media_id)
#         )
#         if cursor.rowcount == 0:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Failed to update translation"
#             )

#         conn.commit()
#         return {"success": True, "message": "Translation deleted successfully"}

#     except HTTPException:
#         conn.rollback()
#         raise
#     except Exception as e:
#         conn.rollback()
#         print("Error details:", str(e))
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error deleting translation: {str(e)}"
#         )
#     finally:
#         cursor.close()
#         conn.close()


# hàm mới thêm language
@app.post("/translate", response_model=dict)
async def update_translate_script(
    update_data: schemas.TranslateScriptUpdate,
    current_user: dict = Depends(get_current_user),
):
    print("Received payload:", update_data.dict())
    conn = connect()
    cursor = conn.cursor(dictionary=True)

    try:
        # Kiểm tra dữ liệu đầu vào
        if update_data.media_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid media_id",
            )
        if update_data.question_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid question_id",
            )
        if not update_data.translate_content:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="translate_content cannot be empty",
            )
        if update_data.language_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid language_id",
            )

        # Kiểm tra media_id tồn tại
        cursor.execute(
            "SELECT id, translate_script FROM toeicapp_media WHERE id = %s",
            (update_data.media_id,),
        )
        media = cursor.fetchone()
        if not media:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Media not found"
            )

        # Kiểm tra question_id tồn tại
        cursor.execute(
            "SELECT id FROM toeicapp_question WHERE id = %s", (update_data.question_id,)
        )
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Question not found"
            )

        # Kiểm tra language_id tồn tại
        cursor.execute(
            "SELECT id FROM toeicapp_language WHERE id = %s", (update_data.language_id,)
        )
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Language not found"
            )

        # Phân tích translate_script hiện tại
        try:
            translations = json.loads(media["translate_script"] or "[]")
            if not isinstance(translations, list):
                translations = []
        except json.JSONDecodeError:
            translations = []
            print("Warning: Invalid JSON in translate_script, resetting to empty list")

        # Cập nhật hoặc thêm bản dịch mới
        updated = False
        new_translation = None
        current_time = datetime.now().isoformat()
        user_id = current_user["user_id"]

        for translation in translations:
            if (
                translation.get("question_id") == update_data.question_id
                and translation.get("language_id") == update_data.language_id
            ):
                translation["translate_content"] = update_data.translate_content
                translation["updated_at"] = current_time
                translation["user_id"] = user_id
                new_translation = translation
                updated = True
                break

        if not updated:
            new_translation = {
                "question_id": update_data.question_id,
                "language_id": update_data.language_id,
                "translate_content": update_data.translate_content,
                "created_at": current_time,
                "updated_at": current_time,
                "user_id": user_id,
            }
            translations.append(new_translation)

        # Kiểm tra JSON hợp lệ
        try:
            json.dumps(translations)
        except (TypeError, ValueError) as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid translation data: {str(e)}",
            )

        # Cập nhật cơ sở dữ liệu
        cursor.execute(
            "UPDATE toeicapp_media SET translate_script = %s WHERE id = %s",
            (json.dumps(translations), update_data.media_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update translation",
            )

        conn.commit()
        return {
            "success": True,
            "message": "Translation updated successfully",
            "data": {
                "question_id": new_translation["question_id"],
                "language_id": new_translation["language_id"],
                "translate_content": new_translation["translate_content"],
                "created_at": new_translation["created_at"],
                "updated_at": new_translation["updated_at"],
                "user_id": new_translation["user_id"],
            },
        }

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        print("Error details:", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating translation: {str(e)}",
        )
    finally:
        cursor.close()
        conn.close()


@app.get("/translate", response_model=dict)
async def get_translate_script(
    media_id: int,
    question_id: Optional[int] = None,
    language_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    conn = connect()
    cursor = conn.cursor(dictionary=True)

    try:
        if media_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid media_id",
            )

        cursor.execute(
            "SELECT translate_script FROM toeicapp_media WHERE id = %s", (media_id,)
        )
        media = cursor.fetchone()
        if not media:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Media not found"
            )

        try:
            translations = json.loads(media["translate_script"] or "[]")
            if not isinstance(translations, list):
                translations = []
        except json.JSONDecodeError:
            translations = []

        # Chuẩn hóa translations
        cleaned_translations = []
        for t in translations:
            if isinstance(t, dict) and "question_id" in t:
                translate_content = t.get("translate_content", "")
                if isinstance(translate_content, (dict, list)):
                    translate_content = json.dumps(translate_content)
                cleaned_translations.append(
                    {
                        "question_id": t["question_id"],
                        "language_id": t.get("language_id", 1),
                        "translate_content": translate_content,
                        "created_at": t.get("created_at"),
                        "updated_at": t.get("updated_at"),
                        "user_id": t.get("user_id"),
                    }
                )

        # Lọc theo question_id và language_id
        if question_id is not None and language_id is not None:
            for translation in cleaned_translations:
                if (
                    translation["question_id"] == question_id
                    and translation["language_id"] == language_id
                ):
                    return {
                        "success": True,
                        "data": {
                            "question_id": translation["question_id"],
                            "language_id": translation["language_id"],
                            "translate_content": translation["translate_content"],
                            "created_at": translation["created_at"],
                            "updated_at": translation["updated_at"],
                            "user_id": translation["user_id"],
                        },
                    }
            return {
                "success": True,
                "data": None,
                "message": "No translation found for the specified question_id and language_id",
            }

        # Lọc theo language_id
        if language_id is not None:
            cleaned_translations = [
                t for t in cleaned_translations if t["language_id"] == language_id
            ]

        return {"success": True, "data": cleaned_translations}

    except HTTPException:
        raise
    except Exception as e:
        print("Error details:", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching translation: {str(e)}",
        )
    finally:
        cursor.close()
        conn.close()


# @app.post("/explain", response_model=dict)
# async def update_explain_question(
#     update_data: schemas.ExplainQuestionUpdate,
#     current_user: dict = Depends(get_current_user)
# ):
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         # Kiểm tra quyền admin
#         if not current_user or current_user.get("role") != "admin":
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Only admins can update explanations"
#             )

#         # Cập nhật explain_question
#         cursor.execute(
#             queries.UPDATE_EXPLAIN_QUESTION,
#             (update_data.explain_question, update_data.media_id)
#         )
#         if cursor.rowcount == 0:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Media not found"
#             )

#         conn.commit()
#         return {"message": "Explanation updated successfully"}

#     except Exception as e:
#         conn.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Error updating explanation: {str(e)}"
#         )
#     finally:
#         cursor.close()
#         conn.close()


# @app.post("/explain", response_model=dict)
# async def update_explain_question(
#     update_data: schemas.ExplainQuestionUpdate,
#     current_user: dict = Depends(get_current_user)
# ):
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         # Kiểm tra quyền admin
#         if not current_user or current_user.get("role") != "admin":
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Only admins can update explanations"
#             )

#         # Cập nhật explain_question
#         cursor.execute(
#             queries.UPDATE_EXPLAIN_QUESTION,
#             (update_data.explain_question, update_data.media_id)
#         )
#         if cursor.rowcount == 0:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Media not found"
#             )

#         conn.commit()
#         return {"message": "Explanation updated successfully"}

#     except Exception as e:
#         conn.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Error updating explanation: {str(e)}"
#         )
#     finally:
#         cursor.close()
#         conn.close()

# @app.get("/explain/{media_id}", response_model=list[dict])
# async def get_explanations(
#     media_id: int,
#     current_user: dict = Depends(get_current_user)
# ):
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         cursor.execute(
#             """
#             SELECT question_id, explain_question
#             FROM toeicapp_explain
#             WHERE media_id = %s
#             """,
#             (media_id,)
#         )
#         explanations = cursor.fetchall()
#         return [
#             {"question_id": row["question_id"], "explain_question": row["explain_question"]}
#             for row in explanations
#         ]
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Error fetching explanations: {str(e)}"
#         )
#     finally:
#         cursor.close()
#         conn.close()

# hàm cũ

# @app.post("/explain", response_model=dict)
# async def update_explain_question(
#     update_data: schemas.ExplainQuestionUpdate,
#     current_user: dict = Depends(get_current_user)
# ):
#     print("Received payload:", update_data.dict())
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         # Debug current_user
#         print("Current user:", current_user)

#         # Kiểm tra user có hợp lệ không (cả admin và student đều được phép)
#         if not current_user:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Authentication required"
#             )

#         # Validate dữ liệu đầu vào
#         if not update_data.media_id or update_data.media_id <= 0:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail="Invalid media_id"
#             )
#         if not update_data.question_id or update_data.question_id <= 0:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail="Invalid question_id"
#             )
#         if not update_data.explain_question:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail="explain_question cannot be empty"
#             )

#         # Kiểm tra media có tồn tại không
#         cursor.execute(
#             "SELECT id, explain_question FROM toeicapp_media WHERE id = %s",
#             (update_data.media_id,)
#         )
#         media = cursor.fetchone()
#         if not media:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Media not found"
#             )

#         # Kiểm tra question có tồn tại không
#         cursor.execute(
#             "SELECT id FROM toeicapp_question WHERE id = %s",
#             (update_data.question_id,)
#         )
#         if not cursor.fetchone():
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Question not found"
#             )

#         # Parse JSON explain_question hiện tại
#         try:
#             explanations = json.loads(media["explain_question"] or "[]")
#             if not isinstance(explanations, list):
#                 explanations = []
#         except json.JSONDecodeError:
#             explanations = []
#             print("Warning: Invalid JSON in explain_question, resetting to empty list")

#         # Update hoặc thêm mới explanation
#         updated = False
#         new_explanation = None
#         current_time = datetime.now().isoformat()

#         # Lấy user_id an toàn - thử nhiều key có thể có
#         user_id = (current_user.get("id") or
#                   current_user.get("user_id") or
#                   current_user.get("userId") or
#                   0)
#         print("User ID:", user_id)

#         for explanation in explanations:
#             if explanation.get("question_id") == update_data.question_id:
#                 explanation["explain_question"] = update_data.explain_question
#                 explanation["updated_at"] = current_time
#                 explanation["user_id"] = user_id
#                 new_explanation = explanation
#                 updated = True
#                 break

#         if not updated:
#             new_explanation = {
#                 "question_id": update_data.question_id,
#                 "explain_question": update_data.explain_question,
#                 "created_at": current_time,
#                 "updated_at": current_time,
#                 "user_id": user_id
#             }
#             explanations.append(new_explanation)

#         # Validate JSON trước khi lưu
#         try:
#             json.dumps(explanations)
#         except (TypeError, ValueError) as e:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail=f"Invalid explanation data: {str(e)}"
#             )

#         # Cập nhật vào database
#         cursor.execute(
#             "UPDATE toeicapp_media SET explain_question = %s WHERE id = %s",
#             (json.dumps(explanations), update_data.media_id)
#         )
#         if cursor.rowcount == 0:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Failed to update explanation"
#             )

#         conn.commit()
#         return {
#             "success": True,
#             "message": "Explanation updated successfully",
#             "data": {
#                 "question_id": new_explanation["question_id"],
#                 "explain_question": new_explanation["explain_question"],
#                 "created_at": new_explanation["created_at"],
#                 "updated_at": new_explanation["updated_at"]
#             }
#         }

#     except HTTPException:
#         conn.rollback()
#         raise
#     except Exception as e:
#         conn.rollback()
#         print("Error details:", str(e))
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error updating explanation: {str(e)}"
#         )
#     finally:
#         cursor.close()
#         conn.close()


# @app.get("/explain", response_model=dict)
# async def get_explain_questions(
#     media_id: int,
#     question_id: Optional[int] = None,
#     current_user: dict = Depends(get_current_user)
# ):
#     conn = connect()
#     cursor = conn.cursor(dictionary=True)

#     try:
#         if media_id <= 0:
#             raise HTTPException(
#                 status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#                 detail="Invalid media_id"
#             )

#         cursor.execute(
#             "SELECT explain_question FROM toeicapp_media WHERE id = %s",
#             (media_id,)
#         )
#         media = cursor.fetchone()
#         if not media:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Media not found"
#             )

#         try:
#             explanations = json.loads(media["explain_question"] or "[]")
#             if not isinstance(explanations, list):
#                 explanations = []
#         except json.JSONDecodeError:
#             explanations = []

#         # Chuẩn hóa explanations
#         cleaned_explanations = []
#         for e in explanations:
#             if isinstance(e, dict) and "question_id" in e:
#                 explain_question = e.get("explain_question", "")
#                 if isinstance(explain_question, (dict, list)):
#                     explain_question = json.dumps(explain_question)
#                 cleaned_explanations.append({
#                     "question_id": e["question_id"],
#                     "explain_question": explain_question,
#                     "created_at": e.get("created_at"),
#                     "updated_at": e.get("updated_at"),
#                     "user_id": e.get("user_id")
#                 })

#         # Nếu có question_id cụ thể, trả về explanation cho question đó
#         if question_id is not None:
#             for explanation in cleaned_explanations:
#                 if explanation["question_id"] == question_id:
#                     return {
#                         "success": True,
#                         "data": {
#                             "question_id": explanation["question_id"],
#                             "explain_question": explanation["explain_question"],
#                             "created_at": explanation["created_at"],
#                             "updated_at": explanation["updated_at"]
#                         }
#                     }
#             return {
#                 "success": True,
#                 "data": None,
#                 "message": "No explanation found for the specified question_id"
#             }

#         return {"success": True, "data": cleaned_explanations}

#     except HTTPException:
#         raise
#     except Exception as e:
#         print("Error details:", str(e))
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error fetching explanation: {str(e)}"
#         )
#     finally:
#         cursor.close()
#         conn.close()


# mới thêm language
@app.post("/explain", response_model=dict)
async def update_explain_question(
    update_data: schemas.ExplainQuestionUpdate,
    current_user: dict = Depends(get_current_user),
):
    print("Received payload:", update_data.dict())
    conn = connect()
    cursor = conn.cursor(dictionary=True)

    try:
        # Kiểm tra dữ liệu đầu vào
        if update_data.media_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid media_id",
            )
        if update_data.question_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid question_id",
            )
        if not update_data.explain_question:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="explain_question cannot be empty",
            )
        if update_data.language_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid language_id",
            )

        # Kiểm tra media_id tồn tại
        cursor.execute(
            "SELECT id, explain_question FROM toeicapp_media WHERE id = %s",
            (update_data.media_id,),
        )
        media = cursor.fetchone()
        if not media:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Media not found"
            )

        # Kiểm tra question_id tồn tại
        cursor.execute(
            "SELECT id FROM toeicapp_question WHERE id = %s", (update_data.question_id,)
        )
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Question not found"
            )

        # Kiểm tra language_id tồn tại
        cursor.execute(
            "SELECT id FROM toeicapp_language WHERE id = %s", (update_data.language_id,)
        )
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Language not found"
            )

        # Phân tích explain_question hiện tại
        try:
            explanations = json.loads(media["explain_question"] or "[]")
            if not isinstance(explanations, list):
                explanations = []
        except json.JSONDecodeError:
            explanations = []
            print("Warning: Invalid JSON in explain_question, resetting to empty list")

        # Cập nhật hoặc thêm lời giải thích mới
        updated = False
        new_explanation = None
        current_time = datetime.now().isoformat()
        user_id = current_user["user_id"]

        for explanation in explanations:
            if (
                explanation.get("question_id") == update_data.question_id
                and explanation.get("language_id") == update_data.language_id
            ):
                explanation["explain_question"] = update_data.explain_question
                explanation["updated_at"] = current_time
                explanation["user_id"] = user_id
                new_explanation = explanation
                updated = True
                break

        if not updated:
            new_explanation = {
                "question_id": update_data.question_id,
                "language_id": update_data.language_id,
                "explain_question": update_data.explain_question,
                "created_at": current_time,
                "updated_at": current_time,
                "user_id": user_id,
            }
            explanations.append(new_explanation)

        # Kiểm tra JSON hợp lệ
        try:
            json.dumps(explanations)
        except (TypeError, ValueError) as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid explanation data: {str(e)}",
            )

        # Cập nhật cơ sở dữ liệu
        cursor.execute(
            "UPDATE toeicapp_media SET explain_question = %s WHERE id = %s",
            (json.dumps(explanations), update_data.media_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update explanation",
            )

        conn.commit()
        return {
            "success": True,
            "message": "Explanation updated successfully",
            "data": {
                "question_id": new_explanation["question_id"],
                "language_id": new_explanation["language_id"],
                "explain_question": new_explanation["explain_question"],
                "created_at": new_explanation["created_at"],
                "updated_at": new_explanation["updated_at"],
                "user_id": new_explanation["user_id"],
            },
        }

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        print("Error details:", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating explanation: {str(e)}",
        )
    finally:
        cursor.close()
        conn.close()


@app.get("/explain", response_model=dict)
async def get_explain_questions(
    media_id: int,
    question_id: Optional[int] = None,
    language_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    conn = connect()
    cursor = conn.cursor(dictionary=True)

    try:
        if media_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid media_id",
            )

        cursor.execute(
            "SELECT explain_question FROM toeicapp_media WHERE id = %s", (media_id,)
        )
        media = cursor.fetchone()
        if not media:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Media not found"
            )

        try:
            explanations = json.loads(media["explain_question"] or "[]")
            if not isinstance(explanations, list):
                explanations = []
        except json.JSONDecodeError:
            explanations = []

        # Chuẩn hóa explanations
        cleaned_explanations = []
        for e in explanations:
            if isinstance(e, dict) and "question_id" in e:
                explain_question = e.get("explain_question", "")
                if isinstance(explain_question, (dict, list)):
                    explain_question = json.dumps(explain_question)
                cleaned_explanations.append(
                    {
                        "question_id": e["question_id"],
                        "language_id": e.get("language_id", 1),
                        "explain_question": explain_question,
                        "created_at": e.get("created_at"),
                        "updated_at": e.get("updated_at"),
                        "user_id": e.get("user_id"),
                    }
                )

        # Lọc theo question_id và language_id
        if question_id is not None and language_id is not None:
            for explanation in cleaned_explanations:
                if (
                    explanation["question_id"] == question_id
                    and explanation["language_id"] == language_id
                ):
                    return {
                        "success": True,
                        "data": {
                            "question_id": explanation["question_id"],
                            "language_id": explanation["language_id"],
                            "explain_question": explanation["explain_question"],
                            "created_at": explanation["created_at"],
                            "updated_at": explanation["updated_at"],
                            "user_id": explanation["user_id"],
                        },
                    }
            return {
                "success": True,
                "data": None,
                "message": "No explanation found for the specified question_id and language_id",
            }

        # Lọc theo language_id
        if language_id is not None:
            cleaned_explanations = [
                e for e in cleaned_explanations if e["language_id"] == language_id
            ]

        return {"success": True, "data": cleaned_explanations}

    except HTTPException:
        raise
    except Exception as e:
        print("Error details:", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching explanation: {str(e)}",
        )
    finally:
        cursor.close()
        conn.close()


# @app.post("/chat")
# def chat(request: schemas.PromptRequest):
#     reply = ask_gemini(request.prompt)
#     return {"response": reply}


@app.post("/chat", response_model=dict)
async def chat(
    request: schemas.PromptRequest, current_user: dict = Depends(get_current_user)
):
    try:
        reply = ask_gemini(request.prompt, request.language_id)
        return {"response": reply}
    except Exception as e:
        print(f"Error details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat: {str(e)}",
        )


# @app.post("/chat-with-image")
# def chat_with_image(request: schemas.PromptWithImageRequest):
#     reply = ask_gemini_with_image(request.prompt, request.image_base64)
#     return {"response": reply}

# @app.post("/chat-with-image")
# def chat_with_image(request: schemas.PromptWithImageRequest):
#     reply = ask_gemini_with_image(request.prompt, request.id)
#     return {"response": reply}


@app.post("/chat-with-image", response_model=dict)
async def chat_with_image(
    request: schemas.PromptWithImageRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        reply = ask_gemini_with_image(request.prompt, request.id, request.language_id)
        return {"response": reply}
    except Exception as e:
        print(f"Error details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing image chat: {str(e)}",
        )


# main.py
@app.get("/languages", response_model=dict)
async def get_languages(current_user: dict = Depends(get_current_user)):
    conn = connect()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(queries.GET_ALL_LANGUAGES)
        languages = cursor.fetchall()
        return {"success": True, "data": languages}
    except Exception as e:
        print("Error details:", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching languages: {str(e)}",
        )
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    uvicorn.run(
        app="main:app",
        host="0.0.0.0",
        port=8000,
        log_level="debug",  # Set log level to debug
        workers=4,
        reload=True,
    )
