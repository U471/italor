'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { createPaymentIntent, createIntentRules } = require('../controllers/payment.controller');

const router = express.Router();

/**
 * POST /api/v1/payments/:orderId/create-intent
 *
 * Creates a Stripe PaymentIntent for the given pending order.
 * Requires authentication — the order must belong to the requesting user.
 */
router.post('/:orderId/create-intent', authenticate, createIntentRules, createPaymentIntent);

module.exports = router;
