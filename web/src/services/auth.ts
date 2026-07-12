import { User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'chw';

export const login = async (email: string, password: string): Promise<User> => {
  try {
    console.log('🔐 Attempting login...');
    
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data.user;
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
};

export const signup = async (userData: any): Promise<User> => {
  try {
    console.log('📝 Attempting signup...');
    
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data.user;
  } catch (error) {
    console.error('❌ Registration error:', error);
    throw error;
  }
};

export const register = signup;

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.location.href = '/login';
};

export const getToken = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export const saveToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const saveUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getStoredUser = (): User | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const getCurrentUser = (): User | null => {
  return getStoredUser();
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export default {
  login,
  signup,
  register,
  logout,
  getToken,
  saveToken,
  saveUser,
  getStoredUser,
  getCurrentUser,
  isAuthenticated
};
