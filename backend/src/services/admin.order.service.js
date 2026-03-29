'use strict';

const Order = require('../models/Order');
const User = require('../models/User');

/**
 * Lazy Stripe initializer — avoids requiring the SDK at module load time,
 * which would throw during tests if STRIPE_SECRET_KEY is absent.
 *
 * @returns {import('stripe').Stripe}
 */
function getStripe() {
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

/**
 * Valid forward-only status transitions for the admin.
 * Cancellation is allowed from any non-terminal state.
 */
const ALLOWED_TRANSITIONS = {
  confirmed: ['in_production', 'cancelled'],
  in_production: ['quality_check', 'cancelled'],
  quality_check: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
  pending_payment: ['confirmed', 'cancelled'],
  payment_failed: ['cancelled'],
};

/**
 * Returns aggregated dashboard statistics.
 *
 * Stats returned:
 *  - ordersToday        {number}
 *  - revenueToday       {number}
 *  - ordersPendingAction {number}  (confirmed + in_production + quality_check)
 *  - revenueThisMonth   {number}
 *  - totalActiveUsers   {number}
 *  - dailyOrders        {Array<{ date: string, count: number, revenue: number }>} (last 30 days)
 *  - ordersByStatus     {Array<{ status: string, count: number }>}
 *
 * @returns {Promise<object>}
 */
async function getAdminStats() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    todayStats,
    monthStats,
    pendingCount,
    totalActiveUsers,
    dailyOrders,
    ordersByStatus,
  ] = await Promise.all([
    // Today aggregation
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday }, status: { $nin: ['payment_failed', 'pending_payment'] } } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]),

    // This month aggregation
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, status: { $nin: ['payment_failed', 'pending_payment', 'cancelled', 'refunded'] } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]),

    // Orders pending action (admin needs to advance these)
    Order.countDocuments({ status: { $in: ['confirmed', 'in_production', 'quality_check'] } }),

    // Total active (verified) users
    User.countDocuments({ isVerified: true }),

    // Daily orders for past 30 days
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $nin: ['payment_failed', 'pending_payment'] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]),

    // Orders by status (all time)
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  // Normalise daily orders: fill in missing days with 0 so the chart is continuous
  const filledDailyOrders = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const found = dailyOrders.find(
      (r) => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1 && r._id.day === d.getDate()
    );

    filledDailyOrders.push({
      date: key,
      count: found ? found.count : 0,
      revenue: found ? Math.round(found.revenue * 100) / 100 : 0,
    });
  }

  return {
    ordersToday: todayStats[0]?.count ?? 0,
    revenueToday: Math.round((todayStats[0]?.revenue ?? 0) * 100) / 100,
    ordersPendingAction: pendingCount,
    revenueThisMonth: Math.round((monthStats[0]?.revenue ?? 0) * 100) / 100,
    totalActiveUsers,
    dailyOrders: filledDailyOrders,
    ordersByStatus: ordersByStatus.map((r) => ({ status: r._id, count: r.count })),
  };
}

/**
 * Returns paginated list of ALL orders (admin view), with optional status filter.
 * Orders are populated with basic user info (firstName, lastName, email).
 *
 * @param {{ page?: number, limit?: number, status?: string }} params
 * @returns {Promise<{ orders: object[], total: number, page: number, pages: number }>}
 */
async function getAdminOrders({ page = 1, limit = 20, status } = {}) {
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const query = {};
  if (status) query.status = status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('user', 'firstName lastName email')
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
 * Returns a single order by ID for admin (no user scoping).
 * Populates full user info.
 *
 * @param {string} orderId
 * @returns {Promise<object>}
 */
async function getAdminOrderById(orderId) {
  const order = await Order.findById(orderId)
    .populate('user', 'firstName lastName email phone')
    .lean();

  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }
  return order;
}

/**
 * Updates the status of an order. Validates the transition against the
 * state machine. For SHIPPED status, tracking info is required.
 * Appends a statusHistory entry including the admin's userId.
 *
 * @param {string} orderId
 * @param {string} adminId
 * @param {{ status: string, trackingNumber?: string, carrier?: string, note?: string }} payload
 * @returns {Promise<object>} Updated order
 */
async function updateOrderStatus(orderId, adminId, { status, trackingNumber, carrier, note = '' }) {
  const order = await Order.findById(orderId);

  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  const allowedNext = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowedNext.includes(status)) {
    const err = new Error(
      `Cannot transition from '${order.status}' to '${status}'. Allowed: [${allowedNext.join(', ') || 'none'}]`
    );
    err.status = 422;
    throw err;
  }

  if (status === 'shipped') {
    if (!trackingNumber || !carrier) {
      const err = new Error('trackingNumber and carrier are required when status is shipped');
      err.status = 422;
      throw err;
    }
    order.trackingNumber = trackingNumber.trim();
    order.carrier = carrier.trim();
  }

  order.status = status;

  // Append a manual statusHistory entry with adminId note
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note: note ? `[Admin: ${adminId}] ${note}` : `[Admin: ${adminId}] Status updated to ${status}`,
  });

  // Skip the pre-save hook double-push by marking statusHistory as already modified
  // but not status (so hook won't fire). We do this by saving after manually pushing.
  // The pre-save hook checks isModified('status') — we must avoid a double push.
  // Strategy: mark the statusHistory path modified and save without triggering the hook.
  order.$locals = order.$locals || {};
  order.$locals.skipStatusHook = true;

  // Use updateOne directly to avoid the pre-save hook double-adding to statusHistory
  await Order.updateOne(
    { _id: orderId },
    {
      $set: {
        status: order.status,
        ...(status === 'shipped' ? { trackingNumber: order.trackingNumber, carrier: order.carrier } : {}),
      },
      $push: {
        statusHistory: {
          status,
          timestamp: new Date(),
          note: note ? `[Admin: ${adminId}] ${note}` : `[Admin: ${adminId}] Status updated to ${status}`,
        },
      },
    }
  );

  return Order.findById(orderId).populate('user', 'firstName lastName email').lean();
}

/**
 * Processes a Stripe refund for a cancelled order.
 * Order must be in 'cancelled' status and have a paymentIntentId.
 *
 * @param {string} orderId
 * @param {string} adminId
 * @returns {Promise<object>} Updated order
 */
async function processRefund(orderId, adminId) {
  const order = await Order.findById(orderId);

  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  if (order.status !== 'cancelled') {
    const err = new Error('Only cancelled orders can be refunded');
    err.status = 422;
    throw err;
  }

  if (order.status === 'refunded') {
    const err = new Error('Order has already been refunded');
    err.status = 422;
    throw err;
  }

  if (!order.paymentIntentId) {
    const err = new Error('No payment intent found for this order — nothing to refund');
    err.status = 422;
    throw err;
  }

  const stripe = getStripe();
  await stripe.refunds.create({ payment_intent: order.paymentIntentId });

  await Order.updateOne(
    { _id: orderId },
    {
      $set: { status: 'refunded' },
      $push: {
        statusHistory: {
          status: 'refunded',
          timestamp: new Date(),
          note: `[Admin: ${adminId}] Stripe refund processed`,
        },
      },
    }
  );

  return Order.findById(orderId).populate('user', 'firstName lastName email').lean();
}

module.exports = {
  getAdminStats,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  processRefund,
  ALLOWED_TRANSITIONS,
};
