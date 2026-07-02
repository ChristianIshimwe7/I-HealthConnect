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

// Login
export const login = async (email: string, password: string, role: UserRole): Promise<User> => {
  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `Login failed: ${response.status}`);
    }

    const data = await response.json();
    return { ...data.user, token: data.token };
  } catch (err: any) {
    if (err.message === "Failed to fetch") {
      throw new Error("Cannot connect to server. Please make sure the backend is running on port 3000.");
    }
    throw err;
  }
};

// Signup (register)
export const signup = async (name: string, email: string, password: string, role: UserRole): Promise<User> => {
  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, district: "Kigali" }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `Sign up failed: ${response.status}`);
    }

    const data = await response.json();
    return { ...data.user, token: data.token };
  } catch (err: any) {
    if (err.message === "Failed to fetch") {
      throw new Error("Cannot connect to server. Please make sure the backend is running on port 3000.");
    }
    throw err;
  }
};

// Logout
export const logout = () => {
  localStorage.removeItem('ihc_user');
  localStorage.removeItem('ihc_token');
  window.location.href = '/';
};

// Save user
export const saveUser = (user: User) => {
  localStorage.setItem('ihc_user', JSON.stringify(user));
  if (user.token) localStorage.setItem('ihc_token', user.token);
};

// Get stored user
export const getStoredUser = (): User | null => {
  try {
    const s = localStorage.getItem('ihc_user');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

// Get token
export const getToken = (): string | null => {
  return localStorage.getItem('ihc_token');
};