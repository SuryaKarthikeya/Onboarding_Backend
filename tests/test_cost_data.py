import pytest
from app.services.otp_service import store_otp
from app.models.user import OnboardingState
from app.config.database import get_db

async def get_active_user_headers(async_client, email: str) -> dict:
    code = "123456"
    await store_otp(email, code)
    response = await async_client.post(
        "/v1/auth/verify-otp",
        json={"email": email, "code": code}
    )
    headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
    
    # Complete profile
    await async_client.post(
        "/v1/onboarding/profile",
        json={"first_name": "Test", "last_name": "User"},
        headers=headers
    )
    
    # Create workspace
    await async_client.post(
        "/v1/onboarding/workspace",
        json={"store_name": "Test Store"},
        headers=headers
    )
    
    # Woo connect to shift state to ACTIVE
    await async_client.post(
        "/v1/marketplace/woocommerce",
        json={"store_url": "https://woo.local", "consumer_key": "mock_ck", "consumer_secret": "mock_cs"},
        headers=headers
    )
    return headers

@pytest.mark.asyncio
async def test_access_gating_denied_for_incomplete_onboarding(async_client):
    code = "123456"
    email = "gating@realify.ai"
    await store_otp(email, code)
    login_resp = await async_client.post(
        "/v1/auth/verify-otp",
        json={"email": email, "code": code}
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}
    
    response = await async_client.post(
        "/v1/cost-data/manual",
        json={"amount": 100.0, "category": "Advertising"},
        headers=headers
    )
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_manual_cost_ingestion(async_client):
    headers = await get_active_user_headers(async_client, "active@realify.ai")
    
    payload = {
        "amount": 120.50,
        "category": "Shipping"
    }
    response = await async_client.post(
        "/v1/cost-data/manual",
        json=payload,
        headers=headers
    )
    
    assert response.status_code == 200
    assert response.json()["message"] == "Manual cost entry saved successfully"
    entry = response.json()["entry"]
    assert entry["amount"] == 120.50
    assert entry["category"] == "Shipping"
    assert entry["source"] == "manual"
    
    db = get_db()
    db_entry = await db.cost_entries.find_one({"category": "Shipping"})
    assert db_entry is not None
    assert db_entry["amount"] == 120.50

@pytest.mark.asyncio
async def test_csv_upload_ingestion(async_client):
    headers = await get_active_user_headers(async_client, "active-csv@realify.ai")
    
    csv_content = (
        "Amount,Category\n"
        "200.00,Marketing\n"
        "50.00,Office Supplies\n"
        "400.00,Inventory\n"
    )
    
    files = {"file": ("costs.csv", csv_content.encode("utf-8"), "text/csv")}
    
    response = await async_client.post(
        "/v1/cost-data/upload",
        files=files,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["imported_count"] == 3
    assert len(data["entries"]) == 3
    
    db = get_db()
    cursor = db.cost_entries.find({"source": "csv"})
    entries = await cursor.to_list(length=10)
    assert len(entries) == 3
    categories = {e["category"] for e in entries}
    assert "Marketing" in categories
    assert "Inventory" in categories

@pytest.mark.asyncio
async def test_manual_cost_malformed_workspace_id(async_client):
    headers = await get_active_user_headers(async_client, "malformed-ws@realify.ai")
    response = await async_client.post(
        "/v1/cost-data/manual",
        json={"amount": 100.0, "category": "Advertising", "workspace_id": "invalid_id_format"},
        headers=headers
    )
    assert response.status_code == 400
    assert "Invalid workspace_id format" in response.json()["detail"]

@pytest.mark.asyncio
async def test_manual_cost_unauthorized_workspace_id(async_client):
    headers = await get_active_user_headers(async_client, "unauthorized-ws@realify.ai")
    other_ws_id = "60c72b2f9b1d8e1f5c8b4567"
    response = await async_client.post(
        "/v1/cost-data/manual",
        json={"amount": 100.0, "category": "Advertising", "workspace_id": other_ws_id},
        headers=headers
    )
    assert response.status_code == 403
    assert "User does not have access" in response.json()["detail"]

