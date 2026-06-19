import React, { useState } from 'react';
import type {
  BugAnalyzerResult,
  SecurityScannerResult,
  PRReviewerResult,
  SeniorEngineerResult,
  ReviewType,
  Bug,
  Vulnerability,
} from '../types';
import {
  AlertTriangle,
  CheckCircle,
  FileCode,
  ShieldAlert,
  Code,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  GitPullRequest,
} from 'lucide-react';

interface AnalysisResultViewProps {
  type: ReviewType;
  result: any;
  status: string;
  errorMessage?: string | null;
}

const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ type, result, status, errorMessage }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-2xl border border-neonBlue/10 animate-pulse">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-neonBlue/20 border-t-neonBlue animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-gray-200">Analysis Queued</h3>
        <p className="text-sm text-gray-400 mt-2">Waiting in the asynchronous task pipeline...</p>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-2xl border border-neonPurple/10">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-neonPurple/20 border-t-neonPurple animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-gray-200">AI Oracle Analyzing...</h3>
        <p className="text-sm text-gray-400 mt-2 text-center max-w-sm">
          Processing request using the Google Gemini model. This may take a few moments.
        </p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="p-8 glass-panel rounded-2xl border border-neonRed/30 bg-neonRed/5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-neonRed/10 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-neonRed" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">Analysis Execution Error</h3>
            <p className="text-sm text-gray-400 mt-2">
              An error occurred while compiling code diffs or executing Gemini API request.
            </p>
            <div className="mt-4 p-4 bg-black/40 rounded-lg border border-gray-800 font-mono text-xs text-neonRed/90 whitespace-pre-wrap">
              {errorMessage || 'Unknown service error.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  // Render helper for severity badges
  const renderSeverityBadge = (severity: string) => {
    let classes = '';
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        classes = 'bg-neonRed/10 text-neonRed border-neonRed/20';
        break;
      case 'medium':
        classes = 'bg-neonOrange/10 text-neonOrange border-neonOrange/20';
        break;
      default:
        classes = 'bg-neonGreen/10 text-neonGreen border-neonGreen/20';
    }
    return (
      <span className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-md border ${classes}`}>
        {severity}
      </span>
    );
  };

  // 1. Bug Analyzer View
  if (type === 'bug_analysis') {
    const bugResult = result as BugAnalyzerResult;
    return (
      <div className="space-y-6">
        <div className="glass-panel rounded-2xl p-6 border-neonOrange/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-neonOrange" />
              Logic Bugs Found
            </h3>
            <span className="px-3 py-1 bg-neonOrange/10 text-neonOrange rounded-full text-xs font-semibold">
              {bugResult.bugs_found?.length || 0} issues
            </span>
          </div>

          {(!bugResult.bugs_found || bugResult.bugs_found.length === 0) ? (
            <div className="flex items-center gap-3 p-4 bg-neonGreen/5 border border-neonGreen/10 rounded-xl">
              <CheckCircle className="w-5 h-5 text-neonGreen" />
              <span className="text-sm text-gray-300">Clean code! No bugs or logic issues detected.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {bugResult.bugs_found.map((bug: Bug, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-800/80 bg-black/25 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {renderSeverityBadge(bug.severity)}
                      <span className="text-sm font-semibold text-gray-200 truncate">
                        {bug.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs text-gray-500 font-mono">
                        Line {bug.line}
                      </span>
                      {expandedIndex === index ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {expandedIndex === index && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-800/50 bg-black/40 space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Analysis</h4>
                        <p className="text-sm text-gray-300 mt-1">{bug.description}</p>
                      </div>

                      {bug.suggested_fix && (
                        <div>
                          <h4 className="text-xs font-semibold tracking-wider text-gray-500 uppercase flex items-center gap-1">
                            <Code className="w-3.5 h-3.5 text-neonBlue" />
                            Suggested Fix
                          </h4>
                          <pre className="mt-2 p-4 bg-[#0E111A] border border-gray-850 rounded-lg overflow-x-auto text-xs text-neonBlue/90 font-mono">
                            {bug.suggested_fix}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {bugResult.best_practices && bugResult.best_practices.length > 0 && (
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-neonGreen" />
              Best Practices & Optimization Notes
            </h3>
            <ul className="space-y-3">
              {bugResult.best_practices.map((bp: string, index: number) => (
                <li key={index} className="flex items-start gap-3 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-neonGreen mt-2 shrink-0" />
                  <span>{bp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // 2. Security Scanner View
  if (type === 'security_scan') {
    const secResult = result as SecurityScannerResult;
    const score = secResult.severity_score || 0;
    
    // Determine color based on score
    let scoreColor = 'text-neonGreen';
    let scoreBg = 'bg-neonGreen/10';
    if (score >= 7) {
      scoreColor = 'text-neonRed';
      scoreBg = 'bg-neonRed/10';
    } else if (score >= 4) {
      scoreColor = 'text-neonOrange';
      scoreBg = 'bg-neonOrange/10';
    }

    return (
      <div className="space-y-6">
        <div className="glass-panel rounded-2xl p-6 border-neonRed/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-gray-250 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-neonRed" />
              CVSS Severity Assessment
            </h3>
            <p className="text-sm text-gray-400 mt-1">Calculated risk level based on discovered vulnerability CVSS weights.</p>
          </div>
          <div className={`px-6 py-4 rounded-2xl border border-gray-800 ${scoreBg} flex flex-col items-center justify-center shrink-0`}>
            <span className={`text-4xl font-extrabold ${scoreColor}`}>{score.toFixed(1)}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-1">CVSS SCORE</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-200 mb-4">Discovered Vulnerabilities</h3>

          {(!secResult.vulnerabilities || secResult.vulnerabilities.length === 0) ? (
            <div className="flex items-center gap-3 p-4 bg-neonGreen/5 border border-neonGreen/10 rounded-xl">
              <CheckCircle className="w-5 h-5 text-neonGreen" />
              <span className="text-sm text-gray-300">Clean scan! No vulnerabilities detected.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {secResult.vulnerabilities.map((vuln: Vulnerability, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-800/80 bg-black/25 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {renderSeverityBadge(vuln.severity)}
                      <span className="px-2 py-0.5 bg-gray-800 text-gray-400 border border-gray-700 text-[10px] font-mono rounded">
                        {vuln.cwe_id}
                      </span>
                      <span className="text-sm font-semibold text-gray-200 truncate">
                        {vuln.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs text-gray-500 font-mono">
                        Line {vuln.line}
                      </span>
                      {expandedIndex === index ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {expandedIndex === index && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-800/50 bg-black/40 space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Vulnerability Details</h4>
                        <p className="text-sm text-gray-300 mt-1">{vuln.description}</p>
                      </div>

                      {vuln.remediation && (
                        <div>
                          <h4 className="text-xs font-semibold tracking-wider text-gray-500 uppercase flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-neonGreen" />
                            Remediation Plan
                          </h4>
                          <p className="text-sm text-gray-300 mt-1">{vuln.remediation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. PR Reviewer View
  if (type === 'pr_review') {
    const prResult = result as PRReviewerResult;
    return (
      <div className="space-y-6">
        <div className="glass-panel rounded-2xl p-6 border-neonBlue/15 flex items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-gray-250 flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-neonBlue" />
              PR Risk Level Assessment
            </h3>
            <p className="text-sm text-gray-400 mt-1">Overall architectural and logical instability index.</p>
          </div>
          {renderSeverityBadge(prResult.risk_level || 'low')}
        </div>

        {prResult.summary && (
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-200 mb-2">Executive Summary</h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{prResult.summary}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance Issues */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-md font-bold text-gray-200 flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
              <div className="w-2 h-2 rounded-full bg-neonOrange" />
              Performance Pitfalls
            </h3>
            {(!prResult.performance_issues || prResult.performance_issues.length === 0) ? (
              <span className="text-sm text-gray-500">No performance bottlenecks found.</span>
            ) : (
              <ul className="space-y-3">
                {prResult.performance_issues.map((item, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2.5">
                    <span className="text-neonOrange text-xs mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Security Concerns */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-md font-bold text-gray-200 flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
              <div className="w-2 h-2 rounded-full bg-neonRed" />
              Security Concerns
            </h3>
            {(!prResult.security_concerns || prResult.security_concerns.length === 0) ? (
              <span className="text-sm text-gray-500">No critical security holes found.</span>
            ) : (
              <ul className="space-y-3">
                {prResult.security_concerns.map((item, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2.5">
                    <span className="text-neonRed text-xs mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Missing Tests */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-md font-bold text-gray-200 flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
              <div className="w-2 h-2 rounded-full bg-neonPurple" />
              Untested Components
            </h3>
            {(!prResult.missing_tests || prResult.missing_tests.length === 0) ? (
              <span className="text-sm text-gray-500">Adequate test coverage detected.</span>
            ) : (
              <ul className="space-y-3">
                {prResult.missing_tests.map((item, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2.5">
                    <span className="text-neonPurple text-xs mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recommendations */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-md font-bold text-gray-200 flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
              <div className="w-2 h-2 rounded-full bg-neonGreen" />
              Actionable Fixes
            </h3>
            {(!prResult.recommendations || prResult.recommendations.length === 0) ? (
              <span className="text-sm text-gray-500">No specific fixes recommended.</span>
            ) : (
              <ul className="space-y-3">
                {prResult.recommendations.map((item, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2.5">
                    <span className="text-neonGreen text-xs mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. Senior Reviewer / Repository Reviewer View
  if (type === 'senior_review' || type === 'repository_review') {
    const seniorResult = result as SeniorEngineerResult;
    return (
      <div className="space-y-6">
        {seniorResult.architecture_review && (
          <div className="glass-panel rounded-2xl p-6 border-neonPurple/15">
            <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2 mb-3">
              <Layers className="w-5 h-5 text-neonPurple" />
              Architectural & Layout Audit
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {seniorResult.architecture_review}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scalability */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-md font-bold text-gray-200 flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
              <div className="w-2 h-2 rounded-full bg-neonBlue" />
              Scalability Pitfalls
            </h3>
            {(!seniorResult.scalability_suggestions || seniorResult.scalability_suggestions.length === 0) ? (
              <span className="text-sm text-gray-500">Excellent scaling potential. No changes required.</span>
            ) : (
              <ul className="space-y-3">
                {seniorResult.scalability_suggestions.map((item, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2.5">
                    <span className="text-neonBlue text-xs mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Maintainability */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-md font-bold text-gray-200 flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
              <div className="w-2 h-2 rounded-full bg-neonPurple" />
              Maintainability Tips
            </h3>
            {(!seniorResult.maintainability_suggestions || seniorResult.maintainability_suggestions.length === 0) ? (
              <span className="text-sm text-gray-500">Clean codebase formatting. No recommendations.</span>
            ) : (
              <ul className="space-y-3">
                {seniorResult.maintainability_suggestions.map((item, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2.5">
                    <span className="text-neonPurple text-xs mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Refactoring Opportunities */}
        {seniorResult.refactoring_opportunities && seniorResult.refactoring_opportunities.length > 0 && (
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-neonGreen" />
              Refactoring Opportunities
            </h3>
            <div className="space-y-6">
              {seniorResult.refactoring_opportunities.map((item, index) => (
                <div key={index} className="p-5 rounded-xl bg-black/30 border border-gray-800/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-neonGreen" />
                    <span className="text-sm font-semibold text-gray-200 font-mono">
                      {item.target_file}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-300">{item.explanation}</p>
                  
                  {item.code_snippet && (
                    <pre className="p-4 bg-[#0E111A] border border-gray-850 rounded-lg overflow-x-auto text-xs text-neonGreen/80 font-mono">
                      {item.code_snippet}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default AnalysisResultView;
