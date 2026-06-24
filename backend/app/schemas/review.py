from pydantic import BaseModel, Field
from typing import Optional, Any, List
from uuid import UUID
from datetime import datetime

class ReviewCreate(BaseModel):
    review_type: str  # bug_analysis, security_scan, pr_review, senior_review, repository_review
    metadata: Optional[dict] = None  # Contains code, repo URL, PR URL, etc.

class ReviewHistoryItem(BaseModel):
    id: UUID
    review_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewResponse(BaseModel):
    id: UUID
    user_id: UUID
    review_type: str
    status: str
    metadata_json: Optional[Any] = Field(None, serialization_alias="metadata")
    result: Optional[Any] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

