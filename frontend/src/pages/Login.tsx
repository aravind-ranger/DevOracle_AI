import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, AlertCircle, Loader } from 'lucide-react';

const Login: React.FC = () => {
  const { login, loginWithGitHub, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if we are already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Handle GitHub OAuth Redirect Code Callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      const processGitHubLogin = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
          await loginWithGitHub(code);
          navigate('/dashboard');
        } catch (err: any) {
          setError(err.response?.data?.detail || 'GitHub OAuth login failed.');
        } finally {
          setIsSubmitting(false);
        }
      };
      processGitHubLogin();
    }
  }, [searchParams, navigate, loginWithGitHub]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGitHubClick = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || 'dummy_github_id';
    const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI || 'http://localhost:5173/login';
    
    if (clientId === 'dummy_github_id') {
      // In mock mode, redirect straight to login with a mock code query parameter
      navigate('/login?code=mock_github_auth_code');
    } else {
      const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user user:email repo`;
      window.location.href = githubUrl;
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] w-full flex items-center justify-center px-6 py-12 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-neonBlue/5 rounded-full blur-[100px]" />
      
      <div className="max-w-md w-full glass-panel border-gray-800 p-8 rounded-2xl relative z-10 flex flex-col items-center">
        <div className="p-3 bg-gradient-to-tr from-neonBlue to-neonPurple rounded-xl mb-4 shadow-neonBlue">
          <Terminal className="w-6 h-6 text-black" />
        </div>
        
        <h2 className="text-2xl font-extrabold tracking-wider text-white">Welcome Back</h2>
        <p className="text-gray-500 text-xs mt-1.5 font-medium">Log in to access your DevConsole</p>

        {error && (
          <div className="w-full mt-6 p-4 bg-neonRed/10 border border-neonRed/20 rounded-xl text-neonRed text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full mt-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@example.com"
              required
              className="w-full bg-[#0E1322] border border-gray-800 focus:border-neonBlue rounded-xl px-4 py-3 text-sm text-gray-200 outline-none transition-colors"
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
              className="w-full bg-[#0E1322] border border-gray-800 focus:border-neonBlue rounded-xl px-4 py-3 text-sm text-gray-200 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-neonBlue to-[#00C2FF] text-black font-extrabold rounded-xl hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-300 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="w-full flex items-center gap-4 my-6">
          <div className="h-[1px] bg-gray-850 flex-1" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">or</span>
          <div className="h-[1px] bg-gray-850 flex-1" />
        </div>

        <button
          onClick={handleGitHubClick}
          disabled={isSubmitting}
          className="w-full py-3.5 bg-gray-900/60 border border-gray-800 hover:border-gray-700 text-gray-200 font-bold rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.01] text-sm hover:bg-gray-850"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" />
          </svg>
          Continue with GitHub
        </button>

        <p className="text-xs text-gray-500 mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-neonBlue hover:underline font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
