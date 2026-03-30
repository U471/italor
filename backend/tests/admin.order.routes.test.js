'use strict';

// ── Mock stripe before any module requires it ────────────────────────────────
jest.mock('stripe', () =>
  jest.fn(() => ({
    webhooks: { constructEvent: jest.fn() },
    paymentIntents: { retrieve: jest.fn(), create: jest.fn() },
    refunds: { create: jest.fn().mockResolvedValue({ id: 're_mock', status: 'succeeded' }) },
  }))
);

// ── Mock auth middleware: inject admin user ──────────────────────────────────
jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, _res, next) => {
    req.user = { userId: 'admin-001', email: 'admin@italor.com', role: 'admin' };
    next();
  }),
}));

// ── Mock admin middleware: pass through (role already set in auth mock) ──────
jest.mock('../src/middleware/admin.middleware', () => ({
  requireAdmin: jest.fn((_req, _res, next) => next()),
}));

// ── Mock upload middleware ────────────────────────────────────────────────────
jest.mock('../src/middleware/upload.middleware', () => ({
  uploadAvatar: { single: jest.fn(() => (_req, _res, next) => next()) },
  uploadFabricImage: { single: jest.fn(() => (_req, _res, next) => next()) },
  cloudinary: {},
}));

// ── Mock admin order service ─────────────────────────────────────────────────
jest.mock('../src/services/admin.order.service', () => ({
  getAdminStats: jest.fn(),
  getAdminOrders: jest.fn(),
  getAdminOrderById: jest.fn(),
  updateOrderStatus: jest.fn(),
  processRefund: jest.fn(),
  ALLOWED_TRANSITIONS: {
    confirmed: ['in_production', 'cancelled'],
    in_production: ['quality_check', 'cancelled'],
    quality_check: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
    refunded: [],
    pending_payment: ['confirmed', 'cancelled'],
    payment_failed: ['cancelled'],
  },
}));

const request = require('supertest');
const app = require('../src/app');
const adminOrderService = require('../src/services/admin.order.service');

const VALID_ORDER_ID = '507f1f77bcf86cd799439011';

const MOCK_ORDER = {
  _id: VALID_ORDER_ID,
  orderNumber: 'IT-202603-AB12CD',
  user: { _id: 'user-123', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  status: 'confirmed',
  items: [{ cartItemId: 'item-1', fabricName: 'Merino Wool', unitPrice: 300, quantity: 1 }],
  subtotal: 300,
  discountAmount: 0,
  shippingCost: 45,
  taxAmount: 0,
  total: 345,
  statusHistory: [],
  createdAt: new Date().toISOString(),
};

const MOCK_STATS = {
  ordersToday: 5,
  revenueToday: 1725.0,
  ordersPendingAction: 12,
  revenueThisMonth: 24500.0,
  totalActiveUsers: 340,
  dailyOrders: [],
  ordersByStatus: [{ status: 'confirmed', count: 10 }],
};

beforeEach(() => jest.clearAllMocks());

// ── GET /api/v1/admin/stats ───────────────────────────────────────────────────

describe('GET /api/v1/admin/stats', () => {
  it('returns 200 with stats object', async () => {
    adminOrderService.getAdminStats.mockResolvedValue(MOCK_STATS);

    const res = await request(app).get('/api/v1/admin/stats');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.ordersToday).toBe(5);
    expect(res.body.data.revenueThisMonth).toBe(24500);
    expect(adminOrderService.getAdminStats).toHaveBeenCalledTimes(1);
  });

  it('returns 500 on service error', async () => {
    adminOrderService.getAdminStats.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/v1/admin/stats');

    expect(res.status).toBe(500);
  });
});

// ── GET /api/v1/admin/orders ──────────────────────────────────────────────────

describe('GET /api/v1/admin/orders', () => {
  it('returns 200 with paginated order list', async () => {
    adminOrderService.getAdminOrders.mockResolvedValue({
      orders: [MOCK_ORDER],
      total: 1,
      page: 1,
      pages: 1,
    });

    const res = await request(app).get('/api/v1/admin/orders');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.orders).toHaveLength(1);
    expect(adminOrderService.getAdminOrders).toHaveBeenCalledWith({
      page: undefined,
      limit: undefined,
      status: undefined,
    });
  });

  it('forwards page, limit, and status query params', async () => {
    adminOrderService.getAdminOrders.mockResolvedValue({ orders: [], total: 0, page: 2, pages: 0 });

    const res = await request(app).get('/api/v1/admin/orders?page=2&limit=5&status=confirmed');

    expect(res.status).toBe(200);
    expect(adminOrderService.getAdminOrders).toHaveBeenCalledWith({
      page: '2',
      limit: '5',
      status: 'confirmed',
    });
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(app).get('/api/v1/admin/orders?status=invalid');

    expect(res.status).toBe(400);
    expect(adminOrderService.getAdminOrders).not.toHaveBeenCalled();
  });

  it('returns 500 on service error', async () => {
    adminOrderService.getAdminOrders.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/v1/admin/orders');

    expect(res.status).toBe(500);
  });
});

// ── GET /api/v1/admin/orders/:orderId ─────────────────────────────────────────

describe('GET /api/v1/admin/orders/:orderId', () => {
  it('returns 200 with order on success', async () => {
    adminOrderService.getAdminOrderById.mockResolvedValue(MOCK_ORDER);

    const res = await request(app).get(`/api/v1/admin/orders/${VALID_ORDER_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.data.order.orderNumber).toBe('IT-202603-AB12CD');
    expect(adminOrderService.getAdminOrderById).toHaveBeenCalledWith(VALID_ORDER_ID);
  });

  it('returns 400 for invalid ObjectId', async () => {
    const res = await request(app).get('/api/v1/admin/orders/not-valid');

    expect(res.status).toBe(400);
    expect(adminOrderService.getAdminOrderById).not.toHaveBeenCalled();
  });

  it('returns 404 when order not found', async () => {
    const err = new Error('Order not found');
    err.status = 404;
    adminOrderService.getAdminOrderById.mockRejectedValue(err);

    const res = await request(app).get(`/api/v1/admin/orders/${VALID_ORDER_ID}`);

    expect(res.status).toBe(404);
  });
});

// ── PATCH /api/v1/admin/orders/:orderId/status ────────────────────────────────

describe('PATCH /api/v1/admin/orders/:orderId/status', () => {
  it('returns 200 on valid status update', async () => {
    const updated = { ...MOCK_ORDER, status: 'in_production' };
    adminOrderService.updateOrderStatus.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/api/v1/admin/orders/${VALID_ORDER_ID}/status`)
      .send({ status: 'in_production' });

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('in_production');
    expect(adminOrderService.updateOrderStatus).toHaveBeenCalledWith(
      VALID_ORDER_ID,
      'admin-001',
      { status: 'in_production', trackingNumber: undefined, carrier: undefined, note: undefined }
    );
  });

  it('returns 200 with tracking info for shipped status', async () => {
    const updated = { ...MOCK_ORDER, status: 'shipped', trackingNumber: '1Z999', carrier: 'UPS' };
    adminOrderService.updateOrderStatus.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/api/v1/admin/orders/${VALID_ORDER_ID}/status`)
      .send({ status: 'shipped', trackingNumber: '1Z999', carrier: 'UPS' });

    expect(res.status).toBe(200);
    expect(adminOrderService.updateOrderStatus).toHaveBeenCalledWith(
      VALID_ORDER_ID,
      'admin-001',
      { status: 'shipped', trackingNumber: '1Z999', carrier: 'UPS', note: undefined }
    );
  });

  it('returns 400 for missing status field', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/orders/${VALID_ORDER_ID}/status`)
      .send({});

    expect(res.status).toBe(400);
    expect(adminOrderService.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid status value', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/orders/${VALID_ORDER_ID}/status`)
      .send({ status: 'bad_status' });

    expect(res.status).toBe(400);
  });

  it('returns 422 for disallowed transition', async () => {
    const err = new Error("Cannot transition from 'delivered' to 'confirmed'");
    err.status = 422;
    adminOrderService.updateOrderStatus.mockRejectedValue(err);

    const res = await request(app)
      .patch(`/api/v1/admin/orders/${VALID_ORDER_ID}/status`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/cannot transition/i);
  });

  it('returns 500 on unexpected service error', async () => {
    adminOrderService.updateOrderStatus.mockRejectedValue(new Error('DB failure'));

    const res = await request(app)
      .patch(`/api/v1/admin/orders/${VALID_ORDER_ID}/status`)
      .send({ status: 'in_production' });

    expect(res.status).toBe(500);
  });
});

// ── POST /api/v1/admin/orders/:orderId/refund ────────────────────────────────

describe('POST /api/v1/admin/orders/:orderId/refund', () => {
  it('returns 200 on successful refund', async () => {
    const refunded = { ...MOCK_ORDER, status: 'refunded' };
    adminOrderService.processRefund.mockResolvedValue(refunded);

    const res = await request(app).post(`/api/v1/admin/orders/${VALID_ORDER_ID}/refund`);

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('refunded');
    expect(adminOrderService.processRefund).toHaveBeenCalledWith(VALID_ORDER_ID, 'admin-001');
  });

  it('returns 400 for invalid ObjectId', async () => {
    const res = await request(app).post('/api/v1/admin/orders/not-valid/refund');

    expect(res.status).toBe(400);
    expect(adminOrderService.processRefund).not.toHaveBeenCalled();
  });

  it('returns 422 when order is not cancelled', async () => {
    const err = new Error('Only cancelled orders can be refunded');
    err.status = 422;
    adminOrderService.processRefund.mockRejectedValue(err);

    const res = await request(app).post(`/api/v1/admin/orders/${VALID_ORDER_ID}/refund`);

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/cancelled/i);
  });

  it('returns 500 on unexpected service error', async () => {
    adminOrderService.processRefund.mockRejectedValue(new Error('Stripe error'));

    const res = await request(app).post(`/api/v1/admin/orders/${VALID_ORDER_ID}/refund`);

    expect(res.status).toBe(500);
  });
});
