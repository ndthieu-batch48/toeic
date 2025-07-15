from fastapi import APIRouter, HTTPException, status
from datetime import timedelta

from pydantic import BaseModel

# from ...database.test_pool import get_cursor_from_pool

from ...schemas.user import UserCreate, UserLogin, UserResponse, TokenRequest, TokenResponse
from ...helpers.jwt_helper import hash_password, verify_password, create_access_token, create_refresh_token, verify_token
from ...database.connection import connect
from ...database.queries import SELECT_USER_BY_USERNAME, SELECT_USER_BY_EMAIL_OR_USERNAME, CREATE_USER, UPDATE_USER_PASSWORD_BY_EMAIL, CREATE_RESET_PASSWORD_OTP
from ...core.app_config import app_config

from datetime import datetime


router = APIRouter()

@router.post("/register")
async def register(user: UserCreate):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(SELECT_USER_BY_EMAIL_OR_USERNAME, (user.email, user.username))
    existing_user = cursor.fetchone()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or Username already taken")

    hashed_password = hash_password(user.password)
    cursor.execute(CREATE_USER, (user.username, user.email, hashed_password))
    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "User created successfully"}

@router.post("/login", response_model=UserResponse)
async def login(data: UserLogin):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(SELECT_USER_BY_USERNAME, (data.username,))
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
    
    access_token_expires = timedelta(minutes=app_config.ACCESS_TOKEN_EXPIRE_MINUTES)
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

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.put("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    try:
        payload = verify_token(request.token)
        if not payload or payload.get("action") != "reset-password":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )

        email = payload.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token payload"
            )

        # Add password validation
        if len(request.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long"
            )

        conn = connect()
        cursor = conn.cursor(dictionary=True)
        
        hashed_password = hash_password(request.new_password)
        cursor.execute(UPDATE_USER_PASSWORD_BY_EMAIL, (hashed_password, email))
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password"
            )
        
        cursor.close()
        conn.close()
        
        return {"message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting password"
        )
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

    # class TestOtp(BaseModel):
    #     user_id: int
    #     code: str
    #     expires_at: str

    # @router.post("/otp")
    # async def test_otp(data: TestOtp):
    #     async with get_cursor_from_pool() as (cursor, conn):
    #         try:
    #             await cursor.execute(CREATE_RESET_PASSWORD_OTP, ( data.user_id, data.code , datetime.now()))
    #         except Exception as e:
    #             await conn.rollback()
    #             raise HTTPException(status_code=500, detail=str(e))
         