from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from datetime import timedelta

from pydantic import BaseModel

from app.auth.smtp import send_email_service
from ...schemas.user import UserCreate, UserLogin, UserResponse, TokenRequest, TokenResponse
from ...core.security import hash_password, verify_password, create_access_token, create_refresh_token, verify_token
from ...database.connection import connect
from ...database.queries import LOGIN_QUERY, REGISTER_QUERY_SL, REGISTER_QUERY_IS
from ...core.config import settings

router = APIRouter()

@router.post("/register")
async def register(user: UserCreate):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(REGISTER_QUERY_SL, (user.email, user.username))
    existing_user = cursor.fetchone()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or Username already taken")

    hashed_password = hash_password(user.password)
    cursor.execute(REGISTER_QUERY_IS, (user.username, user.email, hashed_password))
    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "User created successfully"}

@router.post("/login", response_model=UserResponse)
async def login(data: UserLogin):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(LOGIN_QUERY, (data.username,))
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
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user["username"], 
            "user_id": user["id"], 
            "role": user["role"]
        },
        expires_delta=access_token_expires,
    )
    
    refresh_token = create_refresh_token(
        data={
            "sub": user["username"],
            "user_id": user["id"],
            "role": user["role"],
            "token_type": "refresh",
        }
    )
    
    response = UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"],
        date_joined=user["date_joined"], 
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )
    
    cursor.close()
    conn.close()
    return response

@router.post("/refresh-token", response_model=TokenResponse)
async def refresh_token(request: TokenRequest):
    payload = verify_token(request.token)
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
    
    access_token = create_access_token(token_data)
    refresh_token_new = create_refresh_token(token_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_new,
        "token_type": "bearer",
    }

class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/send-mail")
async def send_mail_endpoint(payload: ForgotPasswordRequest):
    send_email_service(payload.email, "", "")
    return {"message": "Email will be sent in background.",  "email": payload.email}

# router.post("/reset-password")
# async def reset_password(reset_password_token: str, new_password: str):
#     return