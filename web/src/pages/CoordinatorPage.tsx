import React from 'react';
import { useLocation } from 'react-router-dom';
import { Layout, StatCard, PageHeader } from '../components';
import { getStoredUser } from '../services/auth';

const ACTIVITY = [
  { dot: '#1D9E75', text: 'CHW Uwera completed 6 screenings',          time: '12m ago' },
  { dot: '#E24B4A', text: 'High-risk referral sent — Amina M.',         time: '2h ago'  },
  { dot: '#EF9F27', text: 'CHW Nkusi synced 14 offline records',         time: '3h ago'  },
  { dot: '#1D9E75', text: 'CHW Ingabire completed onboarding training',  time: '5h ago'  },
  { dot: '#EF9F27', text: 'CHW Habimana offline — 8 records cached',     time: '6h ago'  },
];

const SYNC_STATUS = [
  { name: 'CHW Uwera',    sector: 'Gasabo',   sub: 'Last sync: 12 min ago',     status: 'synced'  as const },
  { name: 'CHW Nkusi',    sector: 'Remera',   sub: 'Last sync: 3 hrs ago',      status: 'synced'  as const },
  { name: 'CHW Habimana', sector: 'Kimironko',sub: '8 records pending upload',   status: 'pending' as const },
  { name: 'CHW Ingabire', sector: 'Gisozi',   sub: 'No connection detected',     status: 'offline' as const },
];

const CHW_TABLE = [
  { name: 'Claudine Uwera',     sector: 'Gasabo',      screenings: 48, referrals: 4, avgTime: 4.2, perf: 88, status: 'Active' as const },
  { name: 'Eric Nkusi',         sector: 'Remera',      screenings: 39, referrals: 3, avgTime: 4.8, perf: 72, status: 'Active' as const },
  { name: 'Alice Habimana',     sector: 'Kimironko',   screenings: 31, referrals: 5, avgTime: 5.1, perf: 60, status: 'Pending sync' as const },
  { name: 'Jean Ingabire',      sector: 'Gisozi',      screenings: 22, referrals: 2, avgTime: 6.3, perf: 42, status: 'Offline' as const },
  { name: 'Marie Mukagatare',   sector: 'Nyamirambo',  screenings: 17, referrals: 1, avgTime: 7.1, perf: 28, status: 'Active' as const },
];

const syncBadge = (s: 'synced'|'pending'|'offline') => ({
  synced:  { bg: '#EAF3DE', text: '#27500A', label: 'Synced' },
  pending: { bg: '#FAEEDA', text: '#633806', label: 'Pending' },
  offline: { bg: '#F1F5F9', text: '#94A3B8', label: 'Offline' },
}[s]);

const perfColor = (p: number) => p >= 70 ? '#1D9E75' : p >= 50 ? '#EF9F27' : '#E24B4A';

const statusDot = (s: string) =>
  s === 'Active' ? '#1D9E75' : s === 'Pending sync' ? '#EF9F27' : '#94A3B8';

const C = { border: '#E2E8F0', bg: '#F8FAFC', text: '#0F172A',
            muted: '#94A3B8', sub: '#475569', surface: '#FFFFFF' };

export default function CoordinatorPage() {
  const user = getStoredUser();
  const location = useLocation();

  return (
    <Layout activeRoute={location.pathname} user={user}>

      <PageHeader title="CHW field coordinator" subtitle="Gasabo sector · 87 CHWs under supervision">
        <button style={{ padding: '7px 14px', border: `1px solid ${C.border}`,
          borderRadius: 8, background: C.surface, fontSize: 13, cursor: 'pointer' }}>
          ⬇ Export report
        </button>
        <button style={{ padding: '7px 14px', border: 'none', borderRadius: 8,
          background: '#1D9E75', color: '#E1F5EE', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add CHW
        </button>
      </PageHeader>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        <StatCard label="Active CHWs today"    value="64"  delta="of 87 registered" />
        <StatCard label="Screenings this week" value="312" delta="↑ +18% vs last week" deltaPositive />
        <StatCard label="Unsynced records"     value="47"  valueColor="#854F0B" delta="Awaiting connectivity" />
        <StatCard label="Referrals generated"  value="28"  delta="9% referral rate" />
      </div>

      {/* Activity + Sync */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
            Recent field activity
          </div>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: i < ACTIVITY.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%',
                background: a.dot, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: C.text }}>{a.text}</span>
              <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>{a.time}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
            Device sync status
          </div>
          {SYNC_STATUS.map((s, i) => {
            const badge = syncBadge(s.status);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 0', borderBottom: i < SYNC_STATUS.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
                    {s.name} · {s.sector}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.sub}</div>
                </div>
                <span style={{ background: badge.bg, color: badge.text,
                  fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHW performance table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              {['CHW name','Sector','Screenings','Referrals','Avg. intake time','Performance','Status'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left',
                  fontSize: 11, fontWeight: 600, color: C.muted,
                  textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CHW_TABLE.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < CHW_TABLE.length - 1
                ? `1px solid ${C.border}` : 'none' }}>
                <td style={{ padding: '10px 14px', color: C.text, fontWeight: 500 }}>{row.name}</td>
                <td style={{ padding: '10px 14px', color: C.sub }}>{row.sector}</td>
                <td style={{ padding: '10px 14px', color: C.text }}>{row.screenings}</td>
                <td style={{ padding: '10px 14px', color: C.text }}>{row.referrals}</td>
                <td style={{ padding: '10px 14px', color: row.avgTime > 5 ? '#854F0B' : C.text }}>
                  {row.avgTime} min
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ width: 90, height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${row.perf}%`, height: 6,
                      background: perfColor(row.perf), borderRadius: 3 }} />
                  </div>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.sub }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%',
                      background: statusDot(row.status), display: 'inline-block' }} />
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
