from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CategoryBreakdownItem(BaseModel):
    category_id: Optional[int]
    category_name: str
    color: str
    icon: str
    total_amount: float
    percentage: float
    transaction_count: int

class MonthlyTrendItem(BaseModel):
    month_name: str
    year: int
    month: int
    income: float
    expense: float
    net_savings: float

class DailyHeatmapItem(BaseModel):
    date: str
    amount: float
    transaction_count: int
    intensity: int  # 0 to 4

class DashboardOverview(BaseModel):
    total_income: float
    total_expenses: float
    current_balance: float
    savings_rate: float
    month_expense: float
    month_income: float
    active_anomalies_count: int
    categories_breakdown: List[CategoryBreakdownItem]
    monthly_trends: List[MonthlyTrendItem]
    recent_transactions: List[Dict[str, Any]]
    spending_heatmap: List[DailyHeatmapItem]
