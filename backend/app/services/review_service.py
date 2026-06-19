import logging
import time
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.review import Review
from app.models.log import ReviewLog
from app.services.ai_service import AIService
from app.services.github_service import GitHubService
from app.core.exceptions import NotFoundError, APIException

logger = logging.getLogger("devoracle.reviews")

class ReviewService:
    def __init__(self):
        self.ai_service = AIService()
        self.github_service = GitHubService()

    def create_pending_review(self, db: Session, user_id: UUID, review_type: str, metadata: dict) -> Review:
        """Create a pending review record in the database"""
        review = Review(
            user_id=user_id,
            review_type=review_type,
            status="pending",
            metadata_json=metadata
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        return review

    async def process_review_job(self, db_session_factory, review_id: UUID):
        """
        Background task to process the review job asynchronously.
        Updates status to processing, runs the analysis, logs usage, and saves findings.
        """
        # Open a new database session within the background thread
        db = db_session_factory()
        try:
            # 1. Fetch the review record
            review = db.query(Review).filter(Review.id == review_id).first()
            if not review:
                logger.error(f"Review job {review_id} not found in background processing.")
                return
            
            # 2. Update status to 'processing'
            review.status = "processing"
            db.commit()
            
            result = None
            tokens_used = 0
            execution_time = 0.0
            
            # 3. Execute analysis depending on review_type
            metadata = review.metadata_json or {}
            
            if review.review_type == "bug_analysis":
                filename = metadata.get("filename", "unknown.py")
                code = metadata.get("code", "")
                if not code:
                    raise APIException(status_code=400, detail="Source code is missing from metadata.", error_code="MISSING_INPUT")
                result, tokens_used, execution_time = self.ai_service.analyze_bugs(filename, code)
                
            elif review.review_type == "security_scan":
                filename = metadata.get("filename", "unknown.py")
                code = metadata.get("code", "")
                if not code:
                    raise APIException(status_code=400, detail="Source code is missing from metadata.", error_code="MISSING_INPUT")
                result, tokens_used, execution_time = self.ai_service.scan_security(filename, code)
                
            elif review.review_type == "pr_review":
                pr_url = metadata.get("pr_url", "")
                if not pr_url:
                    raise APIException(status_code=400, detail="PR URL is missing from metadata.", error_code="MISSING_INPUT")
                
                # Fetch PR details from GitHub
                pr_details = await self.github_service.fetch_pr_details(pr_url)
                # Store the actual PR title and changed files list in metadata
                review.metadata_json = {
                    **metadata,
                    "pr_title": pr_details["title"],
                    "changed_files": pr_details["changed_files"]
                }
                db.commit()
                
                result, tokens_used, execution_time = self.ai_service.review_pr(
                    pr_title=pr_details["title"],
                    diff=pr_details["diff"]
                )
                
            elif review.review_type == "senior_review":
                filename = metadata.get("filename", "unknown.py")
                code = metadata.get("code", "")
                if not code:
                    raise APIException(status_code=400, detail="Source code is missing from metadata.", error_code="MISSING_INPUT")
                result, tokens_used, execution_time = self.ai_service.senior_review(filename, code)
                
            elif review.review_type == "repository_review":
                repo_url = metadata.get("repo_url", "")
                if not repo_url:
                    raise APIException(status_code=400, detail="Repository URL is missing from metadata.", error_code="MISSING_INPUT")
                
                # Fetch repo directory tree/readme
                repo_details = await self.github_service.fetch_repository_structure(repo_url)
                # Store owner and repo in metadata
                review.metadata_json = {
                    **metadata,
                    "owner": repo_details["owner"],
                    "repo": repo_details["repo"]
                }
                db.commit()
                
                result, tokens_used, execution_time = self.ai_service.review_repository(
                    repo_data=repo_details["structure"]
                )
            else:
                raise APIException(status_code=400, detail=f"Unsupported review type: {review.review_type}", error_code="UNSUPPORTED_TYPE")
            
            # 4. Save result and update status to 'completed'
            review.result = result
            review.status = "completed"
            db.commit()
            
            # 5. Log execution metrics in review_logs table
            model_used = "gemini-2.5-flash" if not self.ai_service.is_mock else "mock-model"
            log_record = ReviewLog(
                review_id=review.id,
                model_used=model_used,
                tokens_used=tokens_used,
                execution_time=execution_time
            )
            db.add(log_record)
            db.commit()
            
            logger.info(f"Successfully processed review {review.id} in {execution_time:.2f} seconds.")
            
        except Exception as e:
            logger.exception(f"Failed to process review job {review_id} asynchronously.")
            try:
                review = db.query(Review).filter(Review.id == review_id).first()
                if review:
                    review.status = "failed"
                    review.error_message = str(e)
                    db.commit()
            except Exception as db_err:
                logger.error(f"Failed to save failure status for review {review_id}: {str(db_err)}")
        finally:
            db.close()
