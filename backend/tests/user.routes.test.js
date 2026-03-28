'use strict';

/**
 * Integration tests for /api/v1/user/* endpoints.
 * Mocks user.service and upload.middleware to avoid DB/Cloudinary calls.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

// ── Mock upload middleware before app loads ────────────────────────────────
jest.mock('../src/middleware/upload.middleware', () => ({
  uploadAvatar: {
    single: () => (req, _res, next) => {
      // Simulate multer attaching req.file for happy-path tests
      if (req.headers['x-test-upload'] === 'true') {
        req.file = { path: 'https://res.cloudinary.com/test/avatar.jpg', filename: 'italor/avatars/test123' };
      }
      next();
    },
  },
  uploadFabricImage: { single: jest.fn(() => (_req, _res, next) => next()) },
  cloudinary: { uploader: { destroy: jest.fn() } },
}));

// ── Mock user service ─────────────────────────────────────────────────────
jest.mock('../src/services/user.service', () => ({
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  changePassword: jest.fn(),
  updateAvatar: jest.fn(),
}));

const app = require('../src/app');
const userService = require('../src/services/user.service');

const TEST_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

function makeToken(overrides = {}) {
  return jwt.sign(
    { userId: 'user-id-123', email: 'jane@example.com', role: 'user', ...overrides },
    TEST_SECRET,
    { expiresIn: '15m' }
  );
}

const MOCK_USER = {
  _id: 'user-id-123',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '+1234567890',
  avatarUrl: null,
  isVerified: true,
  role: 'user',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/user/me', () => {
  it('returns 200 with full user profile when authenticated', async () => {
    userService.getUserProfile.mockResolvedValue(MOCK_USER);
    const token = makeToken();

    const res = await request(app)
      .get('/api/v1/user/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('jane@example.com');
    expect(userService.getUserProfile).toHaveBeenCalledWith('user-id-123');
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/user/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is invalid', async () => {
    const res = await request(app)
      .get('/api/v1/user/me')
      .set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is expired', async () => {
    const expired = jwt.sign({ userId: 'x', email: 'x@x.com', role: 'user' }, TEST_SECRET, { expiresIn: -1 });
    const res = await request(app)
      .get('/api/v1/user/me')
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it('returns 404 when user is not found', async () => {
    const err = new Error('User not found');
    err.statusCode = 404;
    userService.getUserProfile.mockRejectedValue(err);

    const res = await request(app)
      .get('/api/v1/user/me')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/v1/user/me', () => {
  it('returns 200 with updated user', async () => {
    const updated = { ...MOCK_USER, firstName: 'Janet' };
    userService.updateUserProfile.mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/v1/user/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ firstName: 'Janet' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
    expect(res.body.user.firstName).toBe('Janet');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/v1/user/me').send({ firstName: 'X' });
    expect(res.status).toBe(401);
  });

  it('propagates service errors', async () => {
    const err = new Error('Validation failed');
    err.statusCode = 400;
    userService.updateUserProfile.mockRejectedValue(err);

    const res = await request(app)
      .put('/api/v1/user/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ firstName: '' });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/v1/user/me/password', () => {
  it('returns 200 on successful password change', async () => {
    userService.changePassword.mockResolvedValue();

    const res = await request(app)
      .put('/api/v1/user/me/password')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ currentPassword: 'OldPass1', newPassword: 'NewPass1' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/changed/i);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .put('/api/v1/user/me/password')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ currentPassword: 'OldPass1' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when current password is wrong', async () => {
    const err = new Error('Current password is incorrect');
    err.statusCode = 400;
    userService.changePassword.mockRejectedValue(err);

    const res = await request(app)
      .put('/api/v1/user/me/password')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ currentPassword: 'WrongPass', newPassword: 'NewPass1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/current password/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/v1/user/me/password').send({});
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/v1/user/me/avatar', () => {
  it('returns 200 with new avatarUrl when file is provided', async () => {
    userService.updateAvatar.mockResolvedValue({
      ...MOCK_USER,
      avatarUrl: 'https://res.cloudinary.com/test/avatar.jpg',
    });

    const res = await request(app)
      .put('/api/v1/user/me/avatar')
      .set('Authorization', `Bearer ${makeToken()}`)
      .set('x-test-upload', 'true');

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toMatch(/cloudinary/);
  });

  it('returns 400 when no file is provided', async () => {
    const res = await request(app)
      .put('/api/v1/user/me/avatar')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no image/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/v1/user/me/avatar');
    expect(res.status).toBe(401);
  });
});
