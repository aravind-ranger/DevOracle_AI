from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict

from app.models.repository_evolution import CommitRecord
from app.schemas.rer_schema import (
    CommitPayload,
    FileModificationCount,
    ActivityArea,
    DailyTimelineItem
)

class RERService:
    @staticmethod
    def store_commits(db: Session, user_id: Any, commits: List[CommitPayload]) -> List[CommitRecord]:
        """Store commits sent from n8n automation, avoiding duplicates."""
        records = []
        for c in commits:
            # Prevent duplicate commits by SHA
            existing = db.query(CommitRecord).filter(
                and_(
                    CommitRecord.repository == c.repository,
                    CommitRecord.commit_sha == c.commit_sha
                )
            ).first()
            
            if existing:
                print(f"commit already exists in DB: {c.commit_sha}")
                continue

            record = CommitRecord(
                user_id=user_id,
                repository=c.repository,
                branch=c.branch,
                commit_sha=c.commit_sha,
                author=c.author,
                commit_message=c.commit_message,
                commit_date=c.commit_date,
                files=c.files,
                patch=c.patch,
                additions=c.additions,
                deletions=c.deletions,
                total_changes=c.total_changes
            )
            db.add(record)
            records.append(record)
        if records:
            db.commit()
            print(f"Stored {len(records)} commits successfully")
            for r in records:
                db.refresh(r)
        return records

    @staticmethod
    def get_evolution_report(db: Session, repository: str, branch: str, week: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Calculate the Repository Evolution Report stats for a specific week."""
        # Find latest commit week if not specified
        if not week:
            latest_commit = db.query(CommitRecord).filter(
                and_(
                    CommitRecord.repository == repository,
                    CommitRecord.branch == branch
                )
            ).order_by(desc(CommitRecord.commit_date)).first()
            
            if not latest_commit:
                return None
            
            year, week_num, _ = latest_commit.commit_date.isocalendar()
            week = f"{year}-W{week_num:02d}"
        
        try:
            year, week_num = map(int, week.split("-W"))
            # ISO week starts on Monday
            start_date = datetime.strptime(f"{year}-W{week_num}-1", "%G-W%V-%u").replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=7)
        except Exception:
            return None

        commits = db.query(CommitRecord).filter(
            and_(
                CommitRecord.repository == repository,
                CommitRecord.branch == branch,
                CommitRecord.commit_date >= start_date,
                CommitRecord.commit_date < end_date
            )
        ).order_by(desc(CommitRecord.commit_date)).all()

        if not commits:
            return {
                "repository": repository,
                "branch": branch,
                "week": week,
                "total_commits": 0,
                "files_changed_count": 0,
                "contributors": [],
                "repeatedly_modified_files": [],
                "high_activity_areas": [],
                "recent_activity": [],
                "daily_timeline": {}
            }

        total_commits = len(commits)
        contributors = list(set(c.author for c in commits))
        
        file_stats = defaultdict(lambda: {"count": 0, "additions": 0, "deletions": 0})
        dir_stats = defaultdict(lambda: {"commits": set(), "files": set()})
        unique_files = set()

        for c in commits:
            for filepath in c.files:
                unique_files.add(filepath)
                file_stats[filepath]["count"] += 1
                
                # Apportion changes per file approximately
                denom = max(len(c.files), 1)
                file_stats[filepath]["additions"] += c.additions // denom
                file_stats[filepath]["deletions"] += c.deletions // denom
                
                parts = filepath.split('/')
                dir_path = "/".join(parts[:-1]) + "/" if len(parts) > 1 else "root/"
                
                dir_stats[dir_path]["commits"].add(c.commit_sha)
                dir_stats[dir_path]["files"].add(filepath)

        files_changed_count = len(unique_files)

        repeated_files = []
        for filepath, stats in file_stats.items():
            if stats["count"] > 1:
                repeated_files.append(
                    FileModificationCount(
                        file_path=filepath,
                        change_count=stats["count"],
                        additions=stats["additions"],
                        deletions=stats["deletions"]
                    )
                )
        repeated_files.sort(key=lambda x: x.change_count, reverse=True)

        activity_areas = []
        for dir_path, stats in dir_stats.items():
            activity_areas.append(
                ActivityArea(
                    directory=dir_path,
                    commits_count=len(stats["commits"]),
                    files_count=len(stats["files"])
                )
            )
        activity_areas.sort(key=lambda x: x.commits_count, reverse=True)

        days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        daily_timeline = {day: [] for day in days_order}
        recent_activity = []

        for c in commits:
            item = DailyTimelineItem(
                commit_sha=c.commit_sha,
                author=c.author,
                commit_message=c.commit_message,
                commit_date=c.commit_date,
                additions=c.additions,
                deletions=c.deletions,
                total_changes=c.total_changes
            )
            recent_activity.append(item)
            weekday_name = c.commit_date.strftime("%A")
            daily_timeline[weekday_name].append(item)

        daily_timeline = {k: v for k, v in daily_timeline.items() if len(v) > 0}

        return {
            "repository": repository,
            "branch": branch,
            "week": week,
            "total_commits": total_commits,
            "files_changed_count": files_changed_count,
            "contributors": contributors,
            "repeatedly_modified_files": repeated_files[:10],
            "high_activity_areas": activity_areas[:5],
            "recent_activity": recent_activity[:10],
            "daily_timeline": daily_timeline
        }

    @staticmethod
    def get_history(db: Session, user_id: Any) -> List[Dict[str, Any]]:
        """Fetch evolution history grouped by repository and branch."""
        query = db.query(
            CommitRecord.repository,
            CommitRecord.branch,
            func.count(CommitRecord.id).label("total_commits"),
            func.max(CommitRecord.commit_date).label("last_commit_date")
        ).filter(
            CommitRecord.user_id == user_id
        ).group_by(
            CommitRecord.repository,
            CommitRecord.branch
        ).order_by(
            desc(func.max(CommitRecord.commit_date))
        ).all()

        results = []
        for row in query:
            year, week_num, _ = row.last_commit_date.isocalendar()
            week = f"{year}-W{week_num:02d}"
            results.append({
                "repository": row.repository,
                "branch": row.branch,
                "total_commits": row.total_commits,
                "last_commit_date": row.last_commit_date,
                "week": week
            })
        return results
