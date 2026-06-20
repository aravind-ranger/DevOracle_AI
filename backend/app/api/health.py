from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db, engine
from app.models import Base
import time

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("", status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(get_db)):
    """System health check endpoint ensuring connectivity to the database and schema creation."""
    start_time = time.time()
    
    # 1. Attempt to create tables dynamically
    create_error = None
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        create_error = str(e)
        
    # 2. Check connectivity and list all tables in the public schema
    tables = []
    db_status = "connected"
    try:
        result = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result.fetchall()]
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
        
    latency = time.time() - start_time
    
    return {
        "status": "healthy" if db_status == "connected" and not create_error else "unhealthy",
        "database": db_status,
        "create_error": create_error,
        "tables": tables,
        "latency_sec": round(latency, 4)
    }

