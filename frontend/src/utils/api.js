import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
});

// Attach token from storage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bora_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
