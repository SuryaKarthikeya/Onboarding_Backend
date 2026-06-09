from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class QuickBooksIntegrationModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    workspace_id: str
    user_id: str
    realm_id: str = Field(..., description="The QuickBooks Company/Tenant ID")
    access_token: str
    refresh_token: str
    access_token_expires_at: datetime
    refresh_token_expires_at: datetime
    status: str = "active"
    updated_at: datetime = Field(default_factory=datetime.utcnow)