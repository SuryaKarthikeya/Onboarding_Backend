import httpx
import urllib.parse
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from app.config.config import settings  # Ensure QB_CLIENT_ID, QB_CLIENT_SECRET are in config
from app.config.database import get_db

# Fallback developer sandbox values for testing if not loaded from settings config
CLIENT_ID = getattr(settings, "QUICKBOOKS_CLIENT_ID", "YOUR_QB_CLIENT_ID")
CLIENT_SECRET = getattr(settings, "QUICKBOOKS_CLIENT_SECRET", "YOUR_QB_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:8000/v1/marketplace/quickbooks/callback"
TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"

def build_quickbooks_auth_url(state: str) -> str:
    """Generates the secure Intuit sign-in consent gateway URL."""
    base_url = "https://appcenter.intuit.com/connect/oauth2"
    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "scope": "com.intuit.quickbooks.accounting",
        "redirect_uri": REDIRECT_URI,
        "state": state
    }
    return f"{base_url}?{urllib.parse.urlencode(params)}"

async def handle_quickbooks_oauth_callback(code: str, realm_id: str, user_id: str, workspace_id: str) -> dict:
    """Exchanges the temporary code parameter for production refresh/access token matrices."""
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            TOKEN_URL,
            data=payload,
            auth=(CLIENT_ID, CLIENT_SECRET),
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"QuickBooks token exchange failed: {response.text}"
        )
        
    data = response.json()
    now = datetime.utcnow()
    
    integration_data = {
        "workspace_id": workspace_id,
        "user_id": user_id,
        "realm_id": realm_id,
        "access_token": data["access_token"],
        "refresh_token": data["refresh_token"],
        "access_token_expires_at": now + timedelta(seconds=data["expires_in"]),
        "refresh_token_expires_at": now + timedelta(seconds=data["x_refresh_token_expires_in"]),
        "status": "active",
        "updated_at": now
    }
    
    db = get_db()
    await db.quickbooks_integrations.update_one(
        {"workspace_id": workspace_id, "realm_id": realm_id},
        {"$set": integration_data},
        upsert=True
    )
    
    return integration_data