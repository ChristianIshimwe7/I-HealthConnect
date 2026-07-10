export type UserRole = 'doctor' | 'supervisor' | 'coordinator' | 'admin';
export type RiskTier = 'high' | 'elevated' | 'low';
export type SyncStatus = 'synced' | 'pending' | 'offline';
export type ReferralStatus = 'pending' | 'accepted' | 'declined' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  district: string;
  initials: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gestationalAge: number;
  gravida: number;
  parity: number;
  chwSector: string;
  chwName: string;
  visitDate: string;
}

export interface RiskScore {
  id: string;
  patientId: string;
  overallScore: number;
  riskTier: RiskTier;
  chdProb: number;
  ntdProb: number;
  renalProb: number;
  abdominalProb: number;
  cleftProb: number;
  createdAt: string;
}

export interface Vitals {
  systolicBp: number;
  diastolicBp: number;
  fundalHeight: number;
  glucose: number;
  hemoglobin: number;
  weight: number;
  familyHistory: boolean;
  priorLoss: boolean;
  infection: boolean;
  folicAcid: 'none' | 'first' | 'ongoing';
}

export interface Referral {
  id: string;
  patientId: string;
  patient: Patient;
  vitals: Vitals;
  riskScore: RiskScore;
  chwNote: string;
  status: ReferralStatus;
  sentAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface DashboardStats {
  totalScreened: number;
  highRiskFlagged: number;
  referralsSent: number;
  activeChws: number;
  anomalyBreakdown: {
    chd: number; ntd: number; renal: number;
    abdominal: number; cleft: number;
  };
  recentReferrals: Array<{
    patientName: string; chwSector: string;
    riskTier: RiskTier; overallScore: number; sentAt: string;
  }>;
}

export interface ChwPerformance {
  id: string;
  name: string;
  sector: string;
  screenings: number;
  referrals: number;
  avgIntakeTime: number;
  performanceScore: number;
  syncStatus: SyncStatus;
  lastSyncAt: string;
  unsyncedCount: number;
}
