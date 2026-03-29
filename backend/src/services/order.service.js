'use strict';

const Order = require('../models/Order');

const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 50;

/**
 * Returns a paginated list of orders for the authenticated user, newest first.
 *
 * @param {string} userId
 * @param {{ page?: number, limit?: number, status?: string }} params
 * @returns {Promise<{ orders: object[], total: number, page: number, pages: number }>}
 */
async function getOrdersByUser(userId, { page = 1, limit = DEFAULT_PAGE_LIMIT, status } = {}) {
  const safeLimit = Math.min(parseInt(limit, 10) || DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const query = { user: userId };
  if (status) query.status = status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit),
  };
}

/**
 * Returns a single order by ID, scoped to the requesting user.
 *
 * @param {string} orderId
 * @param {string} userId
 * @returns {Promise<object>} Order document
 */
async function getOrderByIdForUser(orderId, userId) {
  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }
  return order;
}

module.exports = { getOrdersByUser, getOrderByIdForUser };
