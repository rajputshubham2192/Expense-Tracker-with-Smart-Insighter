import calendar
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.analytics import (
    DashboardOverview, CategoryBreakdownItem, MonthlyTrendItem, DailyHeatmapItem
)

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboard"])

@router.get("/dashboard-overview", response_model=DashboardOverview)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aggregate all critical KPIs, cashflow numbers, category breakdowns, trends, and heatmaps."""
    today = date.today()
    start_of_month = date(today.year, today.month, 1)

    # 1. Total Cumulative Income & Expense
    total_inc = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "income"
    ).scalar() or 0.0

    total_exp = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "expense"
    ).scalar() or 0.0

    current_balance = round(float(total_inc) - float(total_exp), 2)
    savings_rate = round((current_balance / float(total_inc)) * 100, 1) if total_inc > 0 else 0.0

    # 2. Current Month Income & Expense
    month_inc = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "income",
        Transaction.date >= start_of_month
    ).scalar() or 0.0

    month_exp = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "expense",
        Transaction.date >= start_of_month
    ).scalar() or 0.0

    # 3. Active Anomalies Count
    anomalies_count = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.is_anomaly == True
    ).count()

    # 4. Category Breakdown
    cat_query = db.query(
        Category.id,
        Category.name,
        Category.color,
        Category.icon,
        func.sum(Transaction.amount).label("total_amount"),
        func.count(Transaction.id).label("tx_count")
    ).join(Transaction, Transaction.category_id == Category.id)\
     .filter(Transaction.user_id == current_user.id, Transaction.type == "expense")\
     .group_by(Category.id, Category.name, Category.color, Category.icon)\
     .order_by(func.sum(Transaction.amount).desc()).all()

    total_cat_sum = sum(c[4] for c in cat_query) or 1.0
    category_breakdown = [
        CategoryBreakdownItem(
            category_id=c[0],
            category_name=c[1],
            color=c[2] or "#6366f1",
            icon=c[3] or "Tag",
            total_amount=round(float(c[4]), 2),
            percentage=round((float(c[4]) / total_cat_sum) * 100, 1),
            transaction_count=c[5]
        )
        for c in cat_query
    ]

    # 5. Monthly Trends (Last 6 months)
    monthly_trends = []
    for i in range(5, -1, -1):
        # Calculate target month and year
        target_month_num = (today.month - i - 1) % 12 + 1
        target_year_num = today.year + ((today.month - i - 1) // 12)
        days_in_target = calendar.monthrange(target_year_num, target_month_num)[1]

        m_start = date(target_year_num, target_month_num, 1)
        m_end = date(target_year_num, target_month_num, days_in_target)

        m_income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "income",
            Transaction.date >= m_start,
            Transaction.date <= m_end
        ).scalar() or 0.0

        m_expense = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            Transaction.date >= m_start,
            Transaction.date <= m_end
        ).scalar() or 0.0

        m_name = calendar.month_abbr[target_month_num]
        monthly_trends.append(
            MonthlyTrendItem(
                month_name=f"{m_name} '{str(target_year_num)[-2:]}",
                year=target_year_num,
                month=target_month_num,
                income=round(float(m_income), 2),
                expense=round(float(m_expense), 2),
                net_savings=round(float(m_income) - float(m_expense), 2)
            )
        )

    # 6. Recent Transactions (Top 7)
    recent_txs = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.date.desc(), Transaction.id.desc()).limit(7).all()

    recent_serialized = [
        {
            "id": t.id,
            "description": t.description,
            "amount": t.amount,
            "type": t.type,
            "date": t.date.strftime("%Y-%m-%d"),
            "category_name": t.category.name if t.category else "Uncategorized",
            "category_color": t.category.color if t.category else "#64748b",
            "is_anomaly": t.is_anomaly,
            "confidence_score": t.confidence_score
        }
        for t in recent_txs
    ]

    # 7. Daily Spending Heatmap Matrix (Past 60 days)
    heatmap_start = today - timedelta(days=59)
    daily_txs = db.query(
        Transaction.date,
        func.sum(Transaction.amount).label("day_spend"),
        func.count(Transaction.id).label("day_count")
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "expense",
        Transaction.date >= heatmap_start,
        Transaction.date <= today
    ).group_by(Transaction.date).all()

    spend_by_day = {d[0]: (float(d[1]), d[2]) for d in daily_txs}
    max_day_spend = max([val[0] for val in spend_by_day.values()] + [1.0])

    heatmap_items = []
    for d_offset in range(60):
        cur_d = heatmap_start + timedelta(days=d_offset)
        spend, count = spend_by_day.get(cur_d, (0.0, 0))
        
        # Intensity 0 to 4
        if spend == 0:
            intensity = 0
        elif spend <= (max_day_spend * 0.25):
            intensity = 1
        elif spend <= (max_day_spend * 0.50):
            intensity = 2
        elif spend <= (max_day_spend * 0.75):
            intensity = 3
        else:
            intensity = 4

        heatmap_items.append(
            DailyHeatmapItem(
                date=cur_d.strftime("%Y-%m-%d"),
                amount=round(spend, 2),
                transaction_count=count,
                intensity=intensity
            )
        )

    return DashboardOverview(
        total_income=round(float(total_inc), 2),
        total_expenses=round(float(total_exp), 2),
        current_balance=current_balance,
        savings_rate=savings_rate,
        month_expense=round(float(month_exp), 2),
        month_income=round(float(month_inc), 2),
        active_anomalies_count=anomalies_count,
        categories_breakdown=category_breakdown,
        monthly_trends=monthly_trends,
        recent_transactions=recent_serialized,
        spending_heatmap=heatmap_items
    )
