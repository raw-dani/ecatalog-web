import axios from 'axios';

const memoryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('session_id');
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get') {
      const cacheKey = `${response.config.method}:${response.config.url}:${JSON.stringify(response.config.params || {})}`;
      memoryCache.set(cacheKey, {
        timestamp: Date.now(),
        response,
      });
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    if (!config || config._retry) return Promise.reject(error);

    const cacheKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
    const cached = memoryCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Promise.resolve(cached.response);
    }

    return Promise.reject(error);
  }
);

export default api;
