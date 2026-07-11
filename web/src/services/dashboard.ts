import { getToken } from './auth';

export interface FormattedDashboardStats {
  totalScreened: number;
  highRiskFlagged: number;
  referralsSent: number;
  referralRate: number;
  activeCHWs: number;
  totalCHWs: number;
  lowRisk: number;
  elevatedRisk: number;
  anomalyBreakdown: Array<{ label: string; prob: number }>;
  recentReferrals: Array<{ id: string; name: string; district: string; tier: string; score: number; time?: string }>;
  districtChart: Array<{ district: string; screenings: number }>;
}

const API_BASE = 'https://i-healthconnect.onrender.com';

export const fetchDashboardStats = async (): Promise<FormattedDashboardStats> => {
  try {
    const token = getToken();
    
    const response = await fetch(`${API_BASE}/api/dashboard/stats`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }

    const data = await response.json();
    console.log('📊 Dashboard data received:', data);
    
    // Ensure all fields exist
    return {
      totalScreened: data.totalScreened || 0,
      highRiskFlagged: data.highRiskFlagged || 0,
      referralsSent: data.referralsSent || 0,
      referralRate: data.referralRate || 0,
      activeCHWs: data.activeCHWs || 0,
      totalCHWs: data.totalCHWs || 0,
      lowRisk: data.lowRisk || 0,
      elevatedRisk: data.elevatedRisk || 0,
      anomalyBreakdown: data.anomalyBreakdown || [],
      recentReferrals: data.recentReferrals || [],
      districtChart: data.districtChart || [],
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};
