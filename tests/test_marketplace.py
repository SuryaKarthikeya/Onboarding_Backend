import pytest
import json
from unittest.mock import patch, AsyncMock
from app.services.otp_service import store_otp
from app.models.user import OnboardingState
from app.config.database import get_db
from app.core.security import decrypt_credentials


async def get_awaiting_integration_headers(async_client, email: str) -> dict:
    code = "123456"
    await store_otp(email, code)
    response = await async_client.post(
        "/v1/auth/verify-otp",
        json={"email": email, "code": code}
    )
    headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
    
    # Transition to AWAITING_WORKSPACE
    await async_client.post(
        "/v1/onboarding/profile",
        json={"first_name": "Test", "last_name": "User"},
        headers=headers
    )
    
    # Transition to AWAITING_INTEGRATION
    await async_client.post(
        "/v1/onboarding/workspace",
        json={"store_name": "Test Store"},
        headers=headers
    )
    return headers

@pytest.mark.asyncio
async def test_shopify_install(async_client):
    headers = await get_awaiting_integration_headers(async_client, "shopify@realify.ai")
    
    response = await async_client.get(
        "/v1/marketplace/shopify/install?shop=mystore",
        headers=headers
    )
    assert response.status_code == 200
    assert "install_url" in response.json()
    assert "mystore.myshopify.com" in response.json()["install_url"]

@pytest.mark.asyncio
async def test_shopify_callback(async_client):
    headers = await get_awaiting_integration_headers(async_client, "shopify-cb@realify.ai")
    
    response = await async_client.get(
        "/v1/marketplace/shopify/callback?shop=mystore&code=authcode123",
        headers=headers
    )
    assert response.status_code == 200
    assert "connected successfully" in response.json()["message"]
    
    # Check onboarding state has transitioned to ACTIVE
    status_resp = await async_client.get("/v1/onboarding/status", headers=headers)
    assert status_resp.json()["onboarding_state"] == OnboardingState.ACTIVE.value
    
    # Verify access token is encrypted in DB
    db = get_db()
    integration_doc = await db.integrations.find_one({"platform": "shopify"})
    assert integration_doc is not None
    decrypted = decrypt_credentials(integration_doc["credentials"])
    assert decrypted == "mock_shopify_access_token_123456"

@pytest.mark.asyncio
async def test_woocommerce_connect(async_client):
    headers = await get_awaiting_integration_headers(async_client, "woo@realify.ai")
    
    woo_data = {
        "store_url": "https://woostore.local",
        "consumer_key": "mock_ck_123",
        "consumer_secret": "mock_cs_123"
    }
    
    response = await async_client.post(
        "/v1/marketplace/woocommerce",
        json=woo_data,
        headers=headers
    )
    assert response.status_code == 200
    assert "connected successfully" in response.json()["message"]
    
    db = get_db()
    integration_doc = await db.integrations.find_one({"platform": "woocommerce"})
    assert integration_doc is not None
    decrypted = decrypt_credentials(integration_doc["credentials"])
    creds = json.loads(decrypted)
    assert creds["store_url"] == "https://woostore.local"
    assert creds["consumer_key"] == "mock_ck_123"



@pytest.mark.asyncio
async def test_shopify_callback_real_http_flow(async_client):
    from app.config.config import settings
    original_id = settings.SHOPIFY_CLIENT_ID
    original_secret = settings.SHOPIFY_CLIENT_SECRET
    
    settings.SHOPIFY_CLIENT_ID = "active_client_id"
    settings.SHOPIFY_CLIENT_SECRET = "active_client_secret"
    
    headers = await get_awaiting_integration_headers(async_client, "shopify-real@realify.ai")
    
    mock_resp = AsyncMock()
    mock_resp.status_code = 200
    mock_resp.json = lambda: {"access_token": "real_exchanged_token_987"}
    
    with patch("app.services.marketplace_service.httpx.AsyncClient.post", return_value=mock_resp) as mock_post:
        response = await async_client.get(
            "/v1/marketplace/shopify/callback?shop=mystore&code=authcode123",
            headers=headers
        )
        assert response.status_code == 200
        mock_post.assert_called_once()
        
    settings.SHOPIFY_CLIENT_ID = original_id
    settings.SHOPIFY_CLIENT_SECRET = original_secret

@pytest.mark.asyncio
async def test_woocommerce_connect_real_http_flow(async_client):
    headers = await get_awaiting_integration_headers(async_client, "woo-real@realify.ai")
    
    woo_data = {
        "store_url": "https://realwoostore.com",
        "consumer_key": "ck_real_123",
        "consumer_secret": "cs_real_123"
    }
    
    mock_resp = AsyncMock()
    mock_resp.status_code = 200
    mock_resp.json = lambda: {"status": "ok"}
    
    with patch("app.services.marketplace_service.httpx.AsyncClient.get", return_value=mock_resp) as mock_get:
        response = await async_client.post(
            "/v1/marketplace/woocommerce",
            json=woo_data,
            headers=headers
        )
        assert response.status_code == 200
        assert "connected successfully" in response.json()["message"]
        mock_get.assert_called_once()

