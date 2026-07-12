// src/components/Layout.tsx

import React, { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, logout } from '../services/auth';

interface LayoutProps {
  children: ReactNode;
  activeRoute: string;
  user: User | null;
}

function Layout({ children, activeRoute, user }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/patients', label: 'Patients' },
  ];

  if (user?.role === 'coordinator' || user?.role === 'admin') {
    navItems.push({ path: '/coordinator', label: 'CHW Coordinator' });
  }

  if (user?.role === 'admin') {
    navItems.push({ path: '/accounts', label: 'Accounts' });
    navItems.push({ path: '/settings', label: 'Settings' });
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <aside style={{
        width: 220,
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{ marginBottom: 24, paddingLeft: 8 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>I-HealthConnect</h1>
          <p style={{ fontSize: 12, color: '#94A3B8' }}>{user?.role}</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                textDecoration: 'none',
                color: activeRoute === item.path ? '#1D9E75' : '#475569',
                background: activeRoute === item.path ? '#E1F5EE' : 'transparent',
                fontWeight: activeRoute === item.path ? 600 : 400,
                fontSize: 14,
                transition: 'all 0.2s',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            background: '#FCEBEB',
            color: '#791F1F',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 14,
            width: '100%',
            marginTop: 'auto',
          }}
        >
          Logout
        </button>
      </aside>

      <main style={{ flex: 1, padding: 24, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
