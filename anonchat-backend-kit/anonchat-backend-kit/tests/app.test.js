const express = require('express');
const request = require('supertest');
const { z } = require('zod');

const app = require('../src/app');
const AppError = require('../src/utils/AppError');
const asyncHandler = require('../src/utils/asyncHandler');
const validate = require('../src/middleware/validate');
const errorHandler = require('../src/middleware/errorHandler');

describe('app health and foundation middleware', () => {
  test('GET /api/health returns 200 ok without x-powered-by', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
  });

  test('unknown route returns 404 in API contract error shape', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  test('invalid JSON payload returns 400 VALIDATION_ERROR in contract error shape', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON payload',
      },
    });
  });

  test('CORS allows listed origin and withholds header for unlisted origin', async () => {
    const allowed = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const disallowed = await request(app)
      .get('/api/health')
      .set('Origin', 'https://evil.example.com');
    expect(disallowed.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('validate, asyncHandler, and errorHandler', () => {
  const testApp = express();
  testApp.use(express.json());

  testApp.post(
    '/items/:id',
    validate({
      params: z.object({ id: z.string().uuid() }),
      query: z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) }),
      body: z.object({ name: z.string().trim().min(2) }),
    }),
    asyncHandler(async (req, res) => {
      res.status(200).json({
        params: req.validated.params,
        query: req.validated.query,
        body: req.validated.body,
      });
    }),
  );

  testApp.get(
    '/boom',
    asyncHandler(async () => {
      throw new Error('Unexpected failure details');
    }),
  );

  testApp.get('/rate-limited', (_req, _res, next) => {
    next(AppError.rateLimited('RATE_LIMITED', 'Slow down', { retryAfter: 12 }));
  });

  testApp.use(errorHandler);

  test('validate parses body, params, and query onto req.validated', async () => {
    const validUuid = '11111111-1111-4111-8111-111111111111';
    const res = await request(testApp)
      .post(`/items/${validUuid}?limit=10`)
      .send({ name: '  Valid  ' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      params: { id: validUuid },
      query: { limit: 10 },
      body: { name: 'Valid' },
    });
  });

  test('validate returns 400 VALIDATION_ERROR with issues on bad input', async () => {
    const res = await request(testApp).post('/items/not-a-uuid').send({ name: 'a' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details.issues)).toBe(true);
  });

  test('errorHandler masks unexpected errors as 500 INTERNAL', async () => {
    const res = await request(testApp).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: 'INTERNAL',
        message: 'Internal server error',
      },
    });
  });

  test('errorHandler sets Retry-After for 429 AppError', async () => {
    const res = await request(testApp).get('/rate-limited');
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBe('12');
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});
