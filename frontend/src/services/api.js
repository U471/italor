import axios from 'axios';

/**
 * Axios instance pre-configured for the iTailor API.
 * Base URL is read from the VITE_API_BASE_URL environment variable.
 */
const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

// ── Request interceptor — attach JWT if present ───────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — normalize error shape ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    const normalizedError = new Error(message);
    normalizedError.status = error.response?.status;
    normalizedError.data = error.response?.data;
    return Promise.reject(normalizedError);
  }
);

// ── Auth endpoints ────────────────────────────────────────────────────────────

/**
 * Registers a new user account.
 *
 * @param {{ firstName: string, lastName: string, email: string, password: string, confirmPassword: string }} payload
 * @returns {Promise<{ message: string, user: object }>}
 */
export async function registerUser(payload) {
  const { data } = await api.post('/api/v1/auth/register', payload);
  return data;
}

export default api;
