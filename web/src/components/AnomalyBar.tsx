// src/components/AnomalyBar.tsx

import React from 'react';

interface AnomalyBarProps {
  label: string;
  prob: number;
}

function AnomalyBar({ label, prob }: AnomalyBarProps) {
  const getColor = (prob: number) => {
    if (prob > 60) return '#E24B4A';
    if (prob > 30) return '#F59E0B';
    return '#1D9E75';
  };

  const displayProb = Math.min(Math.max(prob || 0, 0), 100);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        marginBottom: 4,
      }}>
        <span style={{ color: '#475569' }}>{label}</span>
        <span style={{ fontWeight: 600, color: getColor(displayProb) }}>
          {displayProb.toFixed(1)}%
        </span>
      </div>
      <div style={{
        width: '100%',
        height: 6,
        background: '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${displayProb}%`,
          height: '100%',
          background: getColor(displayProb),
          borderRadius: 3,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

export default AnomalyBar;
