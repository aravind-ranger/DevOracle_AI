from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class CommitPayload(BaseModel):
    repository: str = Field(..., description="Repository name, e.g. owner/repo")
    branch: str = Field(..., description="Branch name, e.g. main")
    commit_sha: str = Field(..., description="Commit SHA")
    author: str = Field(..., description="Commit author username or name")
    commit_message: str = Field(..., description="Commit message")
    commit_date: datetime = Field(..., description="Date/Time when commit was made")
    files: List[str] = Field(..., description="List of file paths changed in this commit")
    patch: Optional[str] = Field(None, description="Optional raw git diff patch content")
    additions: int = Field(0, description="Number of line additions")
    deletions: int = Field(0, description="Number of line deletions")
    total_changes: int = Field(0, description="Total number of line changes")

class CommitBatchRequest(BaseModel):
    commits: List[CommitPayload]

class CommitRecordResponse(BaseModel):
    id: UUID
    repository: str
    branch: str
    commit_sha: str
    author: str
    commit_message: str
    commit_date: datetime
    files: List[str]
    patch: Optional[str] = None
    additions: int
    deletions: int
    total_changes: int
    created_at: datetime

    class Config:
        from_attributes = True

class FileModificationCount(BaseModel):
    file_path: str
    change_count: int
    additions: int
    deletions: int

class ActivityArea(BaseModel):
    directory: str
    commits_count: int
    files_count: int

class DailyTimelineItem(BaseModel):
    commit_sha: str
    author: str
    commit_message: str
    commit_date: datetime
    additions: int
    deletions: int
    total_changes: int

class EvolutionReportResponse(BaseModel):
    repository: str
    branch: str
    week: str  # Format: YYYY-Www
    total_commits: int
    files_changed_count: int
    contributors: List[str]
    repeatedly_modified_files: List[FileModificationCount]
    high_activity_areas: List[ActivityArea]
    recent_activity: List[DailyTimelineItem]
    daily_timeline: Dict[str, List[DailyTimelineItem]]  # Grouped by weekday name (Monday, Tuesday, etc.)

class HistoryItem(BaseModel):
    repository: str
    branch: str
    total_commits: int
    last_commit_date: datetime
    week: str

class EvolutionHistoryResponse(BaseModel):
    repositories: List[HistoryItem]
