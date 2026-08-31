import axios from 'axios';
import { setLicenseLocked } from '../utils/licenseLock';

const memoryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const PERSISTENT_CACHE_KEY = 'ecatalog_api_cache';
const PERSISTENT_CACHE_LIMIT = 100;

// ===== Cache persisten (localStorage) agar data tetap tersedia saat offline =====
function loadPersistentCache() {
  try {
    const raw = localStorage.getItem(PERSISTENT_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePersistentCache(entries) {
  try {
    // Buang entri terlama jika melebihi batas
    const keys = Object.keys(entries);
    if (keys.length > PERSISTENT_CACHE_LIMIT) {
      keys
        .sort((a, b) => (entries[a].timestamp || 0) - (entries[b].timestamp || 0))
        .slice(0, keys.length - PERSISTENT_CACHE_LIMIT)
        .forEach((key) => delete entries[key]);
    }
    localStorage.setItem(PERSISTENT_CACHE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage penuh / tidak tersedia: abaikan
  }
}

function getPersistent(cacheKey) {
  const entries = loadPersistentCache();
  return entries[cacheKey] || null;
}

function setPersistent(cacheKey, payload) {
  const entries = loadPersistentCache();
  entries[cacheKey] = { timestamp: Date.now(), payload };
  savePersistentCache(entries);
}

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
      // Simpan juga ke cache persisten untuk mode offline
      setPersistent(cacheKey, response.data);
    }
    return response;
  },
  (error) => {
    const config = error.config;
    if (config && !config._retry) {
      const cacheKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
      const cached = memoryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return Promise.resolve(cached.response);
      }
      // Offline / gagal jaringan: pakai cache persisten (tanpa TTL agar tetap tampil offline)
      if (!error.response) {
        const persistent = getPersistent(cacheKey);
        if (persistent) {
          return Promise.resolve({ ...error, config, data: persistent.payload, status: 200, __fromOfflineCache: true });
        }
      }
    }

    if (error.response?.data?.license_error) {
      setLicenseLocked(error.response.data.message);
    }

    return Promise.reject(error);
  }
);

export default api;

