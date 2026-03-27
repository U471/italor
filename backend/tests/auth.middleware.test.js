'use strict';

/**
 * Unit tests for the JWT authentication middleware.
 *
 * Tests the authenticate() function directly without going through
 * the HTTP layer — mocks req, res, next.
 */

const jwt = require('jsonwebtoken');
const { authenticate } = require('../src/middleware/auth.middleware');

const TEST_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeToken(payload = {}, secret = TEST_SECRET, options = {}) {
  return jwt.sign(
    { userId: 'user-123', email: 'test@example.com', role: 'user', ...payload },
    secret,
    { expiresIn: '15m', ...options }
  );
}

function makeReq(token) {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
}

function makeRes() {
  const res = {
    _status: null,
    _json: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._json = body;
      return this;
    },
  };
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
describe('authenticate middleware', () => {
  // ── Valid token ─────────────────────────────────────────────────────────────
  describe('valid token', () => {
    it('calls next() and attaches req.user when token is valid', () => {
      const token = makeToken();
      const req = makeReq(token);
      const res = makeRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('user-123');
      expect(req.user.email).toBe('test@example.com');
      expect(req.user.role).toBe('user');
    });

    it('attaches correct role when role is admin', () => {
      const token = makeToken({ role: 'admin' });
      const req = makeReq(token);
      const res = makeRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user.role).toBe('admin');
    });
  });

  // ── Missing token ───────────────────────────────────────────────────────────
  describe('missing token', () => {
    it('returns 401 when Authorization header is absent', () => {
      const req = makeReq(null);
      const res = makeRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res._status).toBe(401);
      expect(res._json.error).toMatch(/no token provided/i);
    });

    it('returns 401 when Authorization header does not start with Bearer', () => {
      const req = { headers: { authorization: 'Token abc123' } };
      const res = makeRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res._status).toBe(401);
    });
  });

  // ── Invalid token ───────────────────────────────────────────────────────────
  describe('invalid token', () => {
    it('returns 401 when token is signed with wrong secret', () => {
      const token = makeToken({}, 'wrong-secret');
      const req = makeReq(token);
      const res = makeRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res._status).toBe(401);
      expect(res._json.error).toMatch(/invalid token/i);
    });

    it('returns 401 when token is a random string', () => {
      const req = makeReq('not-a-valid-jwt-at-all');
      const res = makeRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res._status).toBe(401);
    });
  });

  // ── Expired token ───────────────────────────────────────────────────────────
  describe('expired token', () => {
    it('returns 401 with "Token expired" message when token is expired', () => {
      // expiresIn: 0s means it expires immediately (effectively expired)
      const token = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', role: 'user' },
        TEST_SECRET,
        { expiresIn: -1 } // already expired
      );

      const req = makeReq(token);
      const res = makeRes();
      const next = jest.fn();

      authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res._status).toBe(401);
      expect(res._json.error).toMatch(/token expired/i);
    });
  });
});
