import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout, StatCard, AnomalyBar, RiskBadge, PageHeader } from '../components';
import { getStoredUser } from '../services/auth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ANOMALY_BREAKDOWN = [
  { label: 'Congenital heart disease', prob: 0.72 },
  { label: 'Neural tube defect',       prob: 0.54 },
  { label: 'Renal anomaly',            prob: 0.38 },
  { label: 'Abdominal wall defect',    prob: 0.22 },
  { label: 'Cleft lip / palate',       prob: 0.14 },
];

const RECENT_REFERRALS = [
  { name: 'Amina Mukamana',      sector: 'CHW Gasabo',     tier: 'high'     as const, score: 0.81, time: '2h ago' },
  { name: 'Grace Uwimana',       sector: 'CHW Nyarugenge', tier: 'elevated' as const, score: 0.61, time: '5h ago' },
  { name: 'Francine Mukamurenzi',sector: 'CHW Kicukiro',   tier: 'high'     as const, score: 0.78, time: '8h ago' },
  { name: 'Pascaline Nkurunziza',sector: 'CHW Bugesera',   tier: 'elevated' as const, score: 0.58, time: '1d ago' },
];

const DISTRICT_CHART = [
  { district: 'Gasabo',      screenings: 1240 },
  { district: 'Nyarugenge',  screenings: 980  },
  { district: 'Kicukiro',    screenings: 870  },
  { district: 'Bugesera',    screenings: 620  },
  { district: 'Rwamagana',   screenings: 540  },
  { district: 'Kayonza',     screenings: 410  },
];

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

export default function DashboardPage() {
  const user = getStoredUser();
  const location = useLocation();
  const [period, setPeriod] = useState('month');

  const C = { border: '#E2E8F0', bg: '#F8FAFC', text: '#0F172A',
              muted: '#94A3B8', sub: '#475569', green: '#1D9E75',
              surface: '#FFFFFF', dark: '#0F172A' };

  return (
    <Layout activeRoute={location.pathname} user={user}>

      {/* Top bar */}
      <PageHeader title="National screening dashboard" subtitle="Kigali · June 2026">
        <div style={{
          background: '#EAF3DE', color: '#27500A', fontSize: 11,
          fontWeight: 600, padding: '4px 10px', borderRadius: 20,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>✅ DHIS2 synced</div>
        <select value={period} onChange={e => setPeriod(e.target.value)}
          style={{ fontSize: 12, padding: '6px 10px', border: `1px solid ${C.border}`,
            borderRadius: 8, background: C.surface, color: C.text, cursor: 'pointer' }}>
          <option value="month">This month</option>
          <option value="30d">Last 30 days</option>
          <option value="q2">Q2 2026</option>
        </select>
      </PageHeader>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <StatCard label="Total screened"    value="4,821" delta="↑ +12% vs last month" deltaPositive />
        <StatCard label="High risk flagged" value="347"   valueColor="#A32D2D" delta="7.2% flag rate" />
        <StatCard label="Referrals sent"    value="289"   delta="↑ 83% referral rate" deltaPositive />
        <StatCard label="CHWs active"       value="1,204" delta="of 1,380 registered" />
      </div>

      {/* Middle grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

        {/* Anomaly breakdown */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>
            Anomaly breakdown by class
          </div>
          {ANOMALY_BREAKDOWN.map(a => (
            <AnomalyBar key={a.label} label={a.label} prob={a.prob} />
          ))}
        </div>

        {/* Recent referrals */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>
            Recent high-risk referrals
          </div>
          {RECENT_REFERRALS.map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 0', borderBottom: i < RECENT_REFERRALS.length - 1
                ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: '#DBEAFE', color: '#1E40AF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, flexShrink: 0,
              }}>{initials(r.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}
                  className="truncate">{r.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{r.sector} · {r.time}</div>
              </div>
              <RiskBadge tier={r.tier} label={`${r.tier === 'high' ? 'Critical' : 'Monitor'} · ${r.score}`} />
            </div>
          ))}
        </div>
      </div>

      {/* District chart */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>
          Screenings by district
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={DISTRICT_CHART} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="district" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: C.dark, border: 'none', borderRadius: 8,
                color: '#F1F5F9', fontSize: 12 }}
              cursor={{ fill: C.border }}
            />
            <Bar dataKey="screenings" fill="#1D9E75" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </Layout>
  );
}
