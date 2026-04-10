import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bora_token');
    const savedUser = localStorage.getItem('bora_user');
    if (token && savedUser) {
      setUserState(JSON.parse(savedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Refresh user from API to get latest avatarUrl
      api.get('/api/auth/me').then(({ data }) => {
        setUserState(data);
        localStorage.setItem('bora_user', JSON.stringify(data));
      }).catch(() => {});
    }
    setLoading(false);
  }, []);

  const setUser = (updater) => {
    setUserState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('bora_user', JSON.stringify(next));
      return next;
    });
  };

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('bora_token', data.token);
    localStorage.setItem('bora_user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUserState(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/api/auth/register', { name, email, password });
    localStorage.setItem('bora_token', data.token);
    localStorage.setItem('bora_user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUserState(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('bora_token');
    localStorage.removeItem('bora_user');
    delete api.defaults.headers.common['Authorization'];
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
