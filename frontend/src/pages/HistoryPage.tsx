import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { Review } from '../types';
import SkeletonLoader from '../components/SkeletonLoader';
import AnalysisResultView from '../components/AnalysisResultView';
import { History, Trash2, ChevronRight, AlertCircle, FileCode, Clock } from 'lucide-react';

const HistoryPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/history');
      setReviews(resp.data);
      setFilteredReviews(resp.data);
      if (resp.data.length > 0) {
        setSelectedReview(resp.data[0]);
      }
    } catch (err) {
      setError('Failed to retrieve history logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Apply filters whenever list, typeFilter or statusFilter changes
  useEffect(() => {
    let result = reviews;

    if (typeFilter !== 'all') {
      result = result.filter((r) => r.review_type === typeFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    setFilteredReviews(result);
    
    // Auto-select first in filtered list if active selection is no longer in view
    if (result.length > 0) {
      const isSelectedInFiltered = result.some((r) => r.id === selectedReview?.id);
      if (!isSelectedInFiltered) {
        setSelectedReview(result[0]);
      }
    } else {
      setSelectedReview(null);
    }
  }, [reviews, typeFilter, statusFilter]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the item while deleting
    
    if (!window.confirm('Are you sure you want to delete this scan from history?')) return;

    try {
      await api.delete(`/history/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (selectedReview?.id === id) {
        setSelectedReview(null);
      }
    } catch (err) {
      alert('Failed to delete review record.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-neonGreen/10 text-neonGreen border-neonGreen/20';
      case 'failed':
        return 'bg-neonRed/10 text-neonRed border-neonRed/20';
      default:
        return 'bg-neonPurple/10 text-neonPurple border-neonPurple/20 animate-pulse';
    }
  };

  return (
    <div className="space-y-8 max-w-6xl w-full mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <History className="w-6 h-6 text-neonBlue" />
          Review History Log
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Explore and filter all past logic audits, security assessments, and repository scans.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-neonRed/10 border border-neonRed/20 rounded-xl text-neonRed text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Row */}
      <div className="glass-panel p-4 rounded-xl border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#111827] text-xs text-gray-300 px-3 py-2 rounded-lg border border-gray-800 outline-none"
            >
              <option value="all">All Types</option>
              <option value="bug_analysis">Bug Analyzer</option>
              <option value="security_scan">Security Scanner</option>
              <option value="pr_review">PR Reviewer</option>
              <option value="senior_review">Senior Reviewer</option>
              <option value="repository_review">Repository Reviewer</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#111827] text-xs text-gray-300 px-3 py-2 rounded-lg border border-gray-800 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-500 font-semibold">
          Filtered Scans: <span className="text-neonBlue">{filteredReviews.length}</span> / {reviews.length}
        </div>
      </div>

      {loading ? (
        <SkeletonLoader count={3} height="h-20" />
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border-gray-800 text-gray-500 text-sm">
          No audit history found in your account yet. Try running an analyzer tool.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* List panel */}
          <div className="lg:col-span-2 space-y-3 overflow-y-auto max-h-[640px] pr-2">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">No matching scans.</div>
            ) : (
              filteredReviews.map((review) => (
                <div
                  key={review.id}
                  onClick={() => setSelectedReview(review)}
                  className={`glass-panel p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between group ${
                    selectedReview?.id === review.id
                      ? 'border-neonBlue/40 bg-neonBlue/5 shadow-[inset_0_0_10px_rgba(0,240,255,0.02)]'
                      : 'border-gray-850 hover:border-gray-700 bg-black/10'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-200 capitalize">
                        {review.review_type.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border ${getStatusBadge(review.status)}`}>
                        {review.status}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-500 font-mono truncate">
                      {review.metadata?.filename || review.metadata?.pr_url || review.metadata?.repo_url || 'N/A'}
                    </p>

                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-600" />
                      <span>{new Date(review.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDelete(review.id, e)}
                      className="p-2 text-gray-500 hover:text-neonRed hover:bg-neonRed/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-neonBlue transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Details panel */}
          <div className="lg:col-span-3">
            {selectedReview ? (
              <div className="space-y-4">
                <div className="glass-panel p-5 rounded-2xl border-gray-800 bg-[#0B0F19]/90 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Selected Job Details</span>
                      <h4 className="text-base font-bold text-white capitalize mt-0.5">
                        {selectedReview.review_type.replace('_', ' ')}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusBadge(selectedReview.status)}`}>
                        {selectedReview.status}
                      </span>
                    </div>
                  </div>

                  {/* Metadata details */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-black/25 p-3 rounded-lg border border-gray-850 font-mono">
                    <div>
                      <span className="text-gray-500 block">SUBMISSION DATE</span>
                      <span className="text-gray-300">{new Date(selectedReview.created_at).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">JOB ID</span>
                      <span className="text-gray-300 truncate block w-full">{selectedReview.id}</span>
                    </div>
                  </div>

                  {selectedReview.metadata && (
                    <div className="text-xs bg-black/20 p-3 rounded-lg border border-gray-850 font-mono space-y-1.5">
                      <span className="text-gray-500 block">SOURCE CONTEXT</span>
                      {selectedReview.metadata.filename && (
                        <p className="text-gray-300"><span className="text-gray-500">File:</span> {selectedReview.metadata.filename}</p>
                      )}
                      {selectedReview.metadata.pr_url && (
                        <p className="text-gray-300"><span className="text-gray-500">PR:</span> {selectedReview.metadata.pr_url}</p>
                      )}
                      {selectedReview.metadata.repo_url && (
                        <p className="text-gray-300"><span className="text-gray-500">Repo:</span> {selectedReview.metadata.repo_url}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="glass-panel p-5 rounded-2xl border-gray-800 bg-[#0B0F19]/40">
                  <h4 className="text-sm font-bold text-gray-200 mb-4">Review Recommendations</h4>
                  <AnalysisResultView
                    type={selectedReview.review_type}
                    result={selectedReview.result}
                    status={selectedReview.status}
                    errorMessage={selectedReview.error_message}
                  />
                </div>
              </div>
            ) : (
              <div className="glass-panel p-12 rounded-2xl border-gray-800 text-center text-gray-500 text-sm flex flex-col items-center justify-center">
                <FileCode className="w-8 h-8 text-gray-650 mb-3" />
                Select a scan from history list to explore the findings.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
