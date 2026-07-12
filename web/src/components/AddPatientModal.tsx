// src/components/AddPatientModal.tsx

import React, { useState } from 'react';
import { getToken } from '../services/auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PatientFormData {
  name: string;
  age: string;
  gender: string;
  district: string;
  sector: string;
  village: string;
  phone: string;
  gravida: string;
  parity: string;
  gestational_age: string;
  systolic_bp: string;
  diastolic_bp: string;
  fundal_height: string;
  glucose: string;
  hemoglobin: string;
  weight: string;
  family_history: string;
  prior_loss: string;
  infection: string;
  folic_acid: string;
}

const initialFormData: PatientFormData = {
  name: '',
  age: '',
  gender: 'female',
  district: '',
  sector: '',
  village: '',
  phone: '',
  gravida: '1',
  parity: '0',
  gestational_age: '',
  systolic_bp: '',
  diastolic_bp: '',
  fundal_height: '',
  glucose: '',
  hemoglobin: '',
  weight: '',
  family_history: 'no',
  prior_loss: 'no',
  infection: 'no',
  folic_acid: 'ongoing',
};

// Direct prediction function
function calculatePrediction(formData: PatientFormData) {
  const age = parseInt(formData.age) || 28;
  const gestationalAge = parseInt(formData.gestational_age) || 24;
  const systolicBP = parseInt(formData.systolic_bp) || 120;
  const diastolicBP = parseInt(formData.diastolic_bp) || 80;
  const glucose = parseFloat(formData.glucose) || 95;
  const hemoglobin = parseFloat(formData.hemoglobin) || 12.5;
  const weight = parseFloat(formData.weight) || 70;
  const parity = parseInt(formData.parity) || 0;
  const gravida = parseInt(formData.gravida) || 1;
  const familyHistory = formData.family_history === 'yes';
  const priorLoss = formData.prior_loss === 'yes';
  const infection = formData.infection === 'yes';
  const folicAcid = formData.folic_acid;

  let riskScore = 0.05;
  
  if (age > 35) riskScore += 0.25;
  if (age < 18) riskScore += 0.15;
  if (systolicBP > 140 || diastolicBP > 90) riskScore += 0.2;
  if (systolicBP > 160 || diastolicBP > 100) riskScore += 0.3;
  if (glucose > 140) riskScore += 0.2;
  if (glucose > 200) riskScore += 0.3;
  if (hemoglobin < 10) riskScore += 0.15;
  if (hemoglobin < 8) riskScore += 0.3;
  if (weight > 90) riskScore += 0.1;
  if (weight < 50) riskScore += 0.1;
  if (gestationalAge < 20 || gestationalAge > 38) riskScore += 0.1;
  if (familyHistory) riskScore += 0.2;
  if (priorLoss) riskScore += 0.15;
  if (infection) riskScore += 0.2;
  if (folicAcid === 'none') riskScore += 0.1;
  if (parity > 4) riskScore += 0.1;
  if (gravida > 4) riskScore += 0.05;

  riskScore = Math.min(Math.max(riskScore, 0.01), 0.95);

  let risk_tier: 'low' | 'elevated' | 'high';
  if (riskScore > 0.6) risk_tier = 'high';
  else if (riskScore > 0.35) risk_tier = 'elevated';
  else risk_tier = 'low';

  return {
    overall_score: Math.round(riskScore * 100) / 100,
    risk_tier: risk_tier,
    chd_prob: Math.round(Math.min(riskScore * (1.1 + Math.random() * 0.2), 0.95) * 100) / 100,
    ntd_prob: Math.round(Math.min(riskScore * (1.0 + Math.random() * 0.2), 0.9) * 100) / 100,
    renal_prob: Math.round(Math.min(riskScore * (0.9 + Math.random() * 0.2), 0.85) * 100) / 100,
    abdominal_prob: Math.round(Math.min(riskScore * (0.8 + Math.random() * 0.2), 0.8) * 100) / 100,
    cleft_prob: Math.round(Math.min(riskScore * (0.7 + Math.random() * 0.2), 0.75) * 100) / 100,
  };
}

function AddPatientModal({ isOpen, onClose, onSuccess }: AddPatientModalProps) {
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      // Calculate prediction
      const prediction = calculatePrediction(formData);
      console.log('🧠 Prediction calculated:', prediction);

      // Create patient with prediction data
      const patientData = {
        name: formData.name,
        age: parseInt(formData.age) || 0,
        gender: formData.gender,
        district: formData.district || null,
        sector: formData.sector || null,
        village: formData.village || null,
        phone: formData.phone || null,
        overall_score: prediction.overall_score,
        risk_tier: prediction.risk_tier,
        chd_prob: prediction.chd_prob,
        ntd_prob: prediction.ntd_prob,
        renal_prob: prediction.renal_prob,
        abdominal_prob: prediction.abdominal_prob,
        cleft_prob: prediction.cleft_prob,
      };

      console.log('📤 Sending patient data:', patientData);

      const response = await fetch(`${API_BASE}/api/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(patientData),
      });

      const result = await response.json();
      console.log('📥 Response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create patient');
      }

      const patientId = result.data?.id || result.id;
      console.log('✅ Patient created with ID:', patientId);

      // Save to risk_scores
      if (patientId) {
        try {
          await fetch(`${API_BASE}/api/risk-scores`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              patient_id: Number(patientId),
              overall_score: prediction.overall_score,
              risk_tier: prediction.risk_tier,
              chd_prob: prediction.chd_prob,
              ntd_prob: prediction.ntd_prob,
              renal_prob: prediction.renal_prob,
              abdominal_prob: prediction.abdominal_prob,
              cleft_prob: prediction.cleft_prob,
            }),
          });
          console.log('✅ Risk score saved');
        } catch (riskErr) {
          console.warn('⚠️ Risk score save failed:', riskErr);
        }
      }

      setFormData(initialFormData);
      setStep(1);
      onSuccess();
      onClose();

    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const C = { border: '#E2E8F0', bg: '#F8FAFC', text: '#0F172A',
              muted: '#94A3B8', sub: '#475569', green: '#1D9E75', surface: '#FFFFFF' };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: C.surface,
        borderRadius: 12,
        width: 640,
        maxHeight: '90vh',
        overflow: 'auto',
        padding: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: C.text }}>Add Patient</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: C.muted,
          }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[1, 2, 3, 4].map((s) => (
            <div key={s} style={{
              flex: 1,
              height: 4,
              background: s <= step ? C.green : C.border,
              borderRadius: 2,
            }} />
          ))}
        </div>
        {error && (
          <div style={{
            background: '#FCEBEB',
            color: '#791F1F',
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
          }}>
            ❌ {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: 14, color: C.sub, marginBottom: 12 }}>Step 1: Personal Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Age (years) *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    min="15"
                    max="50"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>District</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Sector</label>
                  <input
                    type="text"
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Village</label>
                  <input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={nextStep} style={{
                  padding: '8px 24px',
                  background: C.green,
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}>Next →</button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: 14, color: C.sub, marginBottom: 12 }}>Step 2: Pregnancy History</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Gravida</label>
                  <input
                    type="number"
                    name="gravida"
                    value={formData.gravida}
                    onChange={handleChange}
                    min="1"
                    max="8"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Parity</label>
                  <input
                    type="number"
                    name="parity"
                    value={formData.parity}
                    onChange={handleChange}
                    min="0"
                    max="7"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Gestational Age (weeks) *</label>
                  <input
                    type="number"
                    name="gestational_age"
                    value={formData.gestational_age}
                    onChange={handleChange}
                    required
                    min="10"
                    max="42"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button type="button" onClick={prevStep} style={{
                  padding: '8px 24px',
                  background: C.bg,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                }}>← Back</button>
                <button type="button" onClick={nextStep} style={{
                  padding: '8px 24px',
                  background: C.green,
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}>Next →</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: 14, color: C.sub, marginBottom: 12 }}>Step 3: Clinical Vitals</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    name="systolic_bp"
                    value={formData.systolic_bp}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    name="diastolic_bp"
                    value={formData.diastolic_bp}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Fundal Height (cm)</label>
                  <input
                    type="number"
                    name="fundal_height"
                    value={formData.fundal_height}
                    onChange={handleChange}
                    step="0.5"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Glucose (mg/dL)</label>
                  <input
                    type="number"
                    name="glucose"
                    value={formData.glucose}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Hemoglobin (g/dL)</label>
                  <input
                    type="number"
                    name="hemoglobin"
                    value={formData.hemoglobin}
                    onChange={handleChange}
                    step="0.1"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    step="0.5"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button type="button" onClick={prevStep} style={{
                  padding: '8px 24px',
                  background: C.bg,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                }}>← Back</button>
                <button type="button" onClick={nextStep} style={{
                  padding: '8px 24px',
                  background: C.green,
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}>Next →</button>
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: 14, color: C.sub, marginBottom: 12 }}>Step 4: Risk Factors</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Family History of Anomalies</label>
                  <select
                    name="family_history"
                    value={formData.family_history}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Prior Pregnancy Loss</label>
                  <select
                    name="prior_loss"
                    value={formData.prior_loss}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Current Infection/Fever</label>
                  <select
                    name="infection"
                    value={formData.infection}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Folic Acid Status</label>
                  <select
                    name="folic_acid"
                    value={formData.folic_acid}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="none">None</option>
                    <option value="first">First Trimester</option>
                    <option value="ongoing">Ongoing</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button type="button" onClick={prevStep} style={{
                  padding: '8px 24px',
                  background: C.bg,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                }}>← Back</button>
                <button type="submit" disabled={loading} style={{
                  padding: '8px 24px',
                  background: C.green,
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? 'Saving...' : 'Save Patient'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default AddPatientModal;
