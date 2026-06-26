import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class CommitRecord(Base):
    __tablename__ = "commit_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    repository = Column(String, nullable=False, index=True)
    branch = Column(String, nullable=False, default="main")
    commit_sha = Column(String, nullable=False, index=True)
    author = Column(String, nullable=False, index=True)
    commit_message = Column(Text, nullable=False)
    commit_date = Column(DateTime(timezone=True), nullable=False, index=True)
    files = Column(JSONB, nullable=False)  # List of changed files
    patch = Column(Text, nullable=True)     # Patch details
    additions = Column(Integer, nullable=False, default=0)
    deletions = Column(Integer, nullable=False, default=0)
    total_changes = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="commit_records")
