import axios from 'axios';
import useAuthStore from '../store/authStore';

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
    const token = useAuthStore.getState().accessToken;
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

/**
 * Requests a password reset email for the given email address.
 * The server always returns 200 — it never reveals whether the email exists.
 *
 * @param {{ email: string }} payload
 * @returns {Promise<{ message: string }>}
 */
export async function forgotPassword(payload) {
  const { data } = await api.post('/api/v1/auth/forgot-password', payload);
  return data;
}

/**
 * Resets the user's password using a valid reset token.
 *
 * @param {{ token: string, newPassword: string }} payload
 * @returns {Promise<{ message: string }>}
 */
export async function resetPassword(payload) {
  const { data } = await api.post('/api/v1/auth/reset-password', payload);
  return data;
}

// ── User profile endpoints ────────────────────────────────────────────────────

/**
 * Returns the authenticated user's full profile.
 *
 * @returns {Promise<{ user: object }>}
 */
export async function getMe() {
  const { data } = await api.get('/api/v1/user/me');
  return data;
}

/**
 * Updates the authenticated user's profile (firstName, lastName, phone).
 *
 * @param {{ firstName?: string, lastName?: string, phone?: string }} payload
 * @returns {Promise<{ message: string, user: object }>}
 */
export async function updateMe(payload) {
  const { data } = await api.put('/api/v1/user/me', payload);
  return data;
}

/**
 * Changes the authenticated user's password.
 *
 * @param {{ currentPassword: string, newPassword: string }} payload
 * @returns {Promise<{ message: string }>}
 */
export async function updatePassword(payload) {
  const { data } = await api.put('/api/v1/user/me/password', payload);
  return data;
}

/**
 * Uploads a new avatar image.
 *
 * @param {FormData} formData  Must include a file field named "avatar".
 * @returns {Promise<{ message: string, avatarUrl: string }>}
 */
export async function updateAvatar(formData) {
  const { data } = await api.put('/api/v1/user/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ── Fabric catalog endpoints ──────────────────────────────────────────────────

/**
 * Fetches paginated fabric catalog with optional filters/search/sort.
 *
 * @param {URLSearchParams|object} params
 * @returns {Promise<{ fabrics: object[], total: number, page: number, pages: number, limit: number }>}
 */
export async function getFabrics(params) {
  const { data } = await api.get('/api/v1/products', { params });
  return data;
}

/**
 * Returns distinct values for filter sidebar (materials, colors, patterns).
 *
 * @returns {Promise<{ materials: string[], colors: string[], patterns: string[] }>}
 */
export async function getFabricFilters() {
  const { data } = await api.get('/api/v1/products/filters');
  return data;
}

/**
 * Fetches a single fabric by id, including averageRating, reviewCount, and related fabrics.
 *
 * @param {string} id  MongoDB ObjectId
 * @returns {Promise<{ fabric: object, related: object[] }>}
 */
export async function getFabricById(id) {
  const { data } = await api.get(`/api/v1/products/${id}`);
  return data;
}

/**
 * Fetches paginated reviews for a fabric.
 *
 * @param {string} id      MongoDB ObjectId of the fabric
 * @param {object} params  { page, limit }
 * @returns {Promise<{ reviews: object[], total: number, page: number, pages: number }>}
 */
export async function getFabricReviews(id, params) {
  const { data } = await api.get(`/api/v1/products/${id}/reviews`, { params });
  return data;
}

// ── Admin fabric endpoints ────────────────────────────────────────────────────

/** @returns {Promise<{ fabrics, total, page, pages }>} */
export async function adminGetFabrics(params) {
  const { data } = await api.get('/api/v1/admin/products', { params });
  return data;
}

/** @returns {Promise<{ fabric }>} */
export async function adminCreateFabric(payload) {
  const { data } = await api.post('/api/v1/admin/products', payload);
  return data;
}

/** @returns {Promise<{ fabric }>} */
export async function adminUpdateFabric(id, payload) {
  const { data } = await api.put(`/api/v1/admin/products/${id}`, payload);
  return data;
}

/** @returns {Promise<{ message }>} */
export async function adminDeleteFabric(id) {
  const { data } = await api.delete(`/api/v1/admin/products/${id}`);
  return data;
}

/** @param {FormData} formData  Must contain field "image" */
export async function adminUploadFabricImage(id, formData) {
  const { data } = await api.post(`/api/v1/admin/products/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** @param {string} imageUrl */
export async function adminRemoveFabricImage(id, imageUrl) {
  const { data } = await api.delete(`/api/v1/admin/products/${id}/images`, { data: { imageUrl } });
  return data;
}

// ── Suit design endpoints ─────────────────────────────────────────────────────

/** @returns {Promise<{ design }>} */
export async function createDesign(payload) {
  const { data } = await api.post('/api/v1/designs', payload);
  return data;
}

/** @returns {Promise<{ design }>} */
export async function getDesign(id) {
  const { data } = await api.get(`/api/v1/designs/${id}`);
  return data;
}

/** @returns {Promise<{ design }>} */
export async function updateDesign(id, payload) {
  const { data } = await api.put(`/api/v1/designs/${id}`, payload);
  return data;
}

/** @returns {Promise<{ designs }>} */
export async function listMyDesigns() {
  const { data } = await api.get('/api/v1/designs/mine');
  return data;
}

export default api;
