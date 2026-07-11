import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface DashboardStats {
  totalScreened: number;
  highRiskFlagged: number;
  elevatedRiskFlagged: number;
  lowRiskFlagged: number;
  referralsSent: number;
  referralRate: number;
  activeCHWs: number;
  totalCHWs: number;
  anomalyBreakdown: Array<{ label: string; prob: number }>;
  recentReferrals: Array<any>;
  districtChart: Array<{ district: string; screenings: number }>;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const token = getToken();
    
    const response = await fetch(`${API_BASE}/api/dashboard/stats`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Dashboard error:', error);
    throw error;
  }
};
