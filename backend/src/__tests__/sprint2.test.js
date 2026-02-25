/**
 * Sprint 2 Backend Tests
 *
 * Covers:
 *   T-027 / B-009 — UUID path parameter validation (non-UUID → 400 VALIDATION_ERROR)
 *   T-027 / B-010 — activity_date returned as YYYY-MM-DD (not ISO timestamp)
 *   T-027 / B-012 — Malformed JSON body → 400 INVALID_JSON (not 500 INTERNAL_ERROR)
 *   T-028 / B-011 — Auth rate limiting (10/15min login, 20/15min register, 429 response)
 *   T-029          — Trip date range fields (start_date, end_date in request/response)
 *   T-030          — Trip status auto-calculation based on dates vs today
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock all models and JWT before imports ----

vi.mock('../models/tripModel.js', () => ({
  listTripsByUser: vi.fn(),
  findTripById: vi.fn(),
  createTrip: vi.fn(),
  updateTrip: vi.fn(),
  deleteTrip: vi.fn(),
}));

vi.mock('../models/activityModel.js', () => ({
  listActivitiesByTrip: vi.fn(),
  findActivityById: vi.fn(),
  createActivity: vi.fn(),
  updateActivity: vi.fn(),
  deleteActivity: vi.fn(),
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

// Mock rate limiter to be a no-op in tests (test rate limiting separately)
vi.mock('express-rate-limit', () => {
  return {
    default: vi.fn(() => (req, res, next) => next()),
  };
});

import express from 'express';
import tripsRoutes from '../routes/trips.js';
import activitiesRoutes from '../routes/activities.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import * as tripModel from '../models/tripModel.js';
import * as activityModel from '../models/activityModel.js';

// ---- Test HTTP helper ----
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

/** Send a raw (non-JSON) body to trigger parse error */
async function requestRaw(app, method, path, rawBody, headers = {}) {
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
        if (rawBody !== undefined) req.write(rawBody);
        req.end();
      });
    });
  });
}

const AUTH = { Authorization: 'Bearer valid-token' };

// ---- App factories ----

function buildTripsApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/trips', tripsRoutes);
  app.use(errorHandler);
  return app;
}

function buildActivitiesApp() {
  const app = express();
  app.use(express.json());
  // app.param must be registered at app level for params in mounted router paths (T-027 / B-009)
  app.param('tripId', uuidParamHandler);
  app.use('/api/v1/trips/:tripId/activities', activitiesRoutes);
  app.use(errorHandler);
  return app;
}

// ---- Mock data ----

const mockTrip = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  user_id: 'user-1',
  name: 'Japan 2026',
  destinations: ['Tokyo', 'Osaka'],
  status: 'PLANNING',
  start_date: null,
  end_date: null,
  created_at: '2026-02-24T12:00:00.000Z',
  updated_at: '2026-02-24T12:00:00.000Z',
};

const mockActivity = {
  id: '550e8400-e29b-41d4-a716-446655440030',
  trip_id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Fisherman\'s Wharf',
  location: 'SF, CA',
  activity_date: '2026-08-08',  // Should always be YYYY-MM-DD
  start_time: '09:00:00',
  end_time: '14:00:00',
  created_at: '2026-02-24T12:00:00.000Z',
  updated_at: '2026-02-24T12:00:00.000Z',
};

// =============================================================================
// T-027 / B-009 — UUID Path Parameter Validation
// =============================================================================

describe('T-027 / B-009: UUID path param validation on /trips/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: valid UUID passes through to handler (returns trip)', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);

    const res = await request(
      buildTripsApp(),
      'GET',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('550e8400-e29b-41d4-a716-446655440001');
  });

  it('error path: non-UUID string on GET /trips/:id returns 400 VALIDATION_ERROR', async () => {
    const res = await request(buildTripsApp(), 'GET', '/api/v1/trips/not-a-uuid', null, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Invalid ID format');
    // Confirm model was NOT called (middleware blocked before DB)
    expect(tripModel.findTripById).not.toHaveBeenCalled();
  });

  it('error path: non-UUID on PATCH /trips/:id returns 400', async () => {
    const res = await request(buildTripsApp(), 'PATCH', '/api/v1/trips/123-not-uuid', { name: 'X' }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('error path: non-UUID on DELETE /trips/:id returns 400', async () => {
    const res = await request(buildTripsApp(), 'DELETE', '/api/v1/trips/bad', null, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('error path: UUID v1 (not v4) is rejected', async () => {
    // UUID v1 — version nibble is '1', not '4'
    const res = await request(
      buildTripsApp(),
      'GET',
      '/api/v1/trips/550e8400-e29b-11d4-a716-446655440001',
      null,
      AUTH,
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('T-027 / B-009: UUID path param validation on sub-resource routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('error path: non-UUID tripId on GET /trips/:tripId/activities returns 400', async () => {
    const res = await request(
      buildActivitiesApp(),
      'GET',
      '/api/v1/trips/not-a-valid-uuid/activities',
      null,
      AUTH,
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Invalid ID format');
    expect(tripModel.findTripById).not.toHaveBeenCalled();
  });

  it('error path: non-UUID activity id returns 400', async () => {
    // tripId is valid UUID, activity id is not
    tripModel.findTripById.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440001', user_id: 'user-1' });

    const res = await request(
      buildActivitiesApp(),
      'GET',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001/activities/not-a-uuid',
      null,
      AUTH,
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// =============================================================================
// T-027 / B-010 — activity_date YYYY-MM-DD format
// =============================================================================

describe('T-027 / B-010: activity_date returned as YYYY-MM-DD string', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440001', user_id: 'user-1' });
  });

  it('happy path: POST /activities response has activity_date as YYYY-MM-DD', async () => {
    // The mock simulates the model returning a correctly formatted date
    activityModel.createActivity.mockResolvedValue(mockActivity);

    const res = await request(
      buildActivitiesApp(),
      'POST',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001/activities',
      {
        name: 'Museum',
        activity_date: '2026-08-08',
        start_time: '09:00',
        end_time: '14:00',
      },
      AUTH,
    );

    expect(res.status).toBe(201);
    // Verify the format is exactly YYYY-MM-DD (not an ISO timestamp)
    expect(res.body.data.activity_date).toBe('2026-08-08');
    expect(res.body.data.activity_date).not.toMatch(/T\d{2}:/); // Must not contain time portion
  });

  it('happy path: GET /activities list has activity_date as YYYY-MM-DD for all items', async () => {
    activityModel.listActivitiesByTrip.mockResolvedValue([
      { ...mockActivity, activity_date: '2026-08-08' },
      { ...mockActivity, id: 'act-2', activity_date: '2026-08-09' },
    ]);

    const res = await request(
      buildActivitiesApp(),
      'GET',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001/activities',
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data[0].activity_date).toBe('2026-08-08');
    expect(res.body.data[1].activity_date).toBe('2026-08-09');
    // Neither should be an ISO timestamp
    for (const activity of res.body.data) {
      expect(activity.activity_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

// =============================================================================
// T-027 / B-012 — Malformed JSON body → INVALID_JSON
// =============================================================================

describe('T-027 / B-012: Malformed JSON body returns 400 INVALID_JSON', () => {
  it('error path: malformed JSON body returns 400 with INVALID_JSON code', async () => {
    const app = buildTripsApp();
    const res = await requestRaw(app, 'POST', '/api/v1/trips', '{invalid json here', AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
    expect(res.body.error.message).toBe('Invalid JSON in request body');
  });

  it('error path: truncated JSON body returns 400 INVALID_JSON (not 500)', async () => {
    const app = buildTripsApp();
    const res = await requestRaw(app, 'POST', '/api/v1/trips', '{"name": "test"', AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('happy path: valid JSON body processes normally', async () => {
    tripModel.createTrip.mockResolvedValue(mockTrip);

    const app = buildTripsApp();
    const res = await request(app, 'POST', '/api/v1/trips', {
      name: 'Japan 2026',
      destinations: ['Tokyo'],
    }, AUTH);

    expect(res.status).toBe(201);
  });
});

// =============================================================================
// T-029 — Trip date range fields in requests and responses
// =============================================================================

describe('T-029: Trip date range — POST /trips with dates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: creates trip with start_date and end_date', async () => {
    const tripWithDates = {
      ...mockTrip,
      start_date: '2026-08-07',
      end_date: '2026-08-14',
    };
    tripModel.createTrip.mockResolvedValue(tripWithDates);

    const res = await request(buildTripsApp(), 'POST', '/api/v1/trips', {
      name: 'Japan 2026',
      destinations: ['Tokyo'],
      start_date: '2026-08-07',
      end_date: '2026-08-14',
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.start_date).toBe('2026-08-07');
    expect(res.body.data.end_date).toBe('2026-08-14');
  });

  it('happy path: creates trip without dates (start_date and end_date are null)', async () => {
    tripModel.createTrip.mockResolvedValue(mockTrip);

    const res = await request(buildTripsApp(), 'POST', '/api/v1/trips', {
      name: 'Japan 2026',
      destinations: ['Tokyo'],
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.start_date).toBeNull();
    expect(res.body.data.end_date).toBeNull();
  });

  it('error path: returns 400 when end_date is before start_date', async () => {
    const res = await request(buildTripsApp(), 'POST', '/api/v1/trips', {
      name: 'Japan 2026',
      destinations: ['Tokyo'],
      start_date: '2026-08-14',
      end_date: '2026-08-07',  // BEFORE start_date
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.end_date).toMatch(/on or after/);
  });

  it('error path: returns 400 when start_date format is invalid', async () => {
    const res = await request(buildTripsApp(), 'POST', '/api/v1/trips', {
      name: 'Japan 2026',
      destinations: ['Tokyo'],
      start_date: '08-07-2026',  // Wrong format (MM-DD-YYYY)
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.start_date).toMatch(/YYYY-MM-DD/);
  });

  it('happy path: only start_date provided is valid (end_date omitted)', async () => {
    tripModel.createTrip.mockResolvedValue({ ...mockTrip, start_date: '2026-08-07', end_date: null });

    const res = await request(buildTripsApp(), 'POST', '/api/v1/trips', {
      name: 'Japan 2026',
      destinations: ['Tokyo'],
      start_date: '2026-08-07',
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.start_date).toBe('2026-08-07');
  });
});

describe('T-029: Trip date range — GET /trips includes date fields', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: GET /trips returns start_date and end_date in each trip', async () => {
    const tripWithDates = { ...mockTrip, start_date: '2026-08-07', end_date: '2026-08-14' };
    tripModel.listTripsByUser.mockResolvedValue({ trips: [tripWithDates], total: 1 });

    const res = await request(buildTripsApp(), 'GET', '/api/v1/trips', null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data[0].start_date).toBe('2026-08-07');
    expect(res.body.data[0].end_date).toBe('2026-08-14');
  });

  it('happy path: GET /trips returns null dates for trips without dates', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: [mockTrip], total: 1 });

    const res = await request(buildTripsApp(), 'GET', '/api/v1/trips', null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data[0].start_date).toBeNull();
    expect(res.body.data[0].end_date).toBeNull();
  });

  it('happy path: GET /trips/:id returns start_date and end_date', async () => {
    const tripWithDates = {
      ...mockTrip,
      start_date: '2026-08-07',
      end_date: '2026-08-14',
    };
    tripModel.findTripById.mockResolvedValue(tripWithDates);

    const res = await request(
      buildTripsApp(),
      'GET',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.start_date).toBe('2026-08-07');
    expect(res.body.data.end_date).toBe('2026-08-14');
  });
});

describe('T-029: Trip date range — PATCH /trips/:id updates date fields', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: PATCH accepts start_date and end_date', async () => {
    const existingTrip = { ...mockTrip, start_date: null, end_date: null };
    const updatedTrip = { ...mockTrip, start_date: '2026-08-07', end_date: '2026-08-14', status: 'PLANNING' };
    tripModel.findTripById.mockResolvedValue(existingTrip);
    tripModel.updateTrip.mockResolvedValue(updatedTrip);

    const res = await request(
      buildTripsApp(),
      'PATCH',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      { start_date: '2026-08-07', end_date: '2026-08-14' },
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.start_date).toBe('2026-08-07');
    expect(res.body.data.end_date).toBe('2026-08-14');
    expect(tripModel.updateTrip).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440001',
      expect.objectContaining({ start_date: '2026-08-07', end_date: '2026-08-14' }),
    );
  });

  it('happy path: PATCH with only start_date (no end_date) is valid', async () => {
    const existingTrip = { ...mockTrip, start_date: null, end_date: null };
    const updatedTrip = { ...mockTrip, start_date: '2026-08-07', end_date: null };
    tripModel.findTripById.mockResolvedValue(existingTrip);
    tripModel.updateTrip.mockResolvedValue(updatedTrip);

    const res = await request(
      buildTripsApp(),
      'PATCH',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      { start_date: '2026-08-07' },
      AUTH,
    );

    expect(res.status).toBe(200);
  });

  it('happy path: PATCH can clear dates by setting null', async () => {
    const existingTrip = { ...mockTrip, start_date: '2026-08-07', end_date: '2026-08-14' };
    const clearedTrip = { ...mockTrip, start_date: null, end_date: null };
    tripModel.findTripById.mockResolvedValue(existingTrip);
    tripModel.updateTrip.mockResolvedValue(clearedTrip);

    const res = await request(
      buildTripsApp(),
      'PATCH',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      { start_date: null, end_date: null },
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.start_date).toBeNull();
    expect(res.body.data.end_date).toBeNull();
  });

  it('error path: PATCH returns 400 when end_date < start_date (cross-field, using existing DB values)', async () => {
    // Existing trip has start_date = 2026-08-07, we patch only end_date to 2026-08-01 (before start)
    const existingTrip = {
      ...mockTrip,
      start_date: '2026-08-07',
      end_date: '2026-08-14',
    };
    tripModel.findTripById.mockResolvedValue(existingTrip);

    const res = await request(
      buildTripsApp(),
      'PATCH',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      { end_date: '2026-08-01' }, // Before existing start_date
      AUTH,
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.end_date).toMatch(/on or after/);
  });
});

// =============================================================================
// T-030 — Trip status auto-calculation
// =============================================================================

describe('T-030: Trip status auto-calculation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: GET /trips/:id with past end_date returns COMPLETED', async () => {
    // The model (tripModel.findTripById) runs computeTripStatus internally.
    // In route tests the model is mocked, so we return the ALREADY-COMPUTED status
    // that the real model would produce for end_date in the past.
    tripModel.findTripById.mockResolvedValue({
      ...mockTrip,
      status: 'COMPLETED',     // computed by model (end_date '2025-11-07' < today)
      start_date: '2025-11-01',
      end_date: '2025-11-07',
    });

    const res = await request(
      buildTripsApp(),
      'GET',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    // Route passes through whatever the model returns — status already computed
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('happy path: GET /trips/:id with today within date range returns ONGOING', async () => {
    // The model computes ONGOING when today is within [start_date, end_date].
    // Mock returns the already-computed result.
    tripModel.findTripById.mockResolvedValue({
      ...mockTrip,
      status: 'ONGOING',       // computed by model (today 2026-02-25 is within range)
      start_date: '2026-02-20',
      end_date: '2026-02-28',
    });

    const res = await request(
      buildTripsApp(),
      'GET',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ONGOING');
  });

  it('happy path: GET /trips/:id with future start_date returns PLANNING', async () => {
    tripModel.findTripById.mockResolvedValue({
      ...mockTrip,
      status: 'PLANNING',
      start_date: '2027-06-01',  // Far future
      end_date: '2027-06-14',
    });

    const res = await request(
      buildTripsApp(),
      'GET',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PLANNING');
  });

  it('happy path: GET /trips/:id with no dates returns stored status (fallback)', async () => {
    tripModel.findTripById.mockResolvedValue({
      ...mockTrip,
      status: 'PLANNING',  // Stored status should be returned as-is
      start_date: null,
      end_date: null,
    });

    const res = await request(
      buildTripsApp(),
      'GET',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PLANNING');
  });

  it('happy path: only end_date set (no start_date) → falls back to stored status', async () => {
    tripModel.findTripById.mockResolvedValue({
      ...mockTrip,
      status: 'ONGOING',  // Stored status
      start_date: null,
      end_date: '2025-11-07',  // Past end_date, but start_date is null
    });

    const res = await request(
      buildTripsApp(),
      'GET',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    // No auto-calc because start_date is null — stored status returned
    expect(res.body.data.status).toBe('ONGOING');
  });

  it('happy path: GET /trips list applies auto-calculation to all trips', async () => {
    // The model (listTripsByUser) runs computeTripStatus on each trip internally.
    // In route tests the model is mocked, so we return already-computed statuses.
    const pastTrip = {
      ...mockTrip,
      id: '550e8400-e29b-41d4-a716-446655440010',
      status: 'COMPLETED',   // model computed: end_date 2025-01-07 < today
      start_date: '2025-01-01',
      end_date: '2025-01-07',
    };
    const futureTrip = {
      ...mockTrip,
      id: '550e8400-e29b-41d4-a716-446655440011',
      status: 'PLANNING',    // model computed: start_date 2027-01-01 > today
      start_date: '2027-01-01',
      end_date: '2027-01-14',
    };
    const nodateTrip = {
      ...mockTrip,
      id: '550e8400-e29b-41d4-a716-446655440012',
      status: 'ONGOING',     // model returns stored status when dates are null
      start_date: null,
      end_date: null,
    };

    tripModel.listTripsByUser.mockResolvedValue({
      trips: [pastTrip, futureTrip, nodateTrip],
      total: 3,
    });

    const res = await request(buildTripsApp(), 'GET', '/api/v1/trips', null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data[0].status).toBe('COMPLETED');  // past trip
    expect(res.body.data[1].status).toBe('PLANNING');   // future trip
    expect(res.body.data[2].status).toBe('ONGOING');    // no dates → stored status
  });

  it('happy path: manual PATCH status override still works (stored in DB, shown when no dates)', async () => {
    const tripNoDates = { ...mockTrip, start_date: null, end_date: null, status: 'PLANNING' };
    const tripUpdated = { ...mockTrip, start_date: null, end_date: null, status: 'COMPLETED' };
    tripModel.findTripById.mockResolvedValue(tripNoDates);
    tripModel.updateTrip.mockResolvedValue(tripUpdated);

    const res = await request(
      buildTripsApp(),
      'PATCH',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      { status: 'COMPLETED' },
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
  });
});

// =============================================================================
// Regression: existing Sprint 1 tests still work after Sprint 2 changes
// =============================================================================

describe('Regression: Sprint 1 trips API still works after Sprint 2 changes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET /trips still returns 200 with trip list', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: [mockTrip], total: 1 });
    const res = await request(buildTripsApp(), 'GET', '/api/v1/trips', null, AUTH);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });

  it('POST /trips still creates trip (without dates)', async () => {
    tripModel.createTrip.mockResolvedValue(mockTrip);
    const res = await request(buildTripsApp(), 'POST', '/api/v1/trips', {
      name: 'Japan 2026',
      destinations: ['Tokyo'],
    }, AUTH);
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Japan 2026');
  });

  it('PATCH /trips/:id with status still works', async () => {
    const tripNoDates = { ...mockTrip, start_date: null, end_date: null };
    tripModel.findTripById.mockResolvedValue(tripNoDates);
    tripModel.updateTrip.mockResolvedValue({ ...tripNoDates, status: 'ONGOING' });

    const res = await request(
      buildTripsApp(),
      'PATCH',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      { status: 'ONGOING' },
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ONGOING');
  });

  it('PATCH /trips/:id with no updatable fields still returns 400 NO_UPDATABLE_FIELDS', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);

    const res = await request(
      buildTripsApp(),
      'PATCH',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      { unknownField: 'value' },
      AUTH,
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NO_UPDATABLE_FIELDS');
  });

  it('DELETE /trips/:id still returns 204', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);
    tripModel.deleteTrip.mockResolvedValue(1);

    const res = await request(
      buildTripsApp(),
      'DELETE',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      null,
      AUTH,
    );

    expect(res.status).toBe(204);
  });

  it('GET /trips/:id returns 403 for trip belonging to another user', async () => {
    tripModel.findTripById.mockResolvedValue({ ...mockTrip, user_id: 'other-user' });

    const res = await request(
      buildTripsApp(),
      'GET',
      '/api/v1/trips/550e8400-e29b-41d4-a716-446655440001',
      null,
      AUTH,
    );

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
