import asyncio
from fastapi import APIRouter, HTTPException, status
from datetime import timedelta

from fastapi.responses import JSONResponse

from ...database.test_pool import with_transaction
from ...database.connection import connect
from ...schemas import auth as auth_schema
from ...database import queries as auth_queries
from ...core.app_config import app_config

from ...auth.smtp import (
    build_password_reset_email, 
    build_verify_email_mail, 
    send_email_service_async)
from ...helpers.otp_helper import (
    generate_expire_otp_helper, 
    verify_otp_helper)
from ...helpers.jwt_helper import (
    hash_password, 
    verify_password, 
    create_access_token, 
    create_refresh_token, 
    verify_token)

router = APIRouter()

@router.post("/register")
async def register(user: auth_schema.RegisterRequest):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(auth_queries.SELECT_USER_BY_EMAIL_OR_USERNAME, (user.email, user.username))
    existing_user = cursor.fetchone()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or Username already taken")

    hashed_password = hash_password(user.password)
    cursor.execute(auth_queries.INSERT_USER, (user.username, user.email, hashed_password))
    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "User created successfully"}

@router.post("/login", response_model = auth_schema.UserResponse)
async def login(req: auth_schema.LoginRequest):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    
    credential = req.username if req.username else req.email
    cursor.execute(auth_queries.SELECT_USER_BY_USERNAME_OR_EMAIL, (credential, credential))
    user = cursor.fetchone()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password!",
        )
    
    if not verify_password(req.password, user["password"]):
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
    
    response = auth_schema.UserResponse(
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

@router.post("/refresh-token", response_model=auth_schema.TokenResponse)
async def refresh_token(req: auth_schema.TokenRequest):
    payload = verify_token(req.token)
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


@router.put("/reset-password")
async def reset_password(request: auth_schema.ResetPasswordRequest):
    try:

        if len(request.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long"
            )

        if not request.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required"
            )

        conn = connect()
        cursor = conn.cursor(dictionary=True)
        
        hashed_password = hash_password(request.new_password)
        cursor.execute(auth_queries.UPDATE_USER_PASSWORD_BY_EMAIL, (hashed_password, request.email))
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


@router.post("/reset-password/otp")
async def send_reset_password_otp(req: auth_schema.EmailServiceRequest):    
    otp, otp_expire_time = generate_expire_otp_helper()
   
    @with_transaction
    async def insert_otp_transaction(cursor, conn, email):
        await cursor.execute(auth_queries.SELECT_USER_BY_EMAIL, (email,))
        user = await cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        await cursor.execute(auth_queries.DELETE_UNUSED_RESET_PASSWORD_OTP, (email,))
        await cursor.execute(auth_queries.INSERT_RESET_PASSWORD_OTP, (email, otp, otp_expire_time))

    try:
        await insert_otp_transaction(email=req.request_email) # type: ignore
        
        expire_display = f"{app_config.OTP_EXPIRES_MINUTES}"
        msg = build_password_reset_email(req.request_email, otp, expire_display)
        asyncio.create_task(send_email_service_async(msg))
        
        return JSONResponse(
            status_code=200,
            content={"message": f"A password reset OTP will be sent to {req.request_email}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in reset password OTP: {e}"
        )

@router.post("/reset-password/verify")
async def verify_reset_password_otp(req: auth_schema.VerifyOtpServiceRequest):    
   
    @with_transaction
    async def verify_otp(cursor, conn, email, otp):
        await cursor.execute(auth_queries.SELECT_RESET_PASSWORD_OTP_BY_EMAIL, (email,))
        data = await cursor.fetchone()
        if not data:
            raise HTTPException(status_code=400, detail="OTP not found")
            
        otp, expires_at = data.get("otp"), data.get("expires_at")
        is_valid = verify_otp_helper(req.otp, otp, expires_at)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
        await cursor.execute(auth_queries.UPDATE_USED_RESET_PASSWORD_OTP, (email, otp))

    try:
        await verify_otp(email=req.request_email, otp=req.otp) # type: ignore
        
        return JSONResponse(
            status_code=200,
            content={"message": f"Reset password OTP is verified {req.request_email}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in reset password OTP: {e}"
        )

@router.post("/verify-email/otp")
async def send_verify_email_otp(req: auth_schema.EmailServiceRequest):    
    otp, otp_expire_time = generate_expire_otp_helper()
   
    @with_transaction
    async def insert_otp(cursor, conn, email):
        await cursor.execute(auth_queries.DELETE_UNUSED_VERIFY_EMAIL_OTP, (email,))
        await cursor.execute(auth_queries.INSERT_VERIFY_EMAIL_OTP, (email, otp, otp_expire_time))

    try:
        await insert_otp(email=req.request_email) # type: ignore
        
        expire_display = f"{app_config.OTP_EXPIRES_MINUTES}"
        msg = build_verify_email_mail(req.request_email, otp, expire_display)
        asyncio.create_task(send_email_service_async(msg))
        
        return JSONResponse(
            status_code=200,
            content={"message": f"A verification email OTP will be sent to {req.request_email}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in verify email OTP: {e}"
        )

@router.post("/verify-email")
async def verify_email_otp(req: auth_schema.VerifyOtpServiceRequest):    
   
    @with_transaction
    async def verify_otp(cursor, conn, email, otp):
        await cursor.execute(auth_queries.SELECT_VERIFY_EMAIL_OTP_BY_EMAIL, (email,))
        data = await cursor.fetchone()
        if not data:
            raise HTTPException(status_code=400, detail="OTP not found")
            
        otp, expires_at = data.get("otp"), data.get("expires_at")
        is_valid = verify_otp_helper(req.otp, otp, expires_at)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
        await cursor.execute(auth_queries.UPDATE_USED_VERIFY_EMAIL_OTP, (email, otp))

    try:
        await verify_otp(email=req.request_email, otp=req.otp) # type: ignore
        
        return JSONResponse(
            status_code=200,
            content={"message": f"Email OTP is verified for {req.request_email}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error in verify email OTP: {e}"
        )
