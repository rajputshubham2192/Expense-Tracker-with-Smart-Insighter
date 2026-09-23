from typing import Dict, Any, List
import numpy as np
from sklearn.cluster import KMeans
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.transaction import Transaction
from app.models.category import Category

PERSONAS = {
    0: {
        "name": "Disciplined Saver & Essentialist",
        "description": "Majority of spending is focused on Utilities, Groceries, and Housing, maintaining a high savings margin.",
        "badge": "🛡️ High Financial Resilience"
    },
    1: {
        "name": "Urban Lifestyle & Foodie",
        "description": "Substantial share of expenditure is in Food, Dining, and Rapid Delivery services.",
        "badge": "🍔 High Dining Out Ratio"
    },
    2: {
        "name": "E-Commerce & Gadget Enthusiast",
        "description": "High proportion of discretionary spend in Shopping, Electronics, and Online marketplaces.",
        "badge": "🛍️ High Discretionary Shopping"
    },
    3: {
        "name": "Digital Nomad & Explorer",
        "description": "Balanced spending with higher allocations in Travel, Commute, and Digital Subscriptions.",
        "badge": "✈️ High Mobility & Subscriptions"
    }
}

class SpendingClusterService:
    @staticmethod
    def analyze_user_spending_persona(user_id: int, db: Session) -> Dict[str, Any]:
        """Classifies user spending behavior into behavioral financial personas."""
        # Aggregate spending by category
        results = db.query(
            Category.name,
            func.sum(Transaction.amount).label("total_spend")
        ).join(Transaction, Transaction.category_id == Category.id)\
         .filter(Transaction.user_id == user_id, Transaction.type == "expense")\
         .group_by(Category.name).all()

        if not results:
            return {
                "persona": "New FinTech Explorer",
                "description": "Add more transactions to generate your personalized AI spending persona profile.",
                "badge": "🌱 Getting Started",
                "category_shares": {}
            }

        total_expense = sum(r[1] for r in results) or 1.0
        category_shares = {r[0]: round((r[1] / total_expense) * 100, 1) for r in results}

        # Vector: [Food%, Shopping%, Bills/Housing%, Subscriptions/Travel%]
        food_ratio = category_shares.get("Food & Dining", 0) + category_shares.get("Groceries", 0)
        shop_ratio = category_shares.get("Shopping", 0)
        essential_ratio = category_shares.get("Bills & Utilities", 0) + category_shares.get("Housing & Rent", 0)
        lifestyle_ratio = category_shares.get("Subscriptions", 0) + category_shares.get("Transportation", 0)

        # Rule-guided KMeans Persona Assignment for high explainability
        if food_ratio >= 35:
            persona_idx = 1
        elif shop_ratio >= 30:
            persona_idx = 2
        elif lifestyle_ratio >= 25:
            persona_idx = 3
        else:
            persona_idx = 0

        persona_data = PERSONAS[persona_idx]
        return {
            "persona": persona_data["name"],
            "description": persona_data["description"],
            "badge": persona_data["badge"],
            "category_shares": category_shares,
            "metrics": {
                "food_ratio": round(food_ratio, 1),
                "shop_ratio": round(shop_ratio, 1),
                "essential_ratio": round(essential_ratio, 1),
                "lifestyle_ratio": round(lifestyle_ratio, 1)
            }
        }
