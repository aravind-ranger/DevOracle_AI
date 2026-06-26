import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FolderGit2, Search, FileCode2, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

interface Repo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
}

interface RepoFile {
  path: string;
  type: string;
}

interface GithubRepoBrowserProps {
  onFileSelected: (filename: string, code: string, language: string) => void;
  themeColor: 'neonOrange' | 'neonBlue' | 'neonGreen' | 'neonPurple' | 'neonRed';
}

const GithubRepoBrowser: React.FC<GithubRepoBrowserProps> = ({ onFileSelected, themeColor }) => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noGithubToken, setNoGithubToken] = useState(false);

  // Map theme colors to CSS utility classes
  const themeClasses = {
    neonOrange: {
      text: 'text-neonOrange',
      border: 'border-neonOrange',
      bgHover: 'hover:bg-neonOrange/10',
      focus: 'focus:border-neonOrange',
      shadow: 'shadow-neonOrange/20',
    },
    neonBlue: {
      text: 'text-neonBlue',
      border: 'border-neonBlue',
      bgHover: 'hover:bg-neonBlue/10',
      focus: 'focus:border-neonBlue',
      shadow: 'shadow-neonBlue/20',
    },
    neonGreen: {
      text: 'text-neonGreen',
      border: 'border-neonGreen',
      bgHover: 'hover:bg-neonGreen/10',
      focus: 'focus:border-neonGreen',
      shadow: 'shadow-neonGreen/20',
    },
    neonPurple: {
      text: 'text-neonPurple',
      border: 'border-neonPurple',
      bgHover: 'hover:bg-neonPurple/10',
      focus: 'focus:border-neonPurple',
      shadow: 'shadow-neonPurple/20',
    },
    neonRed: {
      text: 'text-neonRed',
      border: 'border-neonRed',
      bgHover: 'hover:bg-neonRed/10',
      focus: 'focus:border-neonRed',
      shadow: 'shadow-neonRed/20',
    },
  }[themeColor];

  const fetchRepos = async () => {
    setIsLoadingRepos(true);
    setError(null);
    setNoGithubToken(false);
    try {
      const resp = await api.get('/github/repos');
      setRepos(resp.data);
      if (resp.data.length > 0) {
        // Find if Spoon-Knife or similar is there, or default to first
        setSelectedRepo(resp.data[0]);
      }
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('access token')) {
        setNoGithubToken(true);
      } else {
        setError(err.response?.data?.detail || 'Failed to retrieve GitHub projects.');
      }
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const fetchFiles = async (repo: Repo) => {
    setIsLoadingFiles(true);
    setError(null);
    try {
      const resp = await api.get(`/github/repos/${repo.owner.login}/${repo.name}/files`);
      setFiles(resp.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to fetch files for ${repo.name}.`);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (!user.has_github_token) {
          const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || 'dummy_github_id';
          if (clientId !== 'dummy_github_id') {
            setNoGithubToken(true);
            return;
          }
        }
      } catch (e) {
        // ignore
      }
    }
    fetchRepos();
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      fetchFiles(selectedRepo);
    }
  }, [selectedRepo]);

  const detectLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext) return 'plaintext';
    
    const mapping: Record<string, string> = {
      py: 'python',
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      cc: 'cpp',
      h: 'cpp',
      cs: 'csharp',
      rb: 'ruby',
      php: 'php',
      html: 'html',
      css: 'css',
      sh: 'shell',
      json: 'json',
      yml: 'yaml',
      yaml: 'yaml',
      md: 'markdown',
    };
    return mapping[ext] || 'plaintext';
  };

  const handleFileClick = async (filePath: string) => {
    if (!selectedRepo) return;
    setIsLoadingContent(true);
    setError(null);
    try {
      const resp = await api.get(
        `/github/repos/${selectedRepo.owner.login}/${selectedRepo.name}/files/${encodeURIComponent(filePath)}`
      );
      const language = detectLanguage(filePath);
      const filename = filePath.split('/').pop() || filePath;
      onFileSelected(filename, resp.data.content, language);
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to retrieve content for ${filePath}.`);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const filteredFiles = files.filter(f =>
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (noGithubToken) {
    return (
      <div className="bg-[#0E1322] border border-gray-800 rounded-2xl p-6 text-center space-y-4">
        <FolderGit2 className="w-10 h-10 mx-auto text-gray-500" />
        <div className="space-y-1">
          <h4 className="font-bold text-gray-200">GitHub Workspace Browser</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            You must be logged in via GitHub to browse your repositories and scan project files directly.
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className={`px-4 py-2 text-xs font-bold text-black bg-white rounded-xl hover:bg-gray-100 transition-colors`}
        >
          Sign Out & Reconnect via GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0E1A] border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-[480px] shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-[#0E1322] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-200">
          <FolderGit2 className={`w-5 h-5 ${themeClasses.text}`} />
          <span className="text-xs font-extrabold uppercase tracking-wider">GitHub Project Workspace</span>
        </div>
        <button
          onClick={fetchRepos}
          disabled={isLoadingRepos}
          className="text-gray-400 hover:text-white transition-colors"
          title="Reload Repositories"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRepos ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Select Repo */}
      <div className="p-4 border-b border-gray-850 bg-[#0A0D17]">
        <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-2">
          Select Active Project
        </label>
        <div className="relative">
          {isLoadingRepos ? (
            <div className="h-10 bg-[#0E1322] border border-gray-800 rounded-xl flex items-center px-4 gap-2 text-xs text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading your repositories...
            </div>
          ) : (
            <select
              value={selectedRepo?.id || ''}
              onChange={(e) => {
                const repo = repos.find(r => r.id === parseInt(e.target.value));
                if (repo) setSelectedRepo(repo);
              }}
              className="bg-[#0E1322] border border-gray-800 focus:border-gray-700 rounded-xl px-4 py-2.5 text-xs text-gray-200 outline-none w-full appearance-none cursor-pointer transition-colors"
            >
              {repos.length === 0 ? (
                <option value="">No repositories found</option>
              ) : (
                repos.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.full_name}
                  </option>
                ))
              )}
            </select>
          )}
        </div>
      </div>

      {/* Search files */}
      {selectedRepo && (
        <div className="p-4 border-b border-gray-850 bg-[#0A0D17] relative">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files in project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0E1322] border border-gray-800 focus:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-200 outline-none w-full transition-colors"
            />
          </div>
        </div>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {error && (
          <div className="p-3 bg-neonRed/10 border border-neonRed/20 rounded-xl text-neonRed text-[11px] flex items-start gap-2 m-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isLoadingFiles ? (
          <div className="flex flex-col items-center justify-center h-full text-xs text-gray-450 gap-2">
            <Loader2 className={`w-6 h-6 animate-spin ${themeClasses.text}`} />
            Loading project file tree...
          </div>
        ) : !selectedRepo ? (
          <div className="flex items-center justify-center h-full text-xs text-gray-500">
            No project selected.
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-gray-500">
            No matching source files found.
          </div>
        ) : (
          filteredFiles.map((file) => (
            <button
              key={file.path}
              onClick={() => handleFileClick(file.path)}
              disabled={isLoadingContent}
              className={`w-full flex items-center justify-between text-left px-3 py-2 text-xs text-gray-300 rounded-lg transition-all ${themeClasses.bgHover} group disabled:opacity-50`}
            >
              <div className="flex items-center gap-2 overflow-hidden mr-2">
                <FileCode2 className="w-3.5 h-3.5 text-gray-500 shrink-0 group-hover:text-gray-300 transition-colors" />
                <span className="truncate" title={file.path}>
                  {file.path}
                </span>
              </div>
              {isLoadingContent && (
                <Loader2 className="w-3 h-3 animate-spin text-gray-400 shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default GithubRepoBrowser;
