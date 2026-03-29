'use strict';

jest.mock('../src/models/PromoCode');

const PromoCode = require('../src/models/PromoCode');
const { validatePromo } = require('../src/services/promo.service');

const FUTURE = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days from now
const PAST = new Date(Date.now() - 1000 * 60 * 60 * 24); // yesterday

function makePromo(overrides = {}) {
  return {
    code: 'SUIT20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 0,
    usageLimit: null,
    usedCount: 0,
    expiresAt: FUTURE,
    isActive: true,
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

describe('validatePromo', () => {
  it('returns isValid: true for a valid active promo', async () => {
    PromoCode.findOne.mockResolvedValue(makePromo());
    const result = await validatePromo('SUIT20', 500);
    expect(result.isValid).toBe(true);
    expect(result.discountType).toBe('percentage');
    expect(result.discountValue).toBe(20);
  });

  it('looks up the code case-insensitively (uppercased)', async () => {
    PromoCode.findOne.mockResolvedValue(makePromo());
    await validatePromo('suit20', 500);
    expect(PromoCode.findOne).toHaveBeenCalledWith({ code: 'SUIT20' });
  });

  it('returns isValid: false when code does not exist', async () => {
    PromoCode.findOne.mockResolvedValue(null);
    const result = await validatePromo('INVALID', 500);
    expect(result.isValid).toBe(false);
  });

  it('returns isValid: false when promo is inactive', async () => {
    PromoCode.findOne.mockResolvedValue(makePromo({ isActive: false }));
    const result = await validatePromo('SUIT20', 500);
    expect(result.isValid).toBe(false);
  });

  it('returns isValid: false when promo has expired', async () => {
    PromoCode.findOne.mockResolvedValue(makePromo({ expiresAt: PAST }));
    const result = await validatePromo('SUIT20', 500);
    expect(result.isValid).toBe(false);
  });

  it('returns isValid: true when expiresAt is null (never expires)', async () => {
    PromoCode.findOne.mockResolvedValue(makePromo({ expiresAt: null }));
    const result = await validatePromo('SUIT20', 500);
    expect(result.isValid).toBe(true);
  });

  it('returns isValid: false when usage limit is reached', async () => {
    PromoCode.findOne.mockResolvedValue(makePromo({ usageLimit: 10, usedCount: 10 }));
    const result = await validatePromo('SUIT20', 500);
    expect(result.isValid).toBe(false);
  });

  it('returns isValid: true when usageLimit is null (unlimited)', async () => {
    PromoCode.findOne.mockResolvedValue(makePromo({ usageLimit: null, usedCount: 9999 }));
    const result = await validatePromo('SUIT20', 500);
    expect(result.isValid).toBe(true);
  });

  it('returns isValid: false when cartTotal is below minOrderValue', async () => {
    PromoCode.findOne.mockResolvedValue(makePromo({ minOrderValue: 1000 }));
    const result = await validatePromo('SUIT20', 500);
    expect(result.isValid).toBe(false);
  });

  it('returns isValid: true when cartTotal meets minOrderValue exactly', async () => {
    PromoCode.findOne.mockResolvedValue(makePromo({ minOrderValue: 500 }));
    const result = await validatePromo('SUIT20', 500);
    expect(result.isValid).toBe(true);
  });
});
