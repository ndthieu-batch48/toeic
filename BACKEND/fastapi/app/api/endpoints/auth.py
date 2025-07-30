import asyncio
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from ...database.test_pool import get_cursor, with_transaction
from ...schemas import auth as auth_schema
from ...database import queries as auth_queries
from ...core.app_config import app_config

from ...auth.smtp import (
    build_password_reset_email, 
    build_verify_email_mail, 
    send_email_service_async)
from ...helpers.otp_helper import (
    generate_expire_otp_helper,
    generate_otp_purpose_token,
    verify_otp_action_token )
from ...helpers.jwt_helper import (
    hash_password, 
    verify_password, 
    create_access_token, 
    create_refresh_token, 
    verify_token)

router = APIRouter()

@router.post("/register")
async def register(req: auth_schema.RegisterRequest):
    @with_transaction
    async def register_transaction(cursor, conn, email, username, password):
        await cursor.execute(auth_queries.SELECT_USER_BY_EMAIL_OR_USERNAME, (email, username))
        existing_user = await cursor.fetchone()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or Username already taken")

        hashed_password = hash_password(password)
        await cursor.execute(auth_queries.INSERT_USER, (username, email, hashed_password))

    try:
        await register_transaction(email=req.email, username=req.username, password=req.password) # type: ignore
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={"message": "User created successfully"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "An error occurred while resetting password",
                "error": str(e),
            },
        )
    


@router.post("/login", response_model = auth_schema.UserResponse)
async def login(req: auth_schema.LoginRequest):
    async with get_cursor() as (cursor, _):
        await cursor.execute(auth_queries.SELECT_USER_BY_EMAIL_OR_USERNAME, (req.credential, req.credential))
        user = await cursor.fetchone()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found!",
            )
        
        if not verify_password(req.password, user.get("password")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid username or password!",
            )
            
        token_data={
                "sub": user.get("username"), 
                "user_id": user.get("id"), 
                "role": user.get("role")
            }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        response = auth_schema.UserResponse(
            id=user.get("id"), 
            email=user["email"],
            username=user.get("username"), 
            role=user.get("role"),
            date_joined=user.get("date_joined"), 
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
    
    response = {
        "access_token": access_token,
        "refresh_token": refresh_token_new,
        "token_type": "bearer",
    }
    return response 


@router.put("/reset-password")
async def reset_password(req: auth_schema.ResetPasswordRequest):
    @with_transaction
    async def reset_password_transaction(cursor, conn, id, new_password):
        await cursor.execute(auth_queries.SELECT_USER_BY_ID, (id,))
        user = await cursor.fetchone()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        hashed_password = hash_password(new_password)
        await cursor.execute(auth_queries.UPDATE_USER_PASSWORD_BY_ID, (hashed_password, id))
        
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password"
            )
    
    try:
        if len(req.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long"
            )

        payload = verify_otp_action_token(req.token)

        if (payload.get("purpose") != "reset_password"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or mismatched token purpose.",
            )
            
        user_id = payload.get("sub")    
        await reset_password_transaction(id=user_id, new_password=req.new_password) # type: ignore
            
        return JSONResponse(
            status_code=200,
            content={"message": "Password reset successfully"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "An error occurred while resetting password",
                "error": {e}
            }
        )


@router.post("/otp/request")
async def send_reset_password_otp(req: auth_schema.OtpServiceRequest):    
    otp, otp_expire_time = generate_expire_otp_helper()
    
    @with_transaction
    async def insert_otp_transaction(cursor, conn, credential_value, credential_type, purpose):
        await cursor.execute(auth_queries.SELECT_USER_BY_EMAIL_OR_USERNAME, (credential_value, credential_value))
        user = await cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = user.get("id")
        credential = user.get(credential_type)
        await cursor.execute(auth_queries.DELETE_UNUSED_OTP, (user_id, purpose,))
        await cursor.execute(auth_queries.INSERT_OTP, (otp, purpose, otp_expire_time, credential_type, credential_value, user_id))

        return credential
    try:
        credential = await insert_otp_transaction(req.credential_value, req.credential_type, req.purpose) # type: ignore
        
        #TODO: Utilizing credential_type for different Email/SMS service
        expire_display = f"{app_config.OTP_EXPIRES_MINUTES}"
        msg = build_password_reset_email(credential, otp, expire_display)
        asyncio.create_task(send_email_service_async(msg))
        
        return JSONResponse(
            status_code=200,
            content={"message": "A password reset OTP will be sent to your email"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail={
                "message": "Error in OTP request service",
                "error": {e}
            }
        )


@router.post("/otp/verify")
async def verify_reset_password_otp(req: auth_schema.VerifyOtpServiceRequest):    

    @with_transaction
    async def verify_otp_transaction(cursor, conn, user_otp, purpose):
        await cursor.execute(auth_queries.SELECT_VALID_OTP, (user_otp, purpose))
        data = await cursor.fetchone()
        if not data:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        user_id = data.get("user_id")
        await cursor.execute(auth_queries.UPDATE_USED_OTP, (user_id, user_otp, purpose))
        return user_id
    try:
        user_id = await verify_otp_transaction(user_otp=req.otp, purpose=req.purpose) # type: ignore
        reset_password_token =  generate_otp_purpose_token(user_id, req.purpose)
        
        return JSONResponse(
            status_code=200,
            content={
                "token": reset_password_token,
                "message": "OTP is verified"
                }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail={
                "message": "Error in OTP verification sercvice",
                "error": {e}
            }
        )
