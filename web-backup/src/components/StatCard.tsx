// src/components/StatCard.tsx

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
  delta?: string;
  deltaPositive?: boolean;
}

function StatCard({ label, value, valueColor = '#0F172A', delta, deltaPositive }: StatCardProps) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      padding: '16px 20px',
    }}>
      <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color: valueColor,
        marginBottom: delta ? 4 : 0,
      }}>
        {value}
      </div>
      {delta && (
        <div style={{
          fontSize: 12,
          color: deltaPositive ? '#1D9E75' : '#E24B4A',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          {deltaPositive ? '↑' : '↓'} {delta}
        </div>
      )}
    </div>
  );
}

export default StatCard;
