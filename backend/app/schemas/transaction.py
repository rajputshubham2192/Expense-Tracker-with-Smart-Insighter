from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.schemas.category import CategoryResponse

class TransactionBase(BaseModel):
    amount: float
    type: str = "expense"  # "expense" or "income"
    description: str
    date: date
    payment_method: Optional[str] = "UPI / Card"
    notes: Optional[str] = None
    category_id: Optional[int] = None
    is_recurring: Optional[bool] = False
    recurring_frequency: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    category_id: Optional[int] = None
    is_recurring: Optional[bool] = None
    recurring_frequency: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    raw_text: Optional[str] = None
    ai_categorized: bool
    confidence_score: float
    is_anomaly: bool
    anomaly_score: float
    price_change_percent: float
    user_id: int
    created_at: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

class TransactionImportResult(BaseModel):
    total_processed: int
    successful_imports: int
    failed_imports: int
    anomalies_detected: int
    categories_assigned_by_ai: int
