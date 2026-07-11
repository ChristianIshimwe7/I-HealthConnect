// src/pages/DashboardPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout, StatCard, AnomalyBar, RiskBadge, PageHeader } from '../components';
import { getStoredUser, User, getToken } from '../services/auth';
import { fetchDashboardStats, FormattedDashboardStats } from '../services/dashboard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid #E2E8F0',
        borderTop: '3px solid #1D9E75',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px'
      }} />
      <p style={{ color: '#94A3B8' }}>Loading dashboard data...</p>
    </div>
  </div>
);

const initials = (name: string) =>
  name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

const COLORS = ['#1D9E75', '#F59E0B', '#E24B4A', '#3B82F6', '#8B5CF6'];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<FormattedDashboardStats | null>(null);
  const location = useLocation();

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchDashboardStats();
      console.log('📊 Dashboard data received:', data);
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const C = { border: '#E2E8F0', bg: '#F8FAFC', text: '#0F172A',
              muted: '#94A3B8', sub: '#475569', green: '#1D9E75',
              surface: '#FFFFFF', dark: '#0F172A' };

  if (!user) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading user...</div>;
  }

  if (loading) {
    return (
      <Layout activeRoute={location.pathname} user={user}>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout activeRoute={location.pathname} user={user}>
        <div style={{
          background: '#FCEBEB',
          border: '1px solid #E24B4A',
          borderRadius: 8,
          padding: '20px 24px',
          color: '#791F1F'
        }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>Error Loading Dashboard</h3>
          <p style={{ margin: 0 }}>{error}</p>
          <button
            onClick={loadDashboardData}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              background: '#1D9E75',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  if (!stats || stats.totalScreened === 0) {
    return (
      <Layout activeRoute={location.pathname} user={user}>
        <PageHeader title="National screening dashboard" subtitle="Kigali · June 2026">
          <div style={{
            background: '#FAEEDA', color: '#633806', fontSize: 11,
            fontWeight: 600, padding: '4px 10px', borderRadius: 20,
          }}>No Data Yet</div>
        </PageHeader>
        <div style={{ textAlign: 'center', padding: '80px 20px', color: C.muted }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
          <h3 style={{ color: C.text, marginBottom: 8 }}>No Data Available</h3>
          <p style={{ fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
            Start screening patients to see statistics here.
          </p>
        </div>
      </Layout>
    );
  }

  // Calculate lowRisk if not provided
  const lowRisk = stats.lowRisk || Math.max(0, stats.totalScreened - stats.highRiskFlagged - Math.floor(stats.totalScreened * 0.1));

  // Prepare pie chart data using actual values
  const pieData = [
    { name: 'High Risk', value: stats.highRiskFlagged || 0 },
    { name: 'Elevated', value: stats.totalScreened > 0 ? Math.max(0, stats.totalScreened - stats.highRiskFlagged - lowRisk) : 0 },
    { name: 'Low Risk', value: lowRisk || 0 },
  ].filter(d => d.value > 0);

  return (
    <Layout activeRoute={location.pathname} user={user}>
      <PageHeader title="National screening dashboard" subtitle="Kigali · June 2026">
        <div style={{
          background: '#EAF3DE', color: '#27500A', fontSize: 11,
          fontWeight: 600, padding: '4px 10px', borderRadius: 20,
        }}>✅ Live Data</div>
      </PageHeader>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <StatCard label="Total screened" value={stats.totalScreened.toLocaleString()} delta="+0% vs last month" deltaPositive />
        <StatCard label="High risk flagged" value={stats.highRiskFlagged.toLocaleString()} valueColor="#A32D2D" delta={`${stats.totalScreened > 0 ? Math.round((stats.highRiskFlagged / stats.totalScreened) * 100) : 0}% flag rate`} />
        <StatCard label="Referrals sent" value={stats.referralsSent.toLocaleString()} delta={`${Math.round(stats.referralRate)}% referral rate`} deltaPositive />
        <StatCard label="CHWs active" value={stats.activeCHWs.toLocaleString()} delta={`of ${stats.totalCHWs.toLocaleString()} registered`} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Anomaly Breakdown */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>
            Anomaly breakdown by class
          </div>
          {stats.anomalyBreakdown.every((a: any) => a.prob === 0) ? (
            <div style={{ textAlign: 'center', color: C.muted, padding: '30px 0', fontSize: 14 }}>
              No anomalies detected
            </div>
          ) : (
            stats.anomalyBreakdown.map((a: any) => (
              <AnomalyBar key={a.label} label={a.label} prob={a.prob || 0} />
            ))
          )}
        </div>

        {/* Risk Distribution Pie Chart */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>
            Risk Distribution
          </div>
          {pieData.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.muted, padding: '30px 0', fontSize: 14 }}>
              No risk data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Referrals */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>
          Recent Referrals
        </div>
        {stats.recentReferrals.length === 0 ? (
          <div style={{ textAlign: 'center', color: C.muted, padding: '20px 0', fontSize: 14 }}>
            No referrals yet
          </div>
        ) : (
          stats.recentReferrals.map((r: any, i: number) => (
            <div key={r.id || i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 0', borderBottom: i < stats.recentReferrals.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: '#DBEAFE', color: '#1E40AF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, flexShrink: 0,
              }}>{initials(r.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{r.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  Sector: {r.district} · {r.time || 'Just now'}
                </div>
              </div>
              <RiskBadge tier={r.tier || 'low'} label={`${r.tier === 'high' ? 'Critical' : r.tier === 'elevated' ? 'Monitor' : 'Low'} · ${r.score || 0}%`} />
            </div>
          ))
        )}
      </div>

      {/* District Chart */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>
          Screenings by district
        </div>
        {stats.districtChart.length === 0 ? (
          <div style={{ textAlign: 'center', color: C.muted, padding: '40px 0', fontSize: 14 }}>
            No district data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.districtChart} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="district" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.dark, border: 'none', borderRadius: 8, color: '#F1F5F9', fontSize: 12 }} cursor={{ fill: C.border }} />
              <Bar dataKey="screenings" fill="#1D9E75" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Layout>
  );
}
