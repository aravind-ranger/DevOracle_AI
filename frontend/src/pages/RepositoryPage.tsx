import React, { useState, useEffect } from 'react';
import AnalysisResultView from '../components/AnalysisResultView';
import api from '../services/api';
import type { Review } from '../types';
import { FolderGit2, AlertCircle, Play, Globe } from 'lucide-react';

const RepositoryPage: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/octocat/Spoon-Knife');
  const [review, setReview] = useState<Review | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!review || review.status === 'completed' || review.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const resp = await api.get(`/history/${review.id}`);
        const updatedReview = resp.data;
        setReview(updatedReview);

        if (updatedReview.status === 'completed' || updatedReview.status === 'failed') {
          setIsSubmitting(false);
          clearInterval(interval);
        }
      } catch (err) {
        setError('Error retrieving background repository audit status.');
        setIsSubmitting(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [review]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setReview(null);

    try {
      const resp = await api.post('/repository-review', {
        repo_url: repoUrl,
      });
      setReview(resp.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit repository scan job.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl w-full mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <FolderGit2 className="w-6 h-6 text-neonGreen" />
          Repository Architecture Auditor
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Scans whole project structures, inspects configuration dependencies, and reports full architectural patterns.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-neonRed/10 border border-neonRed/20 rounded-xl text-neonRed text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl border-gray-800 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              GitHub Repository URL
            </label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Globe className="w-4.5 h-4.5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  required
                  className="w-full bg-[#0E1322] border border-gray-800 focus:border-neonGreen rounded-xl pl-12 pr-4 py-3 text-sm text-gray-200 outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !repoUrl.trim()}
                className="px-6 bg-neonGreen text-black font-bold rounded-xl hover:shadow-[0_0_15px_rgba(57,255,20,0.3)] transition-all duration-350 hover:scale-105 disabled:opacity-50 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                {isSubmitting ? 'Scanning...' : 'Start Audit'}
              </button>
            </div>
          </div>
        </form>

        <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-855 text-xs text-gray-400 leading-relaxed">
          <strong>Protip:</strong> Works with public repositories. Submitting will scan structural metadata and dependencies layout to deliver architectural plans.
        </div>
      </div>

      {review && (
        <div className="space-y-4">
          <h3 className="text-md font-bold text-gray-200">Repository Review Report</h3>
          
          {review.metadata?.owner && review.metadata?.repo && (
            <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center justify-between text-sm">
              <span className="text-gray-400">Target Repository:</span>
              <strong className="text-gray-200 font-mono">{review.metadata.owner}/{review.metadata.repo}</strong>
            </div>
          )}

          <AnalysisResultView
            type="repository_review"
            result={review.result}
            status={review.status}
            errorMessage={review.error_message}
          />
        </div>
      )}
    </div>
  );
};

export default RepositoryPage;
