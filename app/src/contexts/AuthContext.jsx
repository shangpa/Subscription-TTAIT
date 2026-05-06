import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('accessToken'));

  const fetchUser = useCallback(async (accessToken) => {
    try {
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setUser(data);
    } catch {
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = useCallback((accessToken, userData) => {
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
    if (userData) {
      setUser(userData);
      setLoading(false);
    } else {
      fetchUser(accessToken);
    }
  }, [fetchUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
  }, []);

  const isLoggedIn = !!token && !!user;
  const isAdmin = user?.role === 'ADMIN';
  const profileCompleted = user?.profileCompleted ?? false;

  return (
    <AuthContext.Provider value={{ token, user, loading, isLoggedIn, isAdmin, profileCompleted, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
