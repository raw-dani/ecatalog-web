import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('session_id');
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }
  return config;
});

export default api;
