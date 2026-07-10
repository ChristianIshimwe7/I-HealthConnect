import React from 'react';

export default function TestPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f4f8' }}>
      <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1>✅ Test Page</h1>
        <p>This page renders without errors.</p>
        <a href="/">Go to Login</a>
      </div>
    </div>
  );
}
