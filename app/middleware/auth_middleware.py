from typing import List
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
import logging
from app.core.security import verify_token
from app.config.database import get_db
from app.models.user import UserModel, OnboardingState

logger = logging.getLogger("app.middleware.auth_middleware")

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> UserModel:
    """Dependency to retrieve and authenticate the current user using Bearer tokens."""
    token = credentials.credentials
    payload = verify_token(token, expected_type="access")
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload["sub"]
    db = get_db()
    
    try:
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identification format",
        )
        
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
        
    return UserModel(**user_doc)

class StateGating:
    """Dependency class to check and enforce specific onboarding states."""
    def __init__(self, allowed_states: List[OnboardingState]):
        self.allowed_states = allowed_states
        
    def __call__(self, current_user: UserModel = Depends(get_current_user)) -> UserModel:
        if current_user.onboarding_state not in self.allowed_states:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required onboarding state: {[s.value for s in self.allowed_states]}. Current user state: {current_user.onboarding_state.value}"
            )
        return current_user
