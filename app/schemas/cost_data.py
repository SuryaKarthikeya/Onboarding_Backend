from pydantic import BaseModel, Field
from typing import Optional

class ManualCostCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Cost amount value")
    category: str = Field(..., min_length=1, description="Target category categorization tag")
    workspace_id: Optional[str] = Field(None, description="Optional target workspace ID context")
