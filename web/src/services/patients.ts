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
  updated_at?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export const getPatients = async (): Promise<Patient[]> => {
  try {
    const token = getToken();
    if (!token) {
      console.warn('No token found, returning empty array');
      return [];
    }

    const url = API_BASE ? `${API_BASE}/api/patients?limit=1000` : `/api/patients?limit=1000`;
    
    const response = await fetch(url, {
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
    console.log('✅ Patients data received:', data.length || 0);

    if (Array.isArray(data)) {
      return data;
    } else if (data.patients && Array.isArray(data.patients)) {
      return data.patients;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching patients:', error);
    return [];
  }
};

export const getPatientById = async (id: number): Promise<Patient | null> => {
  try {
    const token = getToken();
    if (!token) {
      console.warn('No token found');
      return null;
    }

    const url = API_BASE ? `${API_BASE}/api/patients/${id}` : `/api/patients/${id}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch patient');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching patient:', error);
    return null;
  }
};

export const createPatient = async (patient: any): Promise<Patient> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = API_BASE ? `${API_BASE}/api/patients` : `/api/patients`;
    
    const response = await fetch(url, {
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
    return data;
  } catch (error) {
    console.error('❌ Error creating patient:', error);
    throw error;
  }
};

export const updatePatient = async (id: number, patient: any): Promise<Patient> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = API_BASE ? `${API_BASE}/api/patients/${id}` : `/api/patients/${id}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(patient),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update patient');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error updating patient:', error);
    throw error;
  }
};

export const deletePatient = async (id: number): Promise<void> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = API_BASE ? `${API_BASE}/api/patients/${id}` : `/api/patients/${id}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete patient');
    }
  } catch (error) {
    console.error('❌ Error deleting patient:', error);
    throw error;
  }
};
