from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(String(20), nullable=False, default="expense")  # "expense" or "income"
    description = Column(String(255), nullable=False)
    raw_text = Column(Text, nullable=True)  # Raw bank text or imported line
    date = Column(Date, nullable=False)
    payment_method = Column(String(50), default="UPI / Card")
    notes = Column(Text, nullable=True)
    
    # AI / Smart Insighter Attributes
    ai_categorized = Column(Boolean, default=False)
    confidence_score = Column(Float, default=1.0)
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0)
    is_recurring = Column(Boolean, default=False)
    recurring_frequency = Column(String(50), nullable=True)  # "monthly", "weekly", etc.
    price_change_percent = Column(Float, default=0.0)  # tracks subscription hikes
    
    # Foreign Keys
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
