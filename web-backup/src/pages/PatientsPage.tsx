// src/pages/PatientsPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, PageHeader } from '../components';
import { getStoredUser, User } from '../services/auth';
import { getPatients, Patient } from '../services/patients';
import AddPatientModal from '../components/AddPatientModal';

export default function PatientsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
      fetchPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getPatients();
      console.log('📋 Patients data in page:', data);
      setPatients(data || []);
    } catch (err: any) {
      console.error('❌ Failed to load patients:', err);
      setError(err.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientAdded = () => {
    setSuccessMessage('✅ Patient added successfully!');
    fetchPatients();
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sector?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const C = { border: '#E2E8F0', bg: '#F8FAFC', text: '#0F172A',
              muted: '#94A3B8', sub: '#475569', green: '#1D9E75',
              surface: '#FFFFFF', dark: '#0F172A' };

  if (!user) {
    return null;
  }

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
            <p style={{ color: '#94A3B8' }}>Loading patients...</p>
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
          <h3 style={{ margin: 0, marginBottom: 8 }}>⚠️ Error Loading Patients</h3>
          <p style={{ margin: 0 }}>{error}</p>
          <button
            onClick={fetchPatients}
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
      <PageHeader title="Patients" subtitle={`${patients.length} patients registered`}>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: '8px 16px',
            background: '#1D9E75',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500
          }}
        >
          + Add Patient
        </button>
      </PageHeader>

      {successMessage && (
        <div style={{
          background: '#EAF3DE',
          color: '#27500A',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
        }}>
          {successMessage}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search patients by name, district, or sector..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '10px 14px',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13,
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = C.green}
          onBlur={(e) => e.target.style.borderColor = C.border}
        />
      </div>

      {patients.length === 0 ? (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
          <h3 style={{ color: C.text, margin: 0, marginBottom: 8 }}>No Patients Yet</h3>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
            Click "Add Patient" to register a new patient.
          </p>
        </div>
      ) : (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: C.muted, fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: C.muted, fontWeight: 600 }}>Age</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: C.muted, fontWeight: 600 }}>Gender</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: C.muted, fontWeight: 600 }}>District</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: C.muted, fontWeight: 600 }}>Sector</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: C.muted, fontWeight: 600 }}>Risk Tier</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: C.muted, fontWeight: 600 }}>Score</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: C.muted, fontWeight: 600 }}>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: C.muted }}>
                    No matching patients found
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => {
                  const risk = getRiskColor(p.risk_tier);
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.text, fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted }}>{p.age || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted }}>{p.gender || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted }}>{p.district || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted }}>{p.sector || 'N/A'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: risk.bg,
                          color: risk.color,
                          padding: '2px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          textTransform: 'capitalize'
                        }}>
                          {risk.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted }}>
                        {p.overall_score ? `${Math.round(p.overall_score * 100)}%` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <AddPatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handlePatientAdded}
      />
    </Layout>
  );
}

function getRiskColor(tier?: string) {
  switch (tier) {
    case 'high':
    case 'critical':
      return { bg: '#FCEBEB', color: '#791F1F', label: 'High' };
    case 'elevated':
      return { bg: '#FAEEDA', color: '#633806', label: 'Elevated' };
    case 'moderate':
      return { bg: '#FEF3C7', color: '#854D0E', label: 'Moderate' };
    case 'low':
      return { bg: '#EAF3DE', color: '#27500A', label: 'Low' };
    default:
      return { bg: '#F3F4F6', color: '#6B7280', label: 'Pending' };
  }
}
