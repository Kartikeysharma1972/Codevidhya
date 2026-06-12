import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setAdmin(res.data.admin);
    } catch {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_data');
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, admin: adminData } = res.data;
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_data', JSON.stringify(adminData));
    setAdmin(adminData);
    return adminData;
  };

  const setup = async (name, email, password, school, setupKey) => {
    const res = await api.post('/auth/setup', {
      name,
      email,
      password,
      school,
      setupKey,
    });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, setup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
