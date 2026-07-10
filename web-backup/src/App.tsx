import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getStoredUser } from './services/auth';

// Public Pages
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';

// Protected Pages
import DashboardPage from './pages/DashboardPage';
import ReferralReviewPage from './pages/ReferralReviewPage';
import PatientsPage from './pages/PatientsPage';
import CoordinatorPage from './pages/CoordinatorPage';
import AccountsPage from './pages/AccountsPage';
import SettingsPage from './pages/SettingsPage';
import AnomalyTrendsPage from './pages/AnomalyTrendsPage';

// ── Protected route wrapper ──
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = getStoredUser();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
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
          path="/patients"
          element={
            <ProtectedRoute>
              <PatientsPage />
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