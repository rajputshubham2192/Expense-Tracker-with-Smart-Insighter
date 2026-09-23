from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.feedback import CategoryFeedback
from app.schemas.transaction import (
    TransactionCreate, TransactionUpdate, TransactionResponse, TransactionImportResult
)
from app.services.ml_categorizer import categorizer
from app.services.ml_anomaly import AnomalyDetectionService
from app.services.csv_parser import CSVStatementParser

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/", response_model=List[TransactionResponse])
def list_transactions(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    is_anomaly: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List transactions with rich multi-parameter filtering, sorting, and pagination."""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if type:
        query = query.filter(Transaction.type == type)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if is_anomaly is not None:
        query = query.filter(Transaction.is_anomaly == is_anomaly)

    return query.order_by(Transaction.date.desc(), Transaction.id.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create transaction with automated NLP category inference and Isolation Forest anomaly detection."""
    assigned_category_id = tx_in.category_id
    ai_categorized = False
    confidence = 1.0

    # If no category was explicitly picked, let the AI categorize it
    if not assigned_category_id:
        pred_cat_name, conf = categorizer.predict(tx_in.description)
        cat = db.query(Category).filter(
            (Category.user_id == current_user.id) | (Category.is_default == True),
            Category.name.ilike(pred_cat_name)
        ).first()
        if cat:
            assigned_category_id = cat.id
            ai_categorized = True
            confidence = conf

    # Detect Anomaly
    is_anomaly = False
    anomaly_score = 0.0
    if tx_in.type == "expense" and assigned_category_id:
        is_anomaly, anomaly_score, _ = AnomalyDetectionService.detect_single_transaction_anomaly(
            amount=tx_in.amount,
            category_id=assigned_category_id,
            user_id=current_user.id,
            db=db
        )

    tx = Transaction(
        amount=tx_in.amount,
        type=tx_in.type,
        description=tx_in.description,
        raw_text=tx_in.description,
        date=tx_in.date,
        payment_method=tx_in.payment_method or "UPI / Card",
        notes=tx_in.notes,
        category_id=assigned_category_id,
        user_id=current_user.id,
        is_recurring=tx_in.is_recurring or False,
        recurring_frequency=tx_in.recurring_frequency,
        ai_categorized=ai_categorized,
        confidence_score=confidence,
        is_anomaly=is_anomaly,
        anomaly_score=anomaly_score
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

@router.get("/{tx_id}", response_model=TransactionResponse)
def get_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve single transaction by ID."""
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

@router.put("/{tx_id}", response_model=TransactionResponse)
def update_transaction(
    tx_id: int,
    tx_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update transaction and feed corrections back to ML model for continuous learning."""
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    old_category_id = tx.category_id
    update_data = tx_in.model_dump(exclude_unset=True)

    for field, val in update_data.items():
        setattr(tx, field, val)

    # If user changed the category of an AI-categorized transaction, trigger adaptive learning!
    if tx_in.category_id and tx_in.category_id != old_category_id:
        new_cat = db.query(Category).filter(Category.id == tx_in.category_id).first()
        if new_cat:
            # Re-train NLP model with feedback
            categorizer.add_user_feedback(tx.description, new_cat.name)
            
            # Record feedback entity
            fb = CategoryFeedback(
                raw_text=tx.description,
                predicted_category=tx.category.name if tx.category else None,
                corrected_category=new_cat.name,
                user_id=current_user.id
            )
            db.add(fb)

    # Recalculate anomaly score
    if tx.type == "expense" and tx.category_id:
        is_anomaly, anomaly_score, _ = AnomalyDetectionService.detect_single_transaction_anomaly(
            amount=tx.amount,
            category_id=tx.category_id,
            user_id=current_user.id,
            db=db
        )
        tx.is_anomaly = is_anomaly
        tx.anomaly_score = anomaly_score

    db.commit()
    db.refresh(tx)
    return tx

@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a transaction."""
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(tx)
    db.commit()
    return None

@router.post("/upload-csv", response_model=TransactionImportResult)
async def upload_csv_statement(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload bank statement or CSV file to batch parse, AI categorize, and anomaly-scan transactions."""
    if not file.filename.lower().endswith(('.csv', '.txt')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files (.csv) are currently supported."
        )

    content = await file.read()
    result = CSVStatementParser.parse_and_import(
        file_contents=content,
        user_id=current_user.id,
        db=db
    )
    return result
