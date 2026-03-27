const request = require('supertest');
const app = require('../src/app');

/**
 * Tests for app-level middleware (CORS, rate limiting).
 */

describe('CORS middleware', () => {
  it('allows requests with no origin header', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
  });

  it('allows requests from an allowed origin', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.status).toBe(200);
  });

  it('blocks requests from a disallowed origin', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://evil.example.com');
    expect(res.status).toBe(500);
  });
});
