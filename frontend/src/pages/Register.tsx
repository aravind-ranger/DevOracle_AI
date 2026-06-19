import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, AlertCircle, Loader } from 'lucide-react';

const Register: React.FC = () => {
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Email might already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] w-full flex items-center justify-center px-6 py-12 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-neonPurple/5 rounded-full blur-[100px]" />

      <div className="max-w-md w-full glass-panel border-gray-800 p-8 rounded-2xl relative z-10 flex flex-col items-center">
        <div className="p-3 bg-gradient-to-tr from-neonBlue to-neonPurple rounded-xl mb-4 shadow-neonPurple">
          <Terminal className="w-6 h-6 text-black" />
        </div>

        <h2 className="text-2xl font-extrabold tracking-wider text-white">Create Account</h2>
        <p className="text-gray-500 text-xs mt-1.5 font-medium">Join DevOracle and start auditing code</p>

        {error && (
          <div className="w-full mt-6 p-4 bg-neonRed/10 border border-neonRed/20 rounded-xl text-neonRed text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full mt-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Linus Torvalds"
              required
              className="w-full bg-[#0E1322] border border-gray-800 focus:border-neonPurple rounded-xl px-4 py-3 text-sm text-gray-200 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="linus@git.org"
              required
              className="w-full bg-[#0E1322] border border-gray-800 focus:border-neonPurple rounded-xl px-4 py-3 text-sm text-gray-200 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#0E1322] border border-gray-800 focus:border-neonPurple rounded-xl px-4 py-3 text-sm text-gray-200 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-neonPurple to-[#BD00FF] text-white font-extrabold rounded-xl hover:shadow-[0_0_15px_rgba(189,0,255,0.3)] transition-all duration-300 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-neonPurple hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
