import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, LogOut, User as UserIcon, Code2, History } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-gray-800 bg-[#0B0F19]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="relative p-2 bg-gradient-to-tr from-neonBlue to-neonPurple rounded-xl overflow-hidden shadow-neonBlue">
          <Terminal className="w-5 h-5 text-black" />
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-white via-gray-300 to-neonBlue bg-clip-text text-transparent">
          DEVORACLE <span className="text-neonBlue">AI</span>
        </span>
      </Link>

      <div className="flex items-center gap-6">
        {isAuthenticated ? (
          <>
            <Link
              to="/dashboard"
              className="text-gray-300 hover:text-neonBlue transition-colors duration-200 flex items-center gap-1.5 text-sm font-medium"
            >
              <Code2 className="w-4 h-4" />
              Console
            </Link>
            <Link
              to="/history"
              className="text-gray-300 hover:text-neonBlue transition-colors duration-200 flex items-center gap-1.5 text-sm font-medium"
            >
              <History className="w-4 h-4" />
              History
            </Link>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
              <div className="flex items-center gap-2.5">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-neonBlue/30 hover:border-neonBlue transition-colors duration-300"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-neonPurple/30">
                    <UserIcon className="w-4 h-4 text-neonPurple" />
                  </div>
                )}
                <span className="text-sm font-semibold text-gray-200 hidden sm:inline">Hi, {user?.name}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-neonRed hover:bg-neonRed/10 rounded-lg transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-gray-300 hover:text-white transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-bold text-black bg-gradient-to-r from-neonBlue to-[#00C2FF] rounded-lg hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all duration-300 hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
