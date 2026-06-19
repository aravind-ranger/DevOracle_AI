import React from 'react';
import { Link } from 'react-router-dom';
import { Bug, ShieldAlert, GitPullRequest, Award, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      title: 'Logic Bug Analyzer',
      desc: 'Performs syntax, control flow, and logical error scans on any code file.',
      icon: Bug,
      color: 'text-neonOrange border-neonOrange/15 bg-neonOrange/5',
    },
    {
      title: 'CWE Security Auditor',
      desc: 'Locates critical software vulnerabilities and provides immediate remediation code.',
      icon: ShieldAlert,
      color: 'text-neonRed border-neonRed/15 bg-neonRed/5',
    },
    {
      title: 'Asynchronous PR Inspector',
      desc: 'Pulls repository git diffs directly from GitHub and executes code reviews.',
      icon: GitPullRequest,
      color: 'text-neonBlue border-neonBlue/15 bg-neonBlue/5',
    },
    {
      title: 'Architectural Oracle',
      desc: 'Conducts senior engineer scaling analysis and reports refactoring guidelines.',
      icon: Award,
      color: 'text-neonPurple border-neonPurple/15 bg-neonPurple/5',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-73px)] w-full overflow-hidden flex flex-col justify-between py-16 px-6">
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neonBlue/10 rounded-full blur-[100px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-neonPurple/10 rounded-full blur-[100px] animate-pulse-glow" />

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto w-full text-center relative z-10 flex-1 flex flex-col justify-center items-center">

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl">
          Automate Code Audits with{' '}
          <span className="bg-gradient-to-r from-neonBlue via-cyan-300 to-neonPurple bg-clip-text text-transparent">
            AI Precision
          </span>
        </h1>

        <p className="text-gray-400 mt-6 text-base sm:text-lg max-w-2xl leading-relaxed">
          DevOracle AI analyzes codebases, detects complex logic bugs, scans for security threats,
          and automates GitHub pull request reviews with structural Pydantic validation.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="px-8 py-3.5 font-bold text-black bg-gradient-to-r from-neonBlue to-neonPurple rounded-xl hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all duration-300 hover:scale-105 flex items-center gap-2 group"
          >
            Launch DevConsole
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          {!isAuthenticated && (
            <Link
              to="/login"
              className="px-8 py-3.5 font-bold text-gray-300 hover:text-white glass-panel rounded-xl hover:bg-gray-800/30 transition-all duration-200 border border-gray-800"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-24">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl glass-panel border flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] group ${feature.color}`}
              >
                <div className="p-3 bg-black/40 rounded-xl mb-4 border border-white/5 group-hover:border-white/10 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-gray-200 font-bold text-base">{feature.title}</h3>
                <p className="text-gray-400 text-xs mt-2 leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-gray-600 mt-16 relative z-10">
        <p>© 2026 DevOracle AI Corporation. All rights reserved. Powered by Google DeepMind Gemini API.</p>
      </footer>
    </div>
  );
};

export default Landing;
