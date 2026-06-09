from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import RedirectResponse
from app.models.user import UserModel
from app.middleware.auth_middleware import get_current_user
from app.core.security import verify_token
from app.config.database import get_db
from app.services.quickbooks_service import build_quickbooks_auth_url, handle_quickbooks_oauth_callback
from typing import Optional
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/marketplace/quickbooks", tags=["QuickBooks Ingestion"])

@router.get("/status")
async def get_quickbooks_status(
    current_user: UserModel = Depends(get_current_user)
):
    """Checks if there is an active QuickBooks integration for the user's workspace."""
    mock_workspace_id = "6a26c891f1a54b321c8d77e4"
    db = get_db()
    integration = await db.quickbooks_integrations.find_one({
        "workspace_id": mock_workspace_id,
        "status": "active"
    })
    return {
        "connected": integration is not None,
        "company_id": integration.get("realm_id") if integration else None
    }

@router.post("/disconnect")
async def disconnect_quickbooks(
    current_user: UserModel = Depends(get_current_user)
):
    """Disconnects the active QuickBooks integration."""
    mock_workspace_id = "6a26c891f1a54b321c8d77e4"
    db = get_db()
    await db.quickbooks_integrations.update_many(
        {"workspace_id": mock_workspace_id},
        {"$set": {"status": "inactive", "updated_at": datetime.utcnow()}}
    )
    return {"message": "QuickBooks integration disconnected successfully"}

@router.get("/install")
async def quickbooks_install(
    state: str = Query("state", description="Pass your active JWT access token here"),
    current_user: UserModel = Depends(get_current_user)
):
    """Generates the secure Intuit OAuth authorization installation gateway link."""
    url = build_quickbooks_auth_url(state)
    return {"install_url": url}

@router.get("/callback")
async def quickbooks_callback(
    code: str = Query(..., description="The Intuit auth code allocation parameter"),
    realmId: str = Query(..., description="The QuickBooks Company Tenant ID instance key"),
    state: Optional[str] = None
):
    """OAuth callback endpoint where QuickBooks returns authorization tokens and redirects back to frontend."""
    user = None
    
    if state and state != "state":
        payload = verify_token(token=state, expected_type="access")
        if payload and payload.get("sub"):
            db = get_db()
            user_doc = await db.users.find_one({"_id": ObjectId(payload["sub"])})
            if user_doc:
                user = UserModel(**user_doc)
                
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session context missing or tracking state expired. Re-authenticate configuration loop."
        )
        
    mock_workspace_id = "6a26c891f1a54b321c8d77e4"
    
    await handle_quickbooks_oauth_callback(
        code=code,
        realm_id=realmId,
        user_id=str(user.id),
        workspace_id=mock_workspace_id
    )
    
    frontend_redirect = f"http://localhost:5174/?currentScreen=cost-data&quickbooks=success&realm_id={realmId}"
    return RedirectResponse(url=frontend_redirect, status_code=status.HTTP_307_TEMPORARY_REDIRECT)