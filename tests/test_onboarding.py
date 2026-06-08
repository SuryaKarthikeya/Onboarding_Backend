import pytest
from app.services.otp_service import store_otp
from app.models.user import OnboardingState

async def get_auth_headers(async_client, email: str) -> dict:
    code = "123456"
    await store_otp(email, code)
    response = await async_client.post(
        "/v1/auth/verify-otp",
        json={"email": email, "code": code}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_onboarding_profile_update(async_client):
    headers = await get_auth_headers(async_client, "profile@realify.ai")
    
    # Check initial status is AWAITING_PROFILE
    status_resp = await async_client.get("/v1/onboarding/status", headers=headers)
    assert status_resp.status_code == 200
    assert status_resp.json()["onboarding_state"] == OnboardingState.AWAITING_PROFILE.value
    
    # Save profile details
    profile_data = {
        "first_name": "John",
        "last_name": "Doe"
    }
    response = await async_client.post(
        "/v1/onboarding/profile",
        json=profile_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["onboarding_state"] == OnboardingState.AWAITING_WORKSPACE.value
    assert data["is_completed"] is False
    
    # Hitting /profile again should fail gating since user is now in AWAITING_WORKSPACE
    response2 = await async_client.post(
        "/v1/onboarding/profile",
        json=profile_data,
        headers=headers
    )
    assert response2.status_code == 403

@pytest.mark.asyncio
async def test_onboarding_workspace_creation(async_client):
    headers = await get_auth_headers(async_client, "workspace@realify.ai")
    
    # Transition to AWAITING_WORKSPACE first
    await async_client.post(
        "/v1/onboarding/profile",
        json={"first_name": "John", "last_name": "Doe"},
        headers=headers
    )
    
    # Create workspace
    workspace_data = {
        "store_name": "My Shop",
        "annual_gmv_range": "$500K - $1M",
        "primary_marketplaces": ["Shopify", "Amazon"],
        "goals": ["Increase Profitability", "Scale Revenue"]
    }
    response = await async_client.post(
        "/v1/onboarding/workspace",
        json=workspace_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["store_name"] == "My Shop"
    assert data["annual_gmv_range"] == "$500K - $1M"
    assert "id" in data
    
    # Check onboarding state is now AWAITING_INTEGRATION
    status_resp = await async_client.get("/v1/onboarding/status", headers=headers)
    assert status_resp.json()["onboarding_state"] == OnboardingState.AWAITING_INTEGRATION.value
