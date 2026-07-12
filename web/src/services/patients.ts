// web/src/services/patients.ts

import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface Patient {
  id: number;
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
  created_at: string;
  updated_at?: string;
}

export const getPatients = async (limit = 1000, offset = 0, search = ''): Promise<any> => {
  try {
    const token = getToken();
    console.log('🔑 Token for patients:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (!token) {
      console.warn('⚠️ No token found');
      return { data: [], total: 0 };
    }

    const url = `${API_BASE}/api/patients?limit=${limit}&offset=${offset}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
    console.log('📡 Fetching patients from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Unauthorized - token may be expired');
        // Optionally redirect to login
      }
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Failed to fetch patients: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Patients data received:', data.data?.length || 0, 'patients');
    return data;
  } catch (error) {
    console.error('❌ Error fetching patients:', error);
    throw error;
  }
};

export default { getPatients };
