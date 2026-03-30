'use strict';

const request = require('supertest');

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

jest.mock('../src/services/checkout.service', () => ({
  validateCheckout: jest.fn(),
  createPendingOrder: jest.fn(),
  getOrderById: jest.fn(),
}));

const app = require('../src/app');
const checkoutService = require('../src/services/checkout.service');

const MOCK_SHIPPING_ADDRESS = {
  fullName: 'John Doe',
  line1: '123 Main St',
  line2: 'Apt 4B',
  city: 'London',
  state: '',
  postalCode: 'EC1A 1BB',
  country: 'United Kingdom',
  phone: '+44 7000 000000',
};

const MOCK_SUMMARY = {
  items: [
    {
      cartItemId: 'abc-1',
      fabricName: 'Merino Wool',
      unitPrice: 300,
      quantity: 1,
    },
  ],
  shippingRegion: 'international',
  promoCode: null,
  subtotal: 300,
  discountAmount: 0,
  shippingCost: 45,
  taxAmount: 0,
  total: 345,
};

const MOCK_ORDER = {
  _id: 'order-123',
  orderNumber: 'IT-202603-AB12CD',
  user: 'user-123',
  items: MOCK_SUMMARY.items,
  shippingAddress: MOCK_SHIPPING_ADDRESS,
  shippingRegion: 'international',
  promoCode: null,
  subtotal: 300,
  discountAmount: 0,
  shippingCost: 45,
  taxAmount: 0,
  total: 345,
  status: 'pending_payment',
  statusHistory: [{ status: 'pending_payment', timestamp: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

// ── POST /api/v1/checkout/validate ────────────────────────────────────────────

describe('POST /api/v1/checkout/validate', () => {
  it('returns 200 with a pricing summary on valid input', async () => {
    checkoutService.validateCheckout.mockResolvedValue(MOCK_SUMMARY);

    const res = await request(app)
      .post('/api/v1/checkout/validate')
      .send({ shippingRegion: 'international' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.total).toBe(345);
    expect(checkoutService.validateCheckout).toHaveBeenCalledWith('user-123', {
      shippingRegion: 'international',
      promoCode: null,
    });
  });

  it('returns 200 with promo code forwarded to service', async () => {
    checkoutService.validateCheckout.mockResolvedValue({
      ...MOCK_SUMMARY,
      promoCode: 'SUIT20',
      discountAmount: 60,
      total: 285,
    });

    const res = await request(app)
      .post('/api/v1/checkout/validate')
      .send({ shippingRegion: 'international', promoCode: 'SUIT20' });

    expect(res.status).toBe(200);
    expect(checkoutService.validateCheckout).toHaveBeenCalledWith('user-123', {
      shippingRegion: 'international',
      promoCode: 'SUIT20',
    });
  });

  it('returns 400 when shippingRegion is missing', async () => {
    const res = await request(app)
      .post('/api/v1/checkout/validate')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(checkoutService.validateCheckout).not.toHaveBeenCalled();
  });

  it('returns 400 when shippingRegion is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/checkout/validate')
      .send({ shippingRegion: 'europe' });

    expect(res.status).toBe(400);
    expect(checkoutService.validateCheckout).not.toHaveBeenCalled();
  });

  it('returns 400 when cart is empty (service throws)', async () => {
    const err = new Error('Cart is empty');
    err.status = 400;
    checkoutService.validateCheckout.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/v1/checkout/validate')
      .send({ shippingRegion: 'us' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cart is empty/i);
  });

  it('returns 400 when promo code is invalid (service throws)', async () => {
    const err = new Error('Promo code is invalid or has expired');
    err.status = 400;
    checkoutService.validateCheckout.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/v1/checkout/validate')
      .send({ shippingRegion: 'us', promoCode: 'BADCODE' });

    expect(res.status).toBe(400);
  });

  it('returns 500 on unexpected service error', async () => {
    checkoutService.validateCheckout.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/v1/checkout/validate')
      .send({ shippingRegion: 'us' });

    expect(res.status).toBe(500);
  });
});

// ── POST /api/v1/checkout/orders ─────────────────────────────────────────────

describe('POST /api/v1/checkout/orders', () => {
  const validPayload = {
    shippingAddress: MOCK_SHIPPING_ADDRESS,
    shippingRegion: 'international',
  };

  it('returns 201 with the created order on valid input', async () => {
    checkoutService.createPendingOrder.mockResolvedValue(MOCK_ORDER);

    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.order.orderNumber).toBe('IT-202603-AB12CD');
    expect(res.body.data.order.status).toBe('pending_payment');
    expect(checkoutService.createPendingOrder).toHaveBeenCalledWith('user-123', {
      shippingAddress: MOCK_SHIPPING_ADDRESS,
      shippingRegion: 'international',
      promoCode: null,
    });
  });

  it('forwards the promoCode to the service', async () => {
    checkoutService.createPendingOrder.mockResolvedValue({
      ...MOCK_ORDER,
      promoCode: 'SUIT20',
      discountAmount: 60,
      total: 285,
    });

    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .send({ ...validPayload, promoCode: 'SUIT20' });

    expect(res.status).toBe(201);
    expect(checkoutService.createPendingOrder).toHaveBeenCalledWith('user-123', {
      shippingAddress: MOCK_SHIPPING_ADDRESS,
      shippingRegion: 'international',
      promoCode: 'SUIT20',
    });
  });

  it('returns 400 when fullName is missing', async () => {
    const { fullName: _fn, ...addressWithoutName } = MOCK_SHIPPING_ADDRESS;
    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .send({ shippingAddress: addressWithoutName, shippingRegion: 'international' });

    expect(res.status).toBe(400);
    expect(checkoutService.createPendingOrder).not.toHaveBeenCalled();
  });

  it('returns 400 when line1 is missing', async () => {
    const { line1: _l1, ...addressWithoutLine1 } = MOCK_SHIPPING_ADDRESS;
    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .send({ shippingAddress: addressWithoutLine1, shippingRegion: 'international' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when city is missing', async () => {
    const { city: _c, ...addressWithoutCity } = MOCK_SHIPPING_ADDRESS;
    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .send({ shippingAddress: addressWithoutCity, shippingRegion: 'international' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when postalCode is missing', async () => {
    const { postalCode: _pc, ...addressWithoutPostal } = MOCK_SHIPPING_ADDRESS;
    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .send({ shippingAddress: addressWithoutPostal, shippingRegion: 'international' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when country is missing', async () => {
    const { country: _cn, ...addressWithoutCountry } = MOCK_SHIPPING_ADDRESS;
    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .send({ shippingAddress: addressWithoutCountry, shippingRegion: 'international' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when shippingRegion is missing', async () => {
    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .send({ shippingAddress: MOCK_SHIPPING_ADDRESS });

    expect(res.status).toBe(400);
  });

  it('returns 400 when cart is empty (service throws)', async () => {
    const err = new Error('Cart is empty');
    err.status = 400;
    checkoutService.createPendingOrder.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cart is empty/i);
  });

  it('returns 500 on unexpected service error', async () => {
    checkoutService.createPendingOrder.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .send(validPayload);

    expect(res.status).toBe(500);
  });
});

// ── GET /api/v1/checkout/orders/:orderId ──────────────────────────────────────

describe('GET /api/v1/checkout/orders/:orderId', () => {
  it('returns 200 with the order on success', async () => {
    checkoutService.getOrderById.mockResolvedValue(MOCK_ORDER);

    const res = await request(app).get('/api/v1/checkout/orders/order-123');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.order.orderNumber).toBe('IT-202603-AB12CD');
    expect(checkoutService.getOrderById).toHaveBeenCalledWith('order-123', 'user-123');
  });

  it('returns 404 when order is not found', async () => {
    const err = new Error('Order not found');
    err.status = 404;
    checkoutService.getOrderById.mockRejectedValue(err);

    const res = await request(app).get('/api/v1/checkout/orders/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/order not found/i);
  });

  it('returns 500 on unexpected service error', async () => {
    checkoutService.getOrderById.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/v1/checkout/orders/order-123');

    expect(res.status).toBe(500);
  });
});
