// src/components/Header.tsx

import React from 'react';

function Header() {
  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>I-HealthConnect</h1>
    </header>
  );
}

export default Header;
