'use strict';

/**
 * Integration tests for /api/v1/designs routes.
 */

const request = require('supertest');

// Auth middleware — default to authenticated user
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

jest.mock('../src/services/design.service', () => ({
  createDesign: jest.fn(),
  getDesignById: jest.fn(),
  updateDesign: jest.fn(),
  listUserDesigns: jest.fn(),
}));

const app = require('../src/app');
const {
  createDesign,
  getDesignById,
  updateDesign,
  listUserDesigns,
} = require('../src/services/design.service');

const MOCK_DESIGN = {
  _id: 'd1',
  user: 'user-123',
  sessionId: null,
  fabric: null,
  fabricSnapshot: {},
  style: null,
  lapel: null,
  lining: null,
  details: null,
  monogram: null,
  status: 'draft',
};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/designs', () => {
  it('returns 201 with created design', async () => {
    createDesign.mockResolvedValue(MOCK_DESIGN);

    const res = await request(app).post('/api/v1/designs').send({});

    expect(res.status).toBe(201);
    expect(res.body.design._id).toBe('d1');
  });

  it('passes userId from auth token to service', async () => {
    createDesign.mockResolvedValue(MOCK_DESIGN);

    await request(app).post('/api/v1/designs').send({});

    expect(createDesign).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-123' }));
  });

  it('creates design without auth (guest) when no Authorization header', async () => {
    const { authenticate } = require('../src/middleware/auth.middleware');
    authenticate.mockImplementationOnce((req, _res, next) => {
      // No token — req.user stays undefined
      next();
    });
    createDesign.mockResolvedValue({ ...MOCK_DESIGN, user: null, sessionId: 'sess-abc' });

    const res = await request(app).post('/api/v1/designs').send({ sessionId: 'sess-abc' });

    expect(res.status).toBe(201);
    expect(createDesign).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'sess-abc' }));
  });

  it('returns 500 when service throws', async () => {
    createDesign.mockRejectedValue(new Error('DB error'));

    const res = await request(app).post('/api/v1/designs').send({});

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/designs/mine', () => {
  it('returns 200 with list of user designs', async () => {
    listUserDesigns.mockResolvedValue([MOCK_DESIGN]);

    const res = await request(app).get('/api/v1/designs/mine');

    expect(res.status).toBe(200);
    expect(res.body.designs).toHaveLength(1);
    expect(listUserDesigns).toHaveBeenCalledWith('user-123');
  });

  it('returns 401 when not authenticated', async () => {
    const { authenticate } = require('../src/middleware/auth.middleware');
    authenticate.mockImplementationOnce((_req, res) => {
      res.status(401).json({ error: 'Authentication required.' });
    });

    const res = await request(app).get('/api/v1/designs/mine');

    expect(res.status).toBe(401);
  });

  it('returns 500 when service throws', async () => {
    listUserDesigns.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/v1/designs/mine');

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/designs/:id', () => {
  it('returns 200 with owned design (user match)', async () => {
    getDesignById.mockResolvedValue({ ...MOCK_DESIGN, user: { toString: () => 'user-123' } });

    const res = await request(app).get('/api/v1/designs/d1');

    expect(res.status).toBe(200);
    expect(res.body.design._id).toBe('d1');
  });

  it('returns 403 when design belongs to another user', async () => {
    getDesignById.mockResolvedValue({ ...MOCK_DESIGN, user: { toString: () => 'other-user' } });

    const res = await request(app).get('/api/v1/designs/d1');

    expect(res.status).toBe(403);
  });

  it('returns 404 when design not found', async () => {
    getDesignById.mockResolvedValue(null);

    const res = await request(app).get('/api/v1/designs/nonexistent');

    expect(res.status).toBe(404);
  });

  it('returns 200 with guest design when sessionId matches', async () => {
    const { authenticate } = require('../src/middleware/auth.middleware');
    authenticate.mockImplementationOnce((req, _res, next) => {
      next(); // no user
    });
    getDesignById.mockResolvedValue({ ...MOCK_DESIGN, user: null, sessionId: 'sess-abc' });

    const res = await request(app)
      .get('/api/v1/designs/d1')
      .send({ sessionId: 'sess-abc' });

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/v1/designs/:id', () => {
  it('returns 200 with updated design', async () => {
    getDesignById.mockResolvedValue({ ...MOCK_DESIGN, user: { toString: () => 'user-123' } });
    updateDesign.mockResolvedValue({ ...MOCK_DESIGN, style: { breasting: 'single', buttons: 2 } });

    const res = await request(app)
      .put('/api/v1/designs/d1')
      .send({ style: { breasting: 'single', buttons: 2 } });

    expect(res.status).toBe(200);
    expect(res.body.design.style.breasting).toBe('single');
  });

  it('returns 404 when design not found', async () => {
    getDesignById.mockResolvedValue(null);

    const res = await request(app).put('/api/v1/designs/nonexistent').send({});

    expect(res.status).toBe(404);
  });

  it('returns 403 when design belongs to another user', async () => {
    getDesignById.mockResolvedValue({ ...MOCK_DESIGN, user: { toString: () => 'other-user' } });

    const res = await request(app).put('/api/v1/designs/d1').send({});

    expect(res.status).toBe(403);
  });

  it('returns 500 when service throws on update', async () => {
    getDesignById.mockResolvedValue({ ...MOCK_DESIGN, user: { toString: () => 'user-123' } });
    updateDesign.mockRejectedValue(new Error('DB error'));

    const res = await request(app).put('/api/v1/designs/d1').send({});

    expect(res.status).toBe(500);
  });
});
