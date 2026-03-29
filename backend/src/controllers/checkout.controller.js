'use strict';

const { body, validationResult } = require('express-validator');
const checkoutService = require('../services/checkout.service');

/**
 * Validation rules for the shipping address sub-object.
 */
const shippingAddressRules = [
  body('shippingAddress.fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 200 })
    .withMessage('Full name cannot exceed 200 characters'),

  body('shippingAddress.line1')
    .trim()
    .notEmpty()
    .withMessage('Address line 1 is required')
    .isLength({ max: 300 })
    .withMessage('Address line 1 cannot exceed 300 characters'),

  body('shippingAddress.line2')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage('Address line 2 cannot exceed 300 characters'),

  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 200 })
    .withMessage('City cannot exceed 200 characters'),

  body('shippingAddress.state')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('State cannot exceed 200 characters'),

  body('shippingAddress.postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required')
    .isLength({ max: 20 })
    .withMessage('Postal code cannot exceed 20 characters'),

  body('shippingAddress.country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),

  body('shippingAddress.phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage('Phone cannot exceed 30 characters'),
];

/**
 * Validation rules shared across checkout endpoints.
 */
const checkoutRules = [
  body('shippingRegion')
    .notEmpty()
    .withMessage('Shipping region is required')
    .isIn(['us', 'international'])
    .withMessage('Shipping region must be "us" or "international"'),

  body('promoCode')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .withMessage('Promo code must be a string')
    .isLength({ max: 50 })
    .withMessage('Promo code cannot exceed 50 characters'),
];

/**
 * POST /api/v1/checkout/validate
 *
 * Validates the current cart and returns a pricing summary.
 * Does NOT create an order or charge a card.
 *
 * Body: { shippingRegion, promoCode? }
 */
async function validateCheckout(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { shippingRegion, promoCode } = req.body;
    const summary = await checkoutService.validateCheckout(req.user.userId, {
      shippingRegion,
      promoCode: promoCode || null,
    });

    return res.json({ status: 'success', data: summary });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/checkout/orders
 *
 * Creates a pending order from the authenticated user's current cart.
 * Returns the order document with status 'pending_payment'.
 * The cart is NOT cleared here — it is cleared after successful payment (SCRUM-37).
 *
 * Body: { shippingAddress, shippingRegion, promoCode? }
 */
async function createOrder(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { shippingAddress, shippingRegion, promoCode } = req.body;
    const order = await checkoutService.createPendingOrder(req.user.userId, {
      shippingAddress,
      shippingRegion,
      promoCode: promoCode || null,
    });

    return res.status(201).json({ status: 'success', data: { order } });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/checkout/orders/:orderId
 *
 * Returns a single order scoped to the authenticated user.
 */
async function getOrder(req, res, next) {
  try {
    const order = await checkoutService.getOrderById(req.params.orderId, req.user.userId);
    return res.json({ status: 'success', data: { order } });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  validateCheckout,
  createOrder,
  getOrder,
  validateCheckoutRules: checkoutRules,
  createOrderRules: [...shippingAddressRules, ...checkoutRules],
};
