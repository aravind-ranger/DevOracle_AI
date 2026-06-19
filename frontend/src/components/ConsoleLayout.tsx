import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { RefreshCw } from 'lucide-react';

const ConsoleLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center">
        <RefreshCw className="w-10 h-10 text-neonBlue animate-spin mb-4" />
        <span className="text-gray-400 text-sm tracking-wider font-semibold">LOADING DEVCONSOLE...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0B0F19]/20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ConsoleLayout;
