const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/services/auth.service', () => ({
  registerUser: jest.fn(),
}));

const { registerUser } = require('../src/services/auth.service');

describe('POST /api/v1/auth/register — controller error paths', () => {
  const validPayload = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    password: 'Password1',
    confirmPassword: 'Password1',
  };

  afterEach(() => jest.clearAllMocks());

  it('returns 500 when registerUser throws an unexpected error', async () => {
    registerUser.mockRejectedValue(new Error('DB connection lost'));
    const res = await request(app).post('/api/v1/auth/register').send(validPayload);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/internal server error/i);
  });
});
