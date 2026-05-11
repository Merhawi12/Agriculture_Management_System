import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 10000 });

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('agri_token'));
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('agri_user')); } catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('agri_token', data.token);
    localStorage.setItem('agri_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (form) => {
    const { data } = await API.post('/auth/register', form);
    localStorage.setItem('agri_token', data.token);
    localStorage.setItem('agri_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('agri_token');
    localStorage.removeItem('agri_user');
    setToken(null);
    setUser(null);
  }, []);

  const demoLogin = useCallback(() => login('admin@agrifarm.com', 'admin123'), [login]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, demoLogin, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
