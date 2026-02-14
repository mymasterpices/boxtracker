from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class BoxType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    quantity: int = 0
    cost: float = 0.0
    min_threshold: int = 10
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BoxTypeCreate(BaseModel):
    name: str
    quantity: int = 0
    cost: float = 0.0
    min_threshold: int = 10

class BoxTypeUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    cost: Optional[float] = None
    min_threshold: Optional[int] = None

class UsageRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    box_type_id: str
    box_name: str
    quantity_used: int
    date: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UsageRecordCreate(BaseModel):
    box_type_id: str
    quantity_used: int
    date: Optional[str] = None  # If not provided, use today

class DashboardStats(BaseModel):
    total_box_types: int
    total_inventory: int
    total_value: float
    low_stock_count: int
    low_stock_boxes: List[dict]

# ==================== BOX ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "Box Inventory API"}

@api_router.get("/boxes", response_model=List[BoxType])
async def get_boxes():
    boxes = await db.boxes.find({}, {"_id": 0}).to_list(1000)
    return boxes

@api_router.post("/boxes", response_model=BoxType)
async def create_box(box: BoxTypeCreate):
    box_obj = BoxType(**box.model_dump())
    doc = box_obj.model_dump()
    await db.boxes.insert_one(doc)
    return box_obj

@api_router.get("/boxes/{box_id}", response_model=BoxType)
async def get_box(box_id: str):
    box = await db.boxes.find_one({"id": box_id}, {"_id": 0})
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    return box

@api_router.put("/boxes/{box_id}", response_model=BoxType)
async def update_box(box_id: str, box_update: BoxTypeUpdate):
    existing = await db.boxes.find_one({"id": box_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Box not found")
    
    update_data = {k: v for k, v in box_update.model_dump().items() if v is not None}
    if update_data:
        await db.boxes.update_one({"id": box_id}, {"$set": update_data})
    
    updated = await db.boxes.find_one({"id": box_id}, {"_id": 0})
    return updated

@api_router.delete("/boxes/{box_id}")
async def delete_box(box_id: str):
    result = await db.boxes.delete_one({"id": box_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Box not found")
    # Also delete usage records for this box
    await db.usage.delete_many({"box_type_id": box_id})
    return {"message": "Box deleted successfully"}

# ==================== USAGE ENDPOINTS ====================

@api_router.post("/usage", response_model=UsageRecord)
async def record_usage(usage: UsageRecordCreate):
    # Get the box
    box = await db.boxes.find_one({"id": usage.box_type_id}, {"_id": 0})
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    
    # Check if enough quantity
    if box["quantity"] < usage.quantity_used:
        raise HTTPException(status_code=400, detail=f"Not enough stock. Available: {box['quantity']}")
    
    # Deduct quantity
    new_quantity = box["quantity"] - usage.quantity_used
    await db.boxes.update_one({"id": usage.box_type_id}, {"$set": {"quantity": new_quantity}})
    
    # Create usage record
    use_date = usage.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    usage_obj = UsageRecord(
        box_type_id=usage.box_type_id,
        box_name=box["name"],
        quantity_used=usage.quantity_used,
        date=use_date
    )
    doc = usage_obj.model_dump()
    await db.usage.insert_one(doc)
    
    return usage_obj

@api_router.get("/usage", response_model=List[UsageRecord])
async def get_usage(days: int = 30):
    # Get usage records from last N days
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    records = await db.usage.find(
        {"created_at": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return records

@api_router.get("/usage/trends")
async def get_usage_trends(days: int = 14):
    """Get daily usage aggregated by date for the last N days"""
    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    # Get all usage records
    records = await db.usage.find(
        {"date": {"$gte": cutoff_date}},
        {"_id": 0}
    ).to_list(1000)
    
    # Aggregate by date
    daily_totals = {}
    for r in records:
        date = r["date"]
        if date not in daily_totals:
            daily_totals[date] = 0
        daily_totals[date] += r["quantity_used"]
    
    # Fill in missing dates with 0
    result = []
    current = datetime.now(timezone.utc)
    for i in range(days):
        date = (current - timedelta(days=i)).strftime("%Y-%m-%d")
        result.append({
            "date": date,
            "total_used": daily_totals.get(date, 0)
        })
    
    result.reverse()
    return result

# ==================== DASHBOARD ENDPOINTS ====================

@api_router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    boxes = await db.boxes.find({}, {"_id": 0}).to_list(1000)
    
    total_box_types = len(boxes)
    total_inventory = sum(b["quantity"] for b in boxes)
    total_value = sum(b["quantity"] * b["cost"] for b in boxes)
    
    low_stock_boxes = [
        {"id": b["id"], "name": b["name"], "quantity": b["quantity"], "min_threshold": b["min_threshold"]}
        for b in boxes if b["quantity"] <= b["min_threshold"]
    ]
    
    return DashboardStats(
        total_box_types=total_box_types,
        total_inventory=total_inventory,
        total_value=round(total_value, 2),
        low_stock_count=len(low_stock_boxes),
        low_stock_boxes=low_stock_boxes
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
