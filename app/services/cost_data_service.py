import logging
from bson import ObjectId
from app.config.database import get_db
from app.utils.file_handler import parse_cost_csv
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger("app.services.cost_data_service")

async def add_manual_cost_entry(workspace_id: str, amount: float, category: str) -> Dict[str, Any]:
    """Adds a single manual cost entry to the database."""
    db = get_db()
    entry = {
        "workspace_id": ObjectId(workspace_id),
        "source": "manual",
        "amount": amount,
        "category": category,
        "created_at": datetime.utcnow()  # ADDED: Time logging
    }
    result = await db.cost_entries.insert_one(entry)
    entry["id"] = str(result.inserted_id)
    entry["_id"] = str(result.inserted_id)
    entry["workspace_id"] = str(entry["workspace_id"])
    return entry

async def ingest_csv_cost_sheet(workspace_id: str, file_content: bytes) -> List[Dict[str, Any]]:
    """Parses a CSV buffer and inserts all items into the cost_entries collection."""
    db = get_db()
    parsed_entries = parse_cost_csv(file_content)
    
    if not parsed_entries:
        return []
        
    db_entries = []
    current_time = datetime.utcnow()
    
    for pe in parsed_entries:
        db_entries.append({
            "workspace_id": ObjectId(workspace_id),
            "source": "csv",
            "amount": float(pe["amount"]), # SAFELY: Ensure type casting
            "category": pe["category"],
            "created_at": current_time     # ADDED: Time logging
        })
        
    result = await db.cost_entries.insert_many(db_entries)
    
    # Map back string IDs cleanly for outbound schema processing response frameworks
    inserted_ids = result.inserted_ids
    for idx, entry in enumerate(db_entries):
        entry["id"] = str(inserted_ids[idx])
        entry["_id"] = str(inserted_ids[idx])
        entry["workspace_id"] = str(entry["workspace_id"])
        
    logger.info(f"Successfully ingested {len(db_entries)} cost items from CSV for workspace {workspace_id}")
    return db_entries

async def get_cost_entries_by_workspace(workspace_id: str) -> List[Dict[str, Any]]:
    """Retrieves all cost entries for a workspace."""
    db = get_db()
    cursor = db.cost_entries.find({
        "workspace_id": {"$in": [workspace_id, ObjectId(workspace_id)]}
    })
    db_entries = await cursor.to_list(length=100)
    for entry in db_entries:
        entry["id"] = str(entry["_id"])
        entry["_id"] = str(entry["_id"])
        entry["workspace_id"] = str(entry["workspace_id"])
    return db_entries