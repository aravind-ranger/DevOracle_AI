import React, { useState, useEffect } from 'react';
import AnalysisResultView from '../components/AnalysisResultView';
import api from '../services/api';
import type { Review } from '../types';
import { GitPullRequest, AlertCircle, Play, Globe } from 'lucide-react';

const PRReviewPage: React.FC = () => {
  const [prUrl, setPrUrl] = useState('https://github.com/octocat/Spoon-Knife/pull/12');
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
        setError('Error retrieving background PR review status.');
        setIsSubmitting(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [review]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prUrl.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setReview(null);

    try {
      const resp = await api.post('/pr-review', {
        pr_url: prUrl,
      });
      setReview(resp.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit PR review job.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl w-full mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <GitPullRequest className="w-6 h-6 text-neonBlue" />
          GitHub Pull Request Reviewer
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Pulls public or private git pull requests, compiles patch diff structures, and scans for logic and styling defects.
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
              GitHub Pull Request URL
            </label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Globe className="w-4.5 h-4.5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/pull/42"
                  required
                  className="w-full bg-[#0E1322] border border-gray-800 focus:border-neonBlue rounded-xl pl-12 pr-4 py-3 text-sm text-gray-200 outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !prUrl.trim()}
                className="px-6 bg-neonBlue text-black font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-350 hover:scale-105 disabled:opacity-50 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                {isSubmitting ? 'Reviewing...' : 'Start PR Review'}
              </button>
            </div>
          </div>
        </form>

        <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-850 text-xs text-gray-400 leading-relaxed">
          <strong>Protip:</strong> If the Gemini API key is missing or dummy values are used, the review engine operates in <strong>Mock Mode</strong> and returns a precompiled summary for demonstration purposes.
        </div>
      </div>

      {review && (
        <div className="space-y-4">
          <h3 className="text-md font-bold text-gray-200">PR Assessment Report</h3>
          
          {review.metadata?.pr_title && (
            <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center justify-between text-sm">
              <span className="text-gray-400">PR Scope:</span>
              <strong className="text-gray-200 font-mono">{review.metadata.pr_title}</strong>
            </div>
          )}

          <AnalysisResultView
            type="pr_review"
            result={review.result}
            status={review.status}
            errorMessage={review.error_message}
          />
        </div>
      )}
    </div>
  );
};

export default PRReviewPage;
