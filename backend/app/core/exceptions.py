from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger("devoracle.exceptions")

class APIException(Exception):
    """Base API Exception for DevOracle AI"""
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: str = "An unexpected error occurred.",
        error_code: str = "INTERNAL_SERVER_ERROR"
    ):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code

class AuthenticationError(APIException):
    """Error raised during authentication failures"""
    def __init__(self, detail: str = "Authentication failed."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTHENTICATION_FAILED"
        )

class NotFoundError(APIException):
    """Error raised when a resource is not found"""
    def __init__(self, detail: str = "Resource not found."):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="RESOURCE_NOT_FOUND"
        )

class ValidationError(APIException):
    """Error raised during data validation failures"""
    def __init__(self, detail: str = "Validation failed."):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_FAILED"
        )

def get_cors_headers(request: Request) -> dict:
    """Helper to generate CORS headers for exception responses."""
    origin = request.headers.get("origin")
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://devoracle-4c6d4.web.app",
        "https://devoracle-4c6d4.firebaseapp.com",
    ]
    if origin in allowed_origins:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    return {}

async def api_exception_handler(request: Request, exc: APIException) -> JSONResponse:
    """JSON response handler for APIException"""
    return JSONResponse(
        status_code=exc.status_code,
        headers=get_cors_headers(request),
        content={
            "success": False,
            "error": {
                "code": exc.error_code,
                "message": exc.detail
            }
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Formats validation errors into a clean, custom JSON structure"""
    errors = []
    for error in exc.errors():
        # Get field name
        loc = error.get("loc", [])
        field = loc[-1] if loc else "unknown"
        errors.append({
            "field": str(field),
            "message": error.get("msg", "Invalid value"),
            "type": error.get("type", "value_error")
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        headers=get_cors_headers(request),
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed",
                "details": errors
            }
        }
    )

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Fallback handler for unhandled exceptions to avoid exposing raw stacktraces"""
    logger.exception(f"Unhandled Exception on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        headers=get_cors_headers(request),
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": f"An unexpected error occurred on the server: {str(exc)}"
            }
        }
    )

