'use strict';

/**
 * Integration tests for GET /api/v1/user/me.
 *
 * Uses supertest to send real HTTP requests through the Express app.
 * No DB or email mocks needed — the endpoint only reads from the JWT payload.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

const TEST_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAccessToken(overrides = {}) {
  return jwt.sign(
    {
      userId: 'user-id-456',
      email: 'john.doe@example.com',
      role: 'user',
      ...overrides,
    },
    TEST_SECRET,
    { expiresIn: '15m' }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/user/me', () => {
  // ── With valid token ────────────────────────────────────────────────────────
  describe('authenticated request', () => {
    it('returns 200 with user fields when a valid token is provided', async () => {
      const token = makeAccessToken();

      const res = await request(app)
        .get('/api/v1/user/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe('user-id-456');
      expect(res.body.email).toBe('john.doe@example.com');
      expect(res.body.role).toBe('user');
    });

    it('returns the correct role for an admin user', async () => {
      const token = makeAccessToken({ role: 'admin', userId: 'admin-id-789', email: 'admin@example.com' });

      const res = await request(app)
        .get('/api/v1/user/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('admin');
    });
  });

  // ── Without token ───────────────────────────────────────────────────────────
  describe('unauthenticated request', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      const res = await request(app).get('/api/v1/user/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/user/me')
        .set('Authorization', 'Bearer invalid-token-value');

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('returns 401 when token is expired', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-id-456', email: 'test@example.com', role: 'user' },
        TEST_SECRET,
        { expiresIn: -1 }
      );

      const res = await request(app)
        .get('/api/v1/user/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });
});
