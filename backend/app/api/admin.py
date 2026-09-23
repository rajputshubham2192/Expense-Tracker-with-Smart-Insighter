from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_admin_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.admin import AdminUserSummary, AdminSystemOverview, AdminUserDetail
from app.schemas.analytics import CategoryBreakdownItem

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

@router.get("/system-overview", response_model=AdminSystemOverview)
def get_admin_system_overview(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Platform-wide financial telemetry and user summaries for administrators."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    total_users = len(users)
    active_users = sum(1 for u in users if u.is_active)

    # Platform Totals
    platform_income = float(db.query(func.sum(Transaction.amount)).filter(Transaction.type == "income").scalar() or 0.0)
    platform_expense = float(db.query(func.sum(Transaction.amount)).filter(Transaction.type == "expense").scalar() or 0.0)
    total_anomalies = db.query(Transaction).filter(Transaction.is_anomaly == True).count()

    # Platform-wide Top Spending Categories
    top_cats_query = db.query(
        Category.name,
        Category.color,
        func.sum(Transaction.amount).label("total_spend"),
        func.count(Transaction.id).label("tx_count")
    ).join(Transaction, Transaction.category_id == Category.id)\
     .filter(Transaction.type == "expense")\
     .group_by(Category.name, Category.color)\
     .order_by(func.sum(Transaction.amount).desc()).limit(6).all()

    top_categories_platform = [
        {
            "name": c[0],
            "color": c[1] or "#6366f1",
            "total_spend": round(float(c[2]), 2),
            "transaction_count": c[3]
        }
        for c in top_cats_query
    ]

    # User Summaries
    user_summaries = []
    for u in users:
        # User income & expense
        u_inc = float(db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == u.id, Transaction.type == "income").scalar() or 0.0)
        u_exp = float(db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == u.id, Transaction.type == "expense").scalar() or 0.0)
        tx_count = db.query(Transaction).filter(Transaction.user_id == u.id).count()

        # Top spending category for this user (Where they spend more money!)
        top_cat = db.query(
            Category.name,
            func.sum(Transaction.amount).label("spend")
        ).join(Transaction, Transaction.category_id == Category.id)\
         .filter(Transaction.user_id == u.id, Transaction.type == "expense")\
         .group_by(Category.name)\
         .order_by(func.sum(Transaction.amount).desc()).first()

        top_cat_name = top_cat[0] if top_cat else "No expenses yet"

        # Highest single expense
        highest_tx = db.query(func.max(Transaction.amount)).filter(
            Transaction.user_id == u.id,
            Transaction.type == "expense"
        ).scalar() or 0.0

        user_summaries.append(
            AdminUserSummary(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                role=u.role,
                is_active=u.is_active,
                created_at=u.created_at,
                total_income=round(u_inc, 2),
                total_expense=round(u_exp, 2),
                net_balance=round(u_inc - u_exp, 2),
                transaction_count=tx_count,
                top_spending_category=top_cat_name,
                highest_single_expense=round(float(highest_tx), 2)
            )
        )

    return AdminSystemOverview(
        total_registered_users=total_users,
        active_users_count=active_users,
        total_platform_volume=round(platform_income + platform_expense, 2),
        total_platform_expenses=round(platform_expense, 2),
        total_platform_income=round(platform_income, 2),
        total_anomalies_detected=total_anomalies,
        top_categories_platform_wide=top_categories_platform,
        recent_registrations=user_summaries
    )

@router.get("/users/{user_id}/analytics", response_model=AdminUserDetail)
def get_user_spending_deep_dive(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Detailed category breakdown and transaction inspection for a specific user."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    u_inc = float(db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id, Transaction.type == "income").scalar() or 0.0)
    u_exp = float(db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id, Transaction.type == "expense").scalar() or 0.0)

    # Category Breakdown for this user
    cat_query = db.query(
        Category.id,
        Category.name,
        Category.color,
        Category.icon,
        func.sum(Transaction.amount).label("total_amount"),
        func.count(Transaction.id).label("tx_count")
    ).join(Transaction, Transaction.category_id == Category.id)\
     .filter(Transaction.user_id == user_id, Transaction.type == "expense")\
     .group_by(Category.id, Category.name, Category.color, Category.icon)\
     .order_by(func.sum(Transaction.amount).desc()).all()

    total_spend = sum(c[4] for c in cat_query) or 1.0
    category_breakdown = [
        CategoryBreakdownItem(
            category_id=c[0],
            category_name=c[1],
            color=c[2] or "#6366f1",
            icon=c[3] or "Tag",
            total_amount=round(float(c[4]), 2),
            percentage=round((float(c[4]) / total_spend) * 100, 1),
            transaction_count=c[5]
        )
        for c in cat_query
    ]

    # Recent transactions for this user
    recent_txs = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.date.desc(), Transaction.id.desc()).limit(15).all()

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

    return AdminUserDetail(
        user_id=target_user.id,
        full_name=target_user.full_name,
        email=target_user.email,
        role=target_user.role,
        is_active=target_user.is_active,
        total_income=round(u_inc, 2),
        total_expense=round(u_exp, 2),
        current_balance=round(u_inc - u_exp, 2),
        category_breakdown=category_breakdown,
        recent_transactions=recent_serialized
    )

@router.put("/users/{user_id}/status")
def toggle_user_active_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Enable or disable a user account."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Admins cannot deactivate their own account")

    target_user.is_active = not target_user.is_active
    db.commit()
    return {"status": "success", "is_active": target_user.is_active}

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_registered_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Permanently delete a registered user and cascade-delete all associated transactions and budgets."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Admins cannot delete their own account")

    db.delete(target_user)
    db.commit()
    return None

