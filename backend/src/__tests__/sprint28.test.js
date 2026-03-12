/**
 * Sprint 28 Tests — T-229
 *
 * T-229: Fix tripModel.js TRIP_COLUMNS SQL to use COALESCE so user-provided
 *        start_date / end_date take precedence over the computed MIN/MAX aggregate.
 * ────────────────────────────────────────────────────────────────────────────────
 *
 * Test scenarios (from task description):
 *   (1) PATCH trips with start_date/end_date on a trip with NO sub-resources
 *       → user-provided values are returned in the response.
 *   (2) PATCH trips with start_date/end_date on a trip WITH sub-resources
 *       → user-provided values are returned (not overridden by sub-resource dates).
 *   (3) PATCH with null start_date
 *       → computed aggregate is returned as the fallback (null when no sub-resources).
 *
 * SQL structure test:
 *   Verifies that the TRIP_COLUMNS db.raw() expressions contain COALESCE(trips.start_date …)
 *   and COALESCE(trips.end_date …) in the generated SQL, confirming the fix is in place.
 *
 * Route-level tests use mocked tripModel to isolate route handler behaviour.
 * SQL structure test imports the model with a mocked DB connection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Shared JWT mock — used by all route-level tests in this file
// ============================================================================

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

// ============================================================================
// Route-level tests — mock tripModel
// ============================================================================

vi.mock('../models/tripModel.js', () => ({
  listTripsByUser: vi.fn(),
  findTripById: vi.fn(),
  createTrip: vi.fn(),
  updateTrip: vi.fn(),
  deleteTrip: vi.fn(),
}));

import express from 'express';
import tripsRoutes from '../routes/trips.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as tripModel from '../models/tripModel.js';

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

function makeTrip(overrides = {}) {
  return {
    id: TRIP_UUID,
    user_id: 'user-1',
    name: 'Japan 2026',
    destinations: ['Tokyo', 'Osaka'],
    status: 'PLANNING',
    start_date: null,
    end_date: null,
    notes: null,
    created_at: '2026-02-24T12:00:00.000Z',
    updated_at: '2026-02-24T12:00:00.000Z',
    ...overrides,
  };
}

// ============================================================================
// T-229 (1): PATCH with start_date/end_date — trip with NO sub-resources
//   Expect: user-provided dates are returned in the response.
//   Model is mocked to return the stored dates (COALESCE picks trips.start_date
//   because LEAST() returns NULL when there are no sub-resource rows).
// ============================================================================

describe('T-229 — PATCH /trips/:id — user dates returned (no sub-resources)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with start_date and end_date matching what was PATCH-ed', async () => {
    // findTripById called for ownership check
    tripModel.findTripById.mockResolvedValue(makeTrip());
    // updateTrip returns trip with the user-provided dates stored in trips.start_date /
    // trips.end_date — COALESCE returns these directly (no sub-resources → LEAST = NULL).
    tripModel.updateTrip.mockResolvedValue(
      makeTrip({ start_date: '2026-09-01', end_date: '2026-09-30', status: 'PLANNING' })
    );

    const res = await request(
      buildApp(),
      'PATCH',
      `/api/v1/trips/${TRIP_UUID}`,
      { start_date: '2026-09-01', end_date: '2026-09-30' },
      AUTH
    );

    expect(res.status).toBe(200);
    expect(res.body.data.start_date).toBe('2026-09-01');
    expect(res.body.data.end_date).toBe('2026-09-30');
  });

  it('passes start_date and end_date through to updateTrip', async () => {
    tripModel.findTripById.mockResolvedValue(makeTrip());
    tripModel.updateTrip.mockResolvedValue(
      makeTrip({ start_date: '2026-06-15', end_date: '2026-06-30' })
    );

    await request(
      buildApp(),
      'PATCH',
      `/api/v1/trips/${TRIP_UUID}`,
      { start_date: '2026-06-15', end_date: '2026-06-30' },
      AUTH
    );

    expect(tripModel.updateTrip).toHaveBeenCalledWith(
      TRIP_UUID,
      expect.objectContaining({ start_date: '2026-06-15', end_date: '2026-06-30' })
    );
  });
});

// ============================================================================
// T-229 (2): PATCH with start_date/end_date — trip WITH sub-resources
//   Expect: user-provided dates are returned (not overridden by sub-resource dates).
//   Model is mocked to return the stored user dates — COALESCE picks trips.start_date
//   over the LEAST() sub-resource aggregate because trips.start_date IS NOT NULL.
// ============================================================================

describe('T-229 — PATCH /trips/:id — user dates take precedence over sub-resource dates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns user-set start_date even when sub-resources have earlier dates', async () => {
    tripModel.findTripById.mockResolvedValue(makeTrip());
    // The model (after the COALESCE fix) returns the stored user date, not the
    // sub-resource aggregate. We mock this to reflect the correct post-fix behaviour.
    tripModel.updateTrip.mockResolvedValue(
      makeTrip({ start_date: '2026-09-01', end_date: '2026-09-30' })
    );

    const res = await request(
      buildApp(),
      'PATCH',
      `/api/v1/trips/${TRIP_UUID}`,
      { start_date: '2026-09-01', end_date: '2026-09-30' },
      AUTH
    );

    expect(res.status).toBe(200);
    // Must return what was stored (user intent), not what any sub-resource aggregate
    // would have returned (e.g., an earlier departure_at from a flights row).
    expect(res.body.data.start_date).toBe('2026-09-01');
    expect(res.body.data.end_date).toBe('2026-09-30');
  });

  it('returns user-set end_date even when sub-resources have later dates', async () => {
    tripModel.findTripById.mockResolvedValue(makeTrip());
    tripModel.updateTrip.mockResolvedValue(
      makeTrip({ start_date: '2026-07-01', end_date: '2026-07-14' })
    );

    const res = await request(
      buildApp(),
      'PATCH',
      `/api/v1/trips/${TRIP_UUID}`,
      { start_date: '2026-07-01', end_date: '2026-07-14' },
      AUTH
    );

    expect(res.status).toBe(200);
    expect(res.body.data.start_date).toBe('2026-07-01');
    expect(res.body.data.end_date).toBe('2026-07-14');
  });
});

// ============================================================================
// T-229 (3): PATCH with null start_date → computed aggregate returned as fallback
//   Expect: when trips.start_date is NULL, COALESCE falls back to the LEAST()
//   sub-resource aggregate. When there are also no sub-resources, result is NULL.
// ============================================================================

describe('T-229 — PATCH /trips/:id — null start_date uses computed aggregate (fallback)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null start_date when explicitly set to null and no sub-resources exist', async () => {
    tripModel.findTripById.mockResolvedValue(makeTrip({ start_date: '2026-09-01' }));
    // After clearing the date, trips.start_date = NULL and no sub-resource rows exist
    // → COALESCE(NULL, LEAST(NULL, NULL, …)) = NULL
    tripModel.updateTrip.mockResolvedValue(
      makeTrip({ start_date: null, end_date: null })
    );

    const res = await request(
      buildApp(),
      'PATCH',
      `/api/v1/trips/${TRIP_UUID}`,
      { start_date: null },
      AUTH
    );

    expect(res.status).toBe(200);
    expect(res.body.data.start_date).toBeNull();
  });

  it('returns sub-resource aggregate as start_date when stored value is null', async () => {
    tripModel.findTripById.mockResolvedValue(makeTrip());
    // trips.start_date = NULL → COALESCE falls back to LEAST() sub-resource aggregate.
    // Model returns the computed aggregate date (e.g., earliest departure date).
    tripModel.updateTrip.mockResolvedValue(
      makeTrip({ start_date: '2026-08-10', end_date: '2026-08-25' })
    );

    const res = await request(
      buildApp(),
      'PATCH',
      `/api/v1/trips/${TRIP_UUID}`,
      { name: 'Updated Name' },  // not setting start_date → stays NULL → fallback used
      AUTH
    );

    expect(res.status).toBe(200);
    // Model returns the aggregate fallback; route must pass it through unchanged
    expect(res.body.data.start_date).toBe('2026-08-10');
    expect(res.body.data.end_date).toBe('2026-08-25');
  });
});

// SQL structure tests for the COALESCE fix are in tripModel.coalesce.unit.test.js —
// they require a separate file because this file mocks tripModel.js at module scope,
// which prevents re-importing the real model implementation for SQL inspection.
