/**
 * Tests for Google Sign-In (OAuth 2.0) — backend.
 *
 * Covers what can be tested WITHOUT a live Google round-trip:
 *   1. Graceful degradation — /google and /google/callback redirect to
 *      ?error=oauth_unavailable when GOOGLE_CLIENT_ID/SECRET are unset.
 *   2. Cancel path — /google/callback?error=access_denied redirects to
 *      ?error=access_denied (when configured).
 *   3. The passport verify callback's 3-tier lookup logic (returning user,
 *      auto-link verified email, reject unverified email, create new user,
 *      missing email) against a mocked userModel.
 *
 * Follows the project vitest pattern (auth.test.js): mock the model modules so
 * config/database.js is never imported (no `test` env in knexfile.js), spin up a
 * raw http.createServer(app), use the node http client.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock model modules — short-circuits the config/database.js import.
vi.mock('../models/userModel.js', () => ({
  saveGoogleCalendarTokens: vi.fn(),
  getGoogleCalendarTokens: vi.fn(),
  clearGoogleCalendarTokens: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  findUserByGoogleId: vi.fn(),
  createGoogleUser: vi.fn(),
  linkGoogleId: vi.fn(),
}));

vi.mock('../models/refreshTokenModel.js', () => ({
  generateRawToken: vi.fn(() => 'raw-token-abc'),
  hashToken: vi.fn((t) => `hash-of-${t}`),
  createRefreshToken: vi.fn(),
  findValidRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn(() => 'mock-access-token'), verify: vi.fn() },
}));

import express from 'express';
import authRoutes from '../routes/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { verifyGoogleProfile, isGoogleOAuthConfigured } from '../config/passport.js';
import * as userModel from '../models/userModel.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

// Mini HTTP test helper that does NOT follow redirects.
async function request(app, method, path, headers = {}) {
  const { createServer } = await import('http');
  const server = createServer(app);

  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const port = server.address().port;
      const url = `http://localhost:${port}${path}`;
      import('http').then(({ default: http }) => {
        const req = http.request(url, { method: method.toUpperCase(), headers }, (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            server.close();
            resolve({ status: res.statusCode, headers: res.headers, body: data });
          });
        });
        req.on('error', (err) => { server.close(); reject(err); });
        req.end();
      });
    });
  });
}

// Build a fake passport `done` capturing its call args.
function makeDone() {
  const calls = [];
  const done = (err, user) => calls.push({ err, user });
  done.calls = calls;
  return done;
}

describe('Google OAuth — graceful degradation (no credentials)', () => {
  const saved = {};
  beforeEach(() => {
    saved.id = process.env.GOOGLE_CLIENT_ID;
    saved.secret = process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });
  afterEach(() => {
    if (saved.id !== undefined) process.env.GOOGLE_CLIENT_ID = saved.id;
    if (saved.secret !== undefined) process.env.GOOGLE_CLIENT_SECRET = saved.secret;
  });

  it('isGoogleOAuthConfigured() is false when env vars unset', () => {
    expect(isGoogleOAuthConfigured()).toBe(false);
  });

  it('GET /google redirects to /login?error=oauth_unavailable', async () => {
    const res = await request(buildApp(), 'GET', '/api/v1/auth/google');
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/login\?error=oauth_unavailable/);
  });

  it('GET /google/callback redirects to /login?error=oauth_unavailable', async () => {
    const res = await request(buildApp(), 'GET', '/api/v1/auth/google/callback');
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/login\?error=oauth_unavailable/);
  });
});

describe('Google OAuth — cancel path (configured)', () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
  });
  afterEach(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  it('GET /google/callback?error=access_denied redirects to /login?error=access_denied', async () => {
    const res = await request(
      buildApp(),
      'GET',
      '/api/v1/auth/google/callback?error=access_denied',
    );
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/login\?error=access_denied/);
  });
});

describe('passport verifyGoogleProfile — 3-tier lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const profile = (overrides = {}) => ({
    id: 'google-sub-123',
    displayName: 'Jane Doe',
    emails: [{ value: 'jane@example.com', verified: true }],
    _json: { email_verified: true },
    ...overrides,
  });

  it('returns existing user when found by google_id', async () => {
    userModel.findUserByGoogleId.mockResolvedValue({ id: 'u1', email: 'jane@example.com' });
    const done = makeDone();
    await verifyGoogleProfile('at', 'rt', profile(), done);
    expect(done.calls[0].err).toBeNull();
    expect(done.calls[0].user.id).toBe('u1');
    expect(userModel.findUserByEmail).not.toHaveBeenCalled();
    expect(userModel.createGoogleUser).not.toHaveBeenCalled();
  });

  it('auto-links to existing email account when email verified and flags _linked', async () => {
    userModel.findUserByGoogleId.mockResolvedValue(undefined);
    userModel.findUserByEmail.mockResolvedValue({ id: 'u2', email: 'jane@example.com' });
    userModel.linkGoogleId.mockResolvedValue(1);
    userModel.findUserById.mockResolvedValue({ id: 'u2', email: 'jane@example.com', google_id: 'google-sub-123' });
    const done = makeDone();
    await verifyGoogleProfile('at', 'rt', profile(), done);
    expect(userModel.linkGoogleId).toHaveBeenCalledWith('u2', 'google-sub-123');
    expect(done.calls[0].err).toBeNull();
    expect(done.calls[0].user.id).toBe('u2');
    expect(done.calls[0].user._linked).toBe(true);
    expect(userModel.createGoogleUser).not.toHaveBeenCalled();
  });

  it('rejects (no link) when email matches existing account but is NOT verified', async () => {
    userModel.findUserByGoogleId.mockResolvedValue(undefined);
    userModel.findUserByEmail.mockResolvedValue({ id: 'u3', email: 'jane@example.com' });
    const done = makeDone();
    await verifyGoogleProfile(
      'at', 'rt',
      profile({ emails: [{ value: 'jane@example.com', verified: false }], _json: { email_verified: false } }),
      done,
    );
    expect(userModel.linkGoogleId).not.toHaveBeenCalled();
    expect(userModel.createGoogleUser).not.toHaveBeenCalled();
    expect(done.calls[0].err).toBeInstanceOf(Error);
    expect(done.calls[0].user).toBeUndefined();
  });

  it('creates a new Google user when no match exists', async () => {
    userModel.findUserByGoogleId.mockResolvedValue(undefined);
    userModel.findUserByEmail.mockResolvedValue(undefined);
    userModel.createGoogleUser.mockResolvedValue({ id: 'u4', name: 'Jane Doe', email: 'jane@example.com' });
    const done = makeDone();
    await verifyGoogleProfile('at', 'rt', profile(), done);
    expect(userModel.createGoogleUser).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      google_id: 'google-sub-123',
    });
    expect(done.calls[0].err).toBeNull();
    expect(done.calls[0].user.id).toBe('u4');
  });

  it('errors when Google returns no email', async () => {
    const done = makeDone();
    await verifyGoogleProfile('at', 'rt', profile({ emails: [], _json: {} }), done);
    expect(done.calls[0].err).toBeInstanceOf(Error);
    expect(userModel.findUserByGoogleId).not.toHaveBeenCalled();
  });

  it('propagates model errors to done(err)', async () => {
    userModel.findUserByGoogleId.mockRejectedValue(new Error('db down'));
    const done = makeDone();
    await verifyGoogleProfile('at', 'rt', profile(), done);
    expect(done.calls[0].err).toBeInstanceOf(Error);
    expect(done.calls[0].err.message).toBe('db down');
  });
});
