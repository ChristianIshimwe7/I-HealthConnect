import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, logout } from '../services/auth';
import { RiskTier } from '../types';

const C = {
  dark: '#0F172A', surface: '#1E293B', border: '#334155',
  green: '#1D9E75', greenDark: '#0F6E56', greenLight: '#E1F5EE',
  red: '#E24B4A', redBg: '#FCEBEB', redText: '#791F1F',
  amber: '#EF9F27', amberBg: '#FAEEDA', amberText: '#633806',
  greenBadgeBg: '#EAF3DE', greenBadgeText: '#27500A',
  bg: '#F8FAFC', white: '#FFFFFF', border2: '#E2E8F0',
  text: '#0F172A', textSub: '#475569', textMuted: '#94A3B8',
  darkText: '#F1F5F9', darkMuted: '#94A3B8',
};

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string; value: string | number;
  delta?: string; deltaPositive?: boolean;
  valueColor?: string;
}
export const StatCard = ({ label, value, delta, deltaPositive, valueColor }: StatCardProps) => (
  <div style={{
    background: C.white, border: `1px solid ${C.border2}`,
    borderRadius: 8, padding: '14px 16px', flex: 1,
  }}>
    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 600, color: valueColor ?? C.text }}>{value}</div>
    {delta && (
      <div style={{ fontSize: 11, color: deltaPositive ? C.green : C.red, marginTop: 4 }}>
        {delta}
      </div>
    )}
  </div>
);

// ── RiskBadge ─────────────────────────────────────────────────────────────────
interface RiskBadgeProps { tier: RiskTier | 'monitor'; label?: string; }
export const RiskBadge = ({ tier, label }: RiskBadgeProps) => {
  const map = {
    high:     { bg: C.redBg,      text: C.redText },
    elevated: { bg: C.amberBg,    text: C.amberText },
    monitor:  { bg: C.amberBg,    text: C.amberText },
    low:      { bg: C.greenBadgeBg, text: C.greenBadgeText },
  }[tier] ?? { bg: C.bg, text: C.textMuted };
  const defaultLabel = { high:'Critical', elevated:'Elevated', monitor:'Monitor', low:'Low risk' }[tier];
  return (
    <span style={{
      background: map.bg, color: map.text,
      fontSize: 11, fontWeight: 600,
      padding: '3px 9px', borderRadius: 20,
      whiteSpace: 'nowrap',
    }}>{label ?? defaultLabel}</span>
  );
};

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps {
  label: string; onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md'; loading?: boolean; disabled?: boolean;
  icon?: React.ReactNode; type?: 'button' | 'submit';
}
export const Button = ({
  label, onClick, variant = 'primary', size = 'md',
  loading, disabled, icon, type = 'button',
}: ButtonProps) => {
  const styles = {
    primary:   { background: C.green,  color: C.greenLight, border: 'none' },
    secondary: { background: C.white,  color: C.text, border: `1px solid ${C.border2}` },
    danger:    { background: C.red,    color: C.white, border: 'none' },
  }[variant];
  const pad = size === 'sm' ? '6px 12px' : '9px 16px';
  return (
    <button
      type={type} onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...styles, padding: pad, borderRadius: 8,
        fontSize: size === 'sm' ? 12 : 13, fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'flex', alignItems: 'center', gap: 6,
        transition: 'opacity .15s',
      }}>
      {icon}{loading ? 'Loading…' : label}
    </button>
  );
};

// ── AnomalyBar ────────────────────────────────────────────────────────────────
interface AnomalyBarProps { label: string; prob: number; }
export const AnomalyBar = ({ label, prob }: AnomalyBarProps) => {
  const pct = Math.round(prob * 100);
  const color = pct >= 65 ? C.red : pct >= 40 ? C.amber : C.green;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: C.textSub, width: 130, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 7, background: C.border2, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: 7, background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 12, color, width: 32, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
    </div>
  );
};

// ── VitalChip ─────────────────────────────────────────────────────────────────
interface VitalChipProps { label: string; value: string | number; unit?: string; warning?: boolean; }
export const VitalChip = ({ label, value, unit, warning }: VitalChipProps) => (
  <div style={{ background: C.bg, borderRadius: 8, padding: '8px 10px' }}>
    <div style={{ fontSize: 11, color: C.textMuted }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 600, color: warning ? C.red : C.text, marginTop: 2 }}>
      {value}{unit ? <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 2 }}>{unit}</span> : null}
    </div>
  </div>
);

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; }
export const Modal = ({ open, onClose, title, children }: ModalProps) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: C.white, borderRadius: 12, width: 480,
        maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: `1px solid ${C.border2}`,
        }}>
          <span style={{ fontWeight: 600, color: C.text }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 18,
            color: C.textMuted, cursor: 'pointer', lineHeight: 1,
          }}>✕</button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
};

// ── PageHeader ────────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string; subtitle?: string; children?: React.ReactNode;
}
export const PageHeader = ({ title, subtitle, children }: PageHeaderProps) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  }}>
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{subtitle}</div>}
    </div>
    {children && <div style={{ display: 'flex', gap: 8 }}>{children}</div>}
  </div>
);

// ── Sidebar ───────────────────────────────────────────────────────────────────
interface NavItem { label: string; icon: string; path: string; }

const NAV: Array<{ section: string; items: NavItem[] }> = [
  { section: 'Overview', items: [
    { label: 'Dashboard',    icon: '📊', path: '/dashboard' },
    { label: 'Referrals',   icon: '📤', path: '/referrals' },
    { label: 'Patients',    icon: '👥', path: '/patients' },
  ]},
  { section: 'Analytics', items: [
    { label: 'Anomaly trends', icon: '📈', path: '/trends' },
    { label: 'District map',   icon: '🗺️', path: '/map' },
    { label: 'DHIS2 reports',  icon: '📋', path: '/reports' },
  ]},
  { section: 'Admin', items: [
    { label: 'CHW Coordinator', icon: '👷', path: '/coordinator' },
    { label: 'CHW Accounts',    icon: '✅', path: '/accounts' },
    { label: 'Settings',        icon: '⚙️', path: '/settings' },
  ]},
];

interface SidebarProps { activeRoute: string; user: User | null; }
export const Sidebar = ({ activeRoute, user }: SidebarProps) => {
  const navigate = useNavigate();
  return (
    <div style={{
      background: C.dark, width: 210, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', padding: '0 0 16px',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26, background: C.green,
          borderRadius: 6, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 14,
        }}>💚</div>
        <span style={{ color: C.darkText, fontSize: 13, fontWeight: 600 }}>I-HealthConnect</span>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {NAV.map(group => (
          <div key={group.section}>
            <div style={{
              color: '#475569', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '10px 16px 4px',
            }}>{group.section}</div>
            {group.items.map(item => {
              const active = activeRoute === item.path;
              return (
                <div key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 16px', cursor: 'pointer',
                    color: active ? '#9FE1CB' : C.darkMuted,
                    background: active ? C.greenDark : 'transparent',
                    fontSize: 13, transition: 'background .15s',
                  }}>
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  {item.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* User footer */}
      {user && (
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: C.green, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: C.greenLight,
              fontSize: 11, fontWeight: 600, flexShrink: 0,
            }}>{user.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.darkText, fontSize: 12, fontWeight: 500 }}
                className="truncate">{user.name}</div>
              <div style={{ color: C.darkMuted, fontSize: 11 }}
                className="truncate">{user.role}</div>
            </div>
            <button onClick={() => logout()} title="Sign out"
              style={{ background: 'none', border: 'none', color: C.darkMuted,
                fontSize: 14, cursor: 'pointer' }}>⏏</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Layout wrapper ────────────────────────────────────────────────────────────
interface LayoutProps { children: React.ReactNode; activeRoute: string; user: User | null; }
export const Layout = ({ children, activeRoute, user }: LayoutProps) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar activeRoute={activeRoute} user={user} />
    <main style={{ flex: 1, background: C.bg, padding: 20, overflowY: 'auto' }}>
      {children}
    </main>
  </div>
);

// ── Header ────────────────────────────────────────────────────────────────────
export const Header = () => {
  const navigate = useNavigate();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        background: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <h1 style={{ fontSize: "20px", fontWeight: "bold" }}>I‑HealthConnect</h1>
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "#2563EB",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Login
        </button>
        <button
          onClick={() => navigate("/signup")}
          style={{
            background: "#FACC15",
            color: "#000",
            padding: "8px 16px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Sign up
        </button>
      </div>
    </header>
  );
};