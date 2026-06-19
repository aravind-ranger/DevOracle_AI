import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BugsPage from './pages/BugsPage';
import SecurityPage from './pages/SecurityPage';
import PRReviewPage from './pages/PRReviewPage';
import SeniorPage from './pages/SeniorPage';
import RepositoryPage from './pages/RepositoryPage';
import HistoryPage from './pages/HistoryPage';
import ReviewDetailsPage from './pages/ReviewDetailsPage';

import ConsoleLayout from './components/ConsoleLayout';
import Navbar from './components/Navbar';

const queryClient = new QueryClient();

// Unauthenticated Main Site Layout
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<MainLayout><Landing /></MainLayout>} />
            <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
            <Route path="/register" element={<MainLayout><Register /></MainLayout>} />

            {/* Authenticated Dashboard Pages */}
            <Route path="/dashboard" element={<ConsoleLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="bugs" element={<BugsPage />} />
              <Route path="security" element={<SecurityPage />} />
              <Route path="pr-review" element={<PRReviewPage />} />
              <Route path="senior" element={<SeniorPage />} />
              <Route path="repository" element={<RepositoryPage />} />
              <Route path="review/:id" element={<ReviewDetailsPage />} />
            </Route>

            {/* Authenticated History Page */}
            <Route path="/history" element={<ConsoleLayout />}>
              <Route index element={<HistoryPage />} />
            </Route>

            {/* Redirect Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
