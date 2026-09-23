from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.category import Category
from app.models.feedback import CategoryFeedback
from app.schemas.ai import (
    AICategorizeRequest, AICategorizeResponse, AICorrectionRequest,
    ForecastResponse, AnomalyItem, RecurringSubscriptionItem, SmartRecommendation
)
from app.services.ml_categorizer import categorizer
from app.services.ml_forecasting import SpendingForecaster
from app.services.ml_anomaly import AnomalyDetectionService
from app.services.ml_clustering import SpendingClusterService
from app.services.recommendation_engine import SmartRecommendationEngine

router = APIRouter(prefix="/ai", tags=["AI & Smart Insighter"])

@router.post("/categorize", response_model=AICategorizeResponse)
def auto_categorize_text(
    req: AICategorizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Predict category using TF-IDF NLP model with confidence score."""
    pred_cat_name, confidence = categorizer.predict(req.description)
    cat = db.query(Category).filter(
        (Category.user_id == current_user.id) | (Category.is_default == True),
        Category.name.ilike(pred_cat_name)
    ).first()

    reasoning = f"Identified via NLP token keywords matching '{pred_cat_name}' with {int(confidence*100)}% statistical confidence."
    return AICategorizeResponse(
        category_id=cat.id if cat else None,
        category_name=cat.name if cat else pred_cat_name,
        confidence_score=confidence,
        reasoning=reasoning
    )

@router.post("/feedback", status_code=status.HTTP_200_OK)
def submit_ai_correction_feedback(
    fb_in: AICorrectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit user correction to trigger online continuous machine learning retrain."""
    categorizer.add_user_feedback(fb_in.raw_text, fb_in.corrected_category)
    feedback_record = CategoryFeedback(
        raw_text=fb_in.raw_text,
        predicted_category=fb_in.predicted_category,
        corrected_category=fb_in.corrected_category,
        user_id=current_user.id
    )
    db.add(feedback_record)
    db.commit()
    return {"status": "success", "message": "Feedback recorded and ML model updated in real-time."}

@router.get("/forecast", response_model=ForecastResponse)
def get_month_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate time-series spend forecast, burn rate, and overspend probability."""
    return SpendingForecaster.calculate_month_forecast(user_id=current_user.id, db=db)

@router.get("/anomalies", response_model=List[AnomalyItem])
def get_flagged_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve transactions flagged as statistical/Isolation Forest anomalies."""
    return AnomalyDetectionService.get_user_anomalies(user_id=current_user.id, db=db)

@router.get("/recurring-subscriptions", response_model=List[RecurringSubscriptionItem])
def get_recurring_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Detect recurring subscriptions and track unexpected price hikes."""
    return SmartRecommendationEngine.detect_recurring_and_price_hikes(user_id=current_user.id, db=db)

@router.get("/spending-persona", response_model=Dict[str, Any])
def get_spending_persona_clustering(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Categorize user into financial personas using K-Means behavior clustering."""
    return SpendingClusterService.analyze_user_spending_persona(user_id=current_user.id, db=db)

@router.get("/recommendations", response_model=List[SmartRecommendation])
def get_smart_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate actionable AI savings recommendations."""
    return SmartRecommendationEngine.generate_smart_recommendations(user_id=current_user.id, db=db)
