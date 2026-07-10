// src/pages/SettingsPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, PageHeader } from '../components';
import { getStoredUser, User } from '../services/auth';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(storedUser);
  }, [navigate]);

  const C = { border: '#E2E8F0', bg: '#F8FAFC', text: '#0F172A',
              muted: '#94A3B8', sub: '#475569', green: '#1D9E75',
              surface: '#FFFFFF', dark: '#0F172A' };

  if (!user) return null;

  return (
    <Layout activeRoute={location.pathname} user={user}>
      <PageHeader title="Settings" subtitle="System Configuration">
        <button style={{
          padding: '8px 16px',
          background: '#1D9E75',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500
        }}>
          Save Changes
        </button>
      </PageHeader>

      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
        <h3 style={{ color: C.text, margin: 0, marginBottom: 8 }}>System Settings</h3>
        <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
          Configure system settings and preferences here.
        </p>
      </div>
    </Layout>
  );
}