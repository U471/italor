'use strict';

const { query, param, validationResult } = require('express-validator');
const orderService = require('../services/order.service');

/**
 * Validation rules for the list orders endpoint.
 */
const listOrdersRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
  query('status')
    .optional()
    .isIn(['pending_payment', 'payment_failed', 'confirmed', 'in_production', 'quality_check', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid status value'),
];

/**
 * GET /api/v1/orders
 *
 * Returns a paginated list of orders for the authenticated user.
 * Newest orders are returned first.
 */
async function listOrders(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { page, limit, status } = req.query;
    const result = await orderService.getOrdersByUser(req.user.userId, { page, limit, status });

    return res.json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/orders/:orderId
 *
 * Returns a single order for the authenticated user.
 */
async function getOrder(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const order = await orderService.getOrderByIdForUser(req.params.orderId, req.user.userId);
    return res.json({ status: 'success', data: { order } });
  } catch (err) {
    return next(err);
  }
}

const getOrderRules = [
  param('orderId').isMongoId().withMessage('orderId must be a valid MongoDB ObjectId'),
];

module.exports = { listOrders, getOrder, listOrdersRules, getOrderRules };
