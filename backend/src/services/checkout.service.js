'use strict';

const Cart = require('../models/Cart');
const Order = require('../models/Order');
const PromoCode = require('../models/PromoCode');

const SHIPPING_RATES = { us: 15, international: 45 };
const TAX_RATE_US = 0.08;

/**
 * Calculates order totals from cart items + promo + region.
 *
 * @param {object[]} items         - Cart item documents
 * @param {string}   shippingRegion - 'us' | 'international'
 * @param {object|null} promoDoc   - PromoCode document or null
 * @returns {{ subtotal, discountAmount, shippingCost, taxAmount, total }}
 */
function calculateTotals(items, shippingRegion, promoDoc) {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  let discountAmount = 0;
  if (promoDoc) {
    if (promoDoc.discountType === 'percentage') {
      discountAmount = subtotal * (promoDoc.discountValue / 100);
    } else {
      discountAmount = Math.min(promoDoc.discountValue, subtotal);
    }
  }

  const shippingCost = SHIPPING_RATES[shippingRegion] ?? SHIPPING_RATES.international;
  const taxAmount = shippingRegion === 'us' ? subtotal * TAX_RATE_US : 0;
  const total = Math.max(0, subtotal - discountAmount + shippingCost + taxAmount);

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    shippingCost: parseFloat(shippingCost.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}

/**
 * Validates the checkout session for the given user.
 * Verifies the cart is non-empty and the promo code (if any) is still valid.
 * Returns a summary of totals without persisting anything — used by the
 * frontend to display a confirmed order preview before payment.
 *
 * @param {string} userId
 * @param {object} payload
 * @param {string} payload.shippingRegion  - 'us' | 'international'
 * @param {string|null} [payload.promoCode]
 * @returns {Promise<object>} Validated checkout summary
 */
async function validateCheckout(userId, { shippingRegion, promoCode }) {
  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    const err = new Error('Cart is empty');
    err.status = 400;
    throw err;
  }

  let promoDoc = null;
  let promoCodeStr = null;

  if (promoCode && typeof promoCode === 'string' && promoCode.trim()) {
    promoDoc = await PromoCode.findOne({
      code: promoCode.trim().toUpperCase(),
      isActive: true,
    });

    if (!promoDoc) {
      const err = new Error('Promo code is invalid or has expired');
      err.status = 400;
      throw err;
    }

    if (promoDoc.expiresAt && new Date() > promoDoc.expiresAt) {
      const err = new Error('Promo code has expired');
      err.status = 400;
      throw err;
    }

    if (promoDoc.usageLimit !== null && promoDoc.usedCount >= promoDoc.usageLimit) {
      const err = new Error('Promo code usage limit has been reached');
      err.status = 400;
      throw err;
    }

    promoCodeStr = promoDoc.code;
  }

  const totals = calculateTotals(cart.items, shippingRegion, promoDoc);

  return {
    items: cart.items,
    shippingRegion,
    promoCode: promoCodeStr,
    ...totals,
  };
}

/**
 * Creates a pending order from the user's current cart.
 * This is called at the start of the checkout process, before payment.
 * The order starts with status 'pending_payment'.
 *
 * @param {string} userId
 * @param {object} payload
 * @param {object} payload.shippingAddress
 * @param {string} payload.shippingRegion   - 'us' | 'international'
 * @param {string|null} [payload.promoCode]
 * @returns {Promise<object>} Created order document
 */
async function createPendingOrder(userId, { shippingAddress, shippingRegion, promoCode }) {
  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    const err = new Error('Cart is empty');
    err.status = 400;
    throw err;
  }

  let promoDoc = null;
  let promoCodeStr = null;

  if (promoCode && typeof promoCode === 'string' && promoCode.trim()) {
    promoDoc = await PromoCode.findOne({
      code: promoCode.trim().toUpperCase(),
      isActive: true,
    });

    if (!promoDoc) {
      const err = new Error('Promo code is invalid or has expired');
      err.status = 400;
      throw err;
    }

    promoCodeStr = promoDoc.code;
  }

  const totals = calculateTotals(cart.items, shippingRegion, promoDoc);

  // Snapshot items from cart
  const orderItems = cart.items.map((i) => ({
    cartItemId: i.cartItemId,
    suitConfig: i.suitConfig,
    fabricId: i.fabricId,
    fabricName: i.fabricName,
    fabricSwatchUrl: i.fabricSwatchUrl,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
  }));

  // Generate a unique order number (retry on collision)
  let orderNumber;
  let attempts = 0;
  do {
    orderNumber = Order.generateOrderNumber();
    attempts++;
    if (attempts > 10) {
      const err = new Error('Failed to generate unique order number');
      err.status = 500;
      throw err;
    }
  } while (await Order.exists({ orderNumber }));

  const order = await Order.create({
    user: userId,
    orderNumber,
    items: orderItems,
    shippingAddress,
    shippingRegion,
    promoCode: promoCodeStr,
    ...totals,
    status: 'pending_payment',
  });

  return order;
}

/**
 * Retrieves a single order by ID, scoped to the requesting user.
 *
 * @param {string} orderId
 * @param {string} userId
 * @returns {Promise<object>} Order document
 */
async function getOrderById(orderId, userId) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }
  return order;
}

module.exports = {
  validateCheckout,
  createPendingOrder,
  getOrderById,
  calculateTotals,
};
