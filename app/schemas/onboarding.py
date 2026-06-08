from pydantic import BaseModel, Field, field_validator
from typing import Optional
from app.models.user import OnboardingState

class UserProfileUpdate(BaseModel):
    first_name: str = Field(..., min_length=1, description="First name of the user")
    last_name: str = Field(..., min_length=1, description="Last name of the user")

class WorkspaceCreate(BaseModel):
    store_name: str = Field(..., min_length=1, description="Store or business name")
    annual_gmv_range: Optional[str] = Field(None, description="Annual GMV range")
    primary_marketplaces: list[str] = Field(default_factory=list, description="Primary marketplace choices")
    goals: list[str] = Field(default_factory=list, description="Ordered list of primary goals")

    @field_validator("goals")
    @classmethod
    def validate_goals(cls, v: list[str]) -> list[str]:
        predefined_goals = {
            "Increase Profitability",
            "Scale Revenue",
            "Optimize Inventory",
            "Save Time"
        }
        if set(v) != predefined_goals or len(v) != 4:
            raise ValueError(
                "Goals must contain exactly the 4 predefined options in order of priority: "
                "Increase Profitability, Scale Revenue, Optimize Inventory, and Save Time."
            )
        return v

class WorkspaceResponse(BaseModel):
    id: str
    store_name: str
    annual_gmv_range: Optional[str] = None
    primary_marketplaces: list[str]
    goals: list[str]
    owner_id: str

class UserProfileResponse(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class OnboardingStatusResponse(BaseModel):
    onboarding_state: OnboardingState
    is_completed: bool
    next_step: Optional[str] = None
