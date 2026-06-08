import logging
from fastapi import HTTPException, status
from app.config.database import get_db
from app.models.user import UserModel, OnboardingState, UserProfile  # FIXED: Imported UserProfile
from app.services.otp_service import verify_otp_code
from app.core.security import create_access_token, create_refresh_token, verify_token
from typing import Optional, Dict, Any
from bson import ObjectId
import bcrypt

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
        onboarding_state = OnboardingState.AWAITING_PROFILE.value  # FIXED: Cast to explicit string value
        logger.info(f"Created new user with ID {user_id}")
    else:
        user_id = str(user_doc["_id"])
        raw_state = user_doc.get("onboarding_state", OnboardingState.AWAITING_PROFILE)
        onboarding_state = raw_state.value if isinstance(raw_state, OnboardingState) else str(raw_state)
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
        
    raw_state = user_doc.get("onboarding_state", OnboardingState.AWAITING_PROFILE)
    onboarding_state = raw_state.value if isinstance(raw_state, OnboardingState) else str(raw_state)
    access_token = create_access_token(user_id=user_id, onboarding_state=onboarding_state)
    
    return {
        "access_token": access_token,
        "onboarding_state": onboarding_state
    }

async def register_manual_user(payload) -> Dict[str, Any]:
    """Hashes the user's password, creates a document in MongoDB, and signs them in."""
    db = get_db()
    
    # 1. Enforce unique check for email registration
    existing_user = await db.users.find_one({"email": payload.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
    
    # 2. Hash raw text password securely
    hashed_password = bcrypt.hashpw(payload.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # 3. Formulate user profile metadata directly from the signup UI fields
    new_user = UserModel(
        email=payload.email,
        password_hash=hashed_password,
        onboarding_state=OnboardingState.AWAITING_WORKSPACE, # Profile info is filled, step forward
        profile=UserProfile(
            first_name=payload.first_name,
            last_name=payload.last_name
        )
    )
    
    user_dict = new_user.model_dump(by_alias=True, exclude_none=True)
    if "_id" in user_dict:
        user_dict.pop("_id")
        
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    onboarding_state = OnboardingState.AWAITING_WORKSPACE.value
    
    # 4. Auto-login on successful registration
    access_token = create_access_token(user_id=user_id, onboarding_state=onboarding_state)
    refresh_token = create_refresh_token(user_id=user_id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "onboarding_state": onboarding_state
    }

async def authenticate_manual_user(payload) -> Dict[str, Any]:
    """Validates a manual email/password login request against stored documents."""
    db = get_db()
    
    # 1. Find user account by unique email index string
    user_doc = await db.users.find_one({"email": payload.email})
    if not user_doc or not user_doc.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password combination."
        )
        
    # 2. Compare the plain-text password with the stored hash safely
    pwd_bytes = payload.password.encode('utf-8')
    hash_bytes = user_doc["password_hash"].encode('utf-8')
    if not bcrypt.checkpw(pwd_bytes, hash_bytes):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password combination."
        )
        
    user_id = str(user_doc["_id"])
    raw_state = user_doc.get("onboarding_state", OnboardingState.AWAITING_PROFILE)
    onboarding_state = raw_state.value if isinstance(raw_state, OnboardingState) else str(raw_state)
    
    access_token = create_access_token(user_id=user_id, onboarding_state=onboarding_state)
    refresh_token = create_refresh_token(user_id=user_id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "onboarding_state": onboarding_state
    }