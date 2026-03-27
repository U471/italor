'use strict';

/**
 * Integration tests for password reset endpoints:
 *   POST /api/v1/auth/forgot-password
 *   POST /api/v1/auth/reset-password
 *
 * - email.service is mocked to avoid real SMTP calls.
 * - User model methods are mocked to avoid real DB calls.
 */

// ── Mock email service BEFORE requiring app ───────────────────────────────────
jest.mock('../src/services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
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
const app = require('../src/app');
const User = require('../src/models/User');
const { sendPasswordResetEmail } = require('../src/services/email.service');

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeUser(overrides = {}) {
  return {
    _id: 'user-id-123',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    isVerified: true,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/forgot-password', () => {
  // ── Happy path: known email ───────────────────────────────────────────────
  describe('with a registered email', () => {
    beforeEach(() => {
      User.findOne.mockResolvedValue(makeUser());
      User.findByIdAndUpdate.mockResolvedValue({});
    });

    it('returns 200 with a generic success message', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'jane@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/if an account/i);
    });

    it('calls sendPasswordResetEmail with the correct email', async () => {
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'jane@example.com' });

      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({ toEmail: 'jane@example.com' })
      );
    });

    it('calls User.findByIdAndUpdate to store the reset token hash', async () => {
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'jane@example.com' });

      expect(User.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      const updateArg = User.findByIdAndUpdate.mock.calls[0][1];
      expect(updateArg.resetPasswordToken).toBeDefined();
      expect(updateArg.resetPasswordExpiry).toBeDefined();
    });
  });

  // ── Unknown email — must NOT reveal account existence ────────────────────
  describe('with an unknown email', () => {
    beforeEach(() => {
      User.findOne.mockResolvedValue(null);
    });

    it('returns 200 — same response as a known email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'unknown@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/if an account/i);
    });

    it('does NOT call sendPasswordResetEmail for unknown email', async () => {
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'unknown@example.com' });

      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  // ── Validation errors ────────────────────────────────────────────────────
  describe('validation', () => {
    it('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })])
      );
    });

    it('returns 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'not-valid' });

      expect(res.status).toBe(400);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/reset-password', () => {
  const validToken = 'a'.repeat(64); // 64-char hex string (32 bytes raw → 64 hex chars)
  const validPassword = 'NewPassword1';

  // ── Happy path: valid token ───────────────────────────────────────────────
  describe('with a valid token', () => {
    beforeEach(() => {
      User.findOne.mockResolvedValue(makeUser());
      User.findByIdAndUpdate.mockResolvedValue({});
    });

    it('returns 200 on successful password reset', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: validToken, newPassword: validPassword });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/reset successfully/i);
    });

    it('calls User.findByIdAndUpdate with a bcrypt-hashed password', async () => {
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: validToken, newPassword: validPassword });

      expect(User.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      const updateArg = User.findByIdAndUpdate.mock.calls[0][1];
      expect(updateArg.passwordHash).toBeDefined();
      expect(updateArg.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(updateArg.passwordHash).not.toBe(validPassword);
    });

    it('clears the resetPasswordToken and refreshTokenHash on success', async () => {
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: validToken, newPassword: validPassword });

      const updateArg = User.findByIdAndUpdate.mock.calls[0][1];
      expect(updateArg.resetPasswordToken).toBeUndefined();
      expect(updateArg.resetPasswordExpiry).toBeUndefined();
      expect(updateArg.refreshTokenHash).toBeNull();
    });
  });

  // ── Expired / invalid token → 400 ────────────────────────────────────────
  describe('with an expired token', () => {
    beforeEach(() => {
      // findOne returns null → token not found or expired
      User.findOne.mockResolvedValue(null);
    });

    it('returns 400 for an expired token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: validToken, newPassword: validPassword });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/expired/i);
    });
  });

  describe('with an invalid token', () => {
    beforeEach(() => {
      User.findOne.mockResolvedValue(null);
    });

    it('returns 400 for an invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'invalidtoken123', newPassword: validPassword });

      expect(res.status).toBe(400);
    });
  });

  // ── Validation errors ────────────────────────────────────────────────────
  describe('validation', () => {
    it('returns 400 when token is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ newPassword: validPassword });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'token' })])
      );
    });

    it('returns 400 when newPassword is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: validToken });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'newPassword' })])
      );
    });

    it('returns 400 when newPassword is too short (weak)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: validToken, newPassword: 'Pass1' });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'newPassword' })])
      );
    });

    it('returns 400 when newPassword has no uppercase letter', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: validToken, newPassword: 'password1' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when newPassword has no number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: validToken, newPassword: 'Passwords' });

      expect(res.status).toBe(400);
    });
  });
});
