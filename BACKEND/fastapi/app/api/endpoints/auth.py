import asyncio
import email
from fastapi import APIRouter, HTTPException, status
from datetime import timedelta

from fastapi.responses import JSONResponse

from ...database.test_pool import get_cursor, with_transaction
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
    generate_otp_action_token,
    verify_otp_action_token, 
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
    async with get_cursor() as (cursor, _):
        credential = req.username if req.username else req.email
        cursor.execute(auth_queries.SELECT_USER_BY_USERNAME_OR_EMAIL, (credential, credential))
        user = cursor.fetchone()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password!",
            )
        
        if not verify_password(req.password, user.get("password")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password!",
            )

        access_token_expires = timedelta(minutes=app_config.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": user.get("username"), 
                "user_id": user.get("id"), 
                "role": user.get("role")
            },
            expires_delta=access_token_expires,
        )
        
        refresh_token = create_refresh_token(
            data={
                "sub": user.get("username"), 
                "user_id": user.get("id"), 
                "role": user.get("role"),
                "token_type": "refresh",
            }
        )
        
        response = auth_schema.UserResponse(
            id=user.get("id"), 
            email=user["email"],
            username=user.get("username"), 
            role=user.get("role"),
            date_joined=user["date_joined"], 
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )
        
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
    @with_transaction
    async def reset_password_transaction(cursor, conn, email, new_password):
        await cursor.execute(auth_queries.SELECT_USER_BY_EMAIL, (email,))
        user = await cursor.fetchone()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        
        hashed_password = hash_password(new_password)
        cursor.execute(auth_queries.UPDATE_USER_PASSWORD_BY_EMAIL, (hashed_password, email))
        
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password"
            )
    
    try:
        if len(request.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long"
            )

        if not request.token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token not found, session expired"
            )

        payload = verify_otp_action_token(request.token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token, session expired",
            )
        
        email = payload.get("email")    
        await reset_password_transaction(email=email, new_password=request.new_password) # type: ignore
            
        return {"message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting password"
        )



@router.post("/reset-password/otp")
async def send_reset_password_otp(req: auth_schema.EmailServiceRequest):    
    otp, otp_expire_time = generate_expire_otp_helper()
   
    @with_transaction
    async def insert_otp_transaction(cursor, conn, credential):
        await cursor.execute(auth_queries.SELECT_USER_BY_EMAIL_OR_USERNAME, (credential, credential))
        user = await cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_email = user.get("email")
        await cursor.execute(auth_queries.DELETE_UNUSED_RESET_PASSWORD_OTP, (user_email,))
        await cursor.execute(auth_queries.INSERT_RESET_PASSWORD_OTP, (user_email, otp, otp_expire_time))
    
        return user_email
    try:
        credential = req.credential.strip()
        user_email = await insert_otp_transaction(credential) # type: ignore
        
        expire_display = f"{app_config.OTP_EXPIRES_MINUTES}"
        msg = build_password_reset_email(user_email, otp, expire_display)
        asyncio.create_task(send_email_service_async(msg))
        
        return JSONResponse(
            status_code=200,
            content={"message": f"A password reset OTP will be sent to your email", "email": user_email}
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
    async def verify_otp_transaction(cursor, conn, email, otp):
        await cursor.execute(auth_queries.SELECT_RESET_PASSWORD_OTP_BY_EMAIL, (email,))
        data = await cursor.fetchone()
        if not data:
            raise HTTPException(status_code=400, detail="OTP not found")
           
        stored_otp = data.get("otp") 
        expires_at = data.get("expires_at")
        is_valid = verify_otp_helper(user_otp, stored_otp, expires_at)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
        await cursor.execute(auth_queries.UPDATE_USED_RESET_PASSWORD_OTP, (email, otp))

    try:
        await verify_otp_transaction(email=req.request_email, otp=req.otp) # type: ignore
        reset_password_token =  generate_otp_action_token(req.request_email, 'reset_password')
        
        return JSONResponse(
            status_code=200,
            content={
                "token": reset_password_token,
                "message": f"Reset password OTP is verified {req.request_email}"
                }
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
    async def insert_otp_transaction(cursor, conn, email):
        await cursor.execute(auth_queries.DELETE_UNUSED_VERIFY_EMAIL_OTP, (email,))
        await cursor.execute(auth_queries.INSERT_VERIFY_EMAIL_OTP, (email, otp, otp_expire_time))

    try:
        credential = req.credential.strip() # This credential is forced to be an email 
        await insert_otp_transaction(email=credential) # type: ignore

        expire_display = f"{app_config.OTP_EXPIRES_MINUTES}"
        msg = build_verify_email_mail(credential, otp, expire_display)
        asyncio.create_task(send_email_service_async(msg))
        
        return JSONResponse(
            status_code=200,
            content={"message": f"A verification email OTP will be sent to {credential}"}
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
    async def verify_otp_transaction(cursor, conn, email, otp):
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
        await verify_otp_transaction(email=req.request_email, otp=req.otp) # type: ignore
        
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
