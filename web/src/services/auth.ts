import { User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const login = async (email: string, password: string): Promise<User> => {
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
    
    // Store token and user
    saveToken(data.token);
    saveUser(data.user);
    
    return data.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (userData: any): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    
    // Store token and user
    saveToken(data.token);
    saveUser(data.user);
    
    return data.user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Alias for register - for SignUpPage compatibility
export const signup = register;

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
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

// Alias for getCurrentUser - for DashboardPage compatibility
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

// Export everything as default
export default {
  login,
  register,
  signup,
  logout,
  getToken,
  saveToken,
  saveUser,
  getStoredUser,
  getCurrentUser,
  isAuthenticated
};
