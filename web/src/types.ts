export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  district?: string;
  created_at?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  district: string;
  sector: string;
  village?: string;
  phone?: string;
  chd_prob?: number;
  ntd_prob?: number;
  renal_prob?: number;
  abdominal_prob?: number;
  cleft_prob?: number;
  overall_score?: number;
  risk_tier?: string;
  chw_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface Referral {
  id: string;
  patient_id: string;
  chw_id?: string;
  risk_score_id?: string;
  referral_reason?: string;
  referral_to?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  sent_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  patientName?: string;
  riskScore?: number;
  riskTier?: string;
}

export interface RiskScore {
  id: string;
  patient_id: string;
  visit_id?: string;
  overall_score?: number;
  risk_tier?: string;
  chd_prob?: number;
  ntd_prob?: number;
  renal_prob?: number;
  abdominal_prob?: number;
  cleft_prob?: number;
  created_at: string;
}
