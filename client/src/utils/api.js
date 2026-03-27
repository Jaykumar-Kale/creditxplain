import axios from 'axios';

function normalizeBaseURL(raw) {
  const fallback = '/api';
  if (!raw || typeof raw !== 'string') return fallback;

  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  // Keep relative values as-is, just strip trailing slash.
  if (trimmed.startsWith('/')) {
    return trimmed.replace(/\/+$/, '') || fallback;
  }

  // If an absolute URL is provided without /api, append /api.
  try {
    const url = new URL(trimmed);
    const normalizedPath = (url.pathname || '').replace(/\/+$/, '');
    if (!normalizedPath || normalizedPath === '/') {
      url.pathname = '/api';
    }
    return url.toString().replace(/\/+$/, '');
  } catch {
    return trimmed.replace(/\/+$/, '') || fallback;
  }
}

const baseURL = normalizeBaseURL(import.meta.env.VITE_API_URL);
const api = axios.create({ baseURL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;