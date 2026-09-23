from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AICategorizeRequest(BaseModel):
    description: str
    amount: Optional[float] = 0.0

class AICategorizeResponse(BaseModel):
    category_id: Optional[int]
    category_name: str
    confidence_score: float
    reasoning: str

class AICorrectionRequest(BaseModel):
    raw_text: str
    predicted_category: Optional[str] = None
    corrected_category: str

class ForecastResponse(BaseModel):
    current_month_spent: float
    days_elapsed: int
    days_remaining: int
    daily_average_burn_rate: float
    forecasted_month_end_expense: float
    predicted_savings: float
    current_budget: Optional[float]
    overspend_risk_level: str  # "LOW", "MODERATE", "CRITICAL"
    spending_trend_direction: str  # "UPWARD", "STABLE", "DOWNWARD"
    daily_projections: List[Dict[str, Any]]

class AnomalyItem(BaseModel):
    transaction_id: int
    date: str
    description: str
    amount: float
    category_name: str
    anomaly_score: float
    reason: str

class RecurringSubscriptionItem(BaseModel):
    merchant: str
    current_amount: float
    previous_amount: Optional[float]
    price_change_percent: float
    frequency: str
    next_expected_date: Optional[str]
    is_price_hike: bool

class SmartRecommendation(BaseModel):
    id: str
    title: str
    description: str
    potential_savings: float
    category: str
    priority: str  # "HIGH", "MEDIUM", "LOW"
    action_type: str
