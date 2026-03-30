'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { listOrders, getOrder, listOrdersRules, getOrderRules } = require('../controllers/order.controller');

const router = express.Router();

// All order routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/orders
 * Returns paginated order history for the authenticated user.
 */
router.get('/', listOrdersRules, listOrders);

/**
 * GET /api/v1/orders/:orderId
 * Returns a single order for the authenticated user.
 */
router.get('/:orderId', getOrderRules, getOrder);

module.exports = router;
