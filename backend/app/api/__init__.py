from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.transactions import router as transactions_router
from app.api.budgets import router as budgets_router
from app.api.ai_insights import router as ai_router
from app.api.analytics import router as analytics_router
from app.api.admin import router as admin_router

__all__ = [
    "auth_router",
    "categories_router",
    "transactions_router",
    "budgets_router",
    "ai_router",
    "analytics_router",
    "admin_router"
]
