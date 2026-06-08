from pydantic import BaseModel, Field
from typing import Optional
from app.models.user import OnboardingState

class UserProfileUpdate(BaseModel):
    first_name: str = Field(..., min_length=1, description="First name of the user")
    last_name: str = Field(..., min_length=1, description="Last name of the user")
    role: str = Field(..., min_length=1, description="Role in the company (e.g., Owner, Analyst)")

class WorkspaceCreate(BaseModel):
    company_name: str = Field(..., min_length=1, description="Workspace/Company name")
    website: Optional[str] = Field(None, description="Optional store or company website URL")
    revenue_scale: Optional[str] = Field(None, description="Optional revenue scale indicator")

class WorkspaceResponse(BaseModel):
    id: str
    company_name: str
    website: Optional[str] = None
    revenue_scale: Optional[str] = None
    owner_id: str

class UserProfileResponse(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None

class OnboardingStatusResponse(BaseModel):
    onboarding_state: OnboardingState
    is_completed: bool
    next_step: Optional[str] = None
