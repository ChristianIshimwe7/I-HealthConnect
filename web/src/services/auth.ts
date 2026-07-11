// web/src/services/auth.ts

import { supabase, signIn, signUp, signOut } from './supabase';

export type UserRole = 'doctor' | 'nurse' | 'supervisor' | 'coordinator' | 'admin' | 'chw';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  district: string;
  initials: string;
  token?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getRoleDisplayName = (role: UserRole | string): string => {
  const roleMap: Record<string, string> = {
    'doctor': 'Medical Doctor',
    'nurse': 'Nurse',
    'supervisor': 'Supervisor',
    'coordinator': 'CHW Coordinator',
    'admin': 'Administrator',
    'chw': 'Community Health Worker'
  };
  return roleMap[role] || role;
};

export const login = async (email: string, password: string, role: UserRole): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();

    // The backend returns: { token, user: { id, email, name, role } }
    if (!data.token || !data.user) {
      console.error('Invalid login response:', data);
      throw new Error('Invalid login response');
    }

    const userObj: User = {
      id: data.user.id.toString(),
      name: data.user.name,
      email: data.user.email,
      role: data.user.role || role,
      district: data.user.district || 'Kigali',
      token: data.token,
      initials: data.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    };

    saveUser(userObj);
    return userObj;
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
};

export const signup = async (name: string, email: string, password: string, role: UserRole): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, role, district: 'Kigali' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();

    if (!data.token || !data.user) {
      console.error('Invalid registration response:', data);
      throw new Error('Invalid registration response');
    }

    const userObj: User = {
      id: data.user.id.toString(),
      name: data.user.name,
      email: data.user.email,
      role: data.user.role || role,
      district: data.user.district || 'Kigali',
      token: data.token,
      initials: data.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    };

    saveUser(userObj);
    return userObj;
  } catch (error: any) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const logout = async () => {
  localStorage.removeItem('ihc_user');
  localStorage.removeItem('ihc_token');
  window.location.href = '/';
};

export const saveUser = (user: User) => {
  console.log('💾 Saving user:', user);
  localStorage.setItem('ihc_user', JSON.stringify(user));
  if (user.token) {
    localStorage.setItem('ihc_token', user.token);
  }
};

export const getStoredUser = (): User | null => {
  try {
    const s = localStorage.getItem('ihc_user');
    if (s) {
      const user = JSON.parse(s);
      console.log('📖 Retrieved user:', user);
      return user;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving user:', error);
    return null;
  }
};

export const getToken = (): string | null => {
  const token = localStorage.getItem('ihc_token');
  if (token && token.startsWith('eyJhbGciOiJIUzI1NiIs')) {
    return token;
  }
  if (token && token.startsWith('eyJhbGciOiJFUzI1NiIs')) {
    console.warn('⚠️ Invalid token format detected (ES256), clearing...');
    localStorage.removeItem('ihc_token');
    return null;
  }
  return token;
};
