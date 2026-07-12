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
  MapPin,
  Activity,
  RefreshCw
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
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch referrals');
      }

      const result = await response.json();
      console.log('📊 Referrals data:', result);

      // Handle different response formats
      let referralList: Referral[] = [];
      
      if (Array.isArray(result)) {
        referralList = result;
      } else if (result && typeof result === 'object') {
        if (result.data && Array.isArray(result.data)) {
          referralList = result.data;
        } else if (result.referrals && Array.isArray(result.referrals)) {
          referralList = result.referrals;
        } else {
          for (const key in result) {
            if (Array.isArray(result[key])) {
              referralList = result[key];
              break;
            }
          }
        }
      }

      if (!Array.isArray(referralList)) {
        referralList = [];
      }

      setReferrals(referralList);
      console.log('✅ Found', referralList.length, 'referrals');

    } catch (err: any) {
      console.error('❌ Failed to load referrals:', err);
      setError(err.message || 'Failed to fetch referrals');
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReferrals = Array.isArray(referrals) 
    ? referrals.filter(r => filterStatus === 'all' || r?.status === filterStatus)
    : [];

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Clock size={16} color="#D97706" />;
      case 'approved':
        return <CheckCircle size={16} color="#1D9E75" />;
      case 'completed':
        return <CheckCircle size={16} color="#3B82F6" />;
      case 'cancelled':
        return <XCircle size={16} color="#DC2626" />;
      default:
        return <AlertCircle size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { bg: '#FEF3C7', color: '#D97706' };
      case 'approved':
        return { bg: '#D1FAE5', color: '#065F46' };
      case 'completed':
        return { bg: '#DBEAFE', color: '#1E40AF' };
      case 'cancelled':
        return { bg: '#FEE2E2', color: '#991B1B' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280' };
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
          <h3 style={{ margin: 0, marginBottom: 8 }}>Error Loading Referrals</h3>
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
      <PageHeader 
        title="Referrals" 
        subtitle={`${referrals.length} total referrals`}
      >
        <button
          onClick={fetchReferrals}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
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
      </PageHeader>

      {/* Filter */}
      <div style={{ marginBottom: 16 }}>
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
      </div>

      {filteredReferrals.length === 0 ? (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
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
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
          gap: 16 
        }}>
          {filteredReferrals.map((r, index) => {
            const statusColor = getStatusColor(r?.status);
            const risk = getRiskColor(r?.risk_tier || r?.riskTier);
            const patientName = r?.patient_name || r?.patientName || 'Unknown Patient';
            const referralReason = r?.referral_reason || r?.referralReason || 'No reason provided';
            
            return (
              <div
                key={r?.id || index}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 20,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${C.bg}, ${C.border})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 600,
                      color: C.text
                    }}>
                      {patientName.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
                        {patientName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.muted, marginTop: 2 }}>
                        <User size={14} />
                        <span>ID: {r?.patient_id || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: 12,
                    background: statusColor.bg,
                    color: statusColor.color,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}>
                    {getStatusIcon(r?.status)}
                    {r?.status || 'Unknown'}
                  </div>
                </div>

                <div style={{ 
                  marginTop: 12,
                  padding: 12,
                  background: C.bg,
                  borderRadius: 8,
                  fontSize: 13,
                  color: C.text
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <AlertCircle size={14} color={C.muted} style={{ marginTop: 2 }} />
                    <span>{referralReason}</span>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: `1px solid ${C.border}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
                    <Activity size={14} />
                    <span>Risk: 
                      <span style={{
                        color: risk.color,
                        fontWeight: 500,
                        marginLeft: 4
                      }}>
                        {risk.label}
                      </span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
                    <Calendar size={14} />
                    <span>
                      {r?.sent_at || r?.created_at 
                        ? new Date(r.sent_at || r.created_at).toLocaleDateString() 
                        : '—'}
                    </span>
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
