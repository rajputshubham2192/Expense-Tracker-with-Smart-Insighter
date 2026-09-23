from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.ai import AnomalyItem

class AnomalyDetectionService:
    @staticmethod
    def detect_single_transaction_anomaly(
        amount: float,
        category_id: int,
        user_id: int,
        db: Session
    ) -> Tuple[bool, float, str]:
        """Detects if a newly inserted or scanned transaction is an outlier."""
        if amount <= 0:
            return False, 0.0, "Normal"

        # Fetch historical transactions in the same category for this user
        history = db.query(Transaction.amount).filter(
            Transaction.user_id == user_id,
            Transaction.category_id == category_id,
            Transaction.type == "expense"
        ).all()

        amounts = [h[0] for h in history if h[0] > 0]

        # If sparse category history, evaluate against user's global expense distribution
        if len(amounts) < 5:
            global_history = db.query(Transaction.amount).filter(
                Transaction.user_id == user_id,
                Transaction.type == "expense"
            ).all()
            amounts = [g[0] for g in global_history if g[0] > 0]

        # If still insufficient data (< 3 transactions), use rule threshold
        if len(amounts) < 3:
            if amount > 15000:
                return True, 0.85, "High value transaction relative to initial account history"
            return False, 0.1, "Normal"

        # 1. Statistical Z-Score and Interquartile Range
        mean = np.mean(amounts)
        std = np.std(amounts)
        q75, q25 = np.percentile(amounts, [75, 25])
        iqr = q75 - q25
        upper_bound = q75 + (2.5 * max(iqr, std, 1.0))

        # 2. Isolation Forest Outlier Analysis
        data_matrix = np.array(amounts + [amount]).reshape(-1, 1)
        iso = IsolationForest(contamination=0.08, random_state=42)
        iso.fit(data_matrix)
        preds = iso.predict([[amount]])
        scores = iso.decision_function([[amount]])
        
        # Isolation forest returns -1 for outlier, 1 for inlier
        is_iso_outlier = preds[0] == -1
        anomaly_score = float(max(0.0, min(1.0, (0.5 - scores[0]))))

        if amount > upper_bound or (is_iso_outlier and amount > (mean * 2.5)):
            reason = f"Amount ₹{amount:,.2f} is significantly higher than usual (Category Avg: ₹{mean:,.2f})"
            return True, round(max(anomaly_score, 0.80), 2), reason

        return False, round(anomaly_score, 2), "Normal"

    @staticmethod
    def get_user_anomalies(user_id: int, db: Session, limit: int = 15) -> List[AnomalyItem]:
        """Scans and retrieves list of all flagged anomaly transactions for dashboard display."""
        anomalous_txs = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.is_anomaly == True
        ).order_by(Transaction.date.desc(), Transaction.id.desc()).limit(limit).all()

        results = []
        for t in anomalous_txs:
            cat_name = t.category.name if t.category else "Uncategorized"
            reason = f"Unusual spike of ₹{t.amount:,.2f} in {cat_name}"
            results.append(
                AnomalyItem(
                    transaction_id=t.id,
                    date=t.date.strftime("%Y-%m-%d"),
                    description=t.description,
                    amount=t.amount,
                    category_name=cat_name,
                    anomaly_score=t.anomaly_score,
                    reason=reason
                )
            )
        return results
