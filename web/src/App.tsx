import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TestPage from './pages/TestPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
// Force rebuild - Sat Jul 11 14:17:22 SAST 2026
