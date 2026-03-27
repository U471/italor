const request = require('supertest');
const express = require('express');
const { errorHandler } = require('../src/middleware/errorHandler');

/**
 * Tests for central error handling middleware.
 * Covers: custom status codes, production vs dev message masking,
 * default 500 fallback, and response shape.
 */

function buildApp(errorFactory) {
  const app = express();
  app.get('/test', (_req, _res, next) => next(errorFactory()));
  app.use(errorHandler);
  return app;
}

describe('errorHandler middleware', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('uses err.status as response status code', async () => {
    const app = buildApp(() => {
      const err = new Error('Not found');
      err.status = 404;
      return err;
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('uses err.statusCode when err.status is absent', async () => {
    const app = buildApp(() => {
      const err = new Error('Conflict');
      err.statusCode = 409;
      return err;
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(409);
  });

  it('defaults to 500 when no status is provided', async () => {
    const app = buildApp(() => new Error('boom'));
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
  });

  it('masks 500 message in production', async () => {
    process.env.NODE_ENV = 'production';
    const app = buildApp(() => new Error('secret db error'));
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });

  it('exposes real message in non-production for 500', async () => {
    process.env.NODE_ENV = 'development';
    const app = buildApp(() => new Error('real error detail'));
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('real error detail');
  });

  it('exposes real message in production for non-500 errors', async () => {
    process.env.NODE_ENV = 'production';
    const app = buildApp(() => {
      const err = new Error('Bad Request detail');
      err.status = 400;
      return err;
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Bad Request detail');
  });

  it('returns { error } shape', async () => {
    const app = buildApp(() => new Error('some error'));
    const res = await request(app).get('/test');
    expect(res.body).toHaveProperty('error');
  });

  it('falls back to "Internal server error" when err.message is empty', async () => {
    const app = buildApp(() => {
      const err = new Error('');
      err.message = '';
      err.status = 500;
      return err;
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});
