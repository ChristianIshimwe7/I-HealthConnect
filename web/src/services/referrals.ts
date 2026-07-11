import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const getReferrals = async (status?: string) => {
  try {
    const token = getToken();
    const url = status ? `${API_BASE}/api/referrals?status=${status}` : `${API_BASE}/api/referrals`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch referrals: ${response.status}`);
    }

    const data = await response.json();
    return data.referrals || data;
  } catch (error) {
    console.error('Referrals error:', error);
    throw error;
  }
};

export const createReferral = async (referralData: any) => {
  try {
    const token = getToken();
    
    const response = await fetch(`${API_BASE}/api/referrals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(referralData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create referral: ${response.status}`);
    }

    const data = await response.json();
    return data.referral || data;
  } catch (error) {
    console.error('Create referral error:', error);
    throw error;
  }
};

export const updateReferralStatus = async (id: string, status: string, note?: string) => {
  try {
    const token = getToken();
    
    const response = await fetch(`${API_BASE}/api/referrals/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ status, note }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update referral: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update referral error:', error);
    throw error;
  }
};
