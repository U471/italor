'use strict';

/**
 * Integration tests for POST /api/v1/auth/register
 *
 * - email.service is mocked to avoid real SMTP calls.
 * - User model methods (findOne, create) are mocked to avoid real DB calls.
 */

// ── Mock email service BEFORE requiring app ───────────────────────────────────
jest.mock('../src/services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

// ── Mock User model ───────────────────────────────────────────────────────────
// We mock the entire module so mongoose.model is never called with a real connection.
jest.mock('../src/models/User', () => {
  const mockUser = {
    findOne: jest.fn(),
    create: jest.fn(),
  };
  return mockUser;
});

const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { sendVerificationEmail } = require('../src/services/email.service');

// ── Helpers ───────────────────────────────────────────────────────────────────
const validPayload = () => ({
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  password: 'Password1',
  confirmPassword: 'Password1',
});

function makeSavedUser(overrides = {}) {
  return {
    _id: 'user-id-123',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    isVerified: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/register', () => {
  // ── AC1: Happy path ──────────────────────────────────────────────────────
  describe('happy path', () => {
    beforeEach(() => {
      User.findOne.mockResolvedValue(null); // no existing user
      User.create.mockResolvedValue(makeSavedUser());
    });

    it('returns 201 with user payload on valid input', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validPayload());

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        message: expect.stringContaining('verify'),
        user: {
          email: 'jane.doe@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          isVerified: false,
        },
      });
    });

    it('calls User.create once with hashed password (not plaintext)', async () => {
      await request(app).post('/api/v1/auth/register').send(validPayload());

      expect(User.create).toHaveBeenCalledTimes(1);
      const createArg = User.create.mock.calls[0][0];

      // passwordHash should exist and not equal the plaintext password
      expect(createArg.passwordHash).toBeDefined();
      expect(createArg.passwordHash).not.toBe(validPayload().password);

      // passwordHash should look like a bcrypt hash ($2b$...)
      expect(createArg.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it('creates user with isVerified = false', async () => {
      await request(app).post('/api/v1/auth/register').send(validPayload());

      const createArg = User.create.mock.calls[0][0];
      expect(createArg.isVerified).toBe(false);
    });

    it('calls sendVerificationEmail with the correct email', async () => {
      await request(app).post('/api/v1/auth/register').send(validPayload());

      expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({ toEmail: 'jane.doe@example.com' })
      );
    });

    it('does not return passwordHash in the response body', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validPayload());

      const body = JSON.stringify(res.body);
      expect(body).not.toContain('passwordHash');
      expect(body).not.toContain('Password1');
    });
  });

  // ── AC2: Duplicate email → 409 ───────────────────────────────────────────
  describe('duplicate email', () => {
    it('returns 409 with a helpful message when email already exists', async () => {
      User.findOne.mockResolvedValue(makeSavedUser()); // simulate existing user

      const res = await request(app).post('/api/v1/auth/register').send(validPayload());

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('does NOT call User.create on duplicate email', async () => {
      User.findOne.mockResolvedValue(makeSavedUser());

      await request(app).post('/api/v1/auth/register').send(validPayload());

      expect(User.create).not.toHaveBeenCalled();
    });
  });

  // ── AC3: Missing fields → 400 ────────────────────────────────────────────
  describe('missing required fields', () => {
    it('returns 400 when firstName is missing', async () => {
      const payload = validPayload();
      delete payload.firstName;

      const res = await request(app).post('/api/v1/auth/register').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'firstName' })])
      );
    });

    it('returns 400 when email is missing', async () => {
      const payload = validPayload();
      delete payload.email;

      const res = await request(app).post('/api/v1/auth/register').send(payload);

      expect(res.status).toBe(400);
    });

    it('returns 400 when password is missing', async () => {
      const payload = validPayload();
      delete payload.password;

      const res = await request(app).post('/api/v1/auth/register').send(payload);

      expect(res.status).toBe(400);
    });

    it('returns 400 when all fields are absent', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({});

      expect(res.status).toBe(400);
    });
  });

  // ── AC4: Invalid email format → 400 ─────────────────────────────────────
  describe('invalid email format', () => {
    it('returns 400 for "not-an-email"', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload(), email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })])
      );
    });

    it('returns 400 for email missing domain', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload(), email: 'user@' });

      expect(res.status).toBe(400);
    });
  });

  // ── AC5: Weak password → 400 ─────────────────────────────────────────────
  describe('weak password', () => {
    it('returns 400 when password is less than 8 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload(), password: 'Pass1', confirmPassword: 'Pass1' });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'password' })])
      );
    });

    it('returns 400 when password has no uppercase letter', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload(), password: 'password1', confirmPassword: 'password1' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when password has no number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload(), password: 'Passwords', confirmPassword: 'Passwords' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when passwords do not match', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validPayload(), confirmPassword: 'DifferentPass1' });

      expect(res.status).toBe(400);
    });
  });
});
