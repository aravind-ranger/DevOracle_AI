import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Activity, 
  FileText, 
  Users, 
  Layers, 
  Calendar, 
  Search, 
  Presentation, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  FolderGit2, 
  Clock, 
  CornerDownRight, 
  Check,
  Code2
} from 'lucide-react';

interface FileModification {
  file_path: string;
  change_count: number;
  additions: number;
  deletions: number;
}

interface ActivityArea {
  directory: string;
  commits_count: number;
  files_count: number;
}

interface TimelineItem {
  commit_sha: string;
  author: string;
  commit_message: string;
  commit_date: string;
  additions: number;
  deletions: number;
  total_changes: number;
  patch?: string;
}

interface EvolutionReport {
  repository: string;
  branch: string;
  week: string;
  total_commits: number;
  files_changed_count: number;
  contributors: string[];
  repeatedly_modified_files: FileModification[];
  high_activity_areas: ActivityArea[];
  recent_activity: TimelineItem[];
  daily_timeline: Record<string, TimelineItem[]>;
}

interface HistoryItem {
  repository: string;
  branch: string;
  total_commits: number;
  last_commit_date: string;
  week: string;
}

const PulsePage: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeRepo, setActiveRepo] = useState<string>('');
  const [activeBranch, setActiveBranch] = useState<string>('main');
  const [activeWeek, setActiveWeek] = useState<string>('');
  const [report, setReport] = useState<EvolutionReport | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  
  // Dashboard UI state
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [meetingMode, setMeetingMode] = useState(false);
  const [meetingCommitIndex, setMeetingCommitIndex] = useState(0);

  // Fetch repositories history list
  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.get('/rer/history');
      setHistory(resp.data);
      if (resp.data.length > 0) {
        setActiveRepo(resp.data[0].repository);
        setActiveBranch(resp.data[0].branch);
        setActiveWeek(resp.data[0].week);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load evolution history.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch specific week's report
  const fetchReport = async (repo: string, branch: string, week: string) => {
    if (!repo) return;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.get(`/rer/report?repository=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}&week=${week}`);
      setReport(resp.data);
      // Default to first day in timeline if available
      const days = Object.keys(resp.data.daily_timeline);
      if (days.length > 0) {
        setSelectedDay(days[0]);
      } else {
        setSelectedDay(null);
      }
      setMeetingCommitIndex(0);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load evolution report.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (activeRepo && activeWeek) {
      fetchReport(activeRepo, activeBranch, activeWeek);
    }
  }, [activeRepo, activeBranch, activeWeek]);

  // Handle report downloading
  const handleDownload = (format: 'markdown' | 'pdf' | 'docx') => {
    if (!activeRepo || !activeWeek) return;
    const token = localStorage.getItem('access_token');
    const downloadUrl = `${api.defaults.baseURL}/rer/download?repository=${encodeURIComponent(activeRepo)}&branch=${encodeURIComponent(activeBranch)}&week=${activeWeek}&format=${format}&token=${token}`;
    
    // Authenticated download helper
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    // Set headers if needed, otherwise open in new tab with Bearer token parameter support (handled by API router or browser session)
    window.open(downloadUrl, '_blank');
  };

  const copyCurlToClipboard = () => {
    const curlCmd = `curl -X POST "${window.location.origin}/api/rer/analyze" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -d '{
    "commits": [
      {
        "repository": "your-org/your-repo",
        "branch": "main",
        "commit_sha": "a1b2c3d4e5f6g7h8",
        "author": "developer-name",
        "commit_message": "feat: added new dashboard widgets",
        "commit_date": "2026-06-25T12:00:00Z",
        "files": ["src/App.tsx", "package.json"],
        "patch": "diff --git a/src/App.tsx...",
        "additions": 45,
        "deletions": 12,
        "total_changes": 57
      }
    ]
  }'`;
    navigator.clipboard.writeText(curlCmd);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  // Filter commits for search bar
  const getAllCommits = (): TimelineItem[] => {
    if (!report) return [];
    // Combine all commits from all days
    return Object.values(report.daily_timeline).flat();
  };

  const filteredCommits = getAllCommits().filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.commit_message.toLowerCase().includes(query) ||
      c.author.toLowerCase().includes(query) ||
      c.commit_sha.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-neonBlue/10 border border-neonBlue/20 rounded-lg text-neonBlue">
              <Activity className="w-5 h-5 animate-pulse-glow" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-wider text-white">Codebase Pulse</h1>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Intelligent repository analytics and weekly development timelines.
          </p>
        </div>

        {/* Global Selectors */}
        {history.length > 0 && (
          <div className="flex items-center gap-3 bg-[#0E1322] border border-gray-800 rounded-xl p-2">
            <div className="flex items-center gap-1.5 px-2">
              <FolderGit2 className="w-4 h-4 text-neonBlue" />
              <select
                value={activeRepo}
                onChange={(e) => {
                  const item = history.find(h => h.repository === e.target.value);
                  if (item) {
                    setActiveRepo(item.repository);
                    setActiveBranch(item.branch);
                    setActiveWeek(item.week);
                  }
                }}
                className="bg-transparent text-xs text-gray-200 outline-none cursor-pointer border-none font-bold pr-2"
              >
                {Array.from(new Set(history.map(h => h.repository))).map(repo => (
                  <option key={repo} value={repo} className="bg-[#0E1322]">{repo}</option>
                ))}
              </select>
            </div>

            <div className="h-5 w-px bg-gray-800" />

            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="w-4 h-4 text-neonBlue" />
              <select
                value={activeWeek}
                onChange={(e) => setActiveWeek(e.target.value)}
                className="bg-transparent text-xs text-gray-200 outline-none cursor-pointer border-none font-bold pr-2"
              >
                {history
                  .filter(h => h.repository === activeRepo)
                  .map(h => (
                    <option key={h.week} value={h.week} className="bg-[#0E1322]">
                      Week {h.week}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-neonRed/10 border border-neonRed/20 rounded-2xl text-neonRed text-xs">
          {error}
        </div>
      )}

      {/* Empty State */}
      {history.length === 0 && !isLoading && (
        <div className="glass-panel border-gray-800 p-8 rounded-2xl text-center space-y-6 max-w-2xl mx-auto mt-8">
          <Activity className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-200">No Evolution Data Available</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
              Codebase Pulse receives processed repository commit reports from your scheduled **n8n workflow**. 
              You can trigger the analyzer manually by making an API call with your commit data.
            </p>
          </div>

          <div className="text-left bg-[#0A0E1A] border border-gray-800 rounded-xl p-4 relative font-mono text-[11px] text-gray-300">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
              <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-neonBlue" /> API Trigger Payload
              </span>
              <button 
                onClick={copyCurlToClipboard}
                className="text-[10px] bg-neonBlue/10 hover:bg-neonBlue/20 text-neonBlue px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                {copiedCurl ? <Check className="w-3 h-3" /> : 'Copy Curl'}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre">{`curl -X POST "${window.location.origin}/api/rer/analyze" \\
  -H "Authorization: Bearer <token>" \\
  -d '{"commits": [{"repository": "org/repo", "branch": "main", ...}]}'`}</pre>
          </div>
        </div>
      )}

      {/* Dashboard View */}
      {report && !meetingMode && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Analytics Block (2 columns) */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Section 1: Executive Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-panel border-gray-800 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Commits</span>
                <div className="text-xl font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-neonBlue" />
                  {report.total_commits}
                </div>
              </div>

              <div className="glass-panel border-gray-800 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Files Changed</span>
                <div className="text-xl font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-neonGreen" />
                  {report.files_changed_count}
                </div>
              </div>

              <div className="glass-panel border-gray-800 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Contributors</span>
                <div className="text-xl font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-neonPurple" />
                  {report.contributors.length}
                </div>
              </div>

              <div className="glass-panel border-gray-800 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Branch</span>
                <div className="text-xl font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-neonOrange" />
                  {report.branch}
                </div>
              </div>
            </div>

            {/* Section 2: Daily Timeline */}
            <div className="glass-panel border-gray-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wider uppercase text-gray-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neonBlue" /> Daily Timeline
                </h3>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Select day to inspect</span>
              </div>

              {/* Day Selection Tabs */}
              <div className="flex flex-wrap gap-2">
                {Object.keys(report.daily_timeline).map(day => {
                  const commitsCount = report.daily_timeline[day].length;
                  const isActive = selectedDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                        isActive 
                          ? 'border-neonBlue bg-neonBlue/5 text-neonBlue' 
                          : 'border-gray-800 bg-[#0E1322]/45 hover:bg-gray-800/35 text-gray-300'
                      }`}
                    >
                      {day}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-neonBlue/20 text-neonBlue' : 'bg-gray-800 text-gray-500'}`}>
                        {commitsCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Daily Commits Listing */}
              {selectedDay && report.daily_timeline[selectedDay] && (
                <div className="border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-850 bg-[#0A0E1A]/40 max-h-[220px] overflow-y-auto">
                  {report.daily_timeline[selectedDay].map((c) => (
                    <div key={c.commit_sha} className="p-3 hover:bg-gray-800/10 transition-colors flex items-center justify-between gap-4 text-xs font-mono">
                      <div className="flex items-start gap-2.5 overflow-hidden">
                        <CornerDownRight className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
                        <span className="text-gray-550 shrink-0 select-all font-bold">[{c.commit_sha.substring(0, 7)}]</span>
                        <span className="text-gray-200 truncate font-semibold" title={c.commit_message}>
                          {c.commit_message}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-gray-450 text-[10px]">by {c.author}</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold">
                          <span className="text-neonGreen">+{c.additions}</span>
                          <span className="text-neonRed">-{c.deletions}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Commit Explorer */}
            <div className="glass-panel border-gray-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
                <h3 className="text-sm font-bold tracking-wider uppercase text-gray-200 flex items-center gap-2 shrink-0">
                  <Search className="w-4 h-4 text-neonBlue" /> Commit Explorer
                </h3>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search commits..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0E1322] border border-gray-800 focus:border-neonBlue rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-300 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Explorer Commits Listing */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredCommits.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">No matching commits found.</div>
                ) : (
                  filteredCommits.map(c => (
                    <div key={c.commit_sha} className="p-3 bg-[#0A0D17]/40 border border-gray-850 hover:border-gray-850 hover:bg-gray-800/10 rounded-xl transition-all space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neonBlue font-mono font-bold">[{c.commit_sha.substring(0, 7)}]</span>
                        <span className="text-gray-500 text-[10px]">
                          {new Date(c.commit_date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-200 font-medium leading-relaxed">{c.commit_message}</p>
                      <div className="flex items-center justify-between text-[11px] pt-1 text-gray-500">
                        <span>Author: <strong className="text-gray-300">{c.author}</strong></span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-neonGreen">+{c.additions}</span>
                          <span className="text-neonRed">-{c.deletions}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Side Panels (1 column) */}
          <div className="space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="glass-panel border-gray-800 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">RER Actions</h4>
              
              <div className="space-y-2">
                <button
                  onClick={() => setMeetingMode(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-neonBlue/10 hover:bg-neonBlue/20 border border-neonBlue/20 text-neonBlue font-bold rounded-xl text-xs transition-colors"
                >
                  <Presentation className="w-4 h-4" /> Start Meeting Mode
                </button>
                
                <button
                  onClick={() => handleDownload('markdown')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#0E1322] hover:bg-gray-800/25 border border-gray-800 text-gray-300 font-bold rounded-xl text-xs transition-colors"
                >
                  <Download className="w-4 h-4" /> Export Report (.MD)
                </button>
              </div>
            </div>

            {/* High Activity areas */}
            <div className="glass-panel border-gray-800 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">High-Activity Areas</h4>
              <div className="space-y-3">
                {report.high_activity_areas.length === 0 ? (
                  <span className="text-xs text-gray-500">No activity directories mapped.</span>
                ) : (
                  report.high_activity_areas.map((area) => (
                    <div key={area.directory} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 font-mono truncate mr-2">{area.directory}</span>
                        <span className="text-gray-500 shrink-0 font-bold">{area.commits_count} commits</span>
                      </div>
                      <div className="w-full bg-gray-800/40 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-neonBlue h-full rounded-full"
                          style={{ width: `${Math.min((area.commits_count / report.total_commits) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Repeatedly Modified Files */}
            <div className="glass-panel border-gray-800 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Repeatedly Modified</h4>
              <div className="space-y-3 divide-y divide-gray-850/40">
                {report.repeatedly_modified_files.length === 0 ? (
                  <span className="text-xs text-gray-500">All files modified once or less.</span>
                ) : (
                  report.repeatedly_modified_files.slice(0, 5).map(f => (
                    <div key={f.file_path} className="pt-2.5 first:pt-0 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 font-mono truncate mr-2" title={f.file_path}>
                          {f.file_path.split('/').pop()}
                        </span>
                        <span className="text-neonBlue bg-neonBlue/10 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {f.change_count}x
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span className="truncate max-w-[150px]">{f.file_path}</span>
                        <span className="font-mono text-neonGreen">+{f.additions}/-{f.deletions}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Mode View */}
      {report && meetingMode && (
        <div className="glass-panel border-neonBlue/20 rounded-2xl p-6 md:p-8 space-y-6 max-w-4xl mx-auto shadow-[0_0_30px_rgba(0,240,255,0.03)]">
          {/* Header toolbar */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neonBlue flex items-center gap-1.5">
                <Presentation className="w-3.5 h-3.5 animate-pulse" /> Meeting Presentation Mode
              </span>
              <h2 className="text-md font-bold text-white truncate max-w-md">
                {report.repository} (Week {report.week})
              </h2>
            </div>
            
            <button
              onClick={() => setMeetingMode(false)}
              className="px-3.5 py-1.5 text-xs bg-gray-850 hover:bg-gray-850/80 text-gray-300 font-bold rounded-lg border border-gray-850 transition-colors"
            >
              Exit Presentation
            </button>
          </div>

          {/* Commit Presenter Card */}
          {getAllCommits().length === 0 ? (
            <div className="text-center py-12 text-gray-500">No commits to present.</div>
          ) : (
            <div className="space-y-6">
              {/* Commit Details */}
              {(() => {
                const currentCommit = getAllCommits()[meetingCommitIndex];
                if (!currentCommit) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#0A0D17]/60 p-4 border border-gray-850 rounded-xl font-mono text-xs">
                      <div>
                        <span className="text-gray-500 font-extrabold block">COMMIT SHA</span>
                        <span className="text-neonBlue select-all font-bold">{currentCommit.commit_sha}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-extrabold block">AUTHOR</span>
                        <span className="text-gray-200 font-bold">{currentCommit.author}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-extrabold block">DATE</span>
                        <span className="text-gray-250 font-bold">
                          {new Date(currentCommit.commit_date).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-550 block">Commit Message</span>
                      <p className="text-md text-gray-100 font-semibold bg-gray-850/20 border border-gray-850/30 p-4 rounded-xl leading-relaxed">
                        {currentCommit.commit_message}
                      </p>
                    </div>

                    {/* Diff/Patch view if exists */}
                    {currentCommit.patch && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-550 block">Git Patch / Diff</span>
                        <pre className="bg-[#030712] border border-gray-850 rounded-xl p-4 overflow-x-auto text-[11px] font-mono text-gray-300 max-h-[250px] whitespace-pre-wrap">
                          {currentCommit.patch}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Navigation controls */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <div className="text-xs text-gray-500 font-semibold">
                  Commit <strong className="text-neonBlue">{meetingCommitIndex + 1}</strong> of <strong className="text-gray-300">{getAllCommits().length}</strong>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMeetingCommitIndex(prev => Math.max(prev - 1, 0))}
                    disabled={meetingCommitIndex === 0}
                    className="p-2.5 bg-[#0E1322] border border-gray-850 rounded-xl hover:bg-gray-800/30 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous Commit"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setMeetingCommitIndex(prev => Math.min(prev + 1, getAllCommits().length - 1))}
                    disabled={meetingCommitIndex === getAllCommits().length - 1}
                    className="p-2.5 bg-[#0E1322] border border-gray-850 rounded-xl hover:bg-gray-800/30 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next Commit"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PulsePage;
