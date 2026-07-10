// src/pages/AnomalyTrendsPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, PageHeader } from '../components';
import { getStoredUser, User, getToken } from '../services/auth';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AnomalyTrendsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, high: 0, elevated: 0, low: 0 });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(storedUser);
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchTrends();
    }
  }, [user]);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('📊 Fetching anomaly trends via backend API...');

      const response = await fetch(`${API_BASE}/api/risk-scores`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch risk scores');
      }

      const result = await response.json();
      console.log('📊 Risk scores data:', result);

      const data = result.data || [];

      if (!data || data.length === 0) {
        setTrends([]);
        setSummary({ total: 0, high: 0, elevated: 0, low: 0 });
        setLoading(false);
        return;
      }

      // Calculate summary
      const high = data.filter((r: any) => r.risk_tier === 'high').length;
      const elevated = data.filter((r: any) => r.risk_tier === 'elevated').length;
      const low = data.filter((r: any) => r.risk_tier === 'low').length;

      setSummary({
        total: data.length,
        high,
        elevated,
        low,
      });

      // Format data for charts
      const formattedData = data.map((r: any) => ({
        date: r.prediction_date ? new Date(r.prediction_date).toLocaleDateString() : 'N/A',
        overall: r.overall_score || 0,
        chd: r.chd_prob || 0,
        ntd: r.ntd_prob || 0,
        renal: r.renal_prob || 0,
        abdominal: r.abdominal_prob || 0,
        cleft: r.cleft_prob || 0,
        risk_tier: r.risk_tier || 'low',
      }));

      setTrends(formattedData);
      console.log('✅ Formatted trends:', formattedData.length, 'records');

    } catch (err: any) {
      console.error('❌ Failed to load trends:', err);
      setError(err.message || 'Failed to fetch trends');
    } finally {
      setLoading(false);
    }
  };

  const C = { border: '#E2E8F0', bg: '#F8FAFC', text: '#0F172A',
              muted: '#94A3B8', sub: '#475569', green: '#1D9E75',
              surface: '#FFFFFF', dark: '#0F172A' };

  if (!user) return null;

  if (loading) {
    return (
      <Layout activeRoute={location.pathname} user={user}>
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
            <p style={{ color: '#94A3B8' }}>Loading anomaly trends...</p>
          </div>
        </div>
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
          <h3 style={{ margin: 0, marginBottom: 8 }}>Error Loading Trends</h3>
          <p style={{ margin: 0 }}>{error}</p>
          <button
            onClick={fetchTrends}
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

  return (
    <Layout activeRoute={location.pathname} user={user}>
      <PageHeader title="Anomaly Trends" subtitle={`${summary.total} total predictions`}>
        <button
          onClick={fetchTrends}
          style={{
            padding: '6px 16px',
            background: '#1D9E75',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Refresh
        </button>
      </PageHeader>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ fontSize: 13, color: C.muted }}>Total Predictions</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{summary.total}</div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ fontSize: 13, color: C.muted }}>High Risk</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#E24B4A' }}>{summary.high}</div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ fontSize: 13, color: C.muted }}>Elevated Risk</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#F59E0B' }}>{summary.elevated}</div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ fontSize: 13, color: C.muted }}>Low Risk</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1D9E75' }}>{summary.low}</div>
        </div>
      </div>

      {trends.length === 0 ? (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
          <h3 style={{ color: C.text, margin: 0, marginBottom: 8 }}>No Anomaly Data</h3>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
            Run predictions to start seeing anomaly trends here.
          </p>
        </div>
      ) : (
        <>
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: 20,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>
              Overall Risk Score Trend
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.muted }} />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} domain={[0, 1]} />
                <Tooltip contentStyle={{ background: C.dark, border: 'none', borderRadius: 8, color: '#F1F5F9', fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="overall" stroke="#1D9E75" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>
              Anomaly Type Trends
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.muted }} />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} domain={[0, 1]} />
                <Tooltip contentStyle={{ background: C.dark, border: 'none', borderRadius: 8, color: '#F1F5F9', fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="chd" stroke="#E24B4A" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="ntd" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="renal" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="abdominal" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cleft" stroke="#EC4899" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Layout>
  );
}
