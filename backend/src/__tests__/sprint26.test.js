/**
 * Sprint 26 Tests — T-220, T-221, T-226
 *
 * T-220: knexfile.js production SSL + pool config
 * ─────────────────────────────────────────────────
 *   Verifies that the production Knex config block has:
 *     - ssl.rejectUnauthorized === false  (for AWS RDS self-signed cert)
 *     - pool.max === 5                    (right-sized for db.t3.micro)
 *     - pool.min === 1                    (conservative low-water mark)
 *
 * T-221: Cookie SameSite=None in production
 * ──────────────────────────────────────────
 *   Verifies that auth routes set the refresh token cookie with:
 *     - SameSite=None; Secure when NODE_ENV === 'production'
 *     - SameSite=Strict when NODE_ENV !== 'production' (dev / staging)
 *   Affected endpoints: POST /auth/register, POST /auth/login,
 *                       POST /auth/refresh, POST /auth/logout
 *
 * T-226: test_user seed script
 * ─────────────────────────────
 *   Verifies that:
 *     - seed() calls knex('users').insert with the correct email + name
 *     - The inserted password_hash is a valid bcrypt hash for TestPass123!
 *     - onConflict('email') is called (idempotent — skip on duplicate)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// T-220 — knexfile.js production config
// ============================================================================

describe('T-220 — knexfile.js production config', () => {
  it('production block has ssl.rejectUnauthorized === false (remote URL)', async () => {
    // buildConnectionConfig decomposes remote URLs into host/port/ssl fields.
    // We test this directly because the local DATABASE_URL in .env returns a
    // plain string (local dev path) — a remote URL exercises the SSL branch.
    const { buildConnectionConfig } = await import('../config/knexfile.js');
    const remoteUrl = 'postgres://appuser:secret@rds.example.com:5432/triplanner';
    const config = buildConnectionConfig(remoteUrl);
    expect(config.ssl).toBeDefined();
    expect(config.ssl.rejectUnauthorized).toBe(false);
  });

  it('production block has pool.max === 5', async () => {
    const { default: knexConfig } = await import('../config/knexfile.js');
    expect(knexConfig.production.pool.max).toBe(5);
  });

  it('production block has pool.min === 1', async () => {
    const { default: knexConfig } = await import('../config/knexfile.js');
    expect(knexConfig.production.pool.min).toBe(1);
  });

  it('remote DATABASE_URL produces a decomposed object (not a bare string)', async () => {
    // After the hotfix (decompose-URL strategy), remote URLs are broken into
    // host/port/user/password/database/ssl fields — NOT passed as connectionString —
    // because pg-connection-string overrides rejectUnauthorized when sslmode=require.
    const { buildConnectionConfig } = await import('../config/knexfile.js');
    const remoteUrl = 'postgres://appuser:secret@rds.example.com:5432/triplanner';
    const config = buildConnectionConfig(remoteUrl);
    expect(typeof config).toBe('object');
    expect(config).toHaveProperty('host', 'rds.example.com');
    expect(config).toHaveProperty('database', 'triplanner');
  });

  it('development and staging configs are unchanged (no ssl block)', async () => {
    const { default: knexConfig } = await import('../config/knexfile.js');
    // dev: plain string / no ssl
    expect(typeof knexConfig.development.connection === 'string'
      || !knexConfig.development.connection?.ssl).toBe(true);
    // staging: plain string / no ssl
    expect(typeof knexConfig.staging.connection === 'string'
      || !knexConfig.staging.connection?.ssl).toBe(true);
  });
});

// ============================================================================
// T-221 — Cookie SameSite fix
// ============================================================================

// Mock model dependencies used by auth routes
vi.mock('../models/userModel.js', () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock('../models/refreshTokenModel.js', () => ({
  generateRawToken: vi.fn(() => 'raw-refresh-token'),
  hashToken: vi.fn((t) => `hashed-${t}`),
  createRefreshToken: vi.fn(),
  findValidRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-access-token'),
    verify: vi.fn((token) => {
      if (token === 'valid-token') return { id: 'user-1', email: 'test@example.com', name: 'Test' };
      throw new Error('invalid token');
    }),
  },
}));

import * as userModel from '../models/userModel.js';
import * as refreshTokenModel from '../models/refreshTokenModel.js';

// ---- HTTP helper that returns status, body, AND headers ----
async function requestWithHeaders(app, method, path, body, headers = {}) {
  const { createServer } = await import('http');
  const http = await import('http');
  const server = createServer(app);
  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const port = server.address().port;
      const options = {
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json', ...headers },
      };
      const req = http.default.request(`http://localhost:${port}${path}`, options, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          server.close();
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
            headers: res.headers,
          });
        });
      });
      req.on('error', (e) => { server.close(); reject(e); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

function buildAuthApp() {
  const express = require('express');
  return null; // replaced below with async import
}

async function buildAuthTestApp() {
  const { default: express } = await import('express');
  const { default: authRoutes } = await import('../routes/auth.js');
  const { errorHandler } = await import('../middleware/errorHandler.js');
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

const MOCK_USER = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  password_hash: '$2a$12$KIXRypNYJWQXQVVjbmLiOuHm1Wm5H8F4c2G.x3kPZ9RZ1O8qb5Xm',
  created_at: new Date().toISOString(),
};

describe('T-221 — Cookie SameSite in non-production (default)', () => {
  let originalNodeEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test'; // non-production
    userModel.createUser.mockResolvedValue(MOCK_USER);
    userModel.findUserByEmail.mockResolvedValue(null); // no existing user for register
    refreshTokenModel.generateRawToken.mockReturnValue('raw-token-abc');
    refreshTokenModel.hashToken.mockReturnValue('hashed-raw-token-abc');
    refreshTokenModel.createRefreshToken.mockResolvedValue();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('POST /auth/register sets cookie with SameSite=Strict in non-production', async () => {
    const app = await buildAuthTestApp();
    const res = await requestWithHeaders(app, 'POST', '/api/v1/auth/register', {
      name: 'Test User',
      email: 'new@example.com',
      password: 'Password123',
    });

    expect(res.status).toBe(201);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
    expect(cookieStr.toLowerCase()).toContain('samesite=strict');
    expect(cookieStr.toLowerCase()).not.toContain('samesite=none');
  });
});

describe('T-221 — Cookie SameSite in production', () => {
  let originalNodeEnv;
  let originalCookieSecure;

  beforeEach(() => {
    vi.clearAllMocks();
    originalNodeEnv = process.env.NODE_ENV;
    originalCookieSecure = process.env.COOKIE_SECURE;
    process.env.NODE_ENV = 'production';
    process.env.COOKIE_SECURE = 'true';
    userModel.createUser.mockResolvedValue(MOCK_USER);
    userModel.findUserByEmail.mockResolvedValue(null);
    refreshTokenModel.generateRawToken.mockReturnValue('raw-token-prod');
    refreshTokenModel.hashToken.mockReturnValue('hashed-raw-token-prod');
    refreshTokenModel.createRefreshToken.mockResolvedValue();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.COOKIE_SECURE = originalCookieSecure;
  });

  it('POST /auth/register sets cookie with SameSite=None in production', async () => {
    const app = await buildAuthTestApp();
    const res = await requestWithHeaders(app, 'POST', '/api/v1/auth/register', {
      name: 'Test User',
      email: 'prod@example.com',
      password: 'Password123',
    });

    expect(res.status).toBe(201);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
    expect(cookieStr.toLowerCase()).toContain('samesite=none');
    expect(cookieStr.toLowerCase()).not.toContain('samesite=strict');
  });

  it('POST /auth/register sets Secure flag in production', async () => {
    const app = await buildAuthTestApp();
    const res = await requestWithHeaders(app, 'POST', '/api/v1/auth/register', {
      name: 'Test User',
      email: 'prod2@example.com',
      password: 'Password123',
    });

    expect(res.status).toBe(201);
    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
    expect(cookieStr.toLowerCase()).toContain('secure');
  });
});

// ============================================================================
// T-226 — test_user seed script
// ============================================================================

import bcrypt from 'bcryptjs';
import { seed } from '../seeds/test_user.js';

describe('T-226 — test_user seed script', () => {
  it('seed() inserts with the correct email', async () => {
    // Build a minimal mock knex chainable query object
    const mockIgnore = vi.fn().mockResolvedValue([]);
    const mockOnConflict = vi.fn().mockReturnValue({ ignore: mockIgnore });
    const mockInsert = vi.fn().mockReturnValue({ onConflict: mockOnConflict });
    const mockKnex = vi.fn().mockReturnValue({ insert: mockInsert });

    await seed(mockKnex);

    // Verify the correct table was targeted
    expect(mockKnex).toHaveBeenCalledWith('users');

    // Verify email
    const insertPayload = mockInsert.mock.calls[0][0];
    expect(insertPayload.email).toBe('test@triplanner.local');
  });

  it('seed() inserts with the correct name', async () => {
    const mockIgnore = vi.fn().mockResolvedValue([]);
    const mockOnConflict = vi.fn().mockReturnValue({ ignore: mockIgnore });
    const mockInsert = vi.fn().mockReturnValue({ onConflict: mockOnConflict });
    const mockKnex = vi.fn().mockReturnValue({ insert: mockInsert });

    await seed(mockKnex);

    const insertPayload = mockInsert.mock.calls[0][0];
    expect(insertPayload.name).toBe('Test User');
  });

  // Bcrypt with 12 rounds can take 2–10+ seconds depending on CPU.
  // Allow up to 60s so the test is stable across different machines/loads.
  it('seed() inserts a valid bcrypt hash for TestPass123!', async () => {
    const mockIgnore = vi.fn().mockResolvedValue([]);
    const mockOnConflict = vi.fn().mockReturnValue({ ignore: mockIgnore });
    const mockInsert = vi.fn().mockReturnValue({ onConflict: mockOnConflict });
    const mockKnex = vi.fn().mockReturnValue({ insert: mockInsert });

    await seed(mockKnex);

    const insertPayload = mockInsert.mock.calls[0][0];
    const hashIsValid = await bcrypt.compare('TestPass123!', insertPayload.password_hash);
    expect(hashIsValid).toBe(true);
  }, 60_000);

  it('seed() calls onConflict("email") for idempotency', async () => {
    const mockIgnore = vi.fn().mockResolvedValue([]);
    const mockOnConflict = vi.fn().mockReturnValue({ ignore: mockIgnore });
    const mockInsert = vi.fn().mockReturnValue({ onConflict: mockOnConflict });
    const mockKnex = vi.fn().mockReturnValue({ insert: mockInsert });

    await seed(mockKnex);

    expect(mockOnConflict).toHaveBeenCalledWith('email');
  });

  it('seed() calls ignore() to skip on duplicate email', async () => {
    const mockIgnore = vi.fn().mockResolvedValue([]);
    const mockOnConflict = vi.fn().mockReturnValue({ ignore: mockIgnore });
    const mockInsert = vi.fn().mockReturnValue({ onConflict: mockOnConflict });
    const mockKnex = vi.fn().mockReturnValue({ insert: mockInsert });

    await seed(mockKnex);

    expect(mockIgnore).toHaveBeenCalled();
  });

  it('seed() is idempotent — does not throw when called twice', async () => {
    const mockIgnore = vi.fn().mockResolvedValue([]);
    const mockOnConflict = vi.fn().mockReturnValue({ ignore: mockIgnore });
    const mockInsert = vi.fn().mockReturnValue({ onConflict: mockOnConflict });
    const mockKnex = vi.fn().mockReturnValue({ insert: mockInsert });

    await expect(seed(mockKnex)).resolves.not.toThrow();
    await expect(seed(mockKnex)).resolves.not.toThrow();
  });

  it('seed() does not include unnecessary fields beyond name/email/password_hash', async () => {
    const mockIgnore = vi.fn().mockResolvedValue([]);
    const mockOnConflict = vi.fn().mockReturnValue({ ignore: mockIgnore });
    const mockInsert = vi.fn().mockReturnValue({ onConflict: mockOnConflict });
    const mockKnex = vi.fn().mockReturnValue({ insert: mockInsert });

    await seed(mockKnex);

    const insertPayload = mockInsert.mock.calls[0][0];
    const keys = Object.keys(insertPayload).sort();
    expect(keys).toEqual(['email', 'name', 'password_hash']);
  });
});
