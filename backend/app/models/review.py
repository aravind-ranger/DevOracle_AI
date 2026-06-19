import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    review_type = Column(String, nullable=False)  # bug_analysis, security_scan, pr_review, senior_review, repository_review
    status = Column(String, default="pending", nullable=False)  # pending, processing, completed, failed, cancelled
    metadata_json = Column("metadata", JSONB, nullable=True)  # maps to DB column 'metadata'
    result = Column(JSONB, nullable=True)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reviews")
    logs = relationship("ReviewLog", back_populates="review", cascade="all, delete-orphan")


