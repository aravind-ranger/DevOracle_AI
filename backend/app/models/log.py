from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class ReviewLog(Base):
    __tablename__ = "review_logs"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(UUID(as_uuid=True), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    model_used = Column(String, nullable=False)
    tokens_used = Column(Integer, nullable=False)
    execution_time = Column(Float, nullable=False)  # in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    review = relationship("Review", back_populates="logs")
