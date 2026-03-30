'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  validateCheckout,
  createOrder,
  getOrder,
  validateCheckoutRules,
  createOrderRules,
} = require('../controllers/checkout.controller');

const router = express.Router();

// All checkout routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/checkout/validate
 * Validates cart and returns a pricing summary (no side-effects).
 */
router.post('/validate', validateCheckoutRules, validateCheckout);

/**
 * POST /api/v1/checkout/orders
 * Creates a pending order from the user's cart.
 */
router.post('/orders', createOrderRules, createOrder);

/**
 * GET /api/v1/checkout/orders/:orderId
 * Returns a single order for the authenticated user.
 */
router.get('/orders/:orderId', getOrder);

module.exports = router;
