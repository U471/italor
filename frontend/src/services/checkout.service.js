import {
  validateCheckout as apiValidateCheckout,
  createOrder as apiCreateOrder,
  getOrder as apiGetOrder,
} from './api';

/**
 * Validates the current cart and returns a pricing summary from the server.
 *
 * @param {{ shippingRegion: string, promoCode?: string }} payload
 * @returns {Promise<object>} Pricing summary
 */
export async function validateCheckout(payload) {
  return apiValidateCheckout(payload);
}

/**
 * Creates a pending order from the user's cart.
 *
 * @param {{ shippingAddress: object, shippingRegion: string, promoCode?: string }} payload
 * @returns {Promise<{ order: object }>}
 */
export async function createOrder(payload) {
  return apiCreateOrder(payload);
}

/**
 * Retrieves a single order by ID.
 *
 * @param {string} orderId
 * @returns {Promise<{ order: object }>}
 */
export async function getOrder(orderId) {
  return apiGetOrder(orderId);
}
