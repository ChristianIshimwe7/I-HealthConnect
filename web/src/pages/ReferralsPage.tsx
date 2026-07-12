// src/pages/ReferralsPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, PageHeader } from '../components';
import { getStoredUser, User, getToken } from '../services/auth';
import { 
  Send, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  User,
  Calendar,
  Activity,
  RefreshCw,
  FileText
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Referral {
  id: string;
  patient_id: string;
  patient_name?: string;
  patientName?: string;
  referral_reason?: string;
  referralReason?: string;
  status: string;
  created_at: string;
  sent_at?: string;
  risk_tier?: string;
  riskTier?: string;
  overall_score?: number;
  overallScore?: number;
}

export default function ReferralsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
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
      fetchReferrals();
    }
  }, [user]);

  const fetchReferrals = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('📊 Fetching referrals...');

      const response = await fetch(`${API_BASE}/api/referrals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch referrals');
      }

      const result = await response.json();
      console.log('📊 Referrals data:', result);

      // Safely extract referrals array
      let referralList: Referral[] = [];
      
      if (Array.isArray(result)) {
        referralList = result;
      } else if (result && typeof result === 'object') {
        if (result.data && Array.isArray(result.data)) {
          referralList = result.data;
        } else if (result.referrals && Array.isArray(result.referrals)) {
          referralList = result.referrals;
        } else {
          // Try to find any array property
          for (const key in result) {
            if (Array.isArray(result[key])) {
              referralList = result[key];
              break;
            }
          }
        }
      }

      // Always ensure we have an array
      setReferrals(Array.isArray(referralList) ? referralList : []);
      console.log('✅ Found', referralList.length, 'referrals');

    } catch (err: any) {
      console.error('❌ Failed to load referrals:', err);
      setError(err.message || 'Failed to fetch referrals');
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { bg: '#FEF3C7', color: '#D97706', label: 'Pending', icon: '⏳' };
      case 'approved':
        return { bg: '#D1FAE5', color: '#065F46', label: 'Approved', icon: '✅' };
      case 'completed':
        return { bg: '#DBEAFE', color: '#1E40AF', label: 'Completed', icon: '📋' };
      case 'cancelled':
        return { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled', icon: '❌' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280', label: 'Unknown', icon: '❓' };
    }
  };

  const getRiskColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'high':
        return { bg: '#FCEBEB', color: '#DC2626', label: 'High Risk' };
      case 'elevated':
        return { bg: '#FEF3C7', color: '#D97706', label: 'Elevated' };
      case 'low':
        return { bg: '#EAF3DE', color: '#1D9E75', label: 'Low Risk' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280', label: 'Unknown' };
    }
  };

  // Safely filter referrals - always check if it's an array first
  const filteredReferrals = Array.isArray(referrals) 
    ? referrals.filter(r => filterStatus === 'all' || r?.status?.toLowerCase() === filterStatus)
    : [];

  const stats = {
    total: Array.isArray(referrals) ? referrals.length : 0,
    pending: Array.isArray(referrals) ? referrals.filter(r => r?.status?.toLowerCase() === 'pending').length : 0,
    approved: Array.isArray(referrals) ? referrals.filter(r => r?.status?.toLowerCase() === 'approved').length : 0,
    completed: Array.isArray(referrals) ? referrals.filter(r => r?.status?.toLowerCase() === 'completed').length : 0,
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
            <p style={{ color: '#94A3B8' }}>Loading referrals...</p>
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
          <h3 style={{ margin: 0, marginBottom: 8 }}>⚠️ Error Loading Referrals</h3>
          <p style={{ margin: 0 }}>{error}</p>
          <button
            onClick={fetchReferrals}
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
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: 0 }}>Referrals</h1>
            <p style={{ color: C.muted, marginTop: 4, fontSize: 14 }}>Track and manage patient referrals</p>
          </div>
          <button
            onClick={fetchReferrals}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: '#1D9E75',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: C.muted }}>Total</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{stats.total}</div>
          </div>
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: '#D97706' }}>Pending</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#D97706' }}>{stats.pending}</div>
          </div>
          <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: '#065F46' }}>Approved</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#065F46' }}>{stats.approved}</div>
          </div>
          <div style={{ background: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: 8, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: '#1E40AF' }}>Completed</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1E40AF' }}>{stats.completed}</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '8px 14px',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13,
            background: C.surface,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span style={{ fontSize: 13, color: C.muted }}>{filteredReferrals.length} referrals</span>
      </div>

      {/* Referrals List - Always check if referrals is an array */}
      {!Array.isArray(referrals) || referrals.length === 0 ? (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <Send size={48} color={C.muted} style={{ marginBottom: 16 }} />
          <h3 style={{ color: C.text, margin: 0, marginBottom: 8 }}>No Referrals</h3>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
            {filterStatus !== 'all' 
              ? 'No referrals with the selected status' 
              : 'Referrals will appear here when created.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredReferrals.map((r, index) => {
            const status = getStatusColor(r?.status);
            const risk = getRiskColor(r?.risk_tier || r?.riskTier);
            const patientName = r?.patient_name || r?.patientName || 'Unknown Patient';
            
            return (
              <div
                key={r?.id || index}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${risk.bg}, ${risk.bg}88)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 600,
                    color: risk.color
                  }}>
                    {patientName.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
                      {patientName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: C.muted }}>
                      <span>ID: {r?.patient_id || 'N/A'}</span>
                      <span>•</span>
                      <span style={{ color: risk.color, fontWeight: 500 }}>{risk.label}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: 12,
                    background: status.bg,
                    color: status.color,
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {status.label}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                    {r?.sent_at || r?.created_at 
                      ? new Date(r.sent_at || r.created_at).toLocaleDateString() 
                      : '—'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
