'use strict';

const request = require('supertest');

jest.mock('../src/middleware/upload.middleware', () => ({
  uploadAvatar: { single: jest.fn(() => (_req, _res, next) => next()) },
  uploadFabricImage: { single: jest.fn(() => (_req, _res, next) => next()) },
  cloudinary: {},
}));

jest.mock('../src/services/promo.service', () => ({
  validatePromo: jest.fn(),
}));

const app = require('../src/app');
const promoService = require('../src/services/promo.service');

beforeEach(() => jest.clearAllMocks());

describe('POST /api/v1/promo/validate', () => {
  it('returns 200 with isValid: true for a valid promo code', async () => {
    promoService.validatePromo.mockResolvedValue({
      isValid: true,
      discountType: 'percentage',
      discountValue: 20,
      expiresAt: null,
    });

    const res = await request(app)
      .post('/api/v1/promo/validate')
      .send({ code: 'SUIT20', cartTotal: 500 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.discountValue).toBe(20);
    expect(promoService.validatePromo).toHaveBeenCalledWith('SUIT20', 500);
  });

  it('returns 200 with isValid: false for an invalid promo code', async () => {
    promoService.validatePromo.mockResolvedValue({ isValid: false });

    const res = await request(app)
      .post('/api/v1/promo/validate')
      .send({ code: 'BADCODE', cartTotal: 200 });

    expect(res.status).toBe(200);
    expect(res.body.data.isValid).toBe(false);
  });

  it('returns 400 when code field is missing', async () => {
    const res = await request(app)
      .post('/api/v1/promo/validate')
      .send({ cartTotal: 200 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/code is required/i);
  });

  it('returns 400 when code is not a string', async () => {
    const res = await request(app)
      .post('/api/v1/promo/validate')
      .send({ code: 123, cartTotal: 200 });

    expect(res.status).toBe(400);
  });

  it('defaults cartTotal to 0 when not provided', async () => {
    promoService.validatePromo.mockResolvedValue({ isValid: false });

    const res = await request(app)
      .post('/api/v1/promo/validate')
      .send({ code: 'SUIT20' });

    expect(res.status).toBe(200);
    expect(promoService.validatePromo).toHaveBeenCalledWith('SUIT20', 0);
  });

  it('returns 500 on service error', async () => {
    promoService.validatePromo.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/v1/promo/validate')
      .send({ code: 'SUIT20', cartTotal: 500 });

    expect(res.status).toBe(500);
  });
});
