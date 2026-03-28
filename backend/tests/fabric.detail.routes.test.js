'use strict';

/**
 * Integration tests for GET /api/v1/products/:id and /api/v1/products/:id/reviews
 */

const request = require('supertest');

jest.mock('../src/services/fabric.service', () => ({
  getFabrics: jest.fn(),
  getFabricFilterOptions: jest.fn(),
  getFabricById: jest.fn(),
  getFabricReviews: jest.fn(),
  getRelatedFabrics: jest.fn(),
}));

const app = require('../src/app');
const { getFabricById, getFabricReviews, getRelatedFabrics } = require('../src/services/fabric.service');

const MOCK_FABRIC = {
  _id: 'f1',
  name: 'Italian Merino Wool',
  material: 'wool',
  color: 'navy',
  pattern: 'solid',
  price: 320,
  origin: 'Italy',
  weight: 280,
  season: 'all-year',
  careInstructions: 'Dry clean only.',
  patternDescription: 'Clean solid navy.',
  images: [],
  averageRating: 4.5,
  reviewCount: 12,
};

const MOCK_RELATED = [
  { _id: 'f2', name: 'Navy Chalk Stripe', material: 'wool', color: 'navy', pattern: 'striped', price: 290 },
];

const MOCK_REVIEWS_RESULT = {
  reviews: [
    {
      _id: 'r1',
      displayName: 'James T.',
      rating: 5,
      fitRating: 4,
      title: 'Outstanding quality',
      body: 'Absolutely love this fabric.',
      isVerifiedPurchase: true,
      createdAt: '2024-01-15T10:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  pages: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  getRelatedFabrics.mockResolvedValue(MOCK_RELATED);
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/products/:id', () => {
  it('returns 200 with fabric and related fabrics', async () => {
    getFabricById.mockResolvedValue(MOCK_FABRIC);

    const res = await request(app).get('/api/v1/products/f1');

    expect(res.status).toBe(200);
    expect(res.body.fabric.name).toBe('Italian Merino Wool');
    expect(res.body.fabric.averageRating).toBe(4.5);
    expect(res.body.fabric.reviewCount).toBe(12);
    expect(res.body.related).toHaveLength(1);
  });

  it('returns fabric with new SCRUM-20 fields', async () => {
    getFabricById.mockResolvedValue(MOCK_FABRIC);

    const res = await request(app).get('/api/v1/products/f1');

    expect(res.body.fabric.season).toBe('all-year');
    expect(res.body.fabric.careInstructions).toBe('Dry clean only.');
    expect(res.body.fabric.patternDescription).toBe('Clean solid navy.');
  });

  it('returns 404 when fabric not found', async () => {
    getFabricById.mockResolvedValue(null);

    const res = await request(app).get('/api/v1/products/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 500 when service throws', async () => {
    getFabricById.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/v1/products/f1');

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/products/:id/reviews', () => {
  it('returns 200 with paginated reviews', async () => {
    getFabricReviews.mockResolvedValue(MOCK_REVIEWS_RESULT);

    const res = await request(app).get('/api/v1/products/f1/reviews');

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pages).toBe(1);
  });

  it('passes page and limit query params to service', async () => {
    getFabricReviews.mockResolvedValue({ reviews: [], total: 0, page: 2, pages: 0 });

    await request(app).get('/api/v1/products/f1/reviews?page=2&limit=5');

    expect(getFabricReviews).toHaveBeenCalledWith('f1', { page: '2', limit: '5' });
  });

  it('returns review with verified purchase flag', async () => {
    getFabricReviews.mockResolvedValue(MOCK_REVIEWS_RESULT);

    const res = await request(app).get('/api/v1/products/f1/reviews');

    expect(res.body.reviews[0].isVerifiedPurchase).toBe(true);
    expect(res.body.reviews[0].fitRating).toBe(4);
  });

  it('returns empty reviews list', async () => {
    getFabricReviews.mockResolvedValue({ reviews: [], total: 0, page: 1, pages: 0 });

    const res = await request(app).get('/api/v1/products/f1/reviews');

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(0);
  });

  it('returns 500 when service throws', async () => {
    getFabricReviews.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/v1/products/f1/reviews');

    expect(res.status).toBe(500);
  });
});
