import asyncio
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, Query, HTTPException, Response
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel

from ...core.app_config import app_config
from ...database.test_pool import with_transaction
from ...database.queries.user_queries import (
    INSERT_RESET_PASSWORD_OTP,
    DELETE_UNUSED_RESET_PASSWORD_OTP,
    SELECT_USER_BY_EMAIL,
    DELETE_UNUSED_VERIFY_EMAIL_OTP,
    INSERT_VERIFY_EMAIL_OTP,
    SELECT_VERIFY_EMAIL_OTP_BY_EMAIL,
    SELECT_RESET_PASSWORD_OTP_BY_EMAIL,
    UPDATE_USED_VERIFY_EMAIL_OTP,
    UPDATE_USED_RESET_PASSWORD_OTP,
)
from app.helpers.otp_helper import generate_expire_otp
from app.auth.smtp import build_password_reset_email, build_verify_email_mail, send_email_service_async, build_verify_email_mail_compact

router = APIRouter()

class EmailServiceRequest(BaseModel):
    request_email: str

class VerifyOtpServiceRequest(BaseModel):
    otp: str
    request_email: str

@router.post("/reset-password/otp")
async def send_reset_password_otp(req: EmailServiceRequest):    
    otp, otp_expire_time = generate_expire_otp()
   
    @with_transaction
    async def insert_otp(cursor, conn, email):
        await cursor.execute(SELECT_USER_BY_EMAIL, (email,))
        user = await cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        await cursor.execute(DELETE_UNUSED_RESET_PASSWORD_OTP, (email,))
        await cursor.execute(INSERT_RESET_PASSWORD_OTP, (email, otp, otp_expire_time))

    try:
        await insert_otp(email=req.request_email) # type: ignore
        
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
async def verify_reset_password_otp(req: VerifyOtpServiceRequest):    
   
    @with_transaction
    async def verify_otp(cursor, conn, email, otp):
        await cursor.execute(SELECT_RESET_PASSWORD_OTP_BY_EMAIL, (email,))
        data = await cursor.fetchone()
        
        if not data:
            raise HTTPException(status_code=400, detail="OTP not found")
            
        expires_at = data.get("expires_at")
        if not expires_at or expires_at < datetime.now():
            raise HTTPException(status_code=400, detail="OTP expired")
            
        if data.get("code") != otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        await cursor.execute(UPDATE_USED_RESET_PASSWORD_OTP, (email, otp))

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
async def send_verify_email_otp(req: EmailServiceRequest):    
    otp, otp_expire_time = generate_expire_otp()
   
    @with_transaction
    async def insert_otp(cursor, conn, email):
        await cursor.execute(DELETE_UNUSED_VERIFY_EMAIL_OTP, (email,))
        await cursor.execute(INSERT_VERIFY_EMAIL_OTP, (email, otp, otp_expire_time))

    try:
        await insert_otp(email=req.request_email) # type: ignore
        
        expire_display = f"{app_config.OTP_EXPIRES_MINUTES}"
        msg = build_verify_email_mail_compact(req.request_email, otp, expire_display)
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
async def verify_email_otp(req: VerifyOtpServiceRequest):    
   
    @with_transaction
    async def verify_otp(cursor, conn, email, otp):
        await cursor.execute(SELECT_VERIFY_EMAIL_OTP_BY_EMAIL, (email,))
        data = await cursor.fetchone()
        
        if not data:
            raise HTTPException(status_code=400, detail="OTP not found")
            
        expires_at = data.get("expires_at")
        if not expires_at or expires_at < datetime.now():
            raise HTTPException(status_code=400, detail="OTP expired or not found")
            
        if data.get("code") != otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        await cursor.execute(UPDATE_USED_VERIFY_EMAIL_OTP, (email, otp))

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