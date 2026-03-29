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

jest.mock('../src/services/cart.service', () => ({
  getCart: jest.fn(),
  addItem: jest.fn(),
  updateQuantity: jest.fn(),
  removeItem: jest.fn(),
  mergeGuestCart: jest.fn(),
}));

const app = require('../src/app');
const cartService = require('../src/services/cart.service');

const MOCK_CART = { user: 'user-123', items: [] };
const MOCK_ITEM = {
  cartItemId: 'abc-123',
  suitConfig: { fabric: { _id: 'f1', name: 'Wool' } },
  fabricId: 'f1',
  fabricName: 'Wool',
  fabricSwatchUrl: null,
  unitPrice: 300,
  quantity: 1,
  addedAt: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/cart', () => {
  it('returns 200 with the user cart', async () => {
    cartService.getCart.mockResolvedValue(MOCK_CART);
    const res = await request(app).get('/api/v1/cart');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(cartService.getCart).toHaveBeenCalledWith('user-123');
  });

  it('returns 500 on service error', async () => {
    cartService.getCart.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/api/v1/cart');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/v1/cart/items', () => {
  it('returns 201 with updated cart after add', async () => {
    cartService.addItem.mockResolvedValue({ ...MOCK_CART, items: [MOCK_ITEM] });
    const res = await request(app).post('/api/v1/cart/items').send(MOCK_ITEM);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(cartService.addItem).toHaveBeenCalledWith('user-123', MOCK_ITEM);
  });

  it('returns 500 on service error', async () => {
    cartService.addItem.mockRejectedValue(new Error('DB error'));
    const res = await request(app).post('/api/v1/cart/items').send({});
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/v1/cart/items/:cartItemId', () => {
  it('returns 200 after updating quantity', async () => {
    cartService.updateQuantity.mockResolvedValue(MOCK_CART);
    const res = await request(app)
      .put('/api/v1/cart/items/abc-123')
      .send({ quantity: 2 });
    expect(res.status).toBe(200);
    expect(cartService.updateQuantity).toHaveBeenCalledWith('user-123', 'abc-123', 2);
  });

  it('returns 404 when cart item is not found', async () => {
    const err = new Error('Cart item not found');
    err.status = 404;
    cartService.updateQuantity.mockRejectedValue(err);
    const res = await request(app)
      .put('/api/v1/cart/items/nonexistent')
      .send({ quantity: 2 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/cart/items/:cartItemId', () => {
  it('returns 200 after removing item', async () => {
    cartService.removeItem.mockResolvedValue(MOCK_CART);
    const res = await request(app).delete('/api/v1/cart/items/abc-123');
    expect(res.status).toBe(200);
    expect(cartService.removeItem).toHaveBeenCalledWith('user-123', 'abc-123');
  });

  it('returns 500 on service error', async () => {
    cartService.removeItem.mockRejectedValue(new Error('DB error'));
    const res = await request(app).delete('/api/v1/cart/items/abc-123');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/v1/cart/merge', () => {
  it('returns 200 after merging guest cart items', async () => {
    cartService.mergeGuestCart.mockResolvedValue({ ...MOCK_CART, items: [MOCK_ITEM] });
    const res = await request(app)
      .post('/api/v1/cart/merge')
      .send({ items: [MOCK_ITEM] });
    expect(res.status).toBe(200);
    expect(cartService.mergeGuestCart).toHaveBeenCalledWith('user-123', [MOCK_ITEM]);
  });

  it('merges with empty array when items field is absent', async () => {
    cartService.mergeGuestCart.mockResolvedValue(MOCK_CART);
    const res = await request(app).post('/api/v1/cart/merge').send({});
    expect(res.status).toBe(200);
    expect(cartService.mergeGuestCart).toHaveBeenCalledWith('user-123', []);
  });
});
