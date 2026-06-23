import os
import sys
import time
from collections import defaultdict

# 1. Inject local libraries directory into python search path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)
sys.path.insert(0, os.path.join(backend_dir, "libs"))

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.exceptions import (
    APIException,
    api_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    global_exception_handler
)
from app.api import auth, reviews, health

# Configure Logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("devoracle.main")

# Create database tables automatically on startup
from app.core.database import engine
from app.models import Base
try:
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize database tables: {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="DevOracle AI: Production-Ready Code & Repository Review SaaS Backend",
    version="1.0.0",
    debug=settings.DEBUG
)

# 2. CORS Middleware
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://devoracle-4c6d4.web.app",
    "https://devoracle-4c6d4.firebaseapp.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Simple In-Memory Rate Limiting Middleware
RATE_LIMIT_REQUESTS = 60  # max requests
RATE_LIMIT_WINDOW = 60    # window size in seconds
client_requests = defaultdict(list)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Exclude API documentation and health check from rate limiting
    if request.url.path in ["/docs", "/redoc", "/openapi.json", "/health"]:
        return await call_next(request)
        
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # Filter times to keep only those within current window
    client_requests[client_ip] = [
        t for t in client_requests[client_ip]
        if current_time - t < RATE_LIMIT_WINDOW
    ]
    
    if len(client_requests[client_ip]) >= RATE_LIMIT_REQUESTS:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "success": False,
                "error": {
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Rate limit of {RATE_LIMIT_REQUESTS} requests per minute exceeded. Please slow down."
                }
            }
        )
    
    client_requests[client_ip].append(current_time)
    return await call_next(request)

# 4. Global Exception Handlers Registration
app.add_exception_handler(APIException, api_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# 5. Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(health.router, prefix="/api")

@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirect home requests to interactive api documentation."""
    return RedirectResponse(url="/docs")
