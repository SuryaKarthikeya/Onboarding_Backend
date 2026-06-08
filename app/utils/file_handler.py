import csv
import io
import logging
from typing import List, Dict, Any

logger = logging.getLogger("app.utils.file_handler")

def parse_cost_csv(content: bytes) -> List[Dict[str, Any]]:
    """Parses cost CSV data from bytes. Looks for amount and category columns dynamically."""
    text_data = content.decode("utf-8-sig")  # handles UTF-8 BOM
    file_like = io.StringIO(text_data)
    reader = csv.reader(file_like)
    
    try:
        header = next(reader)
    except StopIteration:
        return []
        
    # Clean header names (lowercase and strip whitespace)
    header = [h.strip().lower() for h in header]
    
    # Identify key columns
    amount_idx = -1
    category_idx = -1
    
    amount_keywords = {"amount", "cost", "value", "price", "total"}
    category_keywords = {"category", "type", "group", "class", "tag"}
    
    for idx, col in enumerate(header):
        if col in amount_keywords:
            amount_idx = idx
        elif col in category_keywords:
            category_idx = idx
            
    # Fallback to column indices if keywords match nothing
    if amount_idx == -1 and len(header) > 0:
        amount_idx = 0
    if category_idx == -1 and len(header) > 1:
        category_idx = 1
        
    results = []
    for row_num, row in enumerate(reader, start=2):
        if not row or all(not cell.strip() for cell in row):
            continue  # Skip empty rows
            
        try:
            amount_str = row[amount_idx].replace("$", "").replace(",", "").strip() if amount_idx < len(row) else "0"
            amount = float(amount_str) if amount_str else 0.0
            
            category = row[category_idx].strip() if category_idx < len(row) else "General"
            if not category:
                category = "General"
                
            results.append({
                "amount": amount,
                "category": category
            })
        except Exception as e:
            logger.warning(f"Skipping row {row_num} due to parsing error: {str(e)}")
            continue
            
    return results
