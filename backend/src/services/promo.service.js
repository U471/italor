'use strict';

const PromoCode = require('../models/PromoCode');

/**
 * Validates a promo code against the current cart total.
 *
 * @param {string} code - The promo code string (case-insensitive).
 * @param {number} cartTotal - The current cart subtotal.
 * @returns {{ isValid: boolean, discountType?: string, discountValue?: number, expiresAt?: Date }}
 */
async function validatePromo(code, cartTotal) {
  const promo = await PromoCode.findOne({ code: code.toUpperCase() });

  if (!promo) {
    return { isValid: false };
  }

  if (!promo.isActive) {
    return { isValid: false };
  }

  if (promo.expiresAt && new Date() > promo.expiresAt) {
    return { isValid: false };
  }

  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    return { isValid: false };
  }

  if (cartTotal < promo.minOrderValue) {
    return { isValid: false };
  }

  return {
    isValid: true,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    expiresAt: promo.expiresAt,
  };
}

module.exports = { validatePromo };
