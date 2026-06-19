from fastapi import APIRouter, Depends, BackgroundTasks, status, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db, SessionLocal
from app.api.auth import get_current_user
from app.models.user import User
from app.models.review import Review
from app.schemas.review import ReviewResponse
from app.services.review_service import ReviewService
from pydantic import BaseModel

router = APIRouter(tags=["Reviews Analysis"])
review_service = ReviewService()

# Request schemas for endpoints
class CodeAnalysisRequest(BaseModel):
    filename: str
    code: str

class PRReviewRequest(BaseModel):
    pr_url: str

class RepoReviewRequest(BaseModel):
    repo_url: str

@router.post("/analyze", response_model=ReviewResponse, status_code=status.HTTP_202_ACCEPTED)
def analyze_code(
    payload: CodeAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a code snippet for bug and best practice analysis."""
    metadata = {"filename": payload.filename, "code": payload.code}
    review = review_service.create_pending_review(db, current_user.id, "bug_analysis", metadata)
    background_tasks.add_task(review_service.process_review_job, SessionLocal, review.id)
    return review

@router.post("/security-scan", response_model=ReviewResponse, status_code=status.HTTP_202_ACCEPTED)
def security_scan(
    payload: CodeAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a code snippet for vulnerability scanner and CVSS score assessment."""
    metadata = {"filename": payload.filename, "code": payload.code}
    review = review_service.create_pending_review(db, current_user.id, "security_scan", metadata)
    background_tasks.add_task(review_service.process_review_job, SessionLocal, review.id)
    return review

@router.post("/pr-review", response_model=ReviewResponse, status_code=status.HTTP_202_ACCEPTED)
def pr_review(
    payload: PRReviewRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a GitHub Pull Request URL for full diff patch code review."""
    metadata = {"pr_url": payload.pr_url}
    review = review_service.create_pending_review(db, current_user.id, "pr_review", metadata)
    background_tasks.add_task(review_service.process_review_job, SessionLocal, review.id)
    return review

@router.post("/senior-review", response_model=ReviewResponse, status_code=status.HTTP_202_ACCEPTED)
def senior_review(
    payload: CodeAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a code snippet for principal architect structure and scalability review."""
    metadata = {"filename": payload.filename, "code": payload.code}
    review = review_service.create_pending_review(db, current_user.id, "senior_review", metadata)
    background_tasks.add_task(review_service.process_review_job, SessionLocal, review.id)
    return review

@router.post("/repository-review", response_model=ReviewResponse, status_code=status.HTTP_202_ACCEPTED)
def repository_review(
    payload: RepoReviewRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a GitHub Repository URL for repository layout and architecture scan."""
    metadata = {"repo_url": payload.repo_url}
    review = review_service.create_pending_review(db, current_user.id, "repository_review", metadata)
    background_tasks.add_task(review_service.process_review_job, SessionLocal, review.id)
    return review

@router.get("/history", response_model=List[ReviewResponse])
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all past review submissions for the currently authenticated user."""
    reviews = db.query(Review).filter(
        Review.user_id == current_user.id
    ).order_by(Review.created_at.desc()).all()
    return reviews

@router.get("/history/{id}", response_model=ReviewResponse)
def get_review_details(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch details and results of a specific review job by its ID."""
    review = db.query(Review).filter(
        Review.id == id,
        Review.user_id == current_user.id
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review job not found.")
    return review

@router.delete("/history/{id}", status_code=status.HTTP_200_OK)
def delete_review(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a review job and its corresponding logs from history."""
    review = db.query(Review).filter(
        Review.id == id,
        Review.user_id == current_user.id
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review job not found.")
    
    db.delete(review)
    db.commit()
    return {"success": True, "message": "Review record successfully deleted."}
