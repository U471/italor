'use strict';

/**
 * Mock stripe before any module that uses it is loaded.
 * This prevents "Neither apiKey nor config.authenticator provided" from
 * throwing during module initialisation in the test environment.
 */
jest.mock('stripe', () => {
  const mockConstructEvent = jest.fn();
  const MockStripe = jest.fn(() => ({
    webhooks: { constructEvent: mockConstructEvent },
    paymentIntents: {
      retrieve: jest.fn(),
      create: jest.fn(),
    },
  }));
  MockStripe._mockConstructEvent = mockConstructEvent;
  return MockStripe;
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

jest.mock('../src/services/payment.service', () => ({
  createPaymentIntent: jest.fn(),
  handlePaymentSucceeded: jest.fn(),
  handlePaymentFailed: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const paymentService = require('../src/services/payment.service');
const Stripe = require('stripe');

const VALID_ORDER_ID = '507f1f77bcf86cd799439011';

beforeEach(() => jest.clearAllMocks());

// ── POST /api/v1/payments/:orderId/create-intent ───────────────────────────

describe('POST /api/v1/payments/:orderId/create-intent', () => {
  it('returns 200 with clientSecret on success', async () => {
    paymentService.createPaymentIntent.mockResolvedValue({
      clientSecret: 'pi_test_secret',
      paymentIntentId: 'pi_test_123',
    });

    const res = await request(app)
      .post(`/api/v1/payments/${VALID_ORDER_ID}/create-intent`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.clientSecret).toBe('pi_test_secret');
    expect(res.body.data.paymentIntentId).toBe('pi_test_123');
    expect(paymentService.createPaymentIntent).toHaveBeenCalledWith(VALID_ORDER_ID, 'user-123');
  });

  it('returns 400 when orderId is not a valid MongoDB ObjectId', async () => {
    const res = await request(app).post('/api/v1/payments/not-a-valid-id/create-intent');

    expect(res.status).toBe(400);
    expect(paymentService.createPaymentIntent).not.toHaveBeenCalled();
  });

  it('returns 404 when order is not found (service throws)', async () => {
    const err = new Error('Order not found');
    err.status = 404;
    paymentService.createPaymentIntent.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/v1/payments/${VALID_ORDER_ID}/create-intent`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/order not found/i);
  });

  it('returns 400 when order is not in pending_payment status (service throws)', async () => {
    const err = new Error('Order cannot be paid in its current status: confirmed');
    err.status = 400;
    paymentService.createPaymentIntent.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/v1/payments/${VALID_ORDER_ID}/create-intent`);

    expect(res.status).toBe(400);
  });

  it('returns 500 on unexpected service error', async () => {
    paymentService.createPaymentIntent.mockRejectedValue(new Error('Stripe API error'));

    const res = await request(app)
      .post(`/api/v1/payments/${VALID_ORDER_ID}/create-intent`);

    expect(res.status).toBe(500);
  });
});

// ── POST /api/v1/webhooks/stripe ──────────────────────────────────────────

describe('POST /api/v1/webhooks/stripe', () => {
  const mockStripeInstance = Stripe();
  const mockConstructEvent = mockStripeInstance.webhooks.constructEvent;

  it('returns 400 when stripe signature is invalid', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const res = await request(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'invalid-sig')
      .send(Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' })));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/signature/i);
  });

  it('returns 200 and calls handlePaymentSucceeded on payment_intent.succeeded', async () => {
    const mockPaymentIntent = {
      id: 'pi_test_123',
      metadata: { orderId: VALID_ORDER_ID },
      payment_method_types: ['card'],
    };
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: mockPaymentIntent },
    });
    paymentService.handlePaymentSucceeded.mockResolvedValue({
      orderNumber: 'IT-202603-AB12CD',
    });

    const res = await request(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' })));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(paymentService.handlePaymentSucceeded).toHaveBeenCalledWith(mockPaymentIntent);
  });

  it('returns 200 and calls handlePaymentFailed on payment_intent.payment_failed', async () => {
    const mockPaymentIntent = {
      id: 'pi_test_456',
      metadata: { orderId: VALID_ORDER_ID },
    };
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: { object: mockPaymentIntent },
    });
    paymentService.handlePaymentFailed.mockResolvedValue({ orderNumber: 'IT-202603-CD34EF' });

    const res = await request(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(Buffer.from(JSON.stringify({ type: 'payment_intent.payment_failed' })));

    expect(res.status).toBe(200);
    expect(paymentService.handlePaymentFailed).toHaveBeenCalledWith(mockPaymentIntent);
  });

  it('returns 200 for unhandled event types (does not crash)', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.created',
      data: { object: {} },
    });

    const res = await request(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(Buffer.from(JSON.stringify({ type: 'customer.created' })));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it('returns 200 even when handlePaymentSucceeded throws (Stripe must not retry)', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_broken', metadata: {} } },
    });
    paymentService.handlePaymentSucceeded.mockRejectedValue(new Error('DB failure'));

    const res = await request(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' })));

    // Must return 200 even on internal error to prevent Stripe retries
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});
