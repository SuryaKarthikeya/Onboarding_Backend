from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from app.models.user import PyObjectId

class WorkspaceModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    company_name: str
    website: Optional[str] = None
    revenue_scale: Optional[str] = None
    owner_id: PyObjectId

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )

class IntegrationModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    workspace_id: PyObjectId
    platform: str  # shopify, woocommerce, amazon
    credentials: str  # encrypted ciphertext
    status: str = "active"  # active, syncing, failed

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )

