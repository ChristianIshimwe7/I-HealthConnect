// web/src/services/patients.ts

import { getToken } from './auth';

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
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getPatients = async (): Promise<Patient[]> => {
  try {
    const token = getToken();
    if (!token) {
      console.warn('No token found, returning empty array');
      return [];
    }

    // Request all patients (limit 1000)
    const response = await fetch(`${API_BASE}/api/patients?limit=1000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch patients');
    }

    const data = await response.json();
    console.log('✅ Patients data received:', data.total || data.patients?.length || 0);
    
    if (data.patients && Array.isArray(data.patients)) {
      return data.patients;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching patients:', error);
    return [];
  }
};

export const createPatient = async (patient: any): Promise<Patient> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(patient),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create patient');
    }

    const data = await response.json();
    return data.patient || data;
  } catch (error) {
    console.error('❌ Error creating patient:', error);
    throw error;
  }
};
