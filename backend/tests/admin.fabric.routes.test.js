'use strict';

/**
 * Integration tests for admin fabric CRUD routes.
 * Mocks auth middleware, admin middleware, and admin.fabric.service.
 */

const request = require('supertest');

// Mock auth + admin middleware to control access
jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, _res, next) => {
    req.user = { userId: 'admin-id', email: 'admin@test.com', role: 'admin' };
    next();
  }),
}));

jest.mock('../src/middleware/admin.middleware', () => ({
  requireAdmin: jest.fn((_req, _res, next) => next()),
}));

jest.mock('../src/middleware/upload.middleware', () => ({
  uploadAvatar: { single: jest.fn(() => (_req, _res, next) => next()) },
  uploadFabricImage: { single: jest.fn(() => (_req, _res, next) => next()) },
  cloudinary: {},
}));

jest.mock('../src/services/admin.fabric.service', () => ({
  adminListFabrics: jest.fn(),
  adminCreateFabric: jest.fn(),
  adminUpdateFabric: jest.fn(),
  adminDeleteFabric: jest.fn(),
  adminAddFabricImage: jest.fn(),
  adminRemoveFabricImage: jest.fn(),
}));

const app = require('../src/app');
const {
  adminListFabrics,
  adminCreateFabric,
  adminUpdateFabric,
  adminDeleteFabric,
  adminAddFabricImage,
  adminRemoveFabricImage,
} = require('../src/services/admin.fabric.service');

const MOCK_FABRIC = {
  _id: 'f1',
  name: 'Italian Merino Wool',
  material: 'wool',
  color: 'navy',
  pattern: 'solid',
  price: 320,
  isActive: true,
};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/admin/products', () => {
  it('returns 200 with fabric list', async () => {
    adminListFabrics.mockResolvedValue({ fabrics: [MOCK_FABRIC], total: 1, page: 1, pages: 1 });

    const res = await request(app).get('/api/v1/admin/products');

    expect(res.status).toBe(200);
    expect(res.body.fabrics).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it('passes page and limit to service', async () => {
    adminListFabrics.mockResolvedValue({ fabrics: [], total: 0, page: 2, pages: 0 });

    await request(app).get('/api/v1/admin/products?page=2&limit=10');

    expect(adminListFabrics).toHaveBeenCalledWith({ page: '2', limit: '10' });
  });

  it('returns 500 when service throws', async () => {
    adminListFabrics.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/v1/admin/products');

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/admin/products', () => {
  it('returns 201 with created fabric', async () => {
    adminCreateFabric.mockResolvedValue(MOCK_FABRIC);

    const res = await request(app)
      .post('/api/v1/admin/products')
      .send({ name: 'Italian Merino Wool', material: 'wool', color: 'navy', pattern: 'solid', price: 320 });

    expect(res.status).toBe(201);
    expect(res.body.fabric.name).toBe('Italian Merino Wool');
  });

  it('passes body to service', async () => {
    adminCreateFabric.mockResolvedValue(MOCK_FABRIC);
    const payload = { name: 'Test', material: 'wool', color: 'navy', pattern: 'solid', price: 100 };

    await request(app).post('/api/v1/admin/products').send(payload);

    expect(adminCreateFabric).toHaveBeenCalledWith(expect.objectContaining(payload));
  });

  it('returns 500 when service throws', async () => {
    adminCreateFabric.mockRejectedValue(new Error('Validation error'));

    const res = await request(app).post('/api/v1/admin/products').send({});

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/v1/admin/products/:id', () => {
  it('returns 200 with updated fabric', async () => {
    adminUpdateFabric.mockResolvedValue({ ...MOCK_FABRIC, price: 350 });

    const res = await request(app)
      .put('/api/v1/admin/products/f1')
      .send({ price: 350 });

    expect(res.status).toBe(200);
    expect(res.body.fabric.price).toBe(350);
  });

  it('returns 404 when fabric not found', async () => {
    adminUpdateFabric.mockResolvedValue(null);

    const res = await request(app).put('/api/v1/admin/products/nonexistent').send({ price: 100 });

    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    adminUpdateFabric.mockRejectedValue(new Error('DB error'));

    const res = await request(app).put('/api/v1/admin/products/f1').send({});

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/v1/admin/products/:id', () => {
  it('returns 200 on successful soft-delete', async () => {
    adminDeleteFabric.mockResolvedValue({ ...MOCK_FABRIC, isActive: false });

    const res = await request(app).delete('/api/v1/admin/products/f1');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it('returns 404 when fabric not found', async () => {
    adminDeleteFabric.mockResolvedValue(null);

    const res = await request(app).delete('/api/v1/admin/products/nonexistent');

    expect(res.status).toBe(404);
  });

  it('returns 500 when service throws', async () => {
    adminDeleteFabric.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete('/api/v1/admin/products/f1');

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/admin/products/:id/images', () => {
  it('returns 400 when no file uploaded', async () => {
    const res = await request(app).post('/api/v1/admin/products/f1/images');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no image/i);
  });

  it('returns 200 with updated fabric after image added', async () => {
    // Simulate multer attaching file to req
    const { authenticate } = require('../src/middleware/auth.middleware');
    authenticate.mockImplementationOnce((req, _res, next) => {
      req.user = { userId: 'admin-id', role: 'admin' };
      req.file = { secure_url: 'https://cdn.example.com/img.jpg', public_id: 'italor/fabrics/img' };
      next();
    });

    adminAddFabricImage.mockResolvedValue({ ...MOCK_FABRIC, images: ['https://cdn.example.com/img.jpg'] });

    const res = await request(app).post('/api/v1/admin/products/f1/images');

    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toBe('https://cdn.example.com/img.jpg');
  });

  it('returns 404 when fabric not found after image upload', async () => {
    const { authenticate } = require('../src/middleware/auth.middleware');
    authenticate.mockImplementationOnce((req, _res, next) => {
      req.user = { userId: 'admin-id', role: 'admin' };
      req.file = { secure_url: 'https://cdn.example.com/img.jpg', public_id: 'italor/fabrics/img' };
      next();
    });

    adminAddFabricImage.mockResolvedValue(null);

    const res = await request(app).post('/api/v1/admin/products/nonexistent/images');

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/v1/admin/products/:id/images', () => {
  it('returns 400 when imageUrl missing', async () => {
    const res = await request(app).delete('/api/v1/admin/products/f1/images').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/imageUrl/i);
  });

  it('returns 200 after image removed', async () => {
    adminRemoveFabricImage.mockResolvedValue({ ...MOCK_FABRIC, images: [] });

    const res = await request(app)
      .delete('/api/v1/admin/products/f1/images')
      .send({ imageUrl: 'https://cdn.example.com/img.jpg' });

    expect(res.status).toBe(200);
  });

  it('returns 404 when fabric not found', async () => {
    adminRemoveFabricImage.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/v1/admin/products/nonexistent/images')
      .send({ imageUrl: 'https://cdn.example.com/img.jpg' });

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Admin middleware enforcement', () => {
  it('returns 401 when not authenticated', async () => {
    const { authenticate } = require('../src/middleware/auth.middleware');
    authenticate.mockImplementationOnce((_req, res) => {
      res.status(401).json({ error: 'Authentication required.' });
    });

    const res = await request(app).get('/api/v1/admin/products');

    expect(res.status).toBe(401);
  });

  it('returns 403 when authenticated but not admin', async () => {
    const { authenticate } = require('../src/middleware/auth.middleware');
    const { requireAdmin } = require('../src/middleware/admin.middleware');

    authenticate.mockImplementationOnce((req, _res, next) => {
      req.user = { userId: 'user-id', role: 'user' };
      next();
    });
    requireAdmin.mockImplementationOnce((_req, res) => {
      res.status(403).json({ error: 'Admin access required.' });
    });

    const res = await request(app).get('/api/v1/admin/products');

    expect(res.status).toBe(403);
  });
});
