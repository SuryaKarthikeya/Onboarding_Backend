from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.models.user import UserModel
from app.middleware.auth_middleware import get_current_user
from app.schemas.cost_data import ManualCostCreate
from app.models.cost_data import CostEntryResponse
from app.services.cost_data_service import add_manual_cost_entry, ingest_csv_cost_sheet, get_cost_entries_by_workspace
from typing import List

router = APIRouter(prefix="/cost-data", tags=["Cost Data Ingestion"])

@router.get("/", response_model=List[CostEntryResponse])
async def get_cost_entries(
    current_user: UserModel = Depends(get_current_user)
):
    """Endpoint to list all cost entries for the workspace."""
    mock_workspace_id = "6a26c891f1a54b321c8d77e4"
    entries = await get_cost_entries_by_workspace(workspace_id=mock_workspace_id)
    return entries

@router.post("/manual", response_model=CostEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_manual_entry(
    payload: ManualCostCreate,
    current_user: UserModel = Depends(get_current_user)
):
    """Endpoint to record a single manual cost entry inside the workspace."""
    # For testing, we use a mock workspace ID connection string string context.
    # Replace this with your dynamic user workspace extraction attribute once built.
    mock_workspace_id = "6a26c891f1a54b321c8d77e4"
    
    entry = await add_manual_cost_entry(
        workspace_id=mock_workspace_id,
        amount=payload.amount,
        category=payload.category
    )
    return entry

@router.post("/upload-csv", response_model=List[CostEntryResponse], status_code=status.HTTP_201_CREATED)
async def upload_cost_csv_sheet(
    file: UploadFile = File(..., description="The binary .csv spreadsheet worksheet document to parse"),
    current_user: UserModel = Depends(get_current_user)
):
    """Endpoint to stream a CSV file into memory, parse rows, and bulk-save entries."""
    # Guard: Ensure only standard CSV documents are routed to the parser
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file layout extension. Only standard .csv sheets are supported."
        )
        
    mock_workspace_id = "6a26c891f1a54b321c8d77e4"
    
    try:
        # Read file buffer contents directly out of streaming memory
        file_content = await file.read()
        db_entries = await ingest_csv_cost_sheet(
            workspace_id=mock_workspace_id,
            file_content=file_content
        )
        
        if not db_entries:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The uploaded CSV document contains no valid readable data records."
            )
            
        return db_entries
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing your worksheet: {str(e)}"
        )