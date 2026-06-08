import logging
from bson import ObjectId
from fastapi import HTTPException, status
from app.config.database import get_db
from app.models.user import UserModel, OnboardingState
from app.models.onboarding import WorkspaceModel
from app.schemas.onboarding import UserProfileUpdate, WorkspaceCreate

logger = logging.getLogger("app.services.onboarding_service")

async def update_user_profile(user: UserModel, data: UserProfileUpdate) -> UserModel:
    """Updates the user profile metadata and transitions onboarding state from AWAITING_PROFILE to AWAITING_WORKSPACE."""
    if user.onboarding_state != OnboardingState.AWAITING_PROFILE:
        logger.info(f"User {user.id} profile updated. State remains {user.onboarding_state}")
        new_state = user.onboarding_state
    else:
        new_state = OnboardingState.AWAITING_WORKSPACE
        
    db = get_db()
    
    update_result = await db.users.update_one(
        {"_id": ObjectId(user.id)},
        {
            "$set": {
                "profile.first_name": data.first_name,
                "profile.last_name": data.last_name,
                "onboarding_state": new_state
            }
        }
    )
    
    if update_result.modified_count == 0:
        logger.warning(f"No changes made during profile update for user {user.id}")
        
    # Fetch updated user
    updated_doc = await db.users.find_one({"_id": ObjectId(user.id)})
    return UserModel(**updated_doc)

async def create_user_workspace(user: UserModel, data: WorkspaceCreate) -> WorkspaceModel:
    """Creates a new workspace context, links it to the user, and transitions onboarding state to AWAITING_INTEGRATION."""
    db = get_db()
    
    # Create workspace object
    workspace = WorkspaceModel(
        store_name=data.store_name,
        annual_gmv_range=data.annual_gmv_range,
        primary_marketplaces=data.primary_marketplaces,
        goals=data.goals,
        owner_id=ObjectId(user.id)
    )
    
    workspace_dict = workspace.model_dump(by_alias=True, exclude_none=True)
    if "_id" in workspace_dict and workspace_dict["_id"] is None:
        workspace_dict.pop("_id")
        
    result = await db.workspaces.insert_one(workspace_dict)
    workspace_id = result.inserted_id
    workspace.id = workspace_id
    
    # Transition user onboarding state if currently in AWAITING_WORKSPACE
    new_state = OnboardingState.AWAITING_INTEGRATION if user.onboarding_state == OnboardingState.AWAITING_WORKSPACE else user.onboarding_state
    
    await db.users.update_one(
        {"_id": ObjectId(user.id)},
        {
            "$addToSet": {"workspace_ids": workspace_id},
            "$set": {"onboarding_state": new_state}
        }
    )
    
    logger.info(f"Workspace {workspace_id} created for user {user.id}. State set to {new_state}")
    return workspace

def calculate_onboarding_status(user: UserModel):
    """Calculates status and instructions for current onboarding state."""
    state = user.onboarding_state
    is_completed = (state == OnboardingState.ACTIVE)
    
    next_step = None
    if state == OnboardingState.AWAITING_PROFILE:
        next_step = "Submit profile details (first_name, last_name)"
    elif state == OnboardingState.AWAITING_WORKSPACE:
        next_step = "Create a workspace (store_name, annual_gmv_range, primary_marketplaces, goals)"
    elif state == OnboardingState.AWAITING_INTEGRATION:
        next_step = "Connect an integration channel (Shopify or WooCommerce)"
    elif state == OnboardingState.ACTIVE:
        next_step = "Dashboard ready"
        
    return {
        "onboarding_state": state,
        "is_completed": is_completed,
        "next_step": next_step
    }
