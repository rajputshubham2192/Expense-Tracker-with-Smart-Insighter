import calendar
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetProgress

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("/progress", response_model=List[BudgetProgress])
def get_budget_progress(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all active budgets for the given month with real-time spend progress and alerts."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year
    days_in_month = calendar.monthrange(target_year, target_month)[1]
    
    start_date = date(target_year, target_month, 1)
    end_date = date(target_year, target_month, days_in_month)
    day_fraction = min(1.0, max(0.05, today.day / days_in_month)) if target_month == today.month else 1.0

    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == target_month,
        Budget.year == target_year
    ).all()

    progress_list = []
    for b in budgets:
        # Calculate spending
        spend_query = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            Transaction.date >= start_date,
            Transaction.date <= end_date
        )

        if b.category_id:
            spend_query = spend_query.filter(Transaction.category_id == b.category_id)
            cat_name = b.category.name if b.category else "Category"
        else:
            cat_name = "Overall Monthly Budget"

        spent = float(spend_query.scalar() or 0.0)
        remaining = max(0.0, b.amount - spent)
        pct = round((spent / b.amount) * 100, 1) if b.amount > 0 else 0.0
        
        # Forecasted month end for this category/overall
        forecasted_spend = round(spent / day_fraction, 2)
        will_exceed = forecasted_spend > b.amount
        is_alert = pct >= (b.threshold_alert or 80.0) or spent >= b.amount

        progress_list.append(
            BudgetProgress(
                budget_id=b.id,
                amount=b.amount,
                spent=spent,
                remaining=remaining,
                percentage_used=pct,
                is_overbudget=spent > b.amount,
                is_alert_triggered=is_alert,
                month=b.month,
                year=b.year,
                category_id=b.category_id,
                category_name=cat_name,
                forecasted_month_end_spend=forecasted_spend,
                will_exceed_forecast=will_exceed
            )
        )

    return progress_list

@router.get("/", response_model=List[BudgetResponse])
def get_budgets(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve raw budget configurations."""
    query = db.query(Budget).filter(Budget.user_id == current_user.id)
    if month:
        query = query.filter(Budget.month == month)
    if year:
        query = query.filter(Budget.year == year)
    return query.all()

@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update monthly/category budget."""
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == budget_in.category_id,
        Budget.month == budget_in.month,
        Budget.year == budget_in.year
    ).first()

    if existing:
        existing.amount = budget_in.amount
        existing.threshold_alert = budget_in.threshold_alert or 80.0
        db.commit()
        db.refresh(existing)
        return existing

    budget = Budget(
        amount=budget_in.amount,
        month=budget_in.month,
        year=budget_in.year,
        threshold_alert=budget_in.threshold_alert or 80.0,
        category_id=budget_in.category_id,
        user_id=current_user.id
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a budget configuration."""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db.delete(budget)
    db.commit()
    return None
