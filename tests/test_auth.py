import pytest
from unittest.mock import patch, AsyncMock
from app.services.otp_service import store_otp
from app.config.database import get_db


@pytest.mark.asyncio
async def test_request_otp_email(async_client):
    response = await async_client.post(
        "/v1/auth/request-otp",
        json={"email": "test@realify.ai"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Verification code sent successfully"

@pytest.mark.asyncio
async def test_request_otp_whatsapp(async_client):
    response = await async_client.post(
        "/v1/auth/request-otp",
        json={"whatsapp_number": "+918897396632"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Verification code sent successfully"

@pytest.mark.asyncio
async def test_request_otp_validation_error(async_client):
    # Missing both fields
    response = await async_client.post("/v1/auth/request-otp", json={})
    assert response.status_code == 422
    
    # Providing both fields
    response = await async_client.post(
        "/v1/auth/request-otp",
        json={"email": "test@realify.ai", "whatsapp_number": "+918897396632"}
    )
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_verify_otp_and_login_new_user(async_client):
    email = "newuser@realify.ai"
    code = "123456"
    await store_otp(email, code)
    
    response = await async_client.post(
        "/v1/auth/verify-otp",
        json={"email": email, "code": code}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["onboarding_state"] == "AWAITING_PROFILE"
    
    db = get_db()
    user_doc = await db.users.find_one({"email": email})
    assert user_doc is not None
    assert user_doc["onboarding_state"] == "AWAITING_PROFILE"

@pytest.mark.asyncio
async def test_verify_otp_wrong_code(async_client):
    email = "test@realify.ai"
    await store_otp(email, "111111")
    
    response = await async_client.post(
        "/v1/auth/verify-otp",
        json={"email": email, "code": "222222"}
    )
    assert response.status_code == 401
    assert "Invalid or expired" in response.json()["detail"]

@pytest.mark.asyncio
async def test_refresh_token(async_client):
    email = "refresh@realify.ai"
    code = "654321"
    await store_otp(email, code)
    
    login_resp = await async_client.post(
        "/v1/auth/verify-otp",
        json={"email": email, "code": code}
    )
    assert login_resp.status_code == 200
    
    cookies = login_resp.cookies
    refresh_token = cookies.get("refresh_token")
    assert refresh_token is not None
    
    refresh_resp = await async_client.post("/v1/auth/refresh")
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()

@pytest.mark.asyncio
async def test_sendgrid_real_http_flow(async_client):
    from app.config.config import settings
    original_key = settings.SENDGRID_API_KEY
    settings.SENDGRID_API_KEY = "SG.real_api_key_test_value"
    
    mock_resp = AsyncMock()
    mock_resp.status_code = 202
    mock_resp.text = "Accepted"
    
    with patch("app.services.email_service.httpx.AsyncClient.post", return_value=mock_resp) as mock_post:
        response = await async_client.post(
            "/v1/auth/request-otp",
            json={"email": "sendgrid-real@realify.ai"}
        )
        assert response.status_code == 200
        mock_post.assert_called_once()
        
    settings.SENDGRID_API_KEY = original_key

@pytest.mark.asyncio
async def test_twilio_real_http_flow(async_client):
    from app.config.config import settings
    original_sid = settings.TWILIO_ACCOUNT_SID
    original_token = settings.TWILIO_AUTH_TOKEN
    
    settings.TWILIO_ACCOUNT_SID = "ACreal_sid_test_value"
    settings.TWILIO_AUTH_TOKEN = "real_token_test_value"
    
    mock_resp = AsyncMock()
    mock_resp.status_code = 201
    mock_resp.text = "Created"
    
    with patch("app.services.whatsapp_service.httpx.AsyncClient.post", return_value=mock_resp) as mock_post:
        response = await async_client.post(
            "/v1/auth/request-otp",
            json={"whatsapp_number": "+918897396632"}
        )
        assert response.status_code == 200
        mock_post.assert_called_once()
        
    settings.TWILIO_ACCOUNT_SID = original_sid
    settings.TWILIO_AUTH_TOKEN = original_token

