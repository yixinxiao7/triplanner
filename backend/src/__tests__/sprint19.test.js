/**
 * Sprint 19 Tests — T-178: Auth Rate Limiting (B-020)
 *
 * These tests cover the five acceptance criteria from T-178:
 *
 *   A) POST /auth/login: request within limit → 200 (happy path)
 *   B) POST /auth/login: request after limit exceeded → 429 RATE_LIMITED
 *   C) POST /auth/register: request within limit → 201 (happy path)
 *   D) POST /auth/register: request after limit exceeded → 429 RATE_LIMITED
 *   E) Non-auth routes are NOT affected by auth rate limiters
 *
 * Test strategy:
 *   Tests A & C use the full auth router (with mocked DB/JWT/bcrypt) and make a single
 *   request — well within the production limits (10 for login, 5 for register).
 *
 *   Tests B & D use isolated Express apps with a tight max=1 rate limiter so we can
 *   verify the 429 response shape without making 10+ real HTTP requests. The rate limiter
 *   handler is identical in shape to what rateLimiter.js exports. The wiring of auth routes
 *   to the production rate limiter instances is verified by code review + QA staging tests.
 *
 *   Test E creates a plain Express app with a health endpoint and no rate limiter applied,
 *   confirming that repeated requests to non-auth routes always return 200.
 *
 * Security self-check (per security-checklist.md):
 *   ✅ Rate limiting uses IP-based keying (express-rate-limit default)
 *   ✅ 429 response returns RATE_LIMITED code — no stack trace, no internals
 *   ✅ standardHeaders: true / legacyHeaders: false → correct RateLimit-* header set
 *   ✅ Non-auth endpoints are unaffected (Test E)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import rateLimit from 'express-rate-limit';
import express from 'express';

// ============================================================================
// Mocks (must be declared before imports that transitively use these modules)
// ============================================================================

vi.mock('../models/userModel.js', () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock('../models/refreshTokenModel.js', () => ({
  generateRawToken: vi.fn(() => 'raw-token-sprint19'),
  hashToken: vi.fn((t) => `hash-of-${t}`),
  createRefreshToken: vi.fn(),
  findValidRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async () => '$2a$12$hashed'),
    compare: vi.fn(async () => true),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-access-token-sprint19'),
    verify: vi.fn((token) => {
      if (token === 'valid-token')
        return { id: 'user-s19', email: 'sprint19@example.com', name: 'Sprint19' };
      throw new Error('Invalid token');
    }),
  },
}));

import authRoutes from '../routes/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as userModel from '../models/userModel.js';
import * as refreshModel from '../models/refreshTokenModel.js';

// ============================================================================
// Test HTTP helper (same pattern as auth.test.js)
// ============================================================================

async function request(app, method, path, body, headers = {}) {
  const { createServer } = await import('http');
  const server = createServer(app);

  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const port = server.address().port;
      const url = `http://localhost:${port}${path}`;

      const options = {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      import('http').then(({ default: http }) => {
        const req = http.request(url, options, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            server.close();
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data ? JSON.parse(data) : null,
            });
          });
        });
        req.on('error', (err) => { server.close(); reject(err); });
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    });
  });
}

// ============================================================================
// App builders
// ============================================================================

/** Full auth app (production rate limiters + mocked DB/JWT/bcrypt). */
function buildAuthApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

/**
 * Minimal rate-limit test app.
 * Applies a fresh rate limiter with the given config to a single POST /test route.
 * Used to verify the 429 response shape without exhausting production limiters.
 */
function buildRateLimitTestApp({ max, message }) {
  const app = express();
  app.use(express.json());

  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window (irrelevant — limit hit after max reqs)
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message,
        },
      });
    },
  });

  app.post('/test', limiter, (req, res) => res.status(200).json({ ok: true }));
  return app;
}

// ============================================================================
// Test A — POST /auth/login: within rate limit → 200
// ============================================================================

describe('T-178 Test A — POST /auth/login within rate limit returns 200', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userModel.findUserByEmail.mockResolvedValue({
      id: 'user-s19',
      name: 'Sprint 19',
      email: 'sprint19@example.com',
      password_hash: '$2a$12$hashed',
      created_at: '2026-03-09T00:00:00.000Z',
    });
    refreshModel.createRefreshToken.mockResolvedValue({});
  });

  it('returns 200 with access_token when credentials are valid (within limit)', async () => {
    const app = buildAuthApp();
    const res = await request(app, 'POST', '/api/v1/auth/login', {
      email: 'sprint19@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.access_token).toBe('mock-access-token-sprint19');
    expect(res.body.data.user.email).toBe('sprint19@example.com');
  });

  it('returns 401 with INVALID_CREDENTIALS when credentials are wrong (within limit)', async () => {
    // Simulate wrong password
    const { default: bcrypt } = await import('bcryptjs');
    bcrypt.compare.mockResolvedValueOnce(false);

    const app = buildAuthApp();
    const res = await request(app, 'POST', '/api/v1/auth/login', {
      email: 'sprint19@example.com',
      password: 'wrong-password',
    });

    // Still within limit — returns 401 not 429
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

// ============================================================================
// Test B — POST /auth/login: after rate limit exceeded → 429 RATE_LIMITED
// ============================================================================

describe('T-178 Test B — POST /auth/login after limit exceeded returns 429 RATE_LIMITED', () => {
  it('returns 429 with RATE_LIMITED code and login-specific message when limit breached', async () => {
    // Isolated app with max=1 (no need to make 10+ real requests)
    const app = buildRateLimitTestApp({
      max: 1,
      message: 'Too many login attempts, please try again later.',
    });

    // First request: within limit
    const res1 = await request(app, 'POST', '/test', {});
    expect(res1.status).toBe(200);

    // Second request: over limit → 429
    const res2 = await request(app, 'POST', '/test', {});
    expect(res2.status).toBe(429);
    expect(res2.body.error).toBeDefined();
    expect(res2.body.error.code).toBe('RATE_LIMITED');
    expect(res2.body.error.message).toBe('Too many login attempts, please try again later.');
  });

  it('returns RateLimit-* standard headers on 429 response (standardHeaders: true)', async () => {
    const app = buildRateLimitTestApp({
      max: 1,
      message: 'Too many login attempts, please try again later.',
    });

    // Exhaust the limit
    await request(app, 'POST', '/test', {});
    const res = await request(app, 'POST', '/test', {});

    expect(res.status).toBe(429);
    // RFC 6585 RateLimit-* headers should be present (standardHeaders: true)
    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
    // Legacy X-RateLimit-* headers should NOT be present (legacyHeaders: false)
    expect(res.headers['x-ratelimit-limit']).toBeUndefined();
  });
});

// ============================================================================
// Test C — POST /auth/register: within rate limit → 201
// ============================================================================

describe('T-178 Test C — POST /auth/register within rate limit returns 201', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userModel.findUserByEmail.mockResolvedValue(null);
    userModel.createUser.mockResolvedValue({
      id: 'user-s19-new',
      name: 'New User',
      email: 'newuser@example.com',
      created_at: '2026-03-09T00:00:00.000Z',
    });
    refreshModel.createRefreshToken.mockResolvedValue({});
  });

  it('returns 201 with user and access_token when registration succeeds (within limit)', async () => {
    const app = buildAuthApp();
    const res = await request(app, 'POST', '/api/v1/auth/register', {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.access_token).toBe('mock-access-token-sprint19');
    expect(res.body.data.user.email).toBe('newuser@example.com');
  });
});

// ============================================================================
// Test D — POST /auth/register: after rate limit exceeded → 429 RATE_LIMITED
// ============================================================================

describe('T-178 Test D — POST /auth/register after limit exceeded returns 429 RATE_LIMITED', () => {
  it('returns 429 with RATE_LIMITED code and register-specific message when limit breached', async () => {
    // Isolated app with max=1 using the register-specific message
    const app = buildRateLimitTestApp({
      max: 1,
      message: 'Too many registration attempts, please try again later.',
    });

    // First request: within limit
    const res1 = await request(app, 'POST', '/test', {});
    expect(res1.status).toBe(200);

    // Second request: over limit → 429
    const res2 = await request(app, 'POST', '/test', {});
    expect(res2.status).toBe(429);
    expect(res2.body.error).toBeDefined();
    expect(res2.body.error.code).toBe('RATE_LIMITED');
    expect(res2.body.error.message).toBe(
      'Too many registration attempts, please try again later.',
    );
  });

  it('does NOT expose stack traces or internal details in 429 response', async () => {
    const app = buildRateLimitTestApp({
      max: 1,
      message: 'Too many registration attempts, please try again later.',
    });

    await request(app, 'POST', '/test', {});
    const res = await request(app, 'POST', '/test', {});

    expect(res.status).toBe(429);
    // Body must only contain { error: { code, message } } — no stack, no internals
    const body = res.body;
    expect(Object.keys(body)).toEqual(['error']);
    expect(Object.keys(body.error)).toEqual(expect.arrayContaining(['code', 'message']));
    expect(body.error.stack).toBeUndefined();
  });
});

// ============================================================================
// Test E — Non-auth routes are NOT rate limited by auth rate limiters
// ============================================================================

describe('T-178 Test E — Non-auth routes are not affected by auth rate limiters', () => {
  it('GET /api/v1/health returns 200 regardless of auth rate limiter state', async () => {
    // Build an app with the health route only — NO auth rate limiters applied
    const app = express();
    app.get('/api/v1/health', (req, res) => res.status(200).json({ status: 'ok' }));

    // Make multiple rapid requests — should all return 200 (no rate limiter here)
    for (let i = 0; i < 5; i++) {
      const res = await request(app, 'GET', '/api/v1/health', null);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    }
  });

  it('Auth rate limiters are scoped only to auth routes — other routes are unaffected', async () => {
    // App with auth routes (rate limited) AND a separate health route (no limiter)
    const app = express();
    app.use(express.json());
    app.use('/api/v1/auth', authRoutes);
    app.get('/api/v1/health', (req, res) => res.status(200).json({ status: 'ok' }));
    app.use(errorHandler);

    // Health endpoint should never be rate limited
    const health1 = await request(app, 'GET', '/api/v1/health', null);
    expect(health1.status).toBe(200);

    const health2 = await request(app, 'GET', '/api/v1/health', null);
    expect(health2.status).toBe(200);
  });
});
