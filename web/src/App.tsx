import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getStoredUser } from './services/auth';

// Import pages
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import ReferralReviewPage from './pages/ReferralReviewPage';
import AnomalyTrendsPage from './pages/AnomalyTrendsPage';
import CoordinatorPage from './pages/CoordinatorPage';
import AccountsPage from './pages/AccountsPage';
import SettingsPage from './pages/SettingsPage';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = getStoredUser();
  if (!user) {
    console.log('🔒 No user found, redirecting to login');
    return <Navigate to="/" replace />;
  }
  console.log('✅ User found, rendering protected route');
  return <>{children}</>;
};

export default function App() {
  console.log('🚀 App rendering with all routes');
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <PatientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/referrals"
          element={
            <ProtectedRoute>
              <ReferralReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trends"
          element={
            <ProtectedRoute>
              <AnomalyTrendsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator"
          element={
            <ProtectedRoute>
              <CoordinatorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <AccountsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
