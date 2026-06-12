import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

const HANDOFF_KEY = 'cv_handoff_v2';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cv_token');
    const cached = localStorage.getItem('cv_user');
    if (!token) {
      setLoading(false);
      return;
    }
    if (cached) setUser(JSON.parse(cached));
    authAPI
      .me()
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('cv_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('cv_token');
        localStorage.removeItem('cv_user');
        localStorage.removeItem(HANDOFF_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = (token, u, handoff) => {
    localStorage.setItem('cv_token', token);
    localStorage.setItem('cv_user', JSON.stringify(u));
    if (handoff && handoff.token) {
      // Persist the sub-app handoff so refreshing the embedded view (or
      // closing & re-opening the tab) still lands the user on their
      // dashboard — no second-login surprises.
      localStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));
    }
    setUser(u);
  };

  const signup = async (payload) => {
    const res = await authAPI.signup(payload);
    persist(res.data.token, res.data.user, res.data.handoff);
    return res.data.user;
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    persist(res.data.token, res.data.user, res.data.handoff);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('cv_token');
    localStorage.removeItem('cv_user');
    localStorage.removeItem(HANDOFF_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function readHandoff() {
  try {
    const raw = localStorage.getItem(HANDOFF_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function dashboardPathFor(role) {
  if (role === 'student') return '/student';
  if (role === 'teacher') return '/teacher';
  if (role === 'admin') return '/admin';
  return '/';
}
