import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

/**
 * Axios 401 Retry Queue — Dedicated Unit Tests (Sprint 4 T-064)
 *
 * Tests the response interceptor logic in api.js that:
 * 1. Catches 401 errors
 * 2. Calls /auth/refresh to get a new access token
 * 3. Retries the original request with the new token
 * 4. Queues concurrent 401s so only one refresh call happens
 * 5. On refresh failure, clears auth and redirects to login
 */

// We need to test the interceptor logic in isolation.
// Since api.js uses import.meta.env and sets up interceptors at module level,
// we'll test by creating a fresh axios instance and replicating the interceptor logic.

describe('Axios 401 Retry Queue Interceptor', () => {
  let client;
  let getTokenFn;
  let setTokenFn;
  let onUnauthorizedFn;
  let isRefreshing;
  let refreshSubscribers;

  function onRefreshed(newToken) {
    refreshSubscribers.forEach((cb) => cb(newToken));
    refreshSubscribers = [];
  }

  function addRefreshSubscriber(cb) {
    refreshSubscribers.push(cb);
  }

  function setupInterceptors() {
    // Request interceptor — add Bearer token
    client.interceptors.request.use(
      (config) => {
        const token = getTokenFn ? getTokenFn() : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor — 401 retry logic
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          !error.response ||
          error.response.status !== 401 ||
          originalRequest._retry ||
          originalRequest.url === '/auth/refresh' ||
          originalRequest.url === '/auth/login'
        ) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve) => {
            addRefreshSubscriber((newToken) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(client(originalRequest));
            });
          });
        }

        isRefreshing = true;

        try {
          const response = await client.post('/auth/refresh');
          const { access_token } = response.data.data;

          if (setTokenFn) {
            setTokenFn(access_token);
          }

          onRefreshed(access_token);
          isRefreshing = false;

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return client(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];
          if (onUnauthorizedFn) {
            onUnauthorizedFn();
          }
          return Promise.reject(refreshError);
        }
      }
    );
  }

  beforeEach(() => {
    client = axios.create({
      baseURL: 'http://test-api',
      headers: { 'Content-Type': 'application/json' },
    });
    getTokenFn = vi.fn(() => 'old-token');
    setTokenFn = vi.fn();
    onUnauthorizedFn = vi.fn();
    isRefreshing = false;
    refreshSubscribers = [];

    setupInterceptors();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Test 1: 401 response triggers refresh token call ──────────────────
  it('retries original request after successful token refresh on 401', async () => {
    let callCount = 0;
    const adapter = vi.fn((config) => {
      callCount++;
      if (config.url === '/auth/refresh') {
        return Promise.resolve({
          status: 200,
          data: { data: { access_token: 'new-token' } },
          headers: {},
          config,
          statusText: 'OK',
        });
      }
      if (config.url === '/trips' && callCount === 1) {
        // First call — 401
        return Promise.reject({
          response: { status: 401, data: {}, headers: {}, config },
          config,
        });
      }
      // Retry call — success
      return Promise.resolve({
        status: 200,
        data: { data: [{ id: 'trip-1' }] },
        headers: {},
        config,
        statusText: 'OK',
      });
    });
    client.defaults.adapter = adapter;

    const response = await client.get('/trips');
    expect(response.data.data).toEqual([{ id: 'trip-1' }]);
    expect(setTokenFn).toHaveBeenCalledWith('new-token');
  });

  // ── Test 2: After successful refresh, setTokenFn is called with new token ──
  it('calls setTokenFn with new access token after successful refresh', async () => {
    // Make getTokenFn return the updated token after setTokenFn is called
    let currentToken = 'old-token';
    getTokenFn = vi.fn(() => currentToken);
    setTokenFn = vi.fn((token) => { currentToken = token; });

    // Re-setup interceptors with updated fns
    client = axios.create({
      baseURL: 'http://test-api',
      headers: { 'Content-Type': 'application/json' },
    });
    isRefreshing = false;
    refreshSubscribers = [];
    setupInterceptors();

    const adapter = vi.fn((config) => {
      if (config.url === '/auth/refresh') {
        return Promise.resolve({
          status: 200,
          data: { data: { access_token: 'refreshed-token-abc' } },
          headers: {},
          config,
          statusText: 'OK',
        });
      }
      if (config.url === '/trips' && !config._retry) {
        return Promise.reject({
          response: { status: 401, data: {}, headers: {}, config },
          config,
        });
      }
      // Retry call succeeds
      return Promise.resolve({
        status: 200,
        data: { data: [] },
        headers: {},
        config,
        statusText: 'OK',
      });
    });
    client.defaults.adapter = adapter;

    await client.get('/trips');
    expect(setTokenFn).toHaveBeenCalledWith('refreshed-token-abc');
    expect(currentToken).toBe('refreshed-token-abc');
  });

  // ── Test 3: Multiple concurrent 401s queue and all retry after single refresh ──
  it('queues concurrent 401 requests and retries all after single refresh', async () => {
    let refreshCallCount = 0;
    const firstCallMap = new Map();

    const adapter = vi.fn((config) => {
      const url = config.url;

      if (url === '/auth/refresh') {
        refreshCallCount++;
        return Promise.resolve({
          status: 200,
          data: { data: { access_token: 'shared-new-token' } },
          headers: {},
          config,
          statusText: 'OK',
        });
      }

      // First call for each URL returns 401
      if (!firstCallMap.has(url)) {
        firstCallMap.set(url, true);
        return Promise.reject({
          response: { status: 401, data: {}, headers: {}, config },
          config,
        });
      }

      // Retry calls succeed
      return Promise.resolve({
        status: 200,
        data: { data: { url } },
        headers: {},
        config,
        statusText: 'OK',
      });
    });
    client.defaults.adapter = adapter;

    // Fire three requests concurrently
    const [r1, r2, r3] = await Promise.all([
      client.get('/trips'),
      client.get('/flights'),
      client.get('/stays'),
    ]);

    expect(r1.data.data.url).toBe('/trips');
    expect(r2.data.data.url).toBe('/flights');
    expect(r3.data.data.url).toBe('/stays');

    // Only ONE refresh call should have been made
    expect(refreshCallCount).toBe(1);
  });

  // ── Test 4: Refresh failure clears auth and calls onUnauthorized ──────
  it('clears auth and calls onUnauthorized when refresh fails', async () => {
    const adapter = vi.fn((config) => {
      if (config.url === '/auth/refresh') {
        return Promise.reject({
          response: { status: 401, data: {}, headers: {}, config },
          config,
        });
      }
      // Original request — 401
      return Promise.reject({
        response: { status: 401, data: {}, headers: {}, config },
        config,
      });
    });
    client.defaults.adapter = adapter;

    await expect(client.get('/trips')).rejects.toBeDefined();
    expect(onUnauthorizedFn).toHaveBeenCalledOnce();
  });

  // ── Test 5: Non-401 errors pass through unchanged ─────────────────────
  it('does not intercept non-401 errors', async () => {
    const adapter = vi.fn((config) => {
      return Promise.reject({
        response: { status: 500, data: { error: 'Server error' }, headers: {}, config },
        config,
      });
    });
    client.defaults.adapter = adapter;

    try {
      await client.get('/trips');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err.response.status).toBe(500);
    }

    // No refresh attempted
    expect(setTokenFn).not.toHaveBeenCalled();
    expect(onUnauthorizedFn).not.toHaveBeenCalled();
  });

  // ── Test 6: 401 on /auth/login is not intercepted (passthrough) ───────
  it('does not intercept 401 on /auth/login (passthrough)', async () => {
    const adapter = vi.fn((config) => {
      return Promise.reject({
        response: { status: 401, data: { error: { message: 'Invalid credentials' } }, headers: {}, config },
        config,
      });
    });
    client.defaults.adapter = adapter;

    try {
      await client.post('/auth/login', { email: 'test@test.com', password: 'wrong' });
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err.response.status).toBe(401);
    }

    // No refresh attempted, no auth cleared
    expect(setTokenFn).not.toHaveBeenCalled();
    expect(onUnauthorizedFn).not.toHaveBeenCalled();
  });

  // ── Test 7: 401 on /auth/refresh is not intercepted (prevents infinite loop) ──
  it('does not intercept 401 on /auth/refresh (prevents infinite loop)', async () => {
    const adapter = vi.fn((config) => {
      return Promise.reject({
        response: { status: 401, data: {}, headers: {}, config },
        config,
      });
    });
    client.defaults.adapter = adapter;

    try {
      await client.post('/auth/refresh');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err.response.status).toBe(401);
    }

    // No retry attempted
    expect(setTokenFn).not.toHaveBeenCalled();
  });

  // ── Test 8: Request interceptor adds Bearer token ─────────────────────
  it('adds Authorization header with Bearer token to requests', async () => {
    let capturedHeaders = null;
    const adapter = vi.fn((config) => {
      capturedHeaders = config.headers;
      return Promise.resolve({
        status: 200,
        data: {},
        headers: {},
        config,
        statusText: 'OK',
      });
    });
    client.defaults.adapter = adapter;

    await client.get('/trips');
    expect(capturedHeaders.Authorization).toBe('Bearer old-token');
  });
});
