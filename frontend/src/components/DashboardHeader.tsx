import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.name || 'Developer';
    if (hour < 12) return `Good Morning, ${name} 👋`;
    if (hour < 18) return `Good Afternoon, ${name} 👋`;
    return `Good Evening, ${name} 👋`;
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border-neonBlue/15 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-neonBlue/5 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="flex items-center gap-4 relative z-10">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name || 'User Avatar'}
            className="w-16 h-16 rounded-full border-2 border-neonBlue/30 object-cover shadow-lg shadow-neonBlue/10"
            onError={(e) => {
              // Fallback to default user icon if image fails to load
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-neonBlue/20 to-neonPurple/20 border-2 border-neonBlue/20 flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-neonBlue" />
          </div>
        )}

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {getGreeting()}
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-lg">
            Welcome back to DevOracle AI. Your personalized AI development assistant is ready.
          </p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="relative z-10 shrink-0 self-start sm:self-center flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-semibold tracking-wide transition-all duration-300 shadow-lg shadow-red-500/5"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>
    </div>
  );
};

export default DashboardHeader;
