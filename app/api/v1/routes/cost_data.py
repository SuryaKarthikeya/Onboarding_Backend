from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import Optional
from bson import ObjectId
from app.models.user import UserModel, OnboardingState
from app.schemas.cost_data import ManualCostCreate
from app.middleware.auth_middleware import StateGating
from app.services.cost_data_service import add_manual_cost_entry, ingest_csv_cost_sheet

router = APIRouter(prefix="/cost-data", tags=["Cost Data Ingestion"])

def resolve_workspace_id(user: UserModel, provided_id: Optional[str]) -> str:
    """Helper to enforce workspace ownership or fallback to default workspace."""
    if provided_id:
        try:
            p_id = ObjectId(provided_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid workspace_id format")
            
        if p_id not in user.workspace_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have access to this workspace context"
            )
        return provided_id
        
    if not user.workspace_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not belong to any active workspace"
        )
    return str(user.workspace_ids[0])

@router.post("/manual")
async def create_manual_cost(
    payload: ManualCostCreate,
    current_user: UserModel = Depends(StateGating([OnboardingState.ACTIVE]))
):
    """Enters a single merchant cost item."""
    workspace_id = resolve_workspace_id(current_user, payload.workspace_id)
    entry = await add_manual_cost_entry(
        workspace_id=workspace_id,
        amount=payload.amount,
        category=payload.category
    )
    return {
        "message": "Manual cost entry saved successfully",
        "entry": entry
    }

@router.post("/upload")
async def upload_csv_sheet(
    file: UploadFile = File(...),
    workspace_id: Optional[str] = Form(None),
    current_user: UserModel = Depends(StateGating([OnboardingState.ACTIVE]))
):
    """Parses and ingests multi-row cost worksheets via CSV."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only CSV files are supported."
        )
        
    resolved_id = resolve_workspace_id(current_user, workspace_id)
    content = await file.read()
    
    entries = await ingest_csv_cost_sheet(resolved_id, content)
    return {
        "message": f"Successfully imported {len(entries)} items from cost sheet",
        "imported_count": len(entries),
        "entries": entries
    }
