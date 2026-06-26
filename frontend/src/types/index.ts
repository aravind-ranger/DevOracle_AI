// API Types for DevOracle AI

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  provider: 'local' | 'github';
  has_github_token: boolean;
  created_at: string;
}

export type ReviewStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type ReviewType = 'bug_analysis' | 'security_scan' | 'pr_review' | 'senior_review' | 'repository_review';

export interface ReviewLog {
  id: number;
  review_id: string;
  model_used: string;
  tokens_used: number;
  execution_time: number;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  review_type: ReviewType;
  status: ReviewStatus;
  metadata: Record<string, any> | null;
  result: any | null; // Cast to specific analysis result in views
  error_message: string | null;
  created_at: string;
}

// 1. Bug Analyzer Output
export interface Bug {
  file: string;
  line: number;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggested_fix: string;
}

export interface BugAnalyzerResult {
  bugs_found: Bug[];
  best_practices: string[];
}

// 2. Security Scanner Output
export interface Vulnerability {
  file: string;
  line: number;
  cwe_id: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  remediation: string;
}

export interface SecurityScannerResult {
  vulnerabilities: Vulnerability[];
  severity_score: number;
}

// 3. Pull Request Reviewer Output
export interface PRReviewerResult {
  summary: string;
  risk_level: 'high' | 'medium' | 'low';
  performance_issues: string[];
  security_concerns: string[];
  missing_tests: string[];
  recommendations: string[];
}

// 4. Senior Engineer Review Output
export interface RefactoringOpportunity {
  target_file: string;
  code_snippet: string;
  explanation: string;
}

export interface SeniorEngineerResult {
  architecture_review: string;
  scalability_suggestions: string[];
  maintainability_suggestions: string[];
  refactoring_opportunities: RefactoringOpportunity[];
}
