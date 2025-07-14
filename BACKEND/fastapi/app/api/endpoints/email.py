import asyncio
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.auth.smtp import build_password_reset_email, build_verify_email_mail, send_email_service_async
from app.core.smtp_config import smtp_config
from app.helpers.jwt_helper import create_email_action_token, verify_token

router = APIRouter()

class EmailServiceRequest(BaseModel):
    request_email: str

class VerifyTokenResponse(BaseModel):
    token: str

@router.post("/verify-email")
async def send_verify_email(payload: EmailServiceRequest):
    verify_token = create_email_action_token(payload.request_email, "verify-email")
    msg = build_verify_email_mail(payload.request_email, verify_token)
    
    # Send email asynchronously in background
    asyncio.create_task(send_email_service_async(msg))
    
    return {"message": f"A verify email will be sent to {payload.request_email}"}

@router.get("/verify-email")
async def verify_email_token(token: str):
    payload = verify_token(token)
    
    if payload and payload.get("action") == "verify-email":
        # TODO: Update user's email_verified status in database
        # user_email = payload.get("email")
        # await user_service.mark_email_as_verified(user_email)
        
        success_url = f"{smtp_config.CLIENT_HOST}/email-verified"
        return RedirectResponse(url=success_url, status_code=302)
    else:
        error_url = f"{smtp_config.CLIENT_HOST}/error?message=Invalid or expired verification token"
        return RedirectResponse(url=error_url, status_code=302)

@router.post("/reset-password/request")
async def send_reset_password_email(payload: EmailServiceRequest):
    reset_token = create_email_action_token(payload.request_email, "reset-password")
    msg = build_password_reset_email(payload.request_email, reset_token)
    
    # Send email asynchronously in background
    asyncio.create_task(send_email_service_async(msg))
    
    return {"message": f"A password reset link will be sent to {payload.request_email}"}

@router.get("/reset-password/verify", response_model=VerifyTokenResponse)
async def verify_reset_token(token: str = Query(..., min_length=10)):
    try:
        payload = verify_token(token)
        if payload and payload.get("action") == "reset-password":
            return {"token": token}
        else:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
    except Exception:
        raise HTTPException(
            status_code=500, 
            detail="An error occurred during token verification"
        )