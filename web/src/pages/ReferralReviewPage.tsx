// src/pages/ReferralReviewPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, PageHeader, RiskBadge } from '../components';
import { getStoredUser, User, getToken } from '../services/auth';
import { getReferrals, Referral, updateReferralStatus } from '../services/referrals';
import { getPatients, Patient } from '../services/patients';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ReferralReviewPage() {
  const [user, setUser] = useState<User | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
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
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [referralsData, patientsData] = await Promise.all([
        getReferrals(),
        getPatients(),
      ]);
      
      setReferrals(referralsData || []);
      setPatients(patientsData || []);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const createReferral = async (patientId: number, status: string) => {
    try {
      const token = getToken();
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_BASE}/api/referrals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: patientId,
          chw_id: user?.id || 12,
          referral_reason: `Referral status: ${status}`,
          status: status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create referral');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
  };

  const handleStatusUpdate = async (patientId: number, patientName: string, status: string) => {
    try {
      setUpdatingId(patientId);
      
      // Check if patient already has a referral
      const existingReferral = referrals.find(r => r.patientName === patientName);
      
      if (existingReferral) {
        // Update existing referral
        await updateReferralStatus(existingReferral.id, status, `Updated to ${status} by ${user?.name || 'Doctor'}`);
      } else {
        // Create new referral with selected status
        await createReferral(patientId, status);
      }
      
      // Refresh data
      await fetchData();
      
      console.log(`Patient ${patientName} status updated to ${status}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getCombinedList = () => {
    const referralMap: Record<string, any> = {};
    referrals.forEach(r => {
      referralMap[r.patientName] = r;
    });

    const combined = patients.map(p => {
      const referral = referralMap[p.name];
      return {
        id: p.id,
        referralId: referral?.id || null,
        name: p.name,
        age: p.age,
        district: p.district,
        sector: p.sector,
        riskScore: p.overall_score || 0,
        riskTier: p.risk_tier || 'pending',
        status: referral?.status || 'pending',
        referralReason: referral?.referralReason || 'No referral created yet',
        sentAt: referral?.sentAt || p.created_at,
        hasReferral: !!referral,
      };
    });

    if (filter === 'all') return combined;
    return combined.filter(c => c.status === filter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#FAEEDA', color: '#633806', label: 'Pending' };
      case 'approved': return { bg: '#DBEAFE', color: '#1E40AF', label: 'Approved' };
      case 'completed': return { bg: '#EAF3DE', color: '#27500A', label: 'Completed' };
      case 'cancelled': return { bg: '#FCEBEB', color: '#791F1F', label: 'Cancelled' };
      default: return { bg: '#F3F4F6', color: '#6B7280', label: 'Pending' };
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

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
            <p style={{ color: '#94A3B8' }}>Loading data...</p>
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
          <h3 style={{ margin: 0, marginBottom: 8 }}>Error Loading Data</h3>
          <p style={{ margin: 0 }}>{error}</p>
          <button
            onClick={fetchData}
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

  const combinedList = getCombinedList();

  return (
    <Layout activeRoute={location.pathname} user={user}>
      <PageHeader title="Patient Referrals" subtitle={`${patients.length} patients · ${referrals.length} with referrals`}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '6px 12px',
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            fontSize: 13,
            background: C.surface,
            cursor: 'pointer',
          }}
        >
          <option value="all">All Patients</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </PageHeader>

      {combinedList.length === 0 ? (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{ color: C.text, margin: 0, marginBottom: 8 }}>No Patients Found</h3>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
            No patients have been registered yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {combinedList.map((item) => {
            const status = getStatusColor(item.status);
            const risk = item.riskTier || 'pending';
            const isUpdating = updatingId === item.id;
            
            return (
              <div key={item.id} style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                {/* Patient Info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 16, color: C.text }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: 13, color: C.muted }}>
                      Age {item.age || 'N/A'}
                    </span>
                    {item.riskTier === 'high' && (
                      <span style={{
                        fontSize: 10,
                        background: '#FCEBEB',
                        color: '#791F1F',
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontWeight: 600,
                      }}>
                        High Risk
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: C.muted }}>
                    {item.district || 'N/A'} · {item.sector || 'N/A'}
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    Score: {item.riskScore ? Math.round(item.riskScore * 100) : 0}% · 
                    Risk: <RiskBadge tier={risk} label={risk} />
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {item.referralReason || 'No referral created yet'}
                  </div>
                </div>
                
                {/* Status Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Status Badge */}
                  <span style={{
                    background: status.bg,
                    color: status.color,
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    minWidth: 80,
                    textAlign: 'center',
                  }}>
                    {status.label}
                  </span>
                  
                  {/* Status Dropdown */}
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusUpdate(item.id, item.name, e.target.value)}
                    disabled={isUpdating}
                    style={{
                      padding: '6px 10px',
                      border: `1px solid ${C.border}`,
                      borderRadius: 4,
                      fontSize: 12,
                      cursor: isUpdating ? 'not-allowed' : 'pointer',
                      background: isUpdating ? '#F3F4F6' : C.surface,
                      opacity: isUpdating ? 0.6 : 1,
                      minWidth: 120,
                    }}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  
                  {isUpdating && (
                    <span style={{ fontSize: 12, color: C.muted }}>Updating...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
