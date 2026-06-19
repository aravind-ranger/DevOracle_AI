from pydantic import BaseModel, Field
from typing import List, Optional

# 1. Bug Analyzer Schemas
class Bug(BaseModel):
    file: str = Field(..., description="The path of the file containing the bug")
    line: int = Field(..., description="Line number of the bug")
    description: str = Field(..., description="Details of the bug found")
    severity: str = Field(..., description="Severity level: high, medium, or low")
    suggested_fix: str = Field(..., description="A snippet or code patch suggesting how to fix this issue")

class BugAnalyzerResponse(BaseModel):
    bugs_found: List[Bug] = Field(default_factory=list, description="List of all bugs identified in the code")
    best_practices: List[str] = Field(default_factory=list, description="List of best practice recommendation notes")

# 2. Security Scanner Schemas
class Vulnerability(BaseModel):
    file: str = Field(..., description="The file containing the security vulnerability")
    line: int = Field(..., description="Line number where the vulnerability starts")
    cwe_id: str = Field(..., description="Common Weakness Enumeration ID, e.g., CWE-79")
    description: str = Field(..., description="Description of the security vulnerability")
    severity: str = Field(..., description="Severity level: critical, high, medium, or low")
    remediation: str = Field(..., description="Steps or code change to resolve the vulnerability")

class SecurityScannerResponse(BaseModel):
    vulnerabilities: List[Vulnerability] = Field(default_factory=list, description="List of security vulnerabilities found")
    severity_score: float = Field(..., description="Overall security risk score between 0.0 (safe) and 10.0 (high risk)")

# 3. Pull Request Reviewer Schemas
class PRReviewerResponse(BaseModel):
    summary: str = Field(..., description="A high-level summary of what the pull request changes")
    risk_level: str = Field(..., description="PR overall risk: low, medium, or high")
    performance_issues: List[str] = Field(default_factory=list, description="Any potential runtime, latency, or memory issues")
    security_concerns: List[str] = Field(default_factory=list, description="Immediate security red flags found in the diff")
    missing_tests: List[str] = Field(default_factory=list, description="List of files or logic that lack tests")
    recommendations: List[str] = Field(default_factory=list, description="Actionable recommendations for improvements")

# 4. Senior Engineer Review Schemas
class RefactoringOpportunity(BaseModel):
    target_file: str = Field(..., description="The file name where refactoring is recommended")
    code_snippet: str = Field(..., description="The original code snippet to refactor")
    explanation: str = Field(..., description="Why and how to refactor this block of code")

class SeniorEngineerReviewResponse(BaseModel):
    architecture_review: str = Field(..., description="A strategic critique of the code architecture, layout, design patterns, and decoupling")
    scalability_suggestions: List[str] = Field(default_factory=list, description="Suggestions for concurrency, database, caching, or performance scale")
    maintainability_suggestions: List[str] = Field(default_factory=list, description="Critique of readability, naming conventions, docstrings, and structure")
    refactoring_opportunities: List[RefactoringOpportunity] = Field(default_factory=list, description="Actionable opportunities for refactoring blocks of code")
