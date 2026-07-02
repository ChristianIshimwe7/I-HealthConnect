import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout, AnomalyBar, VitalChip, RiskBadge } from '../components';
import { getStoredUser } from '../services/auth';

const PATIENTS = [
  {
    id: '1', name: 'Amina Mukamana',       age: 28, weeks: 24, sector: 'CHW Gasabo',
    tier: 'high' as const, score: 0.81, time: '2h ago', gravida: 'G2P1',
    vitals: { systolicBp:138, diastolicBp:90, fundalHeight:22,
              glucose:115, hemoglobin:10.2, weight:64 },
    probs:  { chd:0.78, ntd:0.61, renal:0.34, abdominal:0.18, cleft:0.09 },
    flags:  ['Family history of anomalies', 'No folic acid supplementation', 'Elevated BP trend'],
  },
  {
    id: '2', name: 'Francine Mukamurenzi', age: 32, weeks: 19, sector: 'CHW Kicukiro',
    tier: 'high' as const, score: 0.78, time: '5h ago', gravida: 'G3P2',
    vitals: { systolicBp:142, diastolicBp:94, fundalHeight:18,
              glucose:128, hemoglobin:9.8, weight:72 },
    probs:  { chd:0.72, ntd:0.55, renal:0.40, abdominal:0.22, cleft:0.11 },
    flags:  ['Elevated glucose', 'Prior pregnancy loss', 'No folic acid supplementation'],
  },
  {
    id: '3', name: 'Grace Uwimana',         age: 22, weeks: 18, sector: 'CHW Nyarugenge',
    tier: 'elevated' as const, score: 0.61, time: '5h ago', gravida: 'G1P0',
    vitals: { systolicBp:128, diastolicBp:84, fundalHeight:17,
              glucose:105, hemoglobin:11.0, weight:58 },
    probs:  { chd:0.55, ntd:0.48, renal:0.28, abdominal:0.14, cleft:0.07 },
    flags:  ['Family history of anomalies'],
  },
  {
    id: '4', name: 'Pascaline Nkurunziza',  age: 29, weeks: 30, sector: 'CHW Bugesera',
    tier: 'elevated' as const, score: 0.58, time: '1d ago', gravida: 'G2P1',
    vitals: { systolicBp:124, diastolicBp:82, fundalHeight:28,
              glucose:98, hemoglobin:11.4, weight:68 },
    probs:  { chd:0.50, ntd:0.44, renal:0.30, abdominal:0.16, cleft:0.08 },
    flags:  ['Elevated BP trend'],
  },
  {
    id: '5', name: 'Josephine Murebwayire', age: 25, weeks: 22, sector: 'CHW Rwamagana',
    tier: 'high' as const, score: 0.76, time: '1d ago', gravida: 'G2P1',
    vitals: { systolicBp:136, diastolicBp:88, fundalHeight:20,
              glucose:118, hemoglobin:10.0, weight:60 },
    probs:  { chd:0.70, ntd:0.58, renal:0.36, abdominal:0.20, cleft:0.10 },
    flags:  ['Family history of anomalies', 'Current infection'],
  },
];

const initials = (name: string) => name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

export default function ReferralReviewPage() {
  const user = getStoredUser();
  const location = useLocation();
  const [selectedId, setSelectedId] = useState(PATIENTS[0].id);
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [accepted, setAccepted] = useState<string[]>([]);

  const filtered = PATIENTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()));

  const patient = PATIENTS.find(p => p.id === selectedId) ?? PATIENTS[0];

  const tierConfig = {
    high:     { color: '#E24B4A', bg: '#FCEBEB', label: 'High anomaly risk', banner: '#FCEBEB', bannerBorder: '#F09595' },
    elevated: { color: '#EF9F27', bg: '#FAEEDA', label: 'Elevated risk',     banner: '#FAEEDA', bannerBorder: '#F5C882' },
    low:      { color: '#1D9E75', bg: '#EAF3DE', label: 'Low risk',          banner: '#EAF3DE', bannerBorder: '#86EFAC' },
  }[patient.tier];

  const C = { border: '#E2E8F0', bg: '#F8FAFC', text: '#0F172A',
              muted: '#94A3B8', surface: '#FFFFFF' };

  return (
    <Layout activeRoute={location.pathname} user={user}>
      <div style={{ display: 'flex', height: 'calc(100vh - 40px)',
        border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>

        {/* ── Patient list ── */}
        <div style={{ width: 280, flexShrink: 0, borderRight: `1px solid ${C.border}`,
          background: C.surface, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Referral queue</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {PATIENTS.length} pending · Kigali district
            </div>
          </div>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}` }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search patient name…"
              style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`,
                borderRadius: 8, fontSize: 13, background: C.bg, color: C.text,
                outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => setSelectedId(p.id)}
                style={{
                  padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
                  cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
                  background: selectedId === p.id ? '#E1F5EE' : C.surface,
                  borderLeft: selectedId === p.id ? '3px solid #1D9E75' : '3px solid transparent',
                }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%',
                  background: '#DBEAFE', color: '#1E40AF', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                  {initials(p.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}
                    className="truncate">{p.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {p.age} yrs · {p.weeks} wks · {p.sector}
                  </div>
                  <RiskBadge tier={p.tier}
                    label={`${p.tier === 'high' ? 'Critical' : 'Elevated'} · ${p.score}`} />
                </div>
                <span style={{ fontSize: 10, color: C.muted, flexShrink: 0, marginTop: 2 }}>
                  {p.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Detail panel ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: C.bg }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{patient.name}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                {patient.age} years · {patient.gravida} · {patient.weeks} weeks · {patient.sector}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '8px 14px', border: `1px solid ${C.border}`,
                borderRadius: 8, background: C.surface, fontSize: 13, cursor: 'pointer' }}>
                Request more info
              </button>
              <button
                onClick={() => setAccepted(a => [...a, patient.id])}
                style={{ padding: '8px 14px', border: 'none', borderRadius: 8,
                  background: accepted.includes(patient.id) ? '#0F6E56' : '#1D9E75',
                  color: '#E1F5EE', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {accepted.includes(patient.id) ? '✓ Accepted' : 'Accept referral ↗'}
              </button>
            </div>
          </div>

          {/* Risk banner */}
          <div style={{ background: tierConfig.banner, border: `1px solid ${tierConfig.bannerBorder}`,
            borderRadius: 8, padding: '12px 16px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: tierConfig.color }}>
                {tierConfig.label} detected
              </div>
              <div style={{ fontSize: 12, color: tierConfig.color, marginTop: 2 }}>
                Congenital heart disease probability: {Math.round(patient.probs.chd * 100)}% · Refer for ultrasound
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: tierConfig.color }}>
              {patient.score}
            </div>
          </div>

          {/* Vitals */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase',
              letterSpacing: '0.05em', marginBottom: 10 }}>Clinical vitals at CHW visit</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <VitalChip label="Systolic BP"    value={patient.vitals.systolicBp}  unit="mmHg" warning={patient.vitals.systolicBp > 130} />
              <VitalChip label="Diastolic BP"   value={patient.vitals.diastolicBp} unit="mmHg" warning={patient.vitals.diastolicBp > 85} />
              <VitalChip label="Fundal height"  value={patient.vitals.fundalHeight} unit="cm" />
              <VitalChip label="Blood glucose"  value={patient.vitals.glucose}     unit="mg/dL" warning={patient.vitals.glucose > 110} />
              <VitalChip label="Hemoglobin"     value={patient.vitals.hemoglobin}  unit="g/dL" warning={patient.vitals.hemoglobin < 11} />
              <VitalChip label="Weight"         value={patient.vitals.weight}      unit="kg" />
            </div>
          </div>

          {/* Anomaly probs */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase',
              letterSpacing: '0.05em', marginBottom: 12 }}>ML model anomaly probabilities</div>
            <AnomalyBar label="Congenital heart disease" prob={patient.probs.chd} />
            <AnomalyBar label="Neural tube defect"       prob={patient.probs.ntd} />
            <AnomalyBar label="Renal anomaly"            prob={patient.probs.renal} />
            <AnomalyBar label="Abdominal wall defect"    prob={patient.probs.abdominal} />
            <AnomalyBar label="Cleft lip / palate"       prob={patient.probs.cleft} />
          </div>

          {/* Flags */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase',
              letterSpacing: '0.05em', marginBottom: 10 }}>Risk history flags</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {patient.flags.map((f, i) => (
                <span key={i} style={{ background: '#FCEBEB', color: '#791F1F',
                  fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>⚠ {f}</span>
              ))}
            </div>
          </div>

          {/* Doctor's note */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase',
              letterSpacing: '0.05em', marginBottom: 8 }}>Doctor's note</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder="Add clinical notes before accepting or declining referral…"
              style={{ width: '100%', padding: '9px 11px', border: `1px solid ${C.border}`,
                borderRadius: 8, fontSize: 13, color: C.text, background: C.surface,
                resize: 'none', outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box' as const }} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
