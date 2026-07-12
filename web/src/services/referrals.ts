// src/services/referrals.ts

import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface Referral {
  id: string;
  patient_id: string;
  patient_name?: string;
  patientName?: string;
  referral_reason?: string;
  referralReason?: string;
  status: string;
  created_at: string;
  sent_at?: string;
  risk_tier?: string;
  riskTier?: string;
  overall_score?: number;
  overallScore?: number;
}

export const getReferrals = async (): Promise<any> => {
  try {
    const token = getToken();
    if (!token) {
      console.warn('⚠️ No token found for referrals');
      return [];
    }

    console.log('📊 Fetching referrals...');

    const response = await fetch(`${API_BASE}/api/referrals`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch referrals');
    }

    const result = await response.json();
    console.log('📊 Referrals data:', result);

    // Safely extract referrals array
    if (Array.isArray(result)) {
      return result;
    } else if (result && typeof result === 'object') {
      if (result.data && Array.isArray(result.data)) {
        return result.data;
      } else if (result.referrals && Array.isArray(result.referrals)) {
        return result.referrals;
      }
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error fetching referrals:', error);
    return [];
  }
};

export const updateReferralStatus = async (id: string, status: string, note?: string): Promise<any> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE}/api/referrals/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status, note }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update referral');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error updating referral:', error);
    throw error;
  }
};

export default { getReferrals, updateReferralStatus };
