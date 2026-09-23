from typing import List, Dict, Any
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.transaction import Transaction
from app.models.category import Category
from app.models.budget import Budget
from app.schemas.ai import RecurringSubscriptionItem, SmartRecommendation

class SmartRecommendationEngine:
    @staticmethod
    def detect_recurring_and_price_hikes(user_id: int, db: Session) -> List[RecurringSubscriptionItem]:
        """Detects recurring subscriptions and flags price hikes."""
        # Query potential recurring expenses
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense"
        ).order_by(Transaction.description.asc(), Transaction.date.desc()).all()

        # Group by sanitized merchant name
        merchant_groups: Dict[str, List[Transaction]] = {}
        for t in transactions:
            # Extract main keyword
            desc_clean = t.description.strip().title()
            if len(desc_clean) < 3:
                continue
            
            matched_key = None
            for existing_key in merchant_groups.keys():
                if existing_key.lower() in desc_clean.lower() or desc_clean.lower() in existing_key.lower():
                    matched_key = existing_key
                    break
            
            group_key = matched_key or desc_clean
            if group_key not in merchant_groups:
                merchant_groups[group_key] = []
            merchant_groups[group_key].append(t)

        recurring_items: List[RecurringSubscriptionItem] = []

        for merchant, tx_list in merchant_groups.items():
            # If seen 2 or more times with similar intervals
            if len(tx_list) >= 2:
                latest_tx = tx_list[0]
                prev_tx = tx_list[1]
                
                # Check interval
                days_diff = abs((latest_tx.date - prev_tx.date).days)
                is_monthly = 20 <= days_diff <= 40
                is_weekly = 5 <= days_diff <= 9

                if is_monthly or is_weekly or latest_tx.is_recurring:
                    price_change = 0.0
                    is_hike = False
                    if prev_tx.amount > 0:
                        diff = latest_tx.amount - prev_tx.amount
                        price_change = round((diff / prev_tx.amount) * 100, 1)
                        if price_change > 0:
                            is_hike = True

                    freq = "Monthly" if is_monthly else ("Weekly" if is_weekly else "Periodic")
                    next_date = latest_tx.date + timedelta(days=30 if is_monthly else (7 if is_weekly else 30))

                    recurring_items.append(
                        RecurringSubscriptionItem(
                            merchant=merchant,
                            current_amount=latest_tx.amount,
                            previous_amount=prev_tx.amount if prev_tx.amount != latest_tx.amount else None,
                            price_change_percent=price_change,
                            frequency=freq,
                            next_expected_date=next_date.strftime("%Y-%m-%d"),
                            is_price_hike=is_hike
                        )
                    )

        return recurring_items

    @staticmethod
    def generate_smart_recommendations(user_id: int, db: Session) -> List[SmartRecommendation]:
        """Generates AI-powered actionable savings recommendations."""
        recommendations: List[SmartRecommendation] = []

        # 1. Check Subscriptions Price Hikes
        subscriptions = SmartRecommendationEngine.detect_recurring_and_price_hikes(user_id, db)
        for sub in subscriptions:
            if sub.is_price_hike and sub.previous_amount:
                diff = sub.current_amount - sub.previous_amount
                recommendations.append(
                    SmartRecommendation(
                        id=f"hike-{sub.merchant.lower()}",
                        title=f"Price Hike Detected: {sub.merchant}",
                        description=f"{sub.merchant} increased by {sub.price_change_percent}% (from ₹{sub.previous_amount:,.0f} to ₹{sub.current_amount:,.0f}). Consider auditing usage or switching to an annual plan to save.",
                        potential_savings=round(diff * 12, 0),
                        category="Subscriptions",
                        priority="HIGH",
                        action_type="SUBSCRIPTION_AUDIT"
                    )
                )

        # 2. Check High Dining & Delivery Spend
        food_spend = db.query(func.sum(Transaction.amount)).join(Category).filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            Category.name == "Food & Dining"
        ).scalar() or 0.0

        if food_spend > 5000:
            potential = round(food_spend * 0.25, 0)
            recommendations.append(
                SmartRecommendation(
                    id="food-opt-1",
                    title="Optimize Food & Dining Expenses",
                    description=f"You have spent ₹{food_spend:,.0f} on food delivery & dining out. Preparing meals at home twice more per week could save ~25% monthly.",
                    potential_savings=potential,
                    category="Food & Dining",
                    priority="MEDIUM",
                    action_type="BUDGET_OPTIMIZE"
                )
            )

        # 3. Check Over-Budget Categories
        budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
        for b in budgets:
            if b.category:
                cat_spend = db.query(func.sum(Transaction.amount)).filter(
                    Transaction.user_id == user_id,
                    Transaction.category_id == b.category_id,
                    Transaction.type == "expense"
                ).scalar() or 0.0

                if cat_spend > b.amount:
                    excess = cat_spend - b.amount
                    recommendations.append(
                        SmartRecommendation(
                            id=f"budget-exceed-{b.id}",
                            title=f"Budget Exceeded in {b.category.name}",
                            description=f"You are ₹{excess:,.0f} above your target limit for {b.category.name}. Pause discretionary purchases in this category for the next 7 days.",
                            potential_savings=round(excess, 0),
                            category=b.category.name,
                            priority="HIGH",
                            action_type="SPENDING_HALT"
                        )
                    )

        # 4. Standard Wealth & Savings Rule (50/30/20 Guideline)
        total_income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.type == "income"
        ).scalar() or 0.0

        if total_income > 20000:
            recommended_sip = round(total_income * 0.20, 0)
            recommendations.append(
                SmartRecommendation(
                    id="rule-50-30-20",
                    title="Target 20% Automated SIP & Wealth Growth",
                    description=f"Based on your cumulative income, allocating ₹{recommended_sip:,.0f} (20%) directly into an index fund / SIP on payday will secure compound growth.",
                    potential_savings=recommended_sip,
                    category="Investments",
                    priority="LOW",
                    action_type="SIP_INVESTMENT"
                )
            )

        return recommendations
