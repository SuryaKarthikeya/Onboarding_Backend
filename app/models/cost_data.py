from pydantic import BaseModel, Field
from datetime import datetime

class ManualCostCreate(BaseModel):
    """Validation schema for incoming manual form entries."""
    amount: float = Field(..., gt=0, description="The expense amount, must be greater than 0")
    category: str = Field(..., min_length=1, description="The expense category classification label")

    class Config:
        json_schema_extra = {
            "example": {
                "amount": 1450.00,
                "category": "Marketing"
            }
        }

class CostEntryResponse(BaseModel):
    """Standardized response layout for single cost logs."""
    id: str
    workspace_id: str
    source: str
    amount: float
    category: str
    created_at: datetime