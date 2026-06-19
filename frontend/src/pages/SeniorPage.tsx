import React, { useState, useEffect } from 'react';
import CodeEditor from '../components/CodeEditor';
import AnalysisResultView from '../components/AnalysisResultView';
import api from '../services/api';
import type { Review } from '../types';
import { Award, AlertCircle } from 'lucide-react';

const SeniorPage: React.FC = () => {
  const [code, setCode] = useState(
    `class UserManager:\n    def __init__(self):\n        self.users = {}\n        \n    def add_user(self, user_id, user_data):\n        # BUG: Thread safety issue in shared self.users dictionary\n        # BUG: In-memory dictionary state will be wiped on server restart. Should use Redis or DB.\n        self.users[user_id] = user_data\n        \n    def get_user(self, user_id):\n        return self.users.get(user_id)`
  );
  const [filename, setFilename] = useState('user_manager.py');
  const [language, setLanguage] = useState('python');

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
        setError('Error retrieving background senior audit status.');
        setIsSubmitting(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [review]);

  const handleAudit = async () => {
    if (!code.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setReview(null);

    try {
      const resp = await api.post('/senior-review', {
        filename,
        code,
      });
      setReview(resp.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit senior reviewer job.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl w-full mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-neonPurple" />
          Senior Engineer Reviewer
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Reviews high-level system architectural structures, concurrency blocks, scalability bottlenecks, and locates refactoring opportunities.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-neonRed/10 border border-neonRed/20 rounded-xl text-neonRed text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
            Target Filename
          </label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="user_manager.py"
            className="bg-[#0E1322] border border-gray-800 focus:border-neonPurple rounded-xl px-4 py-2.5 text-sm text-gray-200 outline-none w-64 transition-colors mb-4"
          />

          <CodeEditor
            code={code}
            onChange={(val) => setCode(val || '')}
            language={language}
            onLanguageChange={setLanguage}
            onSubmit={handleAudit}
            isSubmitting={isSubmitting}
            themeColor="neonPurple"
            submitLabel="Run Senior Audit"
          />
        </div>

        {review && (
          <div className="space-y-4 mt-4">
            <h3 className="text-md font-bold text-gray-200">Senior Audit recommendations</h3>
            <AnalysisResultView
              type="senior_review"
              result={review.result}
              status={review.status}
              errorMessage={review.error_message}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SeniorPage;
