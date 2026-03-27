const request = require('supertest');
const app = require('../src/app');

/**
 * SCRUM-46 — AC: Health endpoint tests
 * AC1: GET /api/v1/health returns 200 with required fields
 * AC3: Zero-downtime probe — endpoint must respond under 200ms
 * AC4: No env vars hardcoded — version comes from package.json
 */

describe('GET /api/v1/health', () => {
  // AC1: Happy path — returns 200 with status, timestamp, version
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns a valid ISO timestamp', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.body.timestamp).toBeDefined();
    expect(() => new Date(res.body.timestamp)).not.toThrow();
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it('returns the application version from package.json', async () => {
    const { version } = require('../package.json');
    const res = await request(app).get('/api/v1/health');

    expect(res.body.version).toBe(version);
  });

  it('returns uptime as a non-negative integer', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(res.body.uptime)).toBe(true);
  });

  it('returns environment field', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.body.environment).toBeDefined();
    expect(typeof res.body.environment).toBe('string');
  });

  // AC3: Response time must be fast enough for zero-downtime health probes
  it('responds within 200ms', async () => {
    const start = Date.now();
    await request(app).get('/api/v1/health');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(200);
  });

  // 404 on unknown route
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
