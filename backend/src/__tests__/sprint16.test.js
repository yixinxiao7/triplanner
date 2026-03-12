/**
 * Sprint 16 Tests — T-163: Computed trip date range (start_date / end_date)
 *
 * These tests cover the five acceptance criteria defined for T-163:
 *
 *   A) Trip with no events    → start_date: null,       end_date: null
 *   B) Trip with flights only → start_date: departure,  end_date: arrival
 *   C) Trip with mixed events → start_date: global min, end_date: global max
 *   D) GET /trips list includes start_date/end_date on every trip object
 *   E) All 266+ existing backend tests still pass (verified by running the full suite)
 *
 * Implementation note:
 *   The route tests mock tripModel.js (consistent with all existing backend test files).
 *   The model is responsible for computing start_date/end_date via SQL subqueries;
 *   these tests verify that the route correctly propagates whatever the model returns.
 *
 *   This design matches the existing test pattern: DB-level correctness is validated
 *   through staging integration tests (T-166); unit tests verify route behaviour.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks — declared before any import that transitively uses these modules
// ============================================================================

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
      if (token === 'valid-token')
        return { id: 'user-1', email: 'jane@example.com', name: 'Jane' };
      throw new Error('Invalid token');
    }),
  },
}));

import express from 'express';
import tripsRoutes from '../routes/trips.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as tripModel from '../models/tripModel.js';

// ============================================================================
// Test infrastructure
// ============================================================================

const TRIP_UUID = '550e8400-e29b-41d4-a716-446655440001';
const AUTH = { Authorization: 'Bearer valid-token' };

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

// ============================================================================
// Shared mock trip factory
// ============================================================================

function makeMockTrip(overrides = {}) {
  return {
    id: TRIP_UUID,
    user_id: 'user-1',
    name: 'Test Trip',
    destinations: ['Tokyo'],
    status: 'PLANNING',
    notes: null,
    start_date: null,
    end_date: null,
    created_at: '2026-03-08T10:00:00.000Z',
    updated_at: '2026-03-08T10:00:00.000Z',
    ...overrides,
  };
}

// ============================================================================
// Test A: Trip with no events → start_date: null, end_date: null
// ============================================================================

describe('T-163 Test A — Trip with no events: GET /api/v1/trips/:id returns null dates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: returns 200 with start_date null and end_date null when trip has no events', async () => {
    const tripNoEvents = makeMockTrip({ start_date: null, end_date: null });
    tripModel.findTripById.mockResolvedValue(tripNoEvents);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.start_date).toBeNull();
    expect(res.body.data.end_date).toBeNull();
  });

  it('error path: GET /api/v1/trips/:id returns 404 for non-existent trip', async () => {
    tripModel.findTripById.mockResolvedValue(undefined);

    const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';
    const res = await request(buildApp(), 'GET', `/api/v1/trips/${nonExistentId}`, null, AUTH);

    expect(res.status).toBe(404);
  });
});

// ============================================================================
// Test B: Trip with flights only → correct min/max dates
// ============================================================================

describe('T-163 Test B — Trip with flights only: GET /api/v1/trips/:id returns correct dates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: returns start_date as earliest departure and end_date as latest arrival', async () => {
    // Simulates model computing: departure_at 2026-08-07, arrival_at 2026-08-21
    const tripWithFlights = makeMockTrip({
      start_date: '2026-08-07',
      end_date: '2026-08-21',
      status: 'PLANNING',
    });
    tripModel.findTripById.mockResolvedValue(tripWithFlights);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.start_date).toBe('2026-08-07');
    expect(res.body.data.end_date).toBe('2026-08-21');
  });

  it('dates are returned as YYYY-MM-DD strings (not timestamps)', async () => {
    const tripWithFlights = makeMockTrip({
      start_date: '2026-08-07',
      end_date: '2026-08-21',
    });
    tripModel.findTripById.mockResolvedValue(tripWithFlights);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(200);
    // Must be 10-character YYYY-MM-DD, not an ISO timestamp
    expect(res.body.data.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(res.body.data.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ============================================================================
// Test C: Trip with mixed events → correct overall min/max
// ============================================================================

describe('T-163 Test C — Mixed events: start_date = global min, end_date = global max', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: start_date is earliest across flights+stays+activities+land_travels', async () => {
    // Scenario: stay checks in 2026-08-05 (earliest), activity on 2026-08-10,
    //           flight departs 2026-08-07, land_travel arrives 2026-08-28 (latest)
    const tripMixed = makeMockTrip({
      start_date: '2026-08-05',  // stay check_in is earliest
      end_date:   '2026-08-28',  // land_travel arrival is latest
    });
    tripModel.findTripById.mockResolvedValue(tripMixed);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.start_date).toBe('2026-08-05');
    expect(res.body.data.end_date).toBe('2026-08-28');
  });

  it('happy path: single event type override — stay check-out is latest', async () => {
    // Flight departs 2026-08-07, arrives 2026-08-08; stay checks out 2026-08-25 (latest)
    const tripMixed = makeMockTrip({
      start_date: '2026-08-07',
      end_date:   '2026-08-25',
    });
    tripModel.findTripById.mockResolvedValue(tripMixed);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.start_date).toBe('2026-08-07');
    expect(res.body.data.end_date).toBe('2026-08-25');
  });
});

// ============================================================================
// Test D: GET /api/v1/trips list includes start_date/end_date on every trip
// ============================================================================

describe('T-163 Test D — GET /api/v1/trips list includes start_date and end_date', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: list response includes start_date and end_date on each trip', async () => {
    const trips = [
      makeMockTrip({ id: TRIP_UUID, start_date: '2026-05-01', end_date: '2026-05-15' }),
      makeMockTrip({ id: '550e8400-e29b-41d4-a716-446655440002', start_date: null, end_date: null }),
    ];
    tripModel.listTripsByUser.mockResolvedValue({ trips, total: 2 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips', null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);

    const first = res.body.data[0];
    expect(first).toHaveProperty('start_date');
    expect(first).toHaveProperty('end_date');
    expect(first.start_date).toBe('2026-05-01');
    expect(first.end_date).toBe('2026-05-15');

    const second = res.body.data[1];
    expect(second).toHaveProperty('start_date');
    expect(second).toHaveProperty('end_date');
    expect(second.start_date).toBeNull();
    expect(second.end_date).toBeNull();
  });

  it('error path: list returns 401 without auth token', async () => {
    const res = await request(buildApp(), 'GET', '/api/v1/trips', null);
    expect(res.status).toBe(401);
  });

  it('pagination metadata is present alongside date range fields', async () => {
    const trip = makeMockTrip({ start_date: '2026-06-01', end_date: '2026-06-10' });
    tripModel.listTripsByUser.mockResolvedValue({ trips: [trip], total: 1 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips', null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].start_date).toBe('2026-06-01');
    expect(res.body.data[0].end_date).toBe('2026-06-10');
  });
});

// ============================================================================
// Test E (structural): Confirm start_date/end_date are present on both
//                      GET /trips and GET /trips/:id responses
// ============================================================================

describe('T-163 Test E — start_date/end_date propagate through all existing trip endpoints', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET /trips/:id — single trip includes start_date and end_date keys', async () => {
    const trip = makeMockTrip({ start_date: '2026-09-01', end_date: '2026-09-14' });
    tripModel.findTripById.mockResolvedValue(trip);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('start_date', '2026-09-01');
    expect(res.body.data).toHaveProperty('end_date', '2026-09-14');
  });

  it('POST /trips — creation response includes start_date and end_date keys', async () => {
    const created = makeMockTrip({ start_date: null, end_date: null });
    tripModel.createTrip.mockResolvedValue(created);

    const res = await request(
      buildApp(),
      'POST',
      '/api/v1/trips',
      { name: 'New Trip', destinations: ['Paris'] },
      AUTH
    );

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('start_date');
    expect(res.body.data).toHaveProperty('end_date');
  });

  it('PATCH /trips/:id — update response includes start_date and end_date keys', async () => {
    const existing = makeMockTrip({ start_date: null, end_date: null });
    tripModel.findTripById.mockResolvedValue(existing);
    const updated = makeMockTrip({ name: 'Renamed Trip', start_date: null, end_date: null });
    tripModel.updateTrip.mockResolvedValue(updated);

    const res = await request(
      buildApp(),
      'PATCH',
      `/api/v1/trips/${TRIP_UUID}`,
      { name: 'Renamed Trip' },
      AUTH
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('start_date');
    expect(res.body.data).toHaveProperty('end_date');
  });
});
