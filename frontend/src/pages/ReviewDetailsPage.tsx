import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Review } from '../types';
import AnalysisResultView from '../components/AnalysisResultView';
import { ArrowLeft, Clock, FileCode, AlertCircle, RefreshCw } from 'lucide-react';

const ReviewDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get(`/history/${id}`);
      setReview(resp.data);
    } catch (err) {
      setError('Failed to fetch review audit details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [id]);

  // If review is still processing or pending, poll for changes
  useEffect(() => {
    if (!review || review.status === 'completed' || review.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const resp = await api.get(`/history/${review.id}`);
        const updatedReview = resp.data;
        setReview(updatedReview);
        if (updatedReview.status === 'completed' || updatedReview.status === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [review]);

  if (loading && !review) {
    return (
      <div className="flex flex-col items-center justify-center p-24">
        <RefreshCw className="w-8 h-8 text-neonBlue animate-spin mb-4" />
        <span className="text-gray-400 text-sm">Loading Review Details...</span>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto p-8 text-center">
        <AlertCircle className="w-12 h-12 text-neonRed mx-auto" />
        <h3 className="text-lg font-bold text-gray-200">Error Loading Details</h3>
        <p className="text-sm text-gray-500">{error || 'Review job not found.'}</p>
        <Link to="/dashboard" className="text-sm font-semibold text-neonBlue hover:underline inline-block mt-4">
          Back to Dashboard
        </Link>
      </div>
    );
  }

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
    <div className="space-y-8 max-w-5xl w-full mx-auto pb-12">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="glass-panel p-6 rounded-2xl border-gray-800 bg-[#0B0F19]/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Analysis details</span>
            <h4 className="text-xl font-extrabold text-white capitalize mt-0.5 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-neonBlue" />
              {review.review_type.replace('_', ' ')}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusBadge(review.status)}`}>
              {review.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-black/25 p-3 rounded-lg border border-gray-850 font-mono">
          <div>
            <span className="text-gray-500 block">SUBMISSION DATE</span>
            <span className="text-gray-300 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-gray-600" />
              {new Date(review.created_at).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">JOB ID</span>
            <span className="text-gray-300 truncate block w-full mt-0.5">{review.id}</span>
          </div>
        </div>

        {review.metadata && (
          <div className="text-xs bg-black/20 p-3 rounded-lg border border-gray-850 font-mono space-y-1.5">
            <span className="text-gray-500 block font-bold">SOURCE CONTEXT</span>
            {review.metadata.filename && (
              <p className="text-gray-300"><span className="text-gray-500">File:</span> {review.metadata.filename}</p>
            )}
            {review.metadata.pr_url && (
              <p className="text-gray-300"><span className="text-gray-500">PR URL:</span> {review.metadata.pr_url}</p>
            )}
            {review.metadata.repo_url && (
              <p className="text-gray-300"><span className="text-gray-500">Repo URL:</span> {review.metadata.repo_url}</p>
            )}
          </div>
        )}
      </div>

      <div className="glass-panel p-6 rounded-2xl border-gray-850">
        <h3 className="text-lg font-bold text-gray-200 mb-4">Audit Findings</h3>
        <AnalysisResultView
          type={review.review_type}
          result={review.result}
          status={review.status}
          errorMessage={review.error_message}
        />
      </div>
    </div>
  );
};

export default ReviewDetailsPage;
