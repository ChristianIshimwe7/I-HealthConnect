// src/services/dashboard.ts

import { getToken } from './auth';

export interface FormattedDashboardStats {
  totalScreened: number;
  highRiskFlagged: number;
  referralsSent: number;
  referralRate: number;
  activeCHWs: number;
  totalCHWs: number;
  lowRisk: number;  // Add this field
  anomalyBreakdown: Array<{ label: string; prob: number }>;
  recentReferrals: Array<{ id: string; name: string; district: string; tier: string; score: number; time?: string }>;
  districtChart: Array<{ district: string; screenings: number }>;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://i-healthconnect.onrender.com/api';

export const fetchDashboardStats = async (): Promise<FormattedDashboardStats> => {
  try {
    const token = getToken();
    
    const response = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }

    const data = await response.json();

    // Ensure all fields exist with defaults
    return {
      totalScreened: data.totalScreened || 0,
      highRiskFlagged: data.highRiskFlagged || 0,
      referralsSent: data.referralsSent || 0,
      referralRate: data.referralRate || 0,
      activeCHWs: data.activeCHWs || 0,
      totalCHWs: data.totalCHWs || 0,
      lowRisk: data.lowRisk || Math.max(0, (data.totalScreened || 0) - (data.highRiskFlagged || 0) - Math.floor((data.totalScreened || 0) * 0.1)),
      anomalyBreakdown: data.anomalyBreakdown || [],
      recentReferrals: data.recentReferrals || [],
      districtChart: data.districtChart || [],
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return mock data for testing
    return {
      totalScreened: 0,
      highRiskFlagged: 0,
      referralsSent: 0,
      referralRate: 0,
      activeCHWs: 0,
      totalCHWs: 0,
      lowRisk: 0,
      anomalyBreakdown: [],
      recentReferrals: [],
      districtChart: [],
    };
  }
};
