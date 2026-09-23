from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.category import CategoryResponse

class BudgetBase(BaseModel):
    amount: float
    month: int
    year: int
    threshold_alert: Optional[float] = 80.0
    category_id: Optional[int] = None

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    amount: Optional[float] = None
    threshold_alert: Optional[float] = None

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    created_at: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

class BudgetProgress(BaseModel):
    budget_id: int
    amount: float
    spent: float
    remaining: float
    percentage_used: float
    is_overbudget: bool
    is_alert_triggered: bool
    month: int
    year: int
    category_id: Optional[int] = None
    category_name: Optional[str] = "Overall Budget"
    forecasted_month_end_spend: float
    will_exceed_forecast: bool
