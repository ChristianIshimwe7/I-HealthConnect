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

const API_BASE = 'https://i-healthconnect.onrender.com';

export const login = async (email: string, password: string): Promise<User> => {
  console.log('🔐 Login attempt:', { email });
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('📡 Login response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Login error response:', error);
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    console.log('✅ Login success:', data);

    if (!data.token || !data.user) {
      console.error('❌ Invalid login response:', data);
      throw new Error('Invalid login response');
    }

    const userObj: User = {
      id: data.user.id.toString(),
      name: data.user.name,
      email: data.user.email,
      role: data.user.role || 'nurse',
      district: data.user.district || 'Kigali',
      token: data.token,
      initials: data.user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
    };

    saveUser(userObj);
    return userObj;
  } catch (error: any) {
    console.error('❌ Login error:', error);
    throw error;
  }
};

export const signup = async (email: string, password: string, name: string, role: UserRole): Promise<User> => {
  console.log('📝 Signup attempt:', { email, name, role });
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name, role }),
    });

    console.log('📡 Signup response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Signup error response:', error);
      throw new Error(error.message || 'Signup failed');
    }

    const data = await response.json();
    console.log('✅ Signup success:', data);

    if (!data.token || !data.user) {
      console.error('❌ Invalid signup response:', data);
      throw new Error('Invalid signup response');
    }

    const userObj: User = {
      id: data.user.id.toString(),
      name: data.user.name,
      email: data.user.email,
      role: data.user.role || role,
      district: data.user.district || 'Kigali',
      token: data.token,
      initials: data.user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
    };

    saveUser(userObj);
    return userObj;
  } catch (error: any) {
    console.error('❌ Signup error:', error);
    throw error;
  }
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
  return localStorage.getItem('ihc_token');
};

export const logout = () => {
  localStorage.removeItem('ihc_user');
  localStorage.removeItem('ihc_token');
  window.location.href = '/';
};
