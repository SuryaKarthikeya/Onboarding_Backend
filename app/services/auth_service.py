import logging
from fastapi import HTTPException, status
from app.config.database import get_db
from app.models.user import UserModel, OnboardingState
from app.services.otp_service import verify_otp_code
from app.core.security import create_access_token, create_refresh_token, verify_token
from typing import Optional, Dict, Any
from bson import ObjectId

logger = logging.getLogger("app.services.auth_service")

async def verify_otp_and_login(
    email: Optional[str] = None,
    whatsapp_number: Optional[str] = None,
    code: str = ""
) -> Dict[str, Any]:
    """Verify the OTP. If valid, check if user exists. If not, create them. Return tokens and details."""
    identifier = email or whatsapp_number
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or whatsapp_number must be provided"
        )
        
    # Verify OTP code
    is_valid = await verify_otp_code(identifier, code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired verification code"
        )
        
    # User collection lookup
    db = get_db()
    query = {}
    if email:
        query["email"] = email
    else:
        query["whatsapp_number"] = whatsapp_number
        
    user_doc = await db.users.find_one(query)
    
    if not user_doc:
        # Create new user
        new_user = UserModel(
            email=email,
            whatsapp_number=whatsapp_number,
            onboarding_state=OnboardingState.AWAITING_PROFILE
        )
        user_dict = new_user.model_dump(by_alias=True, exclude_none=True)
        # remove id if it is None, so mongo generates one
        if "_id" in user_dict and user_dict["_id"] is None:
            user_dict.pop("_id")
            
        result = await db.users.insert_one(user_dict)
        user_id = str(result.inserted_id)
        onboarding_state = OnboardingState.AWAITING_PROFILE
        logger.info(f"Created new user with ID {user_id}")
    else:
        user_id = str(user_doc["_id"])
        onboarding_state = user_doc.get("onboarding_state", OnboardingState.AWAITING_PROFILE)
        logger.info(f"User {user_id} logged in successfully")
        
    # Generate tokens
    access_token = create_access_token(user_id=user_id, onboarding_state=onboarding_state)
    refresh_token = create_refresh_token(user_id=user_id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "onboarding_state": onboarding_state
    }

async def refresh_session(refresh_token: str) -> Dict[str, Any]:
    """Verify refresh token and issue a new access token."""
    payload = verify_token(refresh_token, expected_type="refresh")
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
        
    user_id = payload["sub"]
    db = get_db()
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
        
    onboarding_state = user_doc.get("onboarding_state", OnboardingState.AWAITING_PROFILE)
    access_token = create_access_token(user_id=user_id, onboarding_state=onboarding_state)
    
    return {
        "access_token": access_token,
        "onboarding_state": onboarding_state
    }
