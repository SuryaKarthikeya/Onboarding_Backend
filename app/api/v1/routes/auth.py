from typing import Optional
from fastapi import APIRouter, Response, Request, HTTPException, status, Depends
from app.schemas.auth import OTPRequest, OTPVerify, TokenResponse, UserManualRegister, UserManualLogin  # FIXED: Imported manual schemas
from app.services.otp_service import generate_otp, store_otp
from app.services.email_service import send_otp_email
from app.services.whatsapp_service import send_otp_whatsapp
from app.services.auth_service import (
    verify_otp_and_login, 
    refresh_session, 
    register_manual_user,      # FIXED: Imported manual signup service
    authenticate_manual_user   # FIXED: Imported manual login service
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/request-otp", status_code=status.HTTP_200_OK)
async def request_otp(payload: OTPRequest):
    identifier = payload.email or payload.whatsapp_number
    code = generate_otp()
    
    # Store OTP in Redis (enforces rate-limiting)
    await store_otp(identifier, code)
    
    # Dispatch OTP via SendGrid or Twilio
    if payload.email:
        sent = await send_otp_email(payload.email, code)
    else:
        sent = await send_otp_whatsapp(payload.whatsapp_number, code)
        
    if not sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification code. Please try again."
        )
        
    return {"message": "Verification code sent successfully"}

@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(payload: OTPVerify, response: Response):
    email = payload.email
    whatsapp_number = payload.whatsapp_number
    
    result = await verify_otp_and_login(
        email=email,
        whatsapp_number=whatsapp_number,
        code=payload.code
    )
    
    # Secure HTTP-only refresh token cookie setting
    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=False,  # Set to True in production; False allows local testing
        samesite="lax",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    return TokenResponse(
        access_token=result["access_token"],
        onboarding_state=result["onboarding_state"]
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, response: Response, payload_token: Optional[str] = None):
    # Retrieve token from Cookie or payload argument
    refresh_token = request.cookies.get("refresh_token") or payload_token
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )
        
    result = await refresh_session(refresh_token)
    return TokenResponse(
        access_token=result["access_token"],
        onboarding_state=result["onboarding_state"]
    )

@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=TokenResponse)
async def manual_signup(payload: UserManualRegister, response: Response):
    """Handles manual password registration and sets security cookies on successful account creation."""
    result = await register_manual_user(payload)
    
    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=False,  # Set to True in HTTPS production environments
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )
    
    return TokenResponse(
        access_token=result["access_token"],
        onboarding_state=result["onboarding_state"]
    )

@router.post("/login", status_code=status.HTTP_200_OK, response_model=TokenResponse)
async def manual_login(payload: UserManualLogin, response: Response):
    """Verifies traditional email/password credentials and yields active session JWT strings."""
    result = await authenticate_manual_user(payload)
    
    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )
    
    return TokenResponse(
        access_token=result["access_token"],
        onboarding_state=result["onboarding_state"]
    )