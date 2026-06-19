import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Review } from '../types';
import StatsCard from '../components/StatsCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Bug, ShieldAlert, GitPullRequest, Code, Terminal, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const resp = await api.get('/history');
        setHistory(resp.data);
      } catch (err) {
        setError('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Compute Metrics
  const totalScans = history.length;
  const processingScans = history.filter((r) => r.status === 'processing' || r.status === 'pending').length;
  
  // Calculate critical issues from completed security scans
  let criticalVulnerabilitiesCount = 0;
  history.forEach((review) => {
    if (review.review_type === 'security_scan' && review.status === 'completed' && review.result) {
      const vulns = review.result.vulnerabilities || [];
      criticalVulnerabilitiesCount += vulns.filter((v: any) => 
        v.severity.toLowerCase() === 'high' || v.severity.toLowerCase() === 'critical'
      ).length;
    }
  });

  const recentReviews = history.slice(0, 4);

  const quickTools = [
    {
      name: 'Bug Analyzer',
      desc: 'Verify logic flows and find program glitches',
      to: '/dashboard/bugs',
      icon: Bug,
      color: 'blue',
      btnText: 'Open Workspace',
    },
    {
      name: 'Security Scanner',
      desc: 'Audit dependencies and find critical CWE threats',
      to: '/dashboard/security',
      icon: ShieldAlert,
      color: 'red',
      btnText: 'Start Security Scan',
    },
    {
      name: 'PR Reviewer',
      desc: 'Analyze full Pull Request files and diff code patches',
      to: '/dashboard/pr-review',
      icon: GitPullRequest,
      color: 'purple',
      btnText: 'Fetch Pull Request',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl w-full mx-auto pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl border-neonBlue/15 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neonBlue/5 rounded-full blur-[80px]" />
        
        <div className="space-y-1 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome, <span className="bg-gradient-to-r from-neonBlue to-neonPurple bg-clip-text text-transparent">{user?.name}</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-md">
            All code analyzers are loaded. Feed code snippets or git links to begin auditing.
          </p>
        </div>

        <div className="relative z-10 shrink-0 flex items-center gap-3 bg-black/40 border border-gray-800/80 px-4 py-2.5 rounded-2xl text-xs font-semibold font-mono text-neonBlue">
          <Terminal className="w-4 h-4 animate-pulse" />
          <span>CONSOLE: READY</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatsCard
          title="Total Submissions"
          value={loading ? '...' : totalScans}
          icon={Code}
          desc="AI requests processed"
          color="blue"
        />
        <StatsCard
          title="Active Workers"
          value={loading ? '...' : processingScans}
          icon={Terminal}
          desc="Jobs running in background"
          color="purple"
        />
        <StatsCard
          title="Critical Vulnerabilities"
          value={loading ? '...' : criticalVulnerabilitiesCount}
          icon={ShieldAlert}
          desc="High severity CWE threats flagged"
          color="red"
        />
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-gray-200">Analysis Launchers</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickTools.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <div
                  key={idx}
                  className="glass-panel p-5 rounded-2xl border-gray-800/80 flex flex-col justify-between h-48 transition-all duration-300 hover:border-neonBlue/30 group"
                >
                  <div className="space-y-2">
                    <div className="p-2.5 bg-gray-900/60 border border-gray-800 rounded-xl w-fit group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-neonBlue" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-200">{tool.name}</h4>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{tool.desc}</p>
                  </div>
                  <Link
                    to={tool.to}
                    className="text-xs font-bold text-neonBlue flex items-center gap-1 hover:underline mt-4 group-hover:translate-x-0.5 transition-transform"
                  >
                    {tool.btnText}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Recent Submissions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-200">Recent Audits</h3>
            <Link to="/history" className="text-xs font-semibold text-neonBlue hover:underline">
              View All
            </Link>
          </div>

          <div className="glass-panel p-5 rounded-2xl border-gray-850 space-y-4">
            {loading ? (
              <SkeletonLoader count={3} height="h-10" />
            ) : error ? (
              <div className="p-4 bg-neonRed/10 border border-neonRed/25 rounded-xl text-neonRed text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            ) : recentReviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                No recent review history found. Click a quick launcher to analyze code.
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {recentReviews.map((review) => (
                  <Link
                    key={review.id}
                    to={`/dashboard/review/${review.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-800/10 rounded-lg px-2 transition-colors group"
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <span className="text-xs font-semibold text-gray-300 capitalize">
                        {review.review_type.replace('_', ' ')}
                      </span>
                      <p className="text-[10px] text-gray-500 font-mono truncate">
                        {review.metadata?.filename || review.metadata?.pr_url || review.metadata?.repo_url || 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          review.status === 'completed'
                            ? 'bg-neonGreen/10 text-neonGreen border border-neonGreen/20'
                            : review.status === 'failed'
                            ? 'bg-neonRed/10 text-neonRed border border-neonRed/20'
                            : 'bg-neonPurple/10 text-neonPurple border border-neonPurple/20 animate-pulse'
                        }`}
                      >
                        {review.status}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-650 group-hover:text-neonBlue transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
