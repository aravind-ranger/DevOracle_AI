from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
import time

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("", status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(get_db)):
    """System health check endpoint ensuring connectivity to the database."""
    start_time = time.time()
    try:
        # Perform a basic SQL query to verify database response
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
        
    latency = time.time() - start_time
    
    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "latency_sec": round(latency, 4)
    }
