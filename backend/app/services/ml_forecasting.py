import calendar
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import numpy as np
from sklearn.linear_model import LinearRegression

from app.models.transaction import Transaction
from app.models.budget import Budget
from app.schemas.ai import ForecastResponse

class SpendingForecaster:
    @staticmethod
    def calculate_month_forecast(user_id: int, db: Session, target_date: Optional[date] = None) -> ForecastResponse:
        """Forecasts month-end expenses and overspending risk using trend analysis."""
        today = target_date or date.today()
        year = today.year
        month = today.month
        days_in_month = calendar.monthrange(year, month)[1]
        day_of_month = today.day

        # 1. Fetch current month expenses
        start_of_month = date(year, month, 1)
        end_of_month = date(year, month, days_in_month)

        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            Transaction.date >= start_of_month,
            Transaction.date <= today
        ).order_by(Transaction.date.asc()).all()

        current_month_spent = sum(t.amount for t in transactions)

        # 2. Fetch monthly budget
        budget_record = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.category_id.is_(None),
            Budget.month == month,
            Budget.year == year
        ).first()

        current_budget = budget_record.amount if budget_record else None

        # 3. Calculate Daily Aggregates
        daily_spend_map: Dict[int, float] = {d: 0.0 for d in range(1, day_of_month + 1)}
        for t in transactions:
            t_day = t.date.day
            if t_day <= day_of_month:
                daily_spend_map[t_day] += t.amount

        # 4. Burn-rate and Trend Modeling
        days_elapsed = max(1, day_of_month)
        days_remaining = max(0, days_in_month - day_of_month)
        daily_average_burn_rate = round(current_month_spent / days_elapsed, 2)

        # Build time-series trend if we have multiple days
        days_array = np.array(list(daily_spend_map.keys())).reshape(-1, 1)
        spend_array = np.array(list(daily_spend_map.values()))

        trend_direction = "STABLE"
        if len(days_array) > 2 and np.sum(spend_array) > 0:
            reg = LinearRegression().fit(days_array, spend_array)
            slope = reg.coef_[0]
            if slope > 20:
                trend_direction = "UPWARD"
            elif slope < -20:
                trend_direction = "DOWNWARD"

        # Projected spend
        projected_remaining_spend = daily_average_burn_rate * days_remaining
        forecasted_month_end_expense = round(current_month_spent + projected_remaining_spend, 2)

        # Fetch monthly income to calculate predicted savings
        income_sum = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.type == "income",
            Transaction.date >= start_of_month,
            Transaction.date <= end_of_month
        ).scalar() or 0.0

        predicted_savings = max(0.0, round(float(income_sum) - forecasted_month_end_expense, 2))

        # 5. Overspend Risk Assessment
        risk_level = "LOW"
        if current_budget and current_budget > 0:
            ratio = forecasted_month_end_expense / current_budget
            if ratio >= 1.0 or current_month_spent >= current_budget:
                risk_level = "CRITICAL"
            elif ratio >= 0.85:
                risk_level = "MODERATE"
        else:
            if income_sum > 0 and forecasted_month_end_expense > income_sum:
                risk_level = "CRITICAL"
            elif income_sum > 0 and forecasted_month_end_expense > (income_sum * 0.85):
                risk_level = "MODERATE"

        # 6. Generate Daily Projection Array for Charts
        daily_projections = []
        cumulative_actual = 0.0
        for d in range(1, days_in_month + 1):
            if d <= day_of_month:
                cumulative_actual += daily_spend_map.get(d, 0.0)
                daily_projections.append({
                    "day": d,
                    "date": f"{year}-{month:02d}-{d:02d}",
                    "actual_cumulative": round(cumulative_actual, 2),
                    "forecast_cumulative": round(cumulative_actual, 2)
                })
            else:
                projected_cum = cumulative_actual + (daily_average_burn_rate * (d - day_of_month))
                daily_projections.append({
                    "day": d,
                    "date": f"{year}-{month:02d}-{d:02d}",
                    "actual_cumulative": None,
                    "forecast_cumulative": round(projected_cum, 2)
                })

        return ForecastResponse(
            current_month_spent=round(current_month_spent, 2),
            days_elapsed=days_elapsed,
            days_remaining=days_remaining,
            daily_average_burn_rate=daily_average_burn_rate,
            forecasted_month_end_expense=forecasted_month_end_expense,
            predicted_savings=predicted_savings,
            current_budget=current_budget,
            overspend_risk_level=risk_level,
            spending_trend_direction=trend_direction,
            daily_projections=daily_projections
        )
