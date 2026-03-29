'use strict';

jest.mock('stripe', () => {
  return jest.fn(() => ({
    webhooks: { constructEvent: jest.fn() },
    paymentIntents: { retrieve: jest.fn(), create: jest.fn() },
  }));
});

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, _res, next) => {
    req.user = { userId: 'user-123', email: 'user@test.com' };
    next();
  }),
}));

jest.mock('../src/middleware/upload.middleware', () => ({
  uploadAvatar: { single: jest.fn(() => (_req, _res, next) => next()) },
  uploadFabricImage: { single: jest.fn(() => (_req, _res, next) => next()) },
  cloudinary: {},
}));

jest.mock('../src/services/order.service', () => ({
  getOrdersByUser: jest.fn(),
  getOrderByIdForUser: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const orderService = require('../src/services/order.service');

const VALID_ORDER_ID = '507f1f77bcf86cd799439011';

const MOCK_ORDER = {
  _id: VALID_ORDER_ID,
  orderNumber: 'IT-202603-AB12CD',
  user: 'user-123',
  status: 'confirmed',
  items: [{ cartItemId: 'item-1', fabricName: 'Merino Wool', unitPrice: 300, quantity: 1 }],
  subtotal: 300,
  discountAmount: 0,
  shippingCost: 45,
  taxAmount: 0,
  total: 345,
  createdAt: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

// ── GET /api/v1/orders ────────────────────────────────────────────────────────

describe('GET /api/v1/orders', () => {
  it('returns 200 with paginated order list', async () => {
    orderService.getOrdersByUser.mockResolvedValue({
      orders: [MOCK_ORDER],
      total: 1,
      page: 1,
      pages: 1,
    });

    const res = await request(app).get('/api/v1/orders');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.orders).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
    expect(orderService.getOrdersByUser).toHaveBeenCalledWith('user-123', {
      page: undefined,
      limit: undefined,
      status: undefined,
    });
  });

  it('forwards page and limit query params to service', async () => {
    orderService.getOrdersByUser.mockResolvedValue({ orders: [], total: 0, page: 2, pages: 0 });

    const res = await request(app).get('/api/v1/orders?page=2&limit=5');

    expect(res.status).toBe(200);
    expect(orderService.getOrdersByUser).toHaveBeenCalledWith('user-123', {
      page: '2',
      limit: '5',
      status: undefined,
    });
  });

  it('filters by status when provided', async () => {
    orderService.getOrdersByUser.mockResolvedValue({ orders: [], total: 0, page: 1, pages: 0 });

    const res = await request(app).get('/api/v1/orders?status=confirmed');

    expect(res.status).toBe(200);
    expect(orderService.getOrdersByUser).toHaveBeenCalledWith('user-123', {
      page: undefined,
      limit: undefined,
      status: 'confirmed',
    });
  });

  it('returns 400 for invalid status value', async () => {
    const res = await request(app).get('/api/v1/orders?status=invalid_status');

    expect(res.status).toBe(400);
    expect(orderService.getOrdersByUser).not.toHaveBeenCalled();
  });

  it('returns 400 for non-integer page value', async () => {
    const res = await request(app).get('/api/v1/orders?page=abc');

    expect(res.status).toBe(400);
  });

  it('returns 500 on service error', async () => {
    orderService.getOrdersByUser.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/v1/orders');

    expect(res.status).toBe(500);
  });
});

// ── GET /api/v1/orders/:orderId ────────────────────────────────────────────────

describe('GET /api/v1/orders/:orderId', () => {
  it('returns 200 with order on success', async () => {
    orderService.getOrderByIdForUser.mockResolvedValue(MOCK_ORDER);

    const res = await request(app).get(`/api/v1/orders/${VALID_ORDER_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.order.orderNumber).toBe('IT-202603-AB12CD');
    expect(orderService.getOrderByIdForUser).toHaveBeenCalledWith(VALID_ORDER_ID, 'user-123');
  });

  it('returns 400 for invalid MongoDB ObjectId', async () => {
    const res = await request(app).get('/api/v1/orders/not-a-valid-id');

    expect(res.status).toBe(400);
    expect(orderService.getOrderByIdForUser).not.toHaveBeenCalled();
  });

  it('returns 404 when order is not found', async () => {
    const err = new Error('Order not found');
    err.status = 404;
    orderService.getOrderByIdForUser.mockRejectedValue(err);

    const res = await request(app).get(`/api/v1/orders/${VALID_ORDER_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/order not found/i);
  });

  it('returns 500 on unexpected service error', async () => {
    orderService.getOrderByIdForUser.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get(`/api/v1/orders/${VALID_ORDER_ID}`);

    expect(res.status).toBe(500);
  });
});
