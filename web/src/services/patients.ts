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
      throw new Error(`Failed to fetch patients: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Patients response:', result);

    // Handle different response formats
    let patients = [];
    let total = 0;

    if (Array.isArray(result)) {
      patients = result;
      total = result.length;
    } else if (result.data && Array.isArray(result.data)) {
      patients = result.data;
      total = result.total || patients.length;
    } else if (result.patients && Array.isArray(result.patients)) {
      patients = result.patients;
      total = result.total || patients.length;
    } else {
      // Try to extract any array from the response
      for (const key in result) {
        if (Array.isArray(result[key])) {
          patients = result[key];
          total = patients.length;
          break;
        }
      }
    }

    console.log(`✅ Found ${patients.length} patients`);
    return { data: patients, total: total };
  } catch (error) {
    console.error('❌ Error fetching patients:', error);
    return { data: [], total: 0 };
  }
};

export const createPatient = async (patientData: any): Promise<any> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(patientData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create patient: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error creating patient:', error);
    throw error;
  }
};

export default { getPatients, createPatient };
