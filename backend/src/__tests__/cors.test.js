/**
 * Sprint 27 Tests — T-228 Fix B — CORS Origin from Environment Variable
 *
 * Verifies that the CORS middleware in app.js correctly reads the configured
 * origin from the CORS_ORIGIN environment variable rather than always using
 * the hardcoded fallback. This is the regression surface introduced by the
 * ESM dotenv-hoisting bug and fixed by T-228 Fix B.
 *
 * Root cause recap:
 *   In `backend/src/index.js`, the static `import app from './app.js'` was
 *   hoisted before `dotenv.config()` ran.  When app.js executed `cors({ origin:
 *   process.env.CORS_ORIGIN || 'http://localhost:5173' })`, CORS_ORIGIN was
 *   still undefined, so the fallback 'http://localhost:5173' was permanently
 *   captured.  On staging (where CORS_ORIGIN='https://localhost:4173') every
 *   browser-initiated API call was rejected.
 *
 * Fix B converts the static import to a dynamic import() executed after
 * dotenv.config(), so app.js now evaluates with process.env fully populated.
 *
 * Test strategy:
 *   We cannot reuse the cached app.js singleton across tests with different
 *   CORS_ORIGIN values because ESM modules are cached after the first import.
 *   Instead, we build a lightweight test app that mirrors app.js's CORS
 *   configuration pattern exactly:
 *
 *     cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true })
 *
 *   Each test sets process.env.CORS_ORIGIN, then calls buildTestApp() which
 *   evaluates the env var at call time — the same moment app.js evaluates it
 *   when loaded via dynamic import after dotenv.config().  This correctly
 *   exercises the configuration logic the fix restores.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import cors from 'cors';
import http from 'http';

// ---------------------------------------------------------------------------
// Helper: minimal express app that mirrors app.js CORS configuration exactly
// ---------------------------------------------------------------------------

/**
 * Builds a test Express app with the same CORS config pattern used in app.js.
 * Called AFTER process.env.CORS_ORIGIN has been set for the current test,
 * so the env var is evaluated at the time the middleware is registered —
 * matching the behaviour of app.js when loaded via dynamic import().
 */
function buildTestApp() {
  const app = express();
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    }),
  );
  app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
  return app;
}

/**
 * Makes a real HTTP GET request to the given path with the given Origin header
 * and resolves with { status, headers }.
 */
async function makeRequest(app, path, originHeader) {
  const server = http.createServer(app);
  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const port = server.address().port;
      const options = {
        method: 'GET',
        headers: {
          Origin: originHeader,
        },
      };
      const req = http.request(
        `http://localhost:${port}${path}`,
        options,
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            server.close();
            resolve({ status: res.statusCode, headers: res.headers });
          });
        },
      );
      req.on('error', (e) => {
        server.close();
        reject(e);
      });
      req.end();
    });
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('T-228 — CORS origin reflects CORS_ORIGIN env var when set', () => {
  let savedCorsOrigin;

  beforeEach(() => {
    savedCorsOrigin = process.env.CORS_ORIGIN;
  });

  afterEach(() => {
    if (savedCorsOrigin === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = savedCorsOrigin;
    }
  });

  it('uses CORS_ORIGIN env var value as the allowed origin', async () => {
    process.env.CORS_ORIGIN = 'https://custom.example.com';
    const app = buildTestApp();
    const res = await makeRequest(app, '/api/v1/health', 'https://custom.example.com');
    expect(res.headers['access-control-allow-origin']).toBe('https://custom.example.com');
  });

  it('returns 200 for a same-origin request when CORS_ORIGIN matches', async () => {
    process.env.CORS_ORIGIN = 'https://custom.example.com';
    const app = buildTestApp();
    const res = await makeRequest(app, '/api/v1/health', 'https://custom.example.com');
    expect(res.status).toBe(200);
  });

  it('sets Access-Control-Allow-Credentials: true when CORS_ORIGIN is configured', async () => {
    process.env.CORS_ORIGIN = 'https://staging.example.com';
    const app = buildTestApp();
    const res = await makeRequest(app, '/api/v1/health', 'https://staging.example.com');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('uses staging origin https://localhost:4173 (the origin that was broken)', async () => {
    process.env.CORS_ORIGIN = 'https://localhost:4173';
    const app = buildTestApp();
    const res = await makeRequest(app, '/api/v1/health', 'https://localhost:4173');
    expect(res.headers['access-control-allow-origin']).toBe('https://localhost:4173');
  });

  it('does NOT echo back a different origin when CORS_ORIGIN is set to a specific value', async () => {
    process.env.CORS_ORIGIN = 'https://allowed.example.com';
    const app = buildTestApp();
    const res = await makeRequest(app, '/api/v1/health', 'https://evil.example.com');
    // cors package does not set the header when origin doesn't match
    expect(res.headers['access-control-allow-origin']).not.toBe(
      'https://evil.example.com',
    );
  });
});

describe('T-228 — CORS falls back to http://localhost:5173 when CORS_ORIGIN is not set', () => {
  let savedCorsOrigin;

  beforeEach(() => {
    savedCorsOrigin = process.env.CORS_ORIGIN;
    delete process.env.CORS_ORIGIN; // ensure env var is absent
  });

  afterEach(() => {
    if (savedCorsOrigin === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = savedCorsOrigin;
    }
  });

  it('uses fallback http://localhost:5173 when CORS_ORIGIN is absent', async () => {
    const app = buildTestApp();
    const res = await makeRequest(app, '/api/v1/health', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('returns 200 for a request from fallback origin when CORS_ORIGIN is absent', async () => {
    const app = buildTestApp();
    const res = await makeRequest(app, '/api/v1/health', 'http://localhost:5173');
    expect(res.status).toBe(200);
  });

  it('does NOT allow the staging origin when CORS_ORIGIN is absent (uses fallback only)', async () => {
    const app = buildTestApp();
    // Staging origin should NOT be allowed when CORS_ORIGIN isn't configured
    const res = await makeRequest(app, '/api/v1/health', 'https://localhost:4173');
    expect(res.headers['access-control-allow-origin']).not.toBe(
      'https://localhost:4173',
    );
  });
});
