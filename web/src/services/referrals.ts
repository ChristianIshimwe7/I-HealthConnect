// web/src/services/referrals.ts

import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Referral {
  id: string;
  patientName: string;
  age: number;
  district: string;
  chwSector: string;
  riskScore: number;
  riskTier: string;
  status: string;
  referralReason: string;
  sentAt: string;
  chdProb: number;
  ntdProb: number;
  renalProb: number;
  abdominalProb: number;
  cleftProb: number;
  gestationalWeeks: number;
}

export const getReferrals = async (): Promise<Referral[]> => {
  try {
    const token = getToken();
    if (!token) {
      console.warn('No token found, returning empty array');
      return [];
    }

    const response = await fetch(`${API_BASE}/api/referrals`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch referrals');
    }

    const data = await response.json();
    
    let referrals = [];
    if (data.referrals && Array.isArray(data.referrals)) {
      referrals = data.referrals;
    } else if (Array.isArray(data)) {
      referrals = data;
    } else if (data.data && Array.isArray(data.data)) {
      referrals = data.data;
    } else {
      return [];
    }

    return referrals;
  } catch (error) {
    console.error('❌ Error fetching referrals:', error);
    return [];
  }
};

export const updateReferralStatus = async (id: string, status: string, note?: string): Promise<any> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE}/api/referrals/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status, note: note || `Updated to ${status}` }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update referral');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error updating referral:', error);
    throw error;
  }
};
