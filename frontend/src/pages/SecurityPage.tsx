import React, { useState, useEffect } from 'react';
import CodeEditor from '../components/CodeEditor';
import AnalysisResultView from '../components/AnalysisResultView';
import api from '../services/api';
import type { Review } from '../types';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import GithubRepoBrowser from '../components/GithubRepoBrowser';

const SecurityPage: React.FC = () => {
  const [code, setCode] = useState(
    `import sqlite3\n\ndef get_user_data(username):\n    # BUG: SQL Injection vulnerability\n    query = f"SELECT * FROM users WHERE name = '{username}'"\n    conn = sqlite3.connect('db.sq3')\n    cursor = conn.cursor()\n    cursor.execute(query)\n    return cursor.fetchall()`
  );
  const [filename, setFilename] = useState('database.py');
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
        setError('Error retrieving background security audit status.');
        setIsSubmitting(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [review]);

  const handleScan = async () => {
    if (!code.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setReview(null);

    try {
      const resp = await api.post('/security-scan', {
        filename,
        code,
      });
      setReview(resp.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit security scan job.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl w-full mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-neonRed" />
          Security CWE Scanner
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Performs deep static vulnerability scans to expose injection risks, XSS flaws, secrets leakage, and weak cryptos.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-neonRed/10 border border-neonRed/20 rounded-xl text-neonRed text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1">
          <GithubRepoBrowser
            onFileSelected={(fn, cd, lang) => {
              setFilename(fn);
              setCode(cd);
              setLanguage(lang);
            }}
            themeColor="neonRed"
          />
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Target Filename
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="database.py"
              className="bg-[#0E1322] border border-gray-800 focus:border-neonRed rounded-xl px-4 py-2.5 text-sm text-gray-200 outline-none w-full md:w-64 transition-colors"
            />
          </div>

          <CodeEditor
            code={code}
            onChange={(val) => setCode(val || '')}
            language={language}
            onLanguageChange={setLanguage}
            onSubmit={handleScan}
            isSubmitting={isSubmitting}
            themeColor="neonRed"
            submitLabel="Run Security Scan"
          />

          {review && (
            <div className="space-y-4">
              <h3 className="text-md font-bold text-gray-200">Security Audit Report</h3>
              <AnalysisResultView
                type="security_scan"
                result={review.result}
                status={review.status}
                errorMessage={review.error_message}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
