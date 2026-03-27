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

// ── Request interceptor — attach JWT from Zustand store if present ─────────────
api.interceptors.request.use(
  (config) => {
    // Dynamically read from Zustand store to always get the latest token
    try {
      const { useAuthStore } = require('../store/authStore');
      const token = useAuthStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Store not yet initialized — skip
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

/**
 * Logs in a user with email and password.
 * Returns accessToken in body; refresh token is set as httpOnly cookie by server.
 *
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ message: string, accessToken: string, user: object }>}
 */
export async function loginUser(payload) {
  const { data } = await api.post('/api/v1/auth/login', payload);
  return data;
}

/**
 * Exchanges the refresh token cookie for a new access token.
 *
 * @returns {Promise<{ accessToken: string }>}
 */
export async function refreshToken() {
  const { data } = await api.post('/api/v1/auth/refresh-token');
  return data;
}

/**
 * Logs out the user — clears refresh token from DB and cookie.
 *
 * @returns {Promise<{ message: string }>}
 */
export async function logout() {
  const { data } = await api.post('/api/v1/auth/logout');
  return data;
}

export default api;
