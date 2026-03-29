'use strict';

const { param, query, body, validationResult } = require('express-validator');
const adminOrderService = require('../services/admin.order.service');

const ORDER_STATUSES = [
  'pending_payment',
  'payment_failed',
  'confirmed',
  'in_production',
  'quality_check',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

// ── Validation rule sets ──────────────────────────────────────────────────────

const orderIdRules = [
  param('orderId').isMongoId().withMessage('orderId must be a valid MongoDB ObjectId'),
];

const listAdminOrdersRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('status').optional().isIn(ORDER_STATUSES).withMessage('Invalid status value'),
];

const updateStatusRules = [
  param('orderId').isMongoId().withMessage('orderId must be a valid MongoDB ObjectId'),
  body('status').isIn(ORDER_STATUSES).withMessage('Invalid status value'),
  body('trackingNumber').optional({ nullable: true }).isString().trim().isLength({ max: 100 }),
  body('carrier').optional({ nullable: true }).isString().trim().isLength({ max: 100 }),
  body('note').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
];

// ── Controller functions ──────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/stats
 * Returns aggregated KPI statistics for the admin dashboard.
 */
async function getStats(req, res, next) {
  try {
    const stats = await adminOrderService.getAdminStats();
    return res.json({ status: 'success', data: stats });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/admin/orders
 * Returns paginated list of all orders with user info.
 */
async function listAdminOrders(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { page, limit, status } = req.query;
    const result = await adminOrderService.getAdminOrders({ page, limit, status });
    return res.json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/admin/orders/:orderId
 * Returns full order detail including user info.
 */
async function getAdminOrder(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const order = await adminOrderService.getAdminOrderById(req.params.orderId);
    return res.json({ status: 'success', data: { order } });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/admin/orders/:orderId/status
 * Updates order status, validates state-machine transition.
 * Requires trackingNumber + carrier when new status is 'shipped'.
 */
async function updateOrderStatus(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { status, trackingNumber, carrier, note } = req.body;
    const order = await adminOrderService.updateOrderStatus(
      req.params.orderId,
      req.user.userId,
      { status, trackingNumber, carrier, note }
    );

    return res.json({ status: 'success', data: { order } });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ status: 'error', error: err.message });
    }
    return next(err);
  }
}

/**
 * POST /api/v1/admin/orders/:orderId/refund
 * Processes a Stripe refund for a cancelled order.
 */
async function processRefund(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const order = await adminOrderService.processRefund(req.params.orderId, req.user.userId);
    return res.json({ status: 'success', data: { order } });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ status: 'error', error: err.message });
    }
    return next(err);
  }
}

module.exports = {
  getStats,
  listAdminOrders,
  listAdminOrdersRules,
  getAdminOrder,
  orderIdRules,
  updateOrderStatus,
  updateStatusRules,
  processRefund,
};
