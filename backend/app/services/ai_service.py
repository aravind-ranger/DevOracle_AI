import json
import time
import logging
from typing import Any, Dict, Type, Tuple
from pydantic import BaseModel
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.core.config import settings
from app.core.exceptions import APIException
from app.prompts.prompt_templates import (
    BUG_ANALYZER_SYSTEM_INSTRUCTION, BUG_ANALYZER_PROMPT,
    SECURITY_SCANNER_SYSTEM_INSTRUCTION, SECURITY_SCANNER_PROMPT,
    PR_REVIEWER_SYSTEM_INSTRUCTION, PR_REVIEWER_PROMPT,
    SENIOR_ENGINEER_SYSTEM_INSTRUCTION, SENIOR_ENGINEER_PROMPT,
    REPOSITORY_REVIEW_SYSTEM_INSTRUCTION, REPOSITORY_REVIEW_PROMPT
)
from app.schemas.ai_schemas import (
    BugAnalyzerResponse, SecurityScannerResponse,
    PRReviewerResponse, SeniorEngineerReviewResponse
)

logger = logging.getLogger("devoracle.ai")

class AIService:
    def __init__(self):
        self.client = None
        self.is_mock = False
        
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("dummy") or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
            logger.warning("GEMINI_API_KEY is not configured or dummy key is used. AI Service will operate in MOCK MODE.")
            self.is_mock = True
        else:
            try:
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize Gemini GenAI client: {str(e)}. Fallback to Mock mode.")
                self.is_mock = True

    def _call_gemini(
        self,
        prompt: str,
        system_instruction: str,
        response_schema: Type[BaseModel],
        model_name: str = "gemini-2.5-flash"
    ) -> Tuple[Dict[str, Any], int, float]:
        """
        Executes a call to Google Gemini API with strict Pydantic response schema.
        Returns (result_dict, tokens_used, execution_time).
        """
        start_time = time.time()
        
        if self.is_mock:
            mock_data = self._generate_mock_data(response_schema)
            execution_time = time.time() - start_time
            # Return mock data, mock token count, and execution time
            return mock_data, 150, execution_time

        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=response_schema,
                temperature=0.1,
            )
            
            response = self.client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )
            
            execution_time = time.time() - start_time
            
            try:
                result_dict = json.loads(response.text)
            except Exception as json_err:
                logger.error(f"Failed to parse Gemini response: {response.text}")
                raise APIException(
                    status_code=502,
                    detail="Invalid JSON response received from AI model.",
                    error_code="AI_PARSE_ERROR"
                )

            # Get token usage if available in response
            tokens_used = 0
            if response.usage_metadata:
                tokens_used = response.usage_metadata.total_token_count
            else:
                tokens_used = (len(prompt) + len(response.text)) // 4

            return result_dict, tokens_used, execution_time

        except APIError as e:
            logger.error(f"Gemini API Error: {str(e)}")
            raise APIException(
                status_code=502,
                detail=f"Google Gemini API error: {e.message}",
                error_code="AI_API_ERROR"
            )
        except Exception as e:
            logger.error(f"Unexpected AI error: {str(e)}")
            raise APIException(
                status_code=500,
                detail=f"Failed to process AI review: {str(e)}",
                error_code="AI_PROCESSING_ERROR"
            )

    def _generate_mock_data(self, response_schema: Type[BaseModel]) -> Dict[str, Any]:
        """Generates realistic mock analysis data when API key is missing or invalid."""
        if response_schema == BugAnalyzerResponse:
            return {
                "bugs_found": [
                    {
                        "file": "auth.py",
                        "line": 42,
                        "description": "Missing verification of JWT expiration claim when decoding tokens locally.",
                        "severity": "high",
                        "suggested_fix": "payload = jwt.decode(token, settings.JWT_SECRET, options={'verify_exp': True})"
                    },
                    {
                        "file": "database.py",
                        "line": 15,
                        "description": "SQL injection vulnerability: executing raw string formatting in engine query execution.",
                        "severity": "high",
                        "suggested_fix": "db.execute(text('SELECT * FROM users WHERE id = :id'), {'id': user_id})"
                    }
                ],
                "best_practices": [
                    "Use Pydantic models for request validations across all routers.",
                    "Ensure you configure SQLAlchemy pool recycle to prevent connection drop-offs."
                ]
            }
        elif response_schema == SecurityScannerResponse:
            return {
                "vulnerabilities": [
                    {
                        "file": "app/core/security.py",
                        "line": 12,
                        "cwe_id": "CWE-327",
                        "description": "Use of Broken or Risky Cryptographic Algorithm (MD5) for hashing user passwords.",
                        "severity": "critical",
                        "remediation": "Replace MD5 usage with bcrypt."
                    }
                ],
                "severity_score": 8.5
            }
        elif response_schema == PRReviewerResponse:
            return {
                "summary": "This PR implements authentication endpoints: register, login, and token validation.",
                "risk_level": "medium",
                "performance_issues": [
                    "Directly hashing passwords synchronously blocks the event loop under heavy load. Offload hashing to an executor."
                ],
                "security_concerns": [
                    "CORS origins are set to wildcards '*' which exposes the application to security vulnerabilities."
                ],
                "missing_tests": [
                    "No unit tests added for the new token refresh endpoints."
                ],
                "recommendations": [
                    "Verify token expiration limits are properly set in settings.",
                    "Configure strict CORS policies to allowed domains."
                ]
            }
        elif response_schema == SeniorEngineerReviewResponse:
            return {
                "architecture_review": "The application follows the service layer design pattern, which decouples business workflows from HTTP routes.",
                "scalability_suggestions": [
                    "Consider caching active session checks in Redis to lower PostgreSQL traffic.",
                    "Use AsyncSession for SQLAlchemy database connections."
                ],
                "maintainability_suggestions": [
                    "Document all public service methods with docstrings and type signatures.",
                    "Subdivide settings properties into nested configuration groups."
                ],
                "refactoring_opportunities": [
                    {
                        "target_file": "app/main.py",
                        "code_snippet": "app.add_middleware(CORSMiddleware, allow_origins=['*'])",
                        "explanation": "Decouple middleware initialization logic from main app declaration."
                    }
                ]
            }
        return {"data": "Mock data generated successfully."}

    def analyze_bugs(self, filename: str, code: str) -> Tuple[Dict[str, Any], int, float]:
        prompt = BUG_ANALYZER_PROMPT.format(filename=filename, code=code)
        return self._call_gemini(prompt, BUG_ANALYZER_SYSTEM_INSTRUCTION, BugAnalyzerResponse)

    def scan_security(self, filename: str, code: str) -> Tuple[Dict[str, Any], int, float]:
        prompt = SECURITY_SCANNER_PROMPT.format(filename=filename, code=code)
        return self._call_gemini(prompt, SECURITY_SCANNER_SYSTEM_INSTRUCTION, SecurityScannerResponse)

    def review_pr(self, pr_title: str, diff: str) -> Tuple[Dict[str, Any], int, float]:
        prompt = PR_REVIEWER_PROMPT.format(pr_title=pr_title, diff=diff)
        return self._call_gemini(prompt, PR_REVIEWER_SYSTEM_INSTRUCTION, PRReviewerResponse)

    def senior_review(self, filename: str, code: str) -> Tuple[Dict[str, Any], int, float]:
        prompt = SENIOR_ENGINEER_PROMPT.format(filename=filename, code=code)
        return self._call_gemini(prompt, SENIOR_ENGINEER_SYSTEM_INSTRUCTION, SeniorEngineerReviewResponse)

    def review_repository(self, repo_data: str) -> Tuple[Dict[str, Any], int, float]:
        prompt = REPOSITORY_REVIEW_PROMPT.format(repo_data=repo_data)
        return self._call_gemini(prompt, REPOSITORY_REVIEW_SYSTEM_INSTRUCTION, SeniorEngineerReviewResponse)
