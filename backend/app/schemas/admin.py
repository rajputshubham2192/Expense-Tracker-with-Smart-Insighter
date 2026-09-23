from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.schemas.analytics import CategoryBreakdownItem

class AdminUserSummary(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    total_income: float
    total_expense: float
    net_balance: float
    transaction_count: int
    top_spending_category: str
    highest_single_expense: float

class AdminSystemOverview(BaseModel):
    total_registered_users: int
    active_users_count: int
    total_platform_volume: float
    total_platform_expenses: float
    total_platform_income: float
    total_anomalies_detected: int
    top_categories_platform_wide: List[Dict[str, Any]]
    recent_registrations: List[AdminUserSummary]

class AdminUserDetail(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    total_income: float
    total_expense: float
    current_balance: float
    category_breakdown: List[CategoryBreakdownItem]
    recent_transactions: List[Dict[str, Any]]
