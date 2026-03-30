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

// ── Checkout endpoints ────────────────────────────────────────────────────────

/**
 * Validates the current cart and returns a server-computed pricing summary.
 *
 * @param {{ shippingRegion: string, promoCode?: string }} payload
 * @returns {Promise<object>}
 */
export async function validateCheckout(payload) {
  const { data } = await api.post('/api/v1/checkout/validate', payload);
  return data;
}

/**
 * Creates a pending order from the user's cart.
 *
 * @param {{ shippingAddress: object, shippingRegion: string, promoCode?: string }} payload
 * @returns {Promise<{ order: object }>}
 */
export async function createOrder(payload) {
  const { data } = await api.post('/api/v1/checkout/orders', payload);
  return data;
}

/**
 * Retrieves a single order scoped to the authenticated user.
 *
 * @param {string} orderId
 * @returns {Promise<{ order: object }>}
 */
export async function getOrder(orderId) {
  const { data } = await api.get(`/api/v1/checkout/orders/${orderId}`);
  return data;
}

/**
 * Creates a Stripe PaymentIntent for a pending order.
 * Returns { clientSecret, paymentIntentId } to initialise Stripe Elements.
 *
 * @param {string} orderId
 * @returns {Promise<{ clientSecret: string, paymentIntentId: string }>}
 */
export async function createPaymentIntent(orderId) {
  const { data } = await api.post(`/api/v1/payments/${orderId}/create-intent`);
  return data;
}

// ── Order history endpoints ───────────────────────────────────────────────────

/**
 * Lists the authenticated user's orders with optional pagination.
 *
 * @param {{ page?: number, limit?: number, status?: string }} params
 * @returns {Promise<{ orders: object[], total: number, page: number, pages: number }>}
 */
export async function getMyOrders(params) {
  const { data } = await api.get('/api/v1/orders', { params });
  return data;
}

/**
 * Retrieves full detail for a single order.
 *
 * @param {string} orderId
 * @returns {Promise<{ order: object }>}
 */
export async function getOrderDetail(orderId) {
  const { data } = await api.get(`/api/v1/orders/${orderId}`);
  return data;
}

// ── Review endpoints ──────────────────────────────────────────────────────────

/**
 * Creates a review for a fabric (requires a completed order containing that fabric).
 *
 * @param {string} fabricId
 * @param {{ orderId: string, rating: number, title?: string, body?: string, fitRating?: number }} payload
 * @returns {Promise<{ status: string, data: { review: object } }>}
 */
export async function createReview(fabricId, payload) {
  const { data } = await api.post(`/api/v1/products/${fabricId}/reviews`, payload);
  return data;
}

/**
 * Returns paginated reviews written by the authenticated user.
 *
 * @param {{ page?: number, limit?: number }} params
 * @returns {Promise<{ status: string, data: { reviews: object[], total: number, page: number, pages: number } }>}
 */
export async function getMyReviews(params) {
  const { data } = await api.get('/api/v1/reviews/my', { params });
  return data;
}

/**
 * Marks a review as helpful. Each user may vote only once per review.
 *
 * @param {string} reviewId  MongoDB ObjectId
 * @returns {Promise<{ status: string, data: { helpfulVotes: number } }>}
 */
export async function markReviewHelpful(reviewId) {
  const { data } = await api.post(`/api/v1/reviews/${reviewId}/helpful`);
  return data;
}

/**
 * Deletes a review. Only the author or an admin may delete.
 *
 * @param {string} reviewId  MongoDB ObjectId
 * @returns {Promise<{ status: string, message: string }>}
 */
export async function deleteReview(reviewId) {
  const { data } = await api.delete(`/api/v1/reviews/${reviewId}`);
  return data;
}

// ── Admin order endpoints ─────────────────────────────────────────────────────

/**
 * Admin: returns aggregated dashboard statistics.
 *
 * @returns {Promise<object>}
 */
export async function adminGetStats() {
  const { data } = await api.get('/api/v1/admin/stats');
  return data;
}

/**
 * Admin: lists all orders with optional filters.
 *
 * @param {{ page?: number, limit?: number, status?: string }} params
 * @returns {Promise<{ orders: object[], total: number, page: number, pages: number }>}
 */
export async function adminGetOrders(params) {
  const { data } = await api.get('/api/v1/admin/orders', { params });
  return data;
}

/**
 * Admin: returns full detail for a single order including populated user info.
 *
 * @param {string} orderId
 * @returns {Promise<{ order: object }>}
 */
export async function adminGetOrderDetail(orderId) {
  const { data } = await api.get(`/api/v1/admin/orders/${orderId}`);
  return data;
}

/**
 * Admin: updates the status of an order.
 * When status is 'shipped', trackingNumber and carrier are required.
 *
 * @param {string} orderId
 * @param {{ status: string, trackingNumber?: string, carrier?: string, note?: string }} payload
 * @returns {Promise<{ order: object }>}
 */
export async function adminUpdateOrderStatus(orderId, payload) {
  const { data } = await api.patch(`/api/v1/admin/orders/${orderId}/status`, payload);
  return data;
}

/**
 * Admin: processes a Stripe refund for a cancelled order.
 *
 * @param {string} orderId
 * @returns {Promise<{ order: object }>}
 */
export async function adminProcessRefund(orderId) {
  const { data } = await api.post(`/api/v1/admin/orders/${orderId}/refund`);
  return data;
}

export default api;
