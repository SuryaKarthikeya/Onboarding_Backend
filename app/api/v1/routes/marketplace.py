from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional
from bson import ObjectId
from app.models.user import UserModel, OnboardingState
from app.schemas.marketplace import WooCommerceConnect
from app.middleware.auth_middleware import get_current_user, get_optional_current_user, StateGating
from app.core.security import verify_token
from app.config.database import get_db
from app.services.marketplace_service import (
    build_shopify_install_url,
    handle_shopify_oauth_callback,
    connect_woocommerce_store
)

router = APIRouter(prefix="/marketplace", tags=["Marketplace Integrations"])

@router.get("/shopify/install")
async def shopify_install(
    shop: str = Query(..., description="The shop's myshopify.com domain"),
    state: str = Query("state", description="OAuth state tracking parameter"),
    current_user: UserModel = Depends(StateGating([OnboardingState.AWAITING_INTEGRATION, OnboardingState.ACTIVE]))
):
    """Generates the Shopify OAuth redirection installation URL."""
    url = await build_shopify_install_url(shop, state)
    return {"install_url": url}

@router.get("/shopify/callback")
async def shopify_callback(
    shop: str = Query(..., description="The shop domain"),
    code: str = Query(..., description="The OAuth authorization code"),
    state: Optional[str] = None,
    token: Optional[str] = None,
    current_user: Optional[UserModel] = Depends(get_optional_current_user)
):
    """OAuth callback endpoint where Shopify returns the auth code."""
    # Resolve current user from argument or query token fallback
    user = current_user
    if not user and token:
        payload = verify_token(token, expected_type="access")
        if payload and payload.get("sub"):
            db = get_db()
            user_doc = await db.users.find_one({"_id": ObjectId(payload["sub"])})
            if user_doc:
                user = UserModel(**user_doc)
                
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials missing or invalid"
        )
        
    # Gating check: must be in AWAITING_INTEGRATION or ACTIVE
    if user.onboarding_state not in (OnboardingState.AWAITING_INTEGRATION, OnboardingState.ACTIVE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User onboarding state not eligible for integrations setup"
        )
        
    integration = await handle_shopify_oauth_callback(shop, code, str(user.id))
    return {
        "message": "Shopify integration connected successfully",
        "integration_id": str(integration.id),
        "status": integration.status
    }

@router.post("/woocommerce")
async def woocommerce_connect(
    payload: WooCommerceConnect,
    current_user: UserModel = Depends(StateGating([OnboardingState.AWAITING_INTEGRATION, OnboardingState.ACTIVE]))
):
    """Verifies WooCommerce credentials and stores them securely."""
    integration = await connect_woocommerce_store(
        store_url=payload.store_url,
        consumer_key=payload.consumer_key,
        consumer_secret=payload.consumer_secret,
        user_id=str(current_user.id)
    )
    return {
        "message": "WooCommerce integration connected successfully",
        "integration_id": str(integration.id),
        "status": integration.status
    }

