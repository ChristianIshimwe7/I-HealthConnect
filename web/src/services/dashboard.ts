// web/src/services/dashboard.ts

import { supabase } from './supabase';
import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface FormattedDashboardStats {
  totalScreened: number;
  highRiskFlagged: number;
  referralsSent: number;
  activeCHWs: number;
  totalCHWs: number;
  percentChange: number;
  referralRate: number;
  anomalyBreakdown: Array<{
    label: string;
    prob: number;
    count: number;
  }>;
  recentReferrals: Array<{
    id: string;
    name: string;
    chwName: string;
    district: string;
    time: string;
    score: number;
    tier: string;
    status: string;
  }>;
  districtChart: Array<{
    district: string;
    screenings: number;
  }>;
}

const ANOMALY_LABELS = [
  { key: 'chd', label: 'Congenital heart disease' },
  { key: 'ntd', label: 'Neural tube defect' },
  { key: 'renal', label: 'Renal anomaly' },
  { key: 'abdominal', label: 'Abdominal wall defect' },
  { key: 'cleft', label: 'Cleft lip / palate' },
];

export const fetchDashboardStats = async (): Promise<FormattedDashboardStats> => {
  try {
    console.log('📊 Fetching dashboard stats...');

    // Get patients count from the API
    const token = getToken();
    let totalScreened = 0;
    let highRiskFlagged = 0;
    let referralsSent = 0;

    if (token) {
      try {
        const patientsResponse = await fetch(`${API_BASE}/api/patients`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (patientsResponse.ok) {
          const data = await patientsResponse.json();
          totalScreened = data.patients?.length || 0;
          highRiskFlagged = data.patients?.filter((p: any) => p.risk_tier === 'high' || p.risk_tier === 'critical').length || 0;
        }

        const referralsResponse = await fetch(`${API_BASE}/api/referrals`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (referralsResponse.ok) {
          const data = await referralsResponse.json();
          referralsSent = data.referrals?.length || 0;
        }
      } catch (err) {
        console.warn('Error fetching from API, falling back to Supabase:', err);
      }
    }

    // Get CHWs count from Supabase
    const { count: totalCHWs, error: chwError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'chw');

    if (chwError) throw chwError;

    const { count: activeCHWs, error: activeError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'chw')
      .eq('active', true);

    if (activeError) throw activeError;

    // Get risk scores for anomaly breakdown
    const { data: riskData, error: riskError } = await supabase
      .from('risk_scores')
      .select('chd_prob, ntd_prob, renal_prob, abdominal_prob, cleft_prob')
      .limit(100);

    let anomalyBreakdown = ANOMALY_LABELS.map(({ key, label }) => ({
      label,
      prob: 0,
      count: 0
    }));

    if (!riskError && riskData && riskData.length > 0) {
      const totals = { chd: 0, ntd: 0, renal: 0, abdominal: 0, cleft: 0 };
      riskData.forEach((r: any) => {
        totals.chd += r.chd_prob || 0;
        totals.ntd += r.ntd_prob || 0;
        totals.renal += r.renal_prob || 0;
        totals.abdominal += r.abdominal_prob || 0;
        totals.cleft += r.cleft_prob || 0;
      });
      const count = riskData.length;
      anomalyBreakdown = ANOMALY_LABELS.map(({ key, label }) => ({
        label,
        prob: (totals[key as keyof typeof totals] / count) * 100,
        count: Math.round((totals[key as keyof typeof totals] / count) * (totalScreened || 1))
      }));
    }

    // Get recent referrals
    let recentReferrals: any[] = [];
    if (token) {
      try {
        const referralsResponse = await fetch(`${API_BASE}/api/referrals`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (referralsResponse.ok) {
          const data = await referralsResponse.json();
          recentReferrals = (data.referrals || []).slice(0, 5).map((r: any) => ({
            id: r.id,
            name: r.patientName || 'Unknown Patient',
            chwName: 'CHW',
            district: r.district || 'N/A',
            time: getTimeAgo(r.sentAt),
            score: r.riskScore ? Math.round(r.riskScore * 100) : 0,
            tier: r.riskTier || 'low',
            status: r.status || 'pending'
          }));
        }
      } catch (err) {
        console.warn('Error fetching referrals:', err);
      }
    }

    // Get district breakdown
    const { data: allPatients, error: districtError } = await supabase
      .from('patients')
      .select('district');

    let districtChart: Array<{ district: string; screenings: number }> = [];

    if (!districtError && allPatients) {
      const districtCounts: Record<string, number> = {};
      allPatients.forEach((p: any) => {
        const d = p.district || 'Unknown';
        districtCounts[d] = (districtCounts[d] || 0) + 1;
      });
      districtChart = Object.entries(districtCounts).map(([district, count]) => ({
        district,
        screenings: count
      }));
    }

    return {
      totalScreened: totalScreened || 0,
      highRiskFlagged: highRiskFlagged || 0,
      referralsSent: referralsSent || 0,
      activeCHWs: activeCHWs || 0,
      totalCHWs: totalCHWs || 0,
      percentChange: 0,
      referralRate: totalScreened ? (referralsSent || 0) / totalScreened * 100 : 0,
      anomalyBreakdown,
      recentReferrals,
      districtChart,
    };

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values
    return {
      totalScreened: 0,
      highRiskFlagged: 0,
      referralsSent: 0,
      activeCHWs: 0,
      totalCHWs: 0,
      percentChange: 0,
      referralRate: 0,
      anomalyBreakdown: ANOMALY_LABELS.map(({ label }) => ({
        label,
        prob: 0,
        count: 0
      })),
      recentReferrals: [],
      districtChart: [],
    };
  }
};

function getTimeAgo(date: string): string {
  if (!date) return 'Just now';
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'Just now';
}
