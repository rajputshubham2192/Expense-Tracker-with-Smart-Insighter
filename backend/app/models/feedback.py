from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class CategoryFeedback(Base):
    __tablename__ = "category_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    raw_text = Column(String(255), nullable=False)
    predicted_category = Column(String(100), nullable=True)
    corrected_category = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="feedbacks")
