import csv
import io
from datetime import datetime, date
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.transaction import Transaction
from app.services.ml_categorizer import categorizer
from app.services.ml_anomaly import AnomalyDetectionService
from app.schemas.transaction import TransactionImportResult

class CSVStatementParser:
    @staticmethod
    def _parse_date(date_str: str) -> date:
        """Parses various date format conventions found in bank statements."""
        date_str = str(date_str).strip()
        formats = [
            "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y",
            "%d-%b-%Y", "%d %b %Y", "%d-%B-%Y", "%d %B %Y",
            "%Y/%m/%d"
        ]
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        return date.today()

    @staticmethod
    def _clean_amount(val: Any) -> float:
        """Clean amount strings with commas, currency symbols, etc."""
        if not val:
            return 0.0
        val_str = str(val).replace(",", "").replace("₹", "").replace("$", "").replace("INR", "").strip()
        try:
            return abs(float(val_str))
        except ValueError:
            return 0.0

    @staticmethod
    def parse_and_import(
        file_contents: bytes,
        user_id: int,
        db: Session
    ) -> TransactionImportResult:
        """Parses bank statement CSV, automatically executes AI categorization and anomaly detection."""
        text_stream = io.StringIO(file_contents.decode("utf-8-sig", errors="ignore"))
        reader = csv.reader(text_stream)
        
        rows = list(reader)
        if not rows:
            return TransactionImportResult(
                total_processed=0,
                successful_imports=0,
                failed_imports=0,
                anomalies_detected=0,
                categories_assigned_by_ai=0
            )

        # Detect Header Row
        header_idx = 0
        header = []
        for idx, row in enumerate(rows[:10]):
            row_lower = [col.strip().lower() for col in row]
            if any(k in row_lower for k in ["date", "txn date", "transaction date"]) and \
               any(k in row_lower for k in ["narration", "description", "particulars", "remarks", "details"]):
                header_idx = idx
                header = row_lower
                break

        if not header:
            # Default to first row
            header = [col.strip().lower() for col in rows[0]]
            header_idx = 0

        # Map column indices
        date_col = next((i for i, c in enumerate(header) if "date" in c), 0)
        desc_col = next((i for i, c in enumerate(header) if any(k in c for k in ["narration", "description", "particulars", "remarks", "details", "payee"])), 1)
        
        debit_col = next((i for i, c in enumerate(header) if any(k in c for k in ["debit", "withdrawal", "dr"])), None)
        credit_col = next((i for i, c in enumerate(header) if any(k in c for k in ["credit", "deposit", "cr"])), None)
        amount_col = next((i for i, c in enumerate(header) if "amount" in c and i not in [debit_col, credit_col]), None)
        type_col = next((i for i, c in enumerate(header) if any(k in c for k in ["type", "dr/cr", "cr/dr"])), None)

        # Cache category map
        categories = db.query(Category).filter(
            (Category.user_id == user_id) | (Category.is_default == True)
        ).all()
        cat_map = {c.name.lower(): c.id for c in categories}

        total_processed = 0
        successful = 0
        failed = 0
        anomalies_count = 0
        ai_categorized_count = 0

        for row in rows[header_idx + 1:]:
            if not row or all(not cell.strip() for cell in row):
                continue
            total_processed += 1

            try:
                raw_date = row[date_col] if date_col < len(row) else ""
                tx_date = CSVStatementParser._parse_date(raw_date)

                raw_desc = row[desc_col] if desc_col < len(row) else "Bank Transaction"
                if not raw_desc.strip():
                    raw_desc = "Bank Transaction"

                # Determine Type and Amount
                tx_type = "expense"
                amount = 0.0

                if debit_col is not None and credit_col is not None:
                    debit_val = CSVStatementParser._clean_amount(row[debit_col]) if debit_col < len(row) else 0.0
                    credit_val = CSVStatementParser._clean_amount(row[credit_col]) if credit_col < len(row) else 0.0
                    if credit_val > 0:
                        tx_type = "income"
                        amount = credit_val
                    else:
                        tx_type = "expense"
                        amount = debit_val
                elif amount_col is not None:
                    amount = CSVStatementParser._clean_amount(row[amount_col]) if amount_col < len(row) else 0.0
                    if type_col is not None and type_col < len(row):
                        t_val = row[type_col].lower()
                        if "cr" in t_val or "income" in t_val or "deposit" in t_val:
                            tx_type = "income"
                else:
                    # fallback
                    amount = CSVStatementParser._clean_amount(row[-1])

                if amount <= 0:
                    continue

                # 1. AI Categorization
                pred_cat_name, confidence = categorizer.predict(raw_desc)
                if tx_type == "income" and pred_cat_name != "Salary / Income":
                    pred_cat_name = "Salary / Income"

                cat_id = cat_map.get(pred_cat_name.lower())
                ai_categorized_count += 1

                # 2. Anomaly Detection
                is_anomaly = False
                anomaly_score = 0.0
                if tx_type == "expense" and cat_id:
                    is_anomaly, anomaly_score, _ = AnomalyDetectionService.detect_single_transaction_anomaly(
                        amount, cat_id, user_id, db
                    )
                    if is_anomaly:
                        anomalies_count += 1

                # Insert Transaction
                new_tx = Transaction(
                    amount=round(amount, 2),
                    type=tx_type,
                    description=raw_desc.strip()[:250],
                    raw_text=raw_desc.strip(),
                    date=tx_date,
                    payment_method="Bank Statement / CSV",
                    category_id=cat_id,
                    user_id=user_id,
                    ai_categorized=True,
                    confidence_score=confidence,
                    is_anomaly=is_anomaly,
                    anomaly_score=anomaly_score
                )
                db.add(new_tx)
                successful += 1
            except Exception:
                failed += 1

        db.commit()

        return TransactionImportResult(
            total_processed=total_processed,
            successful_imports=successful,
            failed_imports=failed,
            anomalies_detected=anomalies_count,
            categories_assigned_by_ai=ai_categorized_count
        )
