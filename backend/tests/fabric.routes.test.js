'use strict';

/**
 * Integration tests for GET /api/v1/products and /api/v1/products/filters.
 * Mocks fabric.service to avoid DB calls.
 */

const request = require('supertest');

jest.mock('../src/services/fabric.service', () => ({
  getFabrics: jest.fn(),
  getFabricFilterOptions: jest.fn(),
}));

const app = require('../src/app');
const { getFabrics, getFabricFilterOptions } = require('../src/services/fabric.service');

const MOCK_RESULT = {
  fabrics: [
    { _id: 'f1', name: 'Italian Merino Wool', material: 'wool', color: 'navy', pattern: 'solid', price: 320 },
    { _id: 'f2', name: 'British Herringbone', material: 'wool', color: 'charcoal', pattern: 'herringbone', price: 280 },
  ],
  total: 2,
  page: 1,
  pages: 1,
  limit: 24,
};

const MOCK_FILTERS = {
  materials: ['wool', 'cotton', 'linen', 'silk'],
  colors: ['navy', 'charcoal', 'white'],
  patterns: ['solid', 'herringbone', 'striped'],
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/products', () => {
  it('returns 200 with fabric list and pagination', async () => {
    getFabrics.mockResolvedValue(MOCK_RESULT);

    const res = await request(app).get('/api/v1/products');

    expect(res.status).toBe(200);
    expect(res.body.fabrics).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.pages).toBe(1);
    expect(res.body.limit).toBe(24);
  });

  it('passes query params to getFabrics', async () => {
    getFabrics.mockResolvedValue(MOCK_RESULT);

    await request(app).get('/api/v1/products?material=wool&color=navy&minPrice=200&maxPrice=400&sort=price_asc&page=2&limit=12');

    expect(getFabrics).toHaveBeenCalledWith(
      expect.objectContaining({
        material: 'wool',
        color: 'navy',
        minPrice: '200',
        maxPrice: '400',
        sort: 'price_asc',
        page: '2',
        limit: '12',
      })
    );
  });

  it('passes search param to getFabrics', async () => {
    getFabrics.mockResolvedValue({ ...MOCK_RESULT, fabrics: [], total: 0 });

    await request(app).get('/api/v1/products?search=italian+wool');

    expect(getFabrics).toHaveBeenCalledWith(expect.objectContaining({ search: 'italian wool' }));
  });

  it('returns empty list when no fabrics match', async () => {
    getFabrics.mockResolvedValue({ fabrics: [], total: 0, page: 1, pages: 0, limit: 24 });

    const res = await request(app).get('/api/v1/products?color=purple');

    expect(res.status).toBe(200);
    expect(res.body.fabrics).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it('returns 500 when service throws', async () => {
    getFabrics.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/v1/products');

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/products/filters', () => {
  it('returns 200 with filter options', async () => {
    getFabricFilterOptions.mockResolvedValue(MOCK_FILTERS);

    const res = await request(app).get('/api/v1/products/filters');

    expect(res.status).toBe(200);
    expect(res.body.materials).toContain('wool');
    expect(res.body.colors).toContain('navy');
    expect(res.body.patterns).toContain('solid');
  });

  it('returns 500 when service throws', async () => {
    getFabricFilterOptions.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/v1/products/filters');

    expect(res.status).toBe(500);
  });
});
