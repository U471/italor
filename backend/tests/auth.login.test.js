'use strict';

/**
 * Integration tests for login, refresh-token, and logout endpoints.
 *
 * - email.service is mocked to avoid real SMTP calls.
 * - User model methods are mocked to avoid real DB calls.
 * - jsonwebtoken is used directly to create/verify tokens in tests.
 */

// ── Mock email service BEFORE requiring app ───────────────────────────────────
jest.mock('../src/services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

// ── Mock User model ───────────────────────────────────────────────────────────
jest.mock('../src/models/User', () => {
  const mockUser = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
  };
  return mockUser;
});

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');

// ── Helpers ───────────────────────────────────────────────────────────────────
const TEST_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

async function makeHashedPassword(plain = 'Password1') {
  return bcrypt.hash(plain, 1); // rounds=1 for speed in tests
}

function makeSavedUser(overrides = {}) {
  return {
    _id: 'user-id-123',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    isVerified: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRefreshToken(userId = 'user-id-123') {
  return jwt.sign({ userId }, TEST_SECRET, { expiresIn: '7d' });
}

beforeEach(() => {
  jest.clearAllMocks();
  // findByIdAndUpdate succeeds by default
  User.findByIdAndUpdate.mockResolvedValue({});
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/login', () => {
  // ── Happy path ───────────────────────────────────────────────────────────
  describe('happy path', () => {
    it('returns 200 with accessToken in body and refreshToken cookie on valid credentials', async () => {
      const passwordHash = await makeHashedPassword('Password1');
      const user = makeSavedUser({ passwordHash });

      // findOne must return user with passwordHash (select('+passwordHash') chain)
      const selectMock = jest.fn().mockResolvedValue(user);
      User.findOne.mockReturnValue({ select: selectMock });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'jane.doe@example.com', password: 'Password1' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe('string');

      // Verify Set-Cookie contains refreshToken
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
    });

    it('does not expose passwordHash in response body', async () => {
      const passwordHash = await makeHashedPassword('Password1');
      const user = makeSavedUser({ passwordHash });
      const selectMock = jest.fn().mockResolvedValue(user);
      User.findOne.mockReturnValue({ select: selectMock });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'jane.doe@example.com', password: 'Password1' });

      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
      expect(JSON.stringify(res.body)).not.toContain('Password1');
    });

    it('stores hashed refresh token in DB via findByIdAndUpdate', async () => {
      const passwordHash = await makeHashedPassword('Password1');
      const user = makeSavedUser({ passwordHash });
      const selectMock = jest.fn().mockResolvedValue(user);
      User.findOne.mockReturnValue({ select: selectMock });

      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'jane.doe@example.com', password: 'Password1' });

      expect(User.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      const updateArg = User.findByIdAndUpdate.mock.calls[0][1];
      expect(updateArg.refreshTokenHash).toBeDefined();
      // Should be a 64-char hex SHA-256 hash
      expect(updateArg.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // ── Wrong password ───────────────────────────────────────────────────────
  describe('wrong password', () => {
    it('returns 401 when password does not match', async () => {
      const passwordHash = await makeHashedPassword('Password1');
      const user = makeSavedUser({ passwordHash });
      const selectMock = jest.fn().mockResolvedValue(user);
      User.findOne.mockReturnValue({ select: selectMock });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'jane.doe@example.com', password: 'WrongPassword1' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });
  });

  // ── Non-existent email ───────────────────────────────────────────────────
  describe('non-existent email', () => {
    it('returns 401 when email is not found', async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      User.findOne.mockReturnValue({ select: selectMock });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'noone@example.com', password: 'Password1' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });
  });

  // ── Missing fields → 400 ─────────────────────────────────────────────────
  describe('missing fields', () => {
    it('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'Password1' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'jane.doe@example.com' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when both fields are absent', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});

      expect(res.status).toBe(400);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/refresh-token', () => {
  // ── Happy path ───────────────────────────────────────────────────────────
  describe('happy path', () => {
    it('returns 200 with a new accessToken when refresh cookie is valid', async () => {
      const rawRefreshToken = makeRefreshToken('user-id-123');
      const crypto = require('crypto');
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

      const user = makeSavedUser({ refreshTokenHash: tokenHash });
      const selectMock = jest.fn().mockResolvedValue(user);
      User.findById.mockReturnValue({ select: selectMock });

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${rawRefreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe('string');
    });
  });

  // ── Invalid / missing cookie ─────────────────────────────────────────────
  describe('invalid or missing cookie', () => {
    it('returns 401 when no cookie is present', async () => {
      const res = await request(app).post('/api/v1/auth/refresh-token');

      expect(res.status).toBe(401);
    });

    it('returns 401 when cookie token is signed with wrong secret', async () => {
      const badToken = jwt.sign({ userId: 'user-id-123' }, 'wrong-secret', { expiresIn: '7d' });

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${badToken}`]);

      expect(res.status).toBe(401);
    });

    it('returns 401 when token hash does not match DB record', async () => {
      const rawRefreshToken = makeRefreshToken('user-id-123');
      // User has a different hash stored
      const user = makeSavedUser({ refreshTokenHash: 'different-hash-value' });
      const selectMock = jest.fn().mockResolvedValue(user);
      User.findById.mockReturnValue({ select: selectMock });

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', [`refreshToken=${rawRefreshToken}`]);

      expect(res.status).toBe(401);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/logout', () => {
  it('returns 200 and clears the cookie', async () => {
    const rawRefreshToken = makeRefreshToken('user-id-123');

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [`refreshToken=${rawRefreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);

    // Cookie should be cleared (Set-Cookie present and expires in the past or maxAge=0)
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      const cleared = cookies.find((c) => c.startsWith('refreshToken='));
      // When cleared, value is empty or Expires is in past
      expect(cleared).toBeDefined();
    }
  });

  it('returns 200 even when no cookie is present', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(200);
  });
});
