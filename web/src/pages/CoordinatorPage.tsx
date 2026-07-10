// src/pages/CoordinatorPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout, StatCard, PageHeader } from '../components';
import { getStoredUser, User } from '../services/auth';
import { supabase } from '../services/supabase';

interface CHW {
  id: number;
  name: string;
  sector: string;
  screenings: number;
  referrals: number;
  avg_intake_minutes: number;
  last_active: string;
  status: string;  // Changed to string to accept any status value
}

interface Activity {
  id: number;
  chw_name: string;
  action: string;
  time: string;
}

const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh'
  }}>
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
      <p style={{ color: '#94A3B8' }}>Loading CHW data...</p>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default function CoordinatorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [chws, setChws] = useState<CHW[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
  }, []);

  useEffect(() => {
    if (user) {
      fetchCHWData();
    }
  }, [user]);

  const fetchCHWData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get CHWs from Supabase
      const { data: chwsData, error: chwsError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          sector,
          district,
          active
        `)
        .eq('role', 'chw');

      if (chwsError) {
        console.error('❌ CHW error:', chwsError);
        throw new Error('Failed to fetch CHW data');
      }

      console.log('📊 CHW Data:', chwsData);

      // Transform data to match component format
      const transformedChws = (chwsData || []).map((chw: any) => ({
        id: chw.id,
        name: chw.name || 'Unknown CHW',
        sector: chw.sector || chw.district || 'Unknown',
        screenings: Math.floor(Math.random() * 30) + 5, // Mock data
        referrals: Math.floor(Math.random() * 10) + 1, // Mock data
        avg_intake_minutes: 5 + Math.random() * 10, // Mock data
        last_active: new Date().toISOString(),
        status: chw.active ? 'active' : 'offline',
      }));

      setChws(transformedChws);

      // Generate recent activities
      const generatedActivities = transformedChws.slice(0, 5).map((chw: CHW) => ({
        id: chw.id,
        chw_name: chw.name,
        action: chw.screenings > 10 ? `${chw.screenings} screenings completed` : 'Recent activity',
        time: getTimeAgo(new Date().toISOString()),
      }));

      setActivities(generatedActivities);

    } catch (err: any) {
      console.error('❌ Failed to load CHW data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: string): string => {
    if (!date) return 'Just now';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#1D9E75';
      case 'pending_sync': return '#EF9F27';
      case 'offline': return '#E24B4A';
      default: return '#94A3B8';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'pending_sync': return 'Pending sync';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const perfColor = (p: number) => p >= 70 ? '#1D9E75' : p >= 50 ? '#EF9F27' : '#E24B4A';

  const C = { border: '#E2E8F0', bg: '#F8FAFC', text: '#0F172A',
              muted: '#94A3B8', sub: '#475569', surface: '#FFFFFF' };

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
          <h3 style={{ margin: 0, marginBottom: 8 }}>⚠️ Error Loading CHW Data</h3>
          <p style={{ margin: 0 }}>{error}</p>
          <button
            onClick={fetchCHWData}
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

  const activeCHWs = chws.filter(c => c.status === 'active').length;
  const totalScreenings = chws.reduce((sum, c) => sum + c.screenings, 0);
  const totalReferrals = chws.reduce((sum, c) => sum + c.referrals, 0);
  const avgIntakeTime = chws.length > 0
    ? (chws.reduce((sum, c) => sum + c.avg_intake_minutes, 0) / chws.length).toFixed(1)
    : '0';

  return (
    <Layout activeRoute={location.pathname} user={user}>
      <PageHeader title="CHW Field Coordinator" subtitle={`${chws.length} CHWs under supervision`}>
        <button style={{ padding: '7px 14px', border: `1px solid ${C.border}`,
          borderRadius: 8, background: C.surface, fontSize: 13, cursor: 'pointer' }}>
          ⬇ Export report
        </button>
        <button style={{ padding: '7px 14px', border: 'none', borderRadius: 8,
          background: '#1D9E75', color: '#E1F5EE', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add CHW
        </button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        <StatCard label="Active CHWs today" value={activeCHWs} delta={`of ${chws.length} registered`} />
        <StatCard label="Screenings this week" value={totalScreenings} />
        <StatCard label="Referrals generated" value={totalReferrals} />
        <StatCard label="Avg. Intake Time" value={`${avgIntakeTime} min`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
            Recent Field Activity
          </div>
          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.muted, padding: '30px 0' }}>
              No recent activity
            </div>
          ) : (
            activities.map((a) => (
              <div key={a.id} style={{
                padding: '8px 0',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontWeight: 500, color: C.text }}>{a.chw_name}</span>
                  <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>• {a.action}</span>
                </div>
                <span style={{ fontSize: 11, color: C.muted }}>{a.time}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
            Device Sync Status
          </div>
          {chws.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.muted, padding: '30px 0' }}>
              No CHWs registered
            </div>
          ) : (
            chws.slice(0, 5).map((chw) => (
              <div key={chw.id} style={{
                padding: '8px 0',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontWeight: 500, color: C.text }}>{chw.name}</span>
                  <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>• {chw.sector}</span>
                </div>
                <span style={{
                  fontSize: 11,
                  color: getStatusColor(chw.status),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: getStatusColor(chw.status)
                  }} />
                  {getStatusLabel(chw.status)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              {['CHW Name','Sector','Screenings','Referrals','Avg. Intake Time','Performance','Status'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left',
                  fontSize: 11, fontWeight: 600, color: C.muted,
                  textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chws.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: C.muted }}>
                  No CHWs registered yet
                </td>
              </tr>
            ) : (
              chws.map((chw) => {
                const perf = chw.screenings > 0 ? Math.min(100, Math.round((chw.screenings / 50) * 100)) : 0;
                return (
                  <tr key={chw.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 14px', color: C.text, fontWeight: 500 }}>{chw.name}</td>
                    <td style={{ padding: '10px 14px', color: C.sub }}>{chw.sector}</td>
                    <td style={{ padding: '10px 14px', color: C.text }}>{chw.screenings}</td>
                    <td style={{ padding: '10px 14px', color: C.text }}>{chw.referrals}</td>
                    <td style={{ padding: '10px 14px', color: chw.avg_intake_minutes > 5 ? '#854F0B' : C.text }}>
                      {chw.avg_intake_minutes.toFixed(1)} min
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ width: 90, height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${perf}%`, height: 6,
                          background: perfColor(perf), borderRadius: 3 }} />
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        background: chw.status === 'active' ? '#EAF3DE' : chw.status === 'pending_sync' ? '#FAEEDA' : '#FCEBEB',
                        color: chw.status === 'active' ? '#27500A' : chw.status === 'pending_sync' ? '#633806' : '#791F1F',
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <span style={{
                          display: 'inline-block',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: getStatusColor(chw.status)
                        }} />
                        {getStatusLabel(chw.status)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}