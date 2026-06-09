from fastapi import APIRouter, Depends, status
from app.models.user import UserModel, OnboardingState
from app.schemas.onboarding import (
    UserProfileUpdate,
    WorkspaceCreate,
    WorkspaceResponse,
    OnboardingStatusResponse
)
from app.middleware.auth_middleware import get_current_user, StateGating
from app.services.onboarding_service import (
    update_user_profile,
    create_user_workspace,
    calculate_onboarding_status
)

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

@router.post("/profile", response_model=OnboardingStatusResponse)
async def update_profile(
    payload: UserProfileUpdate,
    current_user: UserModel = Depends(StateGating([OnboardingState.AWAITING_PROFILE]))
):
    """Saves user profile metadata and moves onboarding status forward."""
    updated_user = await update_user_profile(current_user, payload)
    status_data = await calculate_onboarding_status(updated_user)
    return OnboardingStatusResponse(**status_data)

@router.post("/workspace", response_model=WorkspaceResponse)
async def create_workspace(
    payload: WorkspaceCreate,
    current_user: UserModel = Depends(StateGating([OnboardingState.AWAITING_WORKSPACE]))
):
    """Registers the workspace tenant organization mapping to user."""
    workspace = await create_user_workspace(current_user, payload)
    return WorkspaceResponse(
        id=str(workspace.id),
        store_name=workspace.store_name,
        annual_gmv_range=workspace.annual_gmv_range,
        primary_marketplaces=workspace.primary_marketplaces,
        goals=workspace.goals,
        owner_id=str(workspace.owner_id)
    )

@router.get("/status", response_model=OnboardingStatusResponse)
async def get_status(current_user: UserModel = Depends(get_current_user)):
    """Fetch user onboarding completion status and instructions."""
    status_data = await calculate_onboarding_status(current_user)
    return OnboardingStatusResponse(**status_data)
