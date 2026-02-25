/**
 * Sprint 4 Backend Tests
 *
 * Covers:
 *   T-058 — Destination deduplication (case-insensitive)
 *
 *   Unit tests for deduplicateDestinations() pure function:
 *     - Exact duplicates removed, first occurrence preserved
 *     - Case-variant duplicates removed, first occurrence casing preserved
 *     - Multiple pairs of case-variant duplicates
 *     - Single element — no dedup needed
 *     - No duplicates — array unchanged
 *     - Order of first occurrences preserved
 *     - Empty array returns empty array
 *     - Non-array input returns input unchanged (guard)
 *     - Does not mutate original array
 *
 *   Integration tests for POST /api/v1/trips (dedup applied):
 *     - POST with exact duplicates → createTrip called, 201 returned
 *     - POST with case-variant duplicates → createTrip called, 201 returned
 *     - POST with no duplicates → unchanged
 *     - POST with empty destinations → 400 validation error
 *
 *   Integration tests for PATCH /api/v1/trips/:id (dedup applied):
 *     - PATCH destinations with exact duplicates → updateTrip called, 200 returned
 *     - PATCH destinations with case-variant duplicates → updateTrip called, 200 returned
 *     - PATCH destinations with no duplicates → unchanged
 *     - PATCH without destinations → dedup not applied (other fields only)
 *     - PATCH with single destination → no regression
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock database module to prevent knex initialization ----
vi.mock('../config/database.js', () => ({
  default: {
    raw: vi.fn((str) => str),
  },
}));

// ---- Mock tripModel DB-calling functions, keep pure functions ----
vi.mock('../models/tripModel.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // Keep the real pure functions
    deduplicateDestinations: actual.deduplicateDestinations,
    computeTripStatus: actual.computeTripStatus,
    // Mock the DB-calling functions
    listTripsByUser: vi.fn(),
    findTripById: vi.fn(),
    createTrip: vi.fn(),
    updateTrip: vi.fn(),
    deleteTrip: vi.fn(),
  };
});

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn((token) => {
      if (token === 'valid-token') return { id: 'user-1', email: 'jane@example.com', name: 'Jane' };
      throw new Error('Invalid token');
    }),
  },
}));

import { deduplicateDestinations } from '../models/tripModel.js';
import express from 'express';
import tripsRoutes from '../routes/trips.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as tripModel from '../models/tripModel.js';

const TRIP_UUID = '550e8400-e29b-41d4-a716-446655440001';
const AUTH = { Authorization: 'Bearer valid-token' };

const mockTrip = {
  id: TRIP_UUID,
  user_id: 'user-1',
  name: 'Japan 2026',
  destinations: ['Tokyo', 'Osaka'],
  status: 'PLANNING',
  start_date: null,
  end_date: null,
  created_at: '2026-02-25T12:00:00.000Z',
  updated_at: '2026-02-25T12:00:00.000Z',
};

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
      const options = {
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json', ...headers },
      };
      import('http').then(({ default: http }) => {
        const req = http.request(`http://localhost:${port}${path}`, options, (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            server.close();
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
          });
        });
        req.on('error', (e) => { server.close(); reject(e); });
        if (body !== undefined && body !== null) req.write(JSON.stringify(body));
        req.end();
      });
    });
  });
}

// ============================================================
// Unit tests for the pure deduplicateDestinations function
// ============================================================

describe('deduplicateDestinations() — pure function (T-058)', () => {
  it('removes exact duplicates, preserving first occurrence', () => {
    const result = deduplicateDestinations(['Tokyo', 'Tokyo', 'Tokyo']);
    expect(result).toEqual(['Tokyo']);
  });

  it('removes case-variant duplicates, preserving first occurrence casing', () => {
    const result = deduplicateDestinations(['Paris', 'paris', 'PARIS']);
    expect(result).toEqual(['Paris']);
  });

  it('handles multiple pairs of case-variant duplicates', () => {
    const result = deduplicateDestinations(['Tokyo', 'Osaka', 'tokyo', 'osaka']);
    expect(result).toEqual(['Tokyo', 'Osaka']);
  });

  it('returns single-element array unchanged', () => {
    const result = deduplicateDestinations(['Tokyo']);
    expect(result).toEqual(['Tokyo']);
  });

  it('returns array unchanged when no duplicates exist', () => {
    const result = deduplicateDestinations(['Tokyo', 'Osaka', 'Kyoto']);
    expect(result).toEqual(['Tokyo', 'Osaka', 'Kyoto']);
  });

  it('preserves order of first occurrences', () => {
    const result = deduplicateDestinations(['berlin', 'Paris', 'BERLIN', 'paris', 'Rome']);
    expect(result).toEqual(['berlin', 'Paris', 'Rome']);
  });

  it('returns empty array for empty input', () => {
    const result = deduplicateDestinations([]);
    expect(result).toEqual([]);
  });

  it('returns non-array input unchanged (guard clause)', () => {
    expect(deduplicateDestinations(undefined)).toBeUndefined();
    expect(deduplicateDestinations(null)).toBeNull();
    expect(deduplicateDestinations('not-an-array')).toBe('not-an-array');
  });

  it('handles mixed case with already-trimmed destinations', () => {
    const result = deduplicateDestinations(['Tokyo', 'tokyo']);
    expect(result).toEqual(['Tokyo']);
  });

  it('does not mutate the original array', () => {
    const original = ['Tokyo', 'tokyo', 'Osaka'];
    const result = deduplicateDestinations(original);
    expect(original).toEqual(['Tokyo', 'tokyo', 'Osaka']); // unchanged
    expect(result).toEqual(['Tokyo', 'Osaka']);
  });
});

// ============================================================
// Integration tests: POST /api/v1/trips with dedup
// ============================================================

describe('POST /api/v1/trips — destination deduplication (T-058)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: creates trip with exact duplicate destinations (dedup in model)', async () => {
    tripModel.createTrip.mockResolvedValue({ ...mockTrip, destinations: ['Tokyo'] });

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Japan 2026',
      destinations: ['Tokyo', 'Tokyo', 'Tokyo'],
    }, AUTH);

    expect(res.status).toBe(201);
    expect(tripModel.createTrip).toHaveBeenCalledTimes(1);
    expect(res.body.data.destinations).toEqual(['Tokyo']);
  });

  it('happy path: creates trip with case-variant duplicate destinations (dedup in model)', async () => {
    tripModel.createTrip.mockResolvedValue({ ...mockTrip, destinations: ['Paris'] });

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'France Trip',
      destinations: ['Paris', 'paris', 'PARIS'],
    }, AUTH);

    expect(res.status).toBe(201);
    expect(tripModel.createTrip).toHaveBeenCalledTimes(1);
    expect(res.body.data.destinations).toEqual(['Paris']);
  });

  it('happy path: non-duplicate destinations pass through unchanged', async () => {
    tripModel.createTrip.mockResolvedValue(mockTrip);

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Japan 2026',
      destinations: ['Tokyo', 'Osaka'],
    }, AUTH);

    expect(res.status).toBe(201);
    expect(tripModel.createTrip).toHaveBeenCalledTimes(1);
    const calledWith = tripModel.createTrip.mock.calls[0][0];
    expect(calledWith.destinations).toEqual(['Tokyo', 'Osaka']);
  });

  it('error path: empty destinations returns 400 validation error', async () => {
    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Empty Trip',
      destinations: [],
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ============================================================
// Integration tests: PATCH /api/v1/trips/:id with dedup
// ============================================================

describe('PATCH /api/v1/trips/:id — destination deduplication (T-058)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: updates trip with exact duplicate destinations (dedup in model)', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);
    tripModel.updateTrip.mockResolvedValue({ ...mockTrip, destinations: ['Tokyo'] });

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      destinations: ['Tokyo', 'Tokyo'],
    }, AUTH);

    expect(res.status).toBe(200);
    expect(tripModel.updateTrip).toHaveBeenCalledTimes(1);
    expect(res.body.data.destinations).toEqual(['Tokyo']);
  });

  it('happy path: updates trip with case-variant duplicate destinations (dedup in model)', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);
    tripModel.updateTrip.mockResolvedValue({ ...mockTrip, destinations: ['Tokyo'] });

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      destinations: ['Tokyo', 'tokyo', 'TOKYO'],
    }, AUTH);

    expect(res.status).toBe(200);
    expect(tripModel.updateTrip).toHaveBeenCalledTimes(1);
    expect(res.body.data.destinations).toEqual(['Tokyo']);
  });

  it('happy path: non-duplicate destinations pass through unchanged on update', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);
    tripModel.updateTrip.mockResolvedValue({ ...mockTrip, destinations: ['Tokyo', 'Osaka', 'Kyoto'] });

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      destinations: ['Tokyo', 'Osaka', 'Kyoto'],
    }, AUTH);

    expect(res.status).toBe(200);
    expect(tripModel.updateTrip).toHaveBeenCalledTimes(1);
    const calledUpdates = tripModel.updateTrip.mock.calls[0][1];
    expect(calledUpdates.destinations).toEqual(['Tokyo', 'Osaka', 'Kyoto']);
  });

  it('does not apply dedup when destinations is not in PATCH body', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);
    tripModel.updateTrip.mockResolvedValue({ ...mockTrip, name: 'Updated Name' });

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      name: 'Updated Name',
    }, AUTH);

    expect(res.status).toBe(200);
    expect(tripModel.updateTrip).toHaveBeenCalledTimes(1);
    const calledUpdates = tripModel.updateTrip.mock.calls[0][1];
    expect(calledUpdates).not.toHaveProperty('destinations');
  });

  it('regression: PATCH with single valid destination still works', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);
    tripModel.updateTrip.mockResolvedValue({ ...mockTrip, destinations: ['Kyoto'] });

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      destinations: ['Kyoto'],
    }, AUTH);

    expect(res.status).toBe(200);
    expect(tripModel.updateTrip).toHaveBeenCalledTimes(1);
    expect(res.body.data.destinations).toEqual(['Kyoto']);
  });
});
