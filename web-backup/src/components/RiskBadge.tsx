// src/components/RiskBadge.tsx

import React from 'react';

interface RiskBadgeProps {
  tier: string;
  label: string;
}

function RiskBadge({ tier, label }: RiskBadgeProps) {
  const getColors = () => {
    switch (tier) {
      case 'high':
      case 'critical':
        return { bg: '#FCEBEB', color: '#791F1F' };
      case 'elevated':
        return { bg: '#FAEEDA', color: '#633806' };
      case 'moderate':
        return { bg: '#FEF3C7', color: '#854D0E' };
      case 'low':
        return { bg: '#EAF3DE', color: '#27500A' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280' };
    }
  };

  const colors = getColors();

  return (
    <span
      style={{
        background: colors.bg,
        color: colors.color,
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {label}
    </span>
  );
}

export default RiskBadge;
