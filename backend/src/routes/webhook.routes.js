'use strict';

const express = require('express');
const { handleStripeWebhook } = require('../controllers/webhook.controller');

const router = express.Router();

/**
 * POST /api/v1/webhooks/stripe
 *
 * IMPORTANT: This route uses express.raw({ type: 'application/json' }) as its
 * body parser instead of express.json(). The raw body buffer is required by
 * stripe.webhooks.constructEvent for signature verification.
 *
 * This route is registered in app.js BEFORE the global express.json() middleware.
 */
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;
