// src/components/PageHeader.tsx

import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <div>
        <h2 style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#0F172A',
          margin: 0,
          marginBottom: 4,
        }}>{title}</h2>
        {subtitle && (
          <p style={{
            fontSize: 14,
            color: '#94A3B8',
            margin: 0,
          }}>{subtitle}</p>
        )}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        {children}
      </div>
    </div>
  );
}

export default PageHeader;
