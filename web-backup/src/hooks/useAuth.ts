import { useState, useEffect } from 'react';
import { User, getStoredUser, saveUser, logout } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoading(false);
  }, []);

  const signIn = (u: User) => {
    saveUser(u);
    setUser(u);
  };

  const signOut = () => {
    logout();
    setUser(null);
  };

  return { user, loading, signIn, signOut, isAuthenticated: !!user };
};
