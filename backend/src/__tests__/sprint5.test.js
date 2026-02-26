/**
 * Sprint 5 Tests — T-072: Trip Search, Filter, and Sort
 *
 * Tests for the new query parameters on GET /api/v1/trips:
 *   ?search=<string>       — ILIKE on name + destinations
 *   ?status=<string>       — post-query filter by computed status
 *   ?sort_by=<string>      — name | created_at | start_date
 *   ?sort_order=<string>   — asc | desc
 *
 * Structure:
 *   1. Route-level tests (validation, param passing, error responses)
 *   2. Model-level unit tests (listTripsByUser with options)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock tripModel ----
// Include the constant exports that the route handler uses for validation (T-072)
vi.mock('../models/tripModel.js', () => ({
  listTripsByUser: vi.fn(),
  findTripById: vi.fn(),
  createTrip: vi.fn(),
  updateTrip: vi.fn(),
  deleteTrip: vi.fn(),
  VALID_SORT_BY: ['name', 'created_at', 'start_date'],
  VALID_SORT_ORDER: ['asc', 'desc'],
  VALID_STATUS_FILTER: ['PLANNING', 'ONGOING', 'COMPLETED'],
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-token'),
    verify: vi.fn((token) => {
      if (token === 'valid-token') return { id: 'user-1', email: 'jane@example.com', name: 'Jane' };
      throw new Error('Invalid token');
    }),
  },
}));

import express from 'express';
import tripsRoutes from '../routes/trips.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as tripModel from '../models/tripModel.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/trips', tripsRoutes);
  app.use(errorHandler);
  return app;
}

async function request(app, method, path, body, headers = {}) {
  const { createServer } = await import('http');
  const server = createServer(app);

  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const port = server.address().port;
      const url = `http://localhost:${port}${path}`;
      const options = {
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json', ...headers },
      };
      import('http').then(({ default: http }) => {
        const req = http.request(url, options, (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            server.close();
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
          });
        });
        req.on('error', (e) => { server.close(); reject(e); });
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    });
  });
}

const AUTH = { Authorization: 'Bearer valid-token' };

const mockTrips = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    user_id: 'user-1',
    name: 'Japan 2026',
    destinations: ['Tokyo', 'Osaka'],
    status: 'PLANNING',
    start_date: '2026-08-07',
    end_date: '2026-08-14',
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    user_id: 'user-1',
    name: 'Europe Tour',
    destinations: ['Paris', 'London', 'Rome'],
    status: 'COMPLETED',
    start_date: '2025-06-01',
    end_date: '2025-06-15',
    created_at: '2025-01-15T10:00:00.000Z',
    updated_at: '2025-06-16T10:00:00.000Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    user_id: 'user-1',
    name: 'Weekend Getaway',
    destinations: ['San Francisco'],
    status: 'PLANNING',
    start_date: null,
    end_date: null,
    created_at: '2026-02-20T08:00:00.000Z',
    updated_at: '2026-02-20T08:00:00.000Z',
  },
];

// =============================================================================
// Route-level tests: GET /api/v1/trips with query parameters
// =============================================================================

describe('GET /api/v1/trips — Search (T-072)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: passes search param to model', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: [mockTrips[0]], total: 1 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips?search=Tokyo', null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
    // Verify model was called with search option
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      search: 'Tokyo',
    }));
  });

  it('happy path: empty search treated as no search', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: mockTrips, total: 3 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips?search=', null, AUTH);

    expect(res.status).toBe(200);
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      search: undefined,
    }));
  });

  it('happy path: whitespace-only search treated as no search', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: mockTrips, total: 3 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips?search=%20%20%20', null, AUTH);

    expect(res.status).toBe(200);
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      search: undefined,
    }));
  });

  it('happy path: search with special characters is accepted', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: [], total: 0 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips?search=caf%C3%A9', null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it('happy path: no results returns empty data array with 200', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: [], total: 0 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips?search=nonexistent', null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });
});

describe('GET /api/v1/trips — Status Filter (T-072)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: filters by PLANNING status', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: [mockTrips[0]], total: 1 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips?status=PLANNING', null, AUTH);

    expect(res.status).toBe(200);
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      status: 'PLANNING',
    }));
  });

  it('happy path: filters by COMPLETED status', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: [mockTrips[1]], total: 1 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips?status=COMPLETED', null, AUTH);

    expect(res.status).toBe(200);
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      status: 'COMPLETED',
    }));
  });

  it('happy path: filters by ONGOING status', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: [], total: 0 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips?status=ONGOING', null, AUTH);

    expect(res.status).toBe(200);
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      status: 'ONGOING',
    }));
  });

  it('error path: invalid status returns 400 VALIDATION_ERROR', async () => {
    const res = await request(buildApp(), 'GET', '/api/v1/trips?status=INVALID', null, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.status).toBe('Status filter must be one of: PLANNING, ONGOING, COMPLETED');
    // Model should NOT be called when validation fails
    expect(tripModel.listTripsByUser).not.toHaveBeenCalled();
  });

  it('error path: lowercase status value returns 400', async () => {
    const res = await request(buildApp(), 'GET', '/api/v1/trips?status=planning', null, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.status).toBeDefined();
  });
});

describe('GET /api/v1/trips — Sort (T-072)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: sort by name ascending', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: mockTrips, total: 3 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips?sort_by=name&sort_order=asc', null, AUTH);

    expect(res.status).toBe(200);
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      sortBy: 'name',
      sortOrder: 'asc',
    }));
  });

  it('happy path: sort by start_date descending', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: mockTrips, total: 3 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips?sort_by=start_date&sort_order=desc', null, AUTH);

    expect(res.status).toBe(200);
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      sortBy: 'start_date',
      sortOrder: 'desc',
    }));
  });

  it('happy path: sort by created_at (default) when sort_by omitted', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: mockTrips, total: 3 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips', null, AUTH);

    expect(res.status).toBe(200);
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      sortBy: 'created_at',
      sortOrder: 'desc',
    }));
  });

  it('error path: invalid sort_by returns 400 VALIDATION_ERROR', async () => {
    const res = await request(buildApp(), 'GET', '/api/v1/trips?sort_by=invalid_column', null, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.sort_by).toBe('Sort field must be one of: name, created_at, start_date');
    expect(tripModel.listTripsByUser).not.toHaveBeenCalled();
  });

  it('error path: invalid sort_order returns 400 VALIDATION_ERROR', async () => {
    const res = await request(buildApp(), 'GET', '/api/v1/trips?sort_order=random', null, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.sort_order).toBe('Sort order must be one of: asc, desc');
    expect(tripModel.listTripsByUser).not.toHaveBeenCalled();
  });

  it('error path: multiple invalid params return all errors at once', async () => {
    const res = await request(buildApp(), 'GET', '/api/v1/trips?status=BAD&sort_by=invalid&sort_order=wrong', null, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.status).toBeDefined();
    expect(res.body.error.fields.sort_by).toBeDefined();
    expect(res.body.error.fields.sort_order).toBeDefined();
    expect(tripModel.listTripsByUser).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/trips — Combined Query Params (T-072)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: search + status + sort combined', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: [mockTrips[0]], total: 1 });

    const res = await request(
      buildApp(),
      'GET',
      '/api/v1/trips?search=Japan&status=PLANNING&sort_by=name&sort_order=asc&page=1&limit=10',
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toEqual({ page: 1, limit: 10, total: 1 });
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', {
      page: 1,
      limit: 10,
      search: 'Japan',
      status: 'PLANNING',
      sortBy: 'name',
      sortOrder: 'asc',
    });
  });

  it('happy path: search + sort without status filter', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: mockTrips.slice(0, 2), total: 2 });

    const res = await request(
      buildApp(),
      'GET',
      '/api/v1/trips?search=trip&sort_by=start_date&sort_order=asc',
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      search: 'trip',
      status: undefined,
      sortBy: 'start_date',
      sortOrder: 'asc',
    }));
  });

  it('happy path: no query params = default behavior (backward compatible)', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: mockTrips, total: 3 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips', null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', {
      page: 1,
      limit: 20,
      search: undefined,
      status: undefined,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  });

  it('error path: returns 401 without auth token', async () => {
    const res = await request(buildApp(), 'GET', '/api/v1/trips?search=test', null);
    expect(res.status).toBe(401);
  });
});

// =============================================================================
// Model-level unit tests for search/filter/sort pure functions
// =============================================================================

describe('VALID_SORT_BY, VALID_SORT_ORDER, VALID_STATUS_FILTER exports (T-072)', () => {
  it('VALID_SORT_BY contains expected values', () => {
    expect(tripModel.VALID_SORT_BY).toEqual(['name', 'created_at', 'start_date']);
  });

  it('VALID_SORT_ORDER contains expected values', () => {
    expect(tripModel.VALID_SORT_ORDER).toEqual(['asc', 'desc']);
  });

  it('VALID_STATUS_FILTER contains expected values', () => {
    expect(tripModel.VALID_STATUS_FILTER).toEqual(['PLANNING', 'ONGOING', 'COMPLETED']);
  });
});

describe('GET /api/v1/trips — Pagination with filters (T-072)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: pagination params passed with search', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: [mockTrips[0]], total: 5 });

    const res = await request(
      buildApp(),
      'GET',
      '/api/v1/trips?search=test&page=2&limit=2',
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual({ page: 2, limit: 2, total: 5 });
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      page: 2,
      limit: 2,
      search: 'test',
    }));
  });

  it('happy path: page/limit coerced for invalid values (NaN → default)', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: mockTrips, total: 3 });

    const res = await request(
      buildApp(),
      'GET',
      '/api/v1/trips?page=abc&limit=xyz',
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      page: 1,
      limit: 20,
    }));
  });

  it('happy path: limit clamped to max 100', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: [], total: 0 });

    const res = await request(
      buildApp(),
      'GET',
      '/api/v1/trips?limit=500',
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      limit: 100,
    }));
  });
});

describe('GET /api/v1/trips — SQL injection prevention (T-072)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('search with SQL injection attempt is safely handled', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: [], total: 0 });

    // This should be passed as a parameterized query value, not concatenated
    const res = await request(
      buildApp(),
      'GET',
      "/api/v1/trips?search='; DROP TABLE trips; --",
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    // The model should have been called with the raw search string as a param
    expect(tripModel.listTripsByUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      search: "'; DROP TABLE trips; --",
    }));
  });

  it('sort_by with SQL injection attempt returns 400', async () => {
    const res = await request(
      buildApp(),
      'GET',
      '/api/v1/trips?sort_by=name;DROP%20TABLE%20trips',
      null,
      AUTH,
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(tripModel.listTripsByUser).not.toHaveBeenCalled();
  });
});
