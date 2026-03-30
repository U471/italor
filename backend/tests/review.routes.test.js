'use strict';

/**
 * Integration-style route tests for review endpoints.
 * Uses supertest against the Express app with all external services mocked.
 */

jest.mock('stripe', () =>
  jest.fn(() => ({
    webhooks: { constructEvent: jest.fn() },
    paymentIntents: { retrieve: jest.fn(), create: jest.fn() },
  }))
);

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, _res, next) => {
    req.user = { userId: 'user-123', email: 'user@test.com', role: 'user' };
    next();
  }),
}));

jest.mock('../src/middleware/upload.middleware', () => ({
  uploadAvatar:      { single: jest.fn(() => (_req, _res, next) => next()) },
  uploadFabricImage: { single: jest.fn(() => (_req, _res, next) => next()) },
  cloudinary: {},
}));

jest.mock('../src/services/review.service', () => ({
  createReview:      jest.fn(),
  getReviewsByUser:  jest.fn(),
  deleteReview:      jest.fn(),
  markHelpful:       jest.fn(),
}));

const request     = require('supertest');
const app         = require('../src/app');
const reviewService = require('../src/services/review.service');

const VALID_FABRIC_ID = '507f1f77bcf86cd799439011';
const VALID_ORDER_ID  = '507f1f77bcf86cd799439012';
const VALID_REVIEW_ID = '507f1f77bcf86cd799439013';

const MOCK_REVIEW = {
  _id: VALID_REVIEW_ID,
  fabric: VALID_FABRIC_ID,
  user: 'user-123',
  order: VALID_ORDER_ID,
  displayName: 'James T.',
  rating: 5,
  title: 'Excellent fabric',
  body: 'Outstanding quality, would order again.',
  isVerifiedPurchase: true,
  helpfulVotes: 0,
  createdAt: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/products/:fabricId/reviews
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/products/:fabricId/reviews', () => {
  const endpoint = `/api/v1/products/${VALID_FABRIC_ID}/reviews`;

  it('returns 201 with created review on valid payload', async () => {
    reviewService.createReview.mockResolvedValue(MOCK_REVIEW);

    const res = await request(app)
      .post(endpoint)
      .send({ orderId: VALID_ORDER_ID, rating: 5, title: 'Excellent', body: 'Outstanding quality, would order again.' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.review.rating).toBe(5);
    expect(reviewService.createReview).toHaveBeenCalledWith(
      'user-123',
      VALID_FABRIC_ID,
      VALID_ORDER_ID,
      expect.objectContaining({ rating: 5 })
    );
  });

  it('returns 400 when fabricId is not a valid MongoId', async () => {
    const res = await request(app)
      .post('/api/v1/products/not-a-mongo-id/reviews')
      .send({ orderId: VALID_ORDER_ID, rating: 5 });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 400 when orderId is missing', async () => {
    const res = await request(app)
      .post(endpoint)
      .send({ rating: 5 });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 400 when rating is out of range', async () => {
    const res = await request(app)
      .post(endpoint)
      .send({ orderId: VALID_ORDER_ID, rating: 6 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when body is shorter than 20 characters', async () => {
    const res = await request(app)
      .post(endpoint)
      .send({ orderId: VALID_ORDER_ID, rating: 4, body: 'Too short' });

    expect(res.status).toBe(400);
  });

  it('returns 409 when user has already reviewed this order', async () => {
    const err = new Error('You have already reviewed this item. You can edit your existing review.');
    err.status = 409;
    reviewService.createReview.mockRejectedValue(err);

    const res = await request(app)
      .post(endpoint)
      .send({ orderId: VALID_ORDER_ID, rating: 4, title: 'OK', body: 'Decent quality for the price paid.' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already reviewed/);
  });

  it('returns 422 when order is not delivered', async () => {
    const err = new Error('You can only review items from delivered orders');
    err.status = 422;
    reviewService.createReview.mockRejectedValue(err);

    const res = await request(app)
      .post(endpoint)
      .send({ orderId: VALID_ORDER_ID, rating: 3, title: 'Good', body: 'It was a decent fabric overall.' });

    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/reviews/my
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/reviews/my', () => {
  it('returns 200 with user reviews', async () => {
    reviewService.getReviewsByUser.mockResolvedValue({
      reviews: [MOCK_REVIEW],
      total: 1,
      page: 1,
      pages: 1,
    });

    const res = await request(app).get('/api/v1/reviews/my');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.reviews).toHaveLength(1);
    expect(reviewService.getReviewsByUser).toHaveBeenCalledWith('user-123', {
      page: undefined,
      limit: undefined,
    });
  });

  it('returns 400 when page query param is invalid', async () => {
    const res = await request(app).get('/api/v1/reviews/my?page=abc');
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/reviews/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/v1/reviews/:id', () => {
  it('returns 200 on successful deletion', async () => {
    reviewService.deleteReview.mockResolvedValue(undefined);

    const res = await request(app).delete(`/api/v1/reviews/${VALID_REVIEW_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(reviewService.deleteReview).toHaveBeenCalledWith(VALID_REVIEW_ID, 'user-123', 'user');
  });

  it('returns 400 for invalid review id', async () => {
    const res = await request(app).delete('/api/v1/reviews/not-valid');
    expect(res.status).toBe(400);
  });

  it('returns 404 when review does not exist', async () => {
    const err = new Error('Review not found');
    err.status = 404;
    reviewService.deleteReview.mockRejectedValue(err);

    const res = await request(app).delete(`/api/v1/reviews/${VALID_REVIEW_ID}`);
    expect(res.status).toBe(404);
  });

  it('returns 403 when non-owner tries to delete', async () => {
    const err = new Error('You are not authorised to delete this review');
    err.status = 403;
    reviewService.deleteReview.mockRejectedValue(err);

    const res = await request(app).delete(`/api/v1/reviews/${VALID_REVIEW_ID}`);
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/reviews/:id/helpful
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/reviews/:id/helpful', () => {
  it('returns 200 with updated helpful vote count', async () => {
    reviewService.markHelpful.mockResolvedValue({ helpfulVotes: 3 });

    const res = await request(app).post(`/api/v1/reviews/${VALID_REVIEW_ID}/helpful`);

    expect(res.status).toBe(200);
    expect(res.body.data.helpfulVotes).toBe(3);
    expect(reviewService.markHelpful).toHaveBeenCalledWith(VALID_REVIEW_ID, 'user-123');
  });

  it('returns 409 when user has already voted helpful', async () => {
    const err = new Error('You have already marked this review as helpful');
    err.status = 409;
    reviewService.markHelpful.mockRejectedValue(err);

    const res = await request(app).post(`/api/v1/reviews/${VALID_REVIEW_ID}/helpful`);
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid review id', async () => {
    const res = await request(app).post('/api/v1/reviews/bad-id/helpful');
    expect(res.status).toBe(400);
  });
});
