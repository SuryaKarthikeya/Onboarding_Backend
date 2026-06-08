import json
import httpx
import logging
from bson import ObjectId
from fastapi import HTTPException, status
from app.config.config import settings
from app.config.database import get_db
from app.models.user import UserModel, OnboardingState
from app.models.onboarding import IntegrationModel
from app.core.security import encrypt_credentials
from typing import Optional

logger = logging.getLogger("app.services.marketplace_service")

async def update_user_state_to_active(db, user_id: str):
    """Automatically transitions user onboarding state to ACTIVE once at least one integration is successfully connected."""
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"onboarding_state": OnboardingState.ACTIVE}}
    )
    logger.info(f"User {user_id} onboarding state transitioned to ACTIVE.")

async def build_shopify_install_url(shop: str, state: str) -> str:
    """Constructs the Shopify authorization redirect URL."""
    if not shop:
        raise HTTPException(status_code=400, detail="Shop domain is required")
    if not shop.endswith(".myshopify.com"):
        shop = f"{shop}.myshopify.com"
        
    scopes = "read_products,read_orders"
    install_url = (
        f"https://{shop}/admin/oauth/authorize?"
        f"client_id={settings.SHOPIFY_CLIENT_ID}&"
        f"scope={scopes}&"
        f"redirect_uri={settings.SHOPIFY_REDIRECT_URI}&"
        f"state={state}"
    )
    return install_url

async def handle_shopify_oauth_callback(shop: str, code: str, user_id: str) -> IntegrationModel:
    """Exchanges Shopify auth code for an offline access token and saves it encrypted."""
    db = get_db()
    
    is_mock = (
        "your_shopify" in settings.SHOPIFY_CLIENT_ID or
        not settings.SHOPIFY_CLIENT_ID
    )
    
    access_token = "mock_shopify_access_token_123456"
    
    if not is_mock:
        if not shop.endswith(".myshopify.com"):
            shop = f"{shop}.myshopify.com"
        url = f"https://{shop}/admin/oauth/access_token"
        payload = {
            "client_id": settings.SHOPIFY_CLIENT_ID,
            "client_secret": settings.SHOPIFY_CLIENT_SECRET,
            "code": code
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    access_token = data.get("access_token")
                else:
                    logger.error(f"Shopify token exchange failed: {response.text}")
                    raise HTTPException(status_code=400, detail="Shopify OAuth authentication failed")
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            logger.error(f"Error connecting to Shopify during OAuth: {str(e)}")
            raise HTTPException(status_code=502, detail="Error communicating with Shopify servers")
            
    # Fetch user's workspace ID
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc or not user_doc.get("workspace_ids"):
        raise HTTPException(status_code=400, detail="User does not have an active workspace context")
    workspace_id = user_doc["workspace_ids"][0]
    
    # Encrypt credentials
    encrypted = encrypt_credentials(access_token)
    
    integration = IntegrationModel(
        workspace_id=workspace_id,
        platform="shopify",
        credentials=encrypted,
        status="active"
    )
    
    integration_dict = integration.model_dump(by_alias=True, exclude_none=True)
    if "_id" in integration_dict and integration_dict["_id"] is None:
        integration_dict.pop("_id")
        
    # Check if integration already exists
    existing = await db.integrations.find_one({"workspace_id": workspace_id, "platform": "shopify"})
    if existing:
        await db.integrations.update_one(
            {"_id": existing["_id"]},
            {"$set": {"credentials": encrypted, "status": "active"}}
        )
        integration.id = existing["_id"]
    else:
        result = await db.integrations.insert_one(integration_dict)
        integration.id = result.inserted_id
        
    await update_user_state_to_active(db, user_id)
    return integration

async def connect_woocommerce_store(
    store_url: str,
    consumer_key: str,
    consumer_secret: str,
    user_id: str
) -> IntegrationModel:
    """Validates WooCommerce credentials against store API and saves them encrypted."""
    db = get_db()
    
    clean_url = store_url.rstrip("/")
    validate_url = f"{clean_url}/wp-json/wc/v3/system_status"
    
    is_mock = (
        consumer_key.startswith("mock_") or 
        consumer_secret.startswith("mock_") or 
        consumer_key == "your_consumer_key"
    )
    
    if not is_mock:
        import base64
        auth_bytes = f"{consumer_key}:{consumer_secret}".encode()
        auth_header = base64.b64encode(auth_bytes).decode()
        headers = {"Authorization": f"Basic {auth_header}"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(validate_url, headers=headers, timeout=10.0)
                if response.status_code != 200:
                    logger.error(f"WooCommerce system status check failed: {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid WooCommerce API key or secret credentials"
                    )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            logger.error(f"WooCommerce validation exception: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unable to connect to store url: {store_url}"
            )
            
    # Fetch user workspace
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc or not user_doc.get("workspace_ids"):
        raise HTTPException(status_code=400, detail="User does not have an active workspace context")
    workspace_id = user_doc["workspace_ids"][0]
    
    # Store credentials as a JSON object inside encrypted string
    creds_payload = json.dumps({
        "store_url": clean_url,
        "consumer_key": consumer_key,
        "consumer_secret": consumer_secret
    })
    encrypted = encrypt_credentials(creds_payload)
    
    integration = IntegrationModel(
        workspace_id=workspace_id,
        platform="woocommerce",
        credentials=encrypted,
        status="active"
    )
    
    integration_dict = integration.model_dump(by_alias=True, exclude_none=True)
    if "_id" in integration_dict and integration_dict["_id"] is None:
        integration_dict.pop("_id")
        
    existing = await db.integrations.find_one({"workspace_id": workspace_id, "platform": "woocommerce"})
    if existing:
        await db.integrations.update_one(
            {"_id": existing["_id"]},
            {"$set": {"credentials": encrypted, "status": "active"}}
        )
        integration.id = existing["_id"]
    else:
        result = await db.integrations.insert_one(integration_dict)
        integration.id = result.inserted_id
        
    await update_user_state_to_active(db, user_id)
    return integration

async def connect_amazon_store(
    seller_id: str,
    refresh_token: str,
    marketplace_id: Optional[str],
    user_id: str
) -> IntegrationModel:
    """Connects and encrypts Amazon SP-API credentials."""
    db = get_db()
    
    # Fetch user workspace
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc or not user_doc.get("workspace_ids"):
        raise HTTPException(status_code=400, detail="User does not have an active workspace")
    workspace_id = user_doc["workspace_ids"][0]
    
    creds_payload = json.dumps({
        "seller_id": seller_id,
        "refresh_token": refresh_token,
        "marketplace_id": marketplace_id
    })
    encrypted = encrypt_credentials(creds_payload)
    
    integration = IntegrationModel(
        workspace_id=workspace_id,
        platform="amazon",
        credentials=encrypted,
        status="active"
    )
    
    integration_dict = integration.model_dump(by_alias=True, exclude_none=True)
    if "_id" in integration_dict and integration_dict["_id"] is None:
        integration_dict.pop("_id")
        
    existing = await db.integrations.find_one({"workspace_id": workspace_id, "platform": "amazon"})
    if existing:
        await db.integrations.update_one(
            {"_id": existing["_id"]},
            {"$set": {"credentials": encrypted, "status": "active"}}
        )
        integration.id = existing["_id"]
    else:
        result = await db.integrations.insert_one(integration_dict)
        integration.id = result.inserted_id
        
    await update_user_state_to_active(db, user_id)
    return integration
