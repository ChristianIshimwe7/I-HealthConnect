// src/pages/PatientsPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, PageHeader } from '../components';
import { getStoredUser, User } from '../services/auth';
import { getPatients, Patient } from '../services/patients';
import AddPatientModal from '../components/AddPatientModal';
import { 
  Users, 
  Search, 
  Plus, 
  Calendar, 
  MapPin,
  Activity,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Heart,
  Brain,
  Kidney,
  Stethoscope,
  Baby
} from 'lucide-react';

export default function PatientsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [expandedPatient, setExpandedPatient] = useState<number | null>(null);
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
      const result = await getPatients();
      let patientList: Patient[] = [];
      
      if (!result) {
        patientList = [];
      } else if (Array.isArray(result)) {
        patientList = result;
      } else if (typeof result === 'object') {
        if (result.data && Array.isArray(result.data)) {
          patientList = result.data;
        } else if (result.patients && Array.isArray(result.patients)) {
          patientList = result.patients;
        } else {
          for (const key in result) {
            if (Array.isArray(result[key])) {
              patientList = result[key];
              break;
            }
          }
        }
      }
      
      if (!Array.isArray(patientList)) {
        patientList = [];
      }
      
      setPatients(patientList);
      setError(null);
    } catch (err: any) {
      console.error('❌ Failed to load patients:', err);
      setError(err.message || 'Failed to fetch patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientAdded = () => {
    setSuccessMessage('✅ Patient added successfully!');
    fetchPatients();
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const toggleExpand = (id: number) => {
    setExpandedPatient(expandedPatient === id ? null : id);
  };

  const filteredPatients = Array.isArray(patients) 
    ? patients.filter(p => {
        const matchesSearch = 
          p?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p?.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p?.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p?.village?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterTier === 'all' || p?.risk_tier === filterTier;
        
        return matchesSearch && matchesFilter;
      })
    : [];

  const stats = {
    total: patients.length,
    high: patients.filter(p => p?.risk_tier === 'high').length,
    elevated: patients.filter(p => p?.risk_tier === 'elevated').length,
    low: patients.filter(p => p?.risk_tier === 'low').length,
  };

  const getAnomalyIcon = (type: string) => {
    switch(type) {
      case 'chd': return <Heart size={14} color="#E24B4A" />;
      case 'ntd': return <Brain size={14} color="#F59E0B" />;
      case 'renal': return <Kidney size={14} color="#3B82F6" />;
      case 'abdominal': return <Stethoscope size={14} color="#8B5CF6" />;
      case 'cleft': return <Baby size={14} color="#EC4899" />;
      default: return <Activity size={14} color="#6B7280" />;
    }
  };

  const getAnomalyLabel = (type: string) => {
    switch(type) {
      case 'chd': return 'CHD';
      case 'ntd': return 'NTD';
      case 'renal': return 'Renal';
      case 'abdominal': return 'Abdominal';
      case 'cleft': return 'Cleft';
      default: return type;
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
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: 0 }}>
              Patient Registry
            </h1>
            <p style={{ color: C.muted, marginTop: 4, fontSize: 14 }}>
              Manage and monitor all registered patients
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: '#1D9E75',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            <Plus size={18} />
            Add Patient
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color={C.muted} />
              <span style={{ fontSize: 12, color: C.muted }}>Total</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginTop: 4 }}>{stats.total}</div>
          </div>
          <div style={{ background: '#FCEBEB', border: '1px solid #FECACA', borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} color="#DC2626" />
              <span style={{ fontSize: 12, color: '#DC2626' }}>High Risk</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626', marginTop: 4 }}>{stats.high}</div>
          </div>
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="#D97706" />
              <span style={{ fontSize: 12, color: '#D97706' }}>Elevated</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#D97706', marginTop: 4 }}>{stats.elevated}</div>
          </div>
          <div style={{ background: '#EAF3DE', border: '1px solid #B8D4A0', borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={18} color="#1D9E75" />
              <span style={{ fontSize: 12, color: '#1D9E75' }}>Low Risk</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1D9E75', marginTop: 4 }}>{stats.low}</div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div style={{
          background: '#EAF3DE',
          color: '#27500A',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle size={18} />
          {successMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input
            type="text"
            placeholder="Search patients by name, district, sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              outline: 'none',
              background: C.surface,
              transition: 'border-color 0.2s'
            }}
          />
        </div>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          style={{
            padding: '10px 14px',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13,
            background: C.surface,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Risk Tiers</option>
          <option value="high">High Risk</option>
          <option value="elevated">Elevated</option>
          <option value="low">Low Risk</option>
        </select>
      </div>

      {filteredPatients.length === 0 ? (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <Users size={48} color={C.muted} style={{ marginBottom: 16 }} />
          <h3 style={{ color: C.text, margin: 0, marginBottom: 8 }}>No Patients Found</h3>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
            {searchTerm || filterTier !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Click "Add Patient" to register a new patient.'}
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
          gap: 16 
        }}>
          {filteredPatients.map((p) => {
            const risk = getRiskColor(p?.risk_tier);
            const isExpanded = expandedPatient === p.id;
            const hasAnomalies = p?.chd_prob || p?.ntd_prob || p?.renal_prob || p?.abdominal_prob || p?.cleft_prob;
            
            const anomalies = [
              { key: 'chd', label: 'CHD', value: p?.chd_prob, icon: <Heart size={14} color="#E24B4A" /> },
              { key: 'ntd', label: 'NTD', value: p?.ntd_prob, icon: <Brain size={14} color="#F59E0B" /> },
              { key: 'renal', label: 'Renal', value: p?.renal_prob, icon: <Kidney size={14} color="#3B82F6" /> },
              { key: 'abdominal', label: 'Abdominal', value: p?.abdominal_prob, icon: <Stethoscope size={14} color="#8B5CF6" /> },
              { key: 'cleft', label: 'Cleft', value: p?.cleft_prob, icon: <Baby size={14} color="#EC4899" /> },
            ];

            return (
              <div
                key={p?.id || Math.random()}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 20,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: risk.bg,
                  color: risk.color,
                  padding: '4px 16px',
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: '0 12px 0 12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {risk.label}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${risk.bg}, ${risk.bg}88)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 600,
                    color: risk.color
                  }}>
                    {p?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>
                      {p?.name || 'Unknown'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: C.muted, marginTop: 2 }}>
                      <span>{p?.age || 'N/A'} years</span>
                      <span>•</span>
                      <span>{p?.gender || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: 6, 
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: `1px solid ${C.border}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
                    <MapPin size={14} />
                    <span>{p?.district || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
                    <Calendar size={14} />
                    <span>{p?.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
                    <Activity size={14} />
                    <span>Score: {p?.overall_score ? `${Math.round(p.overall_score * 100)}%` : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
                    <Shield size={14} />
                    <span>{p?.sector || 'N/A'}</span>
                  </div>
                </div>

                {/* Anomaly Predictions Section */}
                <div style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: `1px solid ${C.border}`,
                }}>
                  <div 
                    onClick={() => toggleExpand(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.text
                    }}
                  >
                    <span>🔬 Anomaly Predictions</span>
                    <span style={{ fontSize: 11, color: C.muted }}>
                      {hasAnomalies ? 'Click to expand' : 'No predictions yet'}
                    </span>
                  </div>
                  
                  {isExpanded && hasAnomalies && (
                    <div style={{
                      marginTop: 10,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 6
                    }}>
                      {anomalies.map((anomaly) => {
                        const prob = anomaly.value || 0;
                        const percentage = Math.round(prob * 100);
                        const level = prob > 0.5 ? 'high' : prob > 0.3 ? 'medium' : 'low';
                        const levelColor = level === 'high' ? '#DC2626' : level === 'medium' ? '#D97706' : '#1D9E75';
                        
                        return (
                          <div
                            key={anomaly.key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 8px',
                              background: C.bg,
                              borderRadius: 4,
                              fontSize: 11,
                              color: C.text
                            }}
                          >
                            {anomaly.icon}
                            <span style={{ fontWeight: 500, minWidth: 50 }}>{anomaly.label}</span>
                            <span style={{ 
                              color: levelColor,
                              fontWeight: 600,
                              marginLeft: 'auto'
                            }}>
                              {percentage}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {isExpanded && !hasAnomalies && (
                    <div style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: C.muted,
                      textAlign: 'center',
                      padding: '8px'
                    }}>
                      No prediction data available for this patient.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
      return { bg: '#FCEBEB', color: '#DC2626', label: 'High Risk' };
    case 'elevated':
      return { bg: '#FEF3C7', color: '#D97706', label: 'Elevated' };
    case 'moderate':
      return { bg: '#FEF3C7', color: '#D97706', label: 'Moderate' };
    case 'low':
      return { bg: '#EAF3DE', color: '#1D9E75', label: 'Low Risk' };
    default:
      return { bg: '#F3F4F6', color: '#6B7280', label: 'Unknown' };
  }
}
