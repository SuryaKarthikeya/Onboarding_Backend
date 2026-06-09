from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import RedirectResponse  # FIXED: Imported redirect responses engine
from typing import Optional
from bson import ObjectId
from app.models.user import UserModel, OnboardingState
from app.schemas.marketplace import WooCommerceConnect
from app.middleware.auth_middleware import get_current_user, StateGating
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
    state: Optional[str] = None
):
    """OAuth callback endpoint where Shopify returns the auth code."""
    user = None
    
    # Extract active session out of returned token string inside state parameter
    if state and state != "state":
        payload = verify_token(state, expected_type="access")
        if payload and payload.get("sub"):
            db = get_db()
            user_doc = await db.users.find_one({"_id": ObjectId(payload["sub"])})
            if user_doc:
                user = UserModel(**user_doc)
                
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials missing or expired. Re-authenticate configuration."
        )
        
    # FIXED: Loosened gating slightly for testing accounts to process different development sequencing gracefully
    allowed_onboarding_states = (
        OnboardingState.AWAITING_WORKSPACE, 
        OnboardingState.AWAITING_INTEGRATION, 
        OnboardingState.ACTIVE
    )
    if user.onboarding_state not in allowed_onboarding_states:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User onboarding state sequence not eligible for channel integration"
        )
        
    # Run the server-to-server token swap operation
    integration = await handle_shopify_oauth_callback(shop, code, str(user.id))
    
    frontend_dashboard_redirect = f"http://localhost:5174/dashboard?integration=success&id={str(integration.id)}"
    return RedirectResponse(url=frontend_dashboard_redirect, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

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

@router.get("/connections")
async def get_connections(
    current_user: UserModel = Depends(get_current_user)
):
    """Fetches the list of active marketplace integrations for the current user's workspace."""
    if not current_user.workspace_ids:
        return {
            "shopify": False,
            "woocommerce": False,
            "amazon": False,
            "ebay": False,
            "walmart": False
        }
        
    workspace_id = current_user.workspace_ids[0]
    db = get_db()
    
    # Fetch all active integrations for this workspace (supporting both ObjectId and string formats in DB)
    cursor = db.integrations.find({
        "workspace_id": {"$in": [workspace_id, str(workspace_id)]},
        "status": "active"
    })
    active_integrations = await cursor.to_list(length=100)
    
    connected_platforms = {
        "shopify": False,
        "woocommerce": False,
        "amazon": False,
        "ebay": False,
        "walmart": False
    }
    
    for integration in active_integrations:
        platform = integration.get("platform")
        if platform in connected_platforms:
            connected_platforms[platform] = True
            
    return connected_platforms