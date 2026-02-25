/**
 * Sprint 3 Backend Tests
 *
 * Covers:
 *   T-043 — Optional activity times (start_time / end_time nullable)
 *     - POST: create "all day" activity (both times null/omitted) → 201
 *     - POST: create timed activity (both times provided) → 201 (regression)
 *     - POST: only start_time provided (no end_time) → 400 linked validation error on end_time
 *     - POST: only end_time provided (no start_time) → 400 linked validation error on start_time
 *     - POST: end_time before start_time → 400 (existing rule still applies)
 *     - POST: explicit null for both times → 201 "all day"
 *     - GET: timeless activity returns null start_time/end_time
 *     - GET: list includes both timed and timeless activities
 *     - PATCH: convert timed activity to "all day" (set both to null) → 200
 *     - PATCH: convert "all day" activity to timed (provide both times) → 200
 *     - PATCH: only start_time on timeless activity → 400 (merged: start=value, end=null)
 *     - PATCH: only start_time on timed activity → 200 (merged: start=new, end=existing)
 *     - PATCH: only end_time null on timed activity → 400 (merged: start=existing, end=null)
 *     - PATCH: start_time null alone on timed activity → 400 (merged: start=null, end=existing)
 *     - DELETE: timeless activity → 204 (same as timed)
 *     - Regression: existing timed activity tests still pass
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock all models and JWT before imports ----

vi.mock('../models/tripModel.js', () => ({
  findTripById: vi.fn(),
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
    verify: vi.fn((token) => {
      if (token === 'valid-token') return { id: 'user-1', email: 'jane@example.com', name: 'Jane' };
      throw new Error('Invalid token');
    }),
  },
}));

import express from 'express';
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

const AUTH = { Authorization: 'Bearer valid-token' };

function buildApp() {
  const app = express();
  app.use(express.json());
  app.param('tripId', uuidParamHandler);
  app.use('/api/v1/trips/:tripId/activities', activitiesRoutes);
  app.use(errorHandler);
  return app;
}

// ---- Mock data ----

const TRIP_UUID = '550e8400-e29b-41d4-a716-446655440001';
const ACTIVITY_UUID = '550e8400-e29b-41d4-a716-446655440030';
const ACTIVITY_UUID_2 = '550e8400-e29b-41d4-a716-446655440031';

const mockTrip = {
  id: TRIP_UUID,
  user_id: 'user-1',
  name: 'Test Trip',
  destinations: ['Tokyo'],
  status: 'PLANNING',
  start_date: null,
  end_date: null,
};

const mockTimedActivity = {
  id: ACTIVITY_UUID,
  trip_id: TRIP_UUID,
  name: "Fisherman's Wharf",
  location: 'SF, CA',
  activity_date: '2026-08-08',
  start_time: '09:00:00',
  end_time: '14:00:00',
  created_at: '2026-02-25T12:00:00.000Z',
  updated_at: '2026-02-25T12:00:00.000Z',
};

const mockTimelessActivity = {
  id: ACTIVITY_UUID_2,
  trip_id: TRIP_UUID,
  name: 'Free Day — Explore the City',
  location: null,
  activity_date: '2026-08-09',
  start_time: null,
  end_time: null,
  created_at: '2026-02-25T12:00:00.000Z',
  updated_at: '2026-02-25T12:00:00.000Z',
};

const BASE_URL = `/api/v1/trips/${TRIP_UUID}/activities`;

// =============================================================================
// T-043 — POST: Create "all day" (timeless) activities
// =============================================================================

describe('T-043: POST /activities — create "all day" activity (no times)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('happy path: creates activity with both times omitted (all day) → 201', async () => {
    activityModel.createActivity.mockResolvedValue(mockTimelessActivity);

    const res = await request(buildApp(), 'POST', BASE_URL, {
      name: 'Free Day — Explore the City',
      activity_date: '2026-08-09',
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Free Day — Explore the City');
    expect(res.body.data.start_time).toBeNull();
    expect(res.body.data.end_time).toBeNull();
    expect(res.body.data.activity_date).toBe('2026-08-09');
  });

  it('happy path: creates activity with explicit null times → 201', async () => {
    activityModel.createActivity.mockResolvedValue(mockTimelessActivity);

    const res = await request(buildApp(), 'POST', BASE_URL, {
      name: 'Free Day — Explore the City',
      activity_date: '2026-08-09',
      start_time: null,
      end_time: null,
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.start_time).toBeNull();
    expect(res.body.data.end_time).toBeNull();
  });

  it('happy path: creates timed activity with both times → 201 (regression)', async () => {
    activityModel.createActivity.mockResolvedValue(mockTimedActivity);

    const res = await request(buildApp(), 'POST', BASE_URL, {
      name: "Fisherman's Wharf",
      location: 'SF, CA',
      activity_date: '2026-08-08',
      start_time: '09:00',
      end_time: '14:00',
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.start_time).toBe('09:00:00');
    expect(res.body.data.end_time).toBe('14:00:00');
  });

  it('happy path: createActivity model receives null times for all-day activity', async () => {
    activityModel.createActivity.mockResolvedValue(mockTimelessActivity);

    await request(buildApp(), 'POST', BASE_URL, {
      name: 'Free Day',
      activity_date: '2026-08-09',
    }, AUTH);

    expect(activityModel.createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        start_time: null,
        end_time: null,
      }),
    );
  });

  it('error path: only start_time provided (no end_time) → 400 linked validation on end_time', async () => {
    const res = await request(buildApp(), 'POST', BASE_URL, {
      name: 'Test',
      activity_date: '2026-08-08',
      start_time: '09:00',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.end_time).toMatch(/both start time and end time/i);
  });

  it('error path: only end_time provided (no start_time) → 400 linked validation on start_time', async () => {
    const res = await request(buildApp(), 'POST', BASE_URL, {
      name: 'Test',
      activity_date: '2026-08-08',
      end_time: '14:00',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.start_time).toMatch(/both start time and end time/i);
  });

  it('error path: end_time before start_time → 400 (existing validation still works)', async () => {
    const res = await request(buildApp(), 'POST', BASE_URL, {
      name: 'Test',
      activity_date: '2026-08-08',
      start_time: '14:00',
      end_time: '09:00',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.end_time).toMatch(/after start/);
  });

  it('error path: start_time provided, end_time explicitly null → 400', async () => {
    const res = await request(buildApp(), 'POST', BASE_URL, {
      name: 'Test',
      activity_date: '2026-08-08',
      start_time: '09:00',
      end_time: null,
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.end_time).toMatch(/both start time and end time/i);
  });

  it('error path: activity_date still required for timeless activities', async () => {
    const res = await request(buildApp(), 'POST', BASE_URL, {
      name: 'Free Day',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields.activity_date).toBeDefined();
  });

  it('error path: name still required for timeless activities', async () => {
    const res = await request(buildApp(), 'POST', BASE_URL, {
      activity_date: '2026-08-09',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields.name).toBeDefined();
  });
});

// =============================================================================
// T-043 — GET: Timeless activities in responses
// =============================================================================

describe('T-043: GET /activities — timeless activities in responses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('happy path: GET list includes timeless activity with null times', async () => {
    activityModel.listActivitiesByTrip.mockResolvedValue([mockTimedActivity, mockTimelessActivity]);

    const res = await request(buildApp(), 'GET', BASE_URL, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);

    // Timed activity
    const timed = res.body.data.find(a => a.id === ACTIVITY_UUID);
    expect(timed.start_time).toBe('09:00:00');
    expect(timed.end_time).toBe('14:00:00');

    // Timeless activity
    const timeless = res.body.data.find(a => a.id === ACTIVITY_UUID_2);
    expect(timeless.start_time).toBeNull();
    expect(timeless.end_time).toBeNull();
    expect(timeless.activity_date).toBe('2026-08-09');
  });

  it('happy path: GET single timeless activity returns null times', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimelessActivity);

    const res = await request(
      buildApp(),
      'GET',
      `${BASE_URL}/${ACTIVITY_UUID_2}`,
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.start_time).toBeNull();
    expect(res.body.data.end_time).toBeNull();
    expect(res.body.data.name).toBe('Free Day — Explore the City');
  });

  it('happy path: GET single timed activity still returns time strings (regression)', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimedActivity);

    const res = await request(
      buildApp(),
      'GET',
      `${BASE_URL}/${ACTIVITY_UUID}`,
      null,
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.start_time).toBe('09:00:00');
    expect(res.body.data.end_time).toBe('14:00:00');
  });
});

// =============================================================================
// T-043 — PATCH: Convert between timed and timeless activities
// =============================================================================

describe('T-043: PATCH /activities — convert timed ↔ timeless', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('happy path: convert timed activity to "all day" (set both times to null) → 200', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimedActivity);
    activityModel.updateActivity.mockResolvedValue({
      ...mockTimedActivity,
      start_time: null,
      end_time: null,
    });

    const res = await request(
      buildApp(),
      'PATCH',
      `${BASE_URL}/${ACTIVITY_UUID}`,
      { start_time: null, end_time: null },
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.start_time).toBeNull();
    expect(res.body.data.end_time).toBeNull();
    expect(activityModel.updateActivity).toHaveBeenCalledWith(
      ACTIVITY_UUID,
      expect.objectContaining({ start_time: null, end_time: null }),
    );
  });

  it('happy path: convert "all day" activity to timed (provide both times) → 200', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimelessActivity);
    activityModel.updateActivity.mockResolvedValue({
      ...mockTimelessActivity,
      start_time: '09:00:00',
      end_time: '14:00:00',
    });

    const res = await request(
      buildApp(),
      'PATCH',
      `${BASE_URL}/${ACTIVITY_UUID_2}`,
      { start_time: '09:00', end_time: '14:00' },
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.start_time).toBe('09:00:00');
    expect(res.body.data.end_time).toBe('14:00:00');
  });

  it('happy path: PATCH only start_time on timed activity (merges with existing end_time) → 200', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimedActivity);
    activityModel.updateActivity.mockResolvedValue({
      ...mockTimedActivity,
      start_time: '10:00:00',
    });

    const res = await request(
      buildApp(),
      'PATCH',
      `${BASE_URL}/${ACTIVITY_UUID}`,
      { start_time: '10:00' },
      AUTH,
    );

    // Merged: start=10:00, end=14:00:00 → both non-null, end > start → valid
    expect(res.status).toBe(200);
  });

  it('happy path: PATCH only end_time on timed activity (merges with existing start_time) → 200', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimedActivity);
    activityModel.updateActivity.mockResolvedValue({
      ...mockTimedActivity,
      end_time: '16:00:00',
    });

    const res = await request(
      buildApp(),
      'PATCH',
      `${BASE_URL}/${ACTIVITY_UUID}`,
      { end_time: '16:00' },
      AUTH,
    );

    // Merged: start=09:00:00, end=16:00 → both non-null, end > start → valid
    expect(res.status).toBe(200);
  });

  it('error path: PATCH only start_time on timeless activity → 400 (merged: start=value, end=null)', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimelessActivity);

    const res = await request(
      buildApp(),
      'PATCH',
      `${BASE_URL}/${ACTIVITY_UUID_2}`,
      { start_time: '09:00' },
      AUTH,
    );

    // Merged: start=09:00, end=null (existing) → mismatched → error on end_time
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.end_time).toMatch(/both start time and end time/i);
  });

  it('error path: PATCH only end_time on timeless activity → 400 (merged: start=null, end=value)', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimelessActivity);

    const res = await request(
      buildApp(),
      'PATCH',
      `${BASE_URL}/${ACTIVITY_UUID_2}`,
      { end_time: '14:00' },
      AUTH,
    );

    // Merged: start=null (existing), end=14:00 → mismatched → error on start_time
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.start_time).toMatch(/both start time and end time/i);
  });

  it('error path: PATCH start_time null alone on timed activity → 400 (merged: start=null, end=existing)', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimedActivity);

    const res = await request(
      buildApp(),
      'PATCH',
      `${BASE_URL}/${ACTIVITY_UUID}`,
      { start_time: null },
      AUTH,
    );

    // Merged: start=null (new), end=14:00:00 (existing) → mismatched
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.start_time).toMatch(/both start time and end time/i);
  });

  it('error path: PATCH end_time null alone on timed activity → 400 (merged: start=existing, end=null)', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimedActivity);

    const res = await request(
      buildApp(),
      'PATCH',
      `${BASE_URL}/${ACTIVITY_UUID}`,
      { end_time: null },
      AUTH,
    );

    // Merged: start=09:00:00 (existing), end=null (new) → mismatched
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.end_time).toMatch(/both start time and end time/i);
  });

  it('error path: PATCH end_time before start_time still returns 400', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimedActivity);

    const res = await request(
      buildApp(),
      'PATCH',
      `${BASE_URL}/${ACTIVITY_UUID}`,
      { start_time: '14:00', end_time: '09:00' },
      AUTH,
    );

    expect(res.status).toBe(400);
    expect(res.body.error.fields.end_time).toMatch(/after start/);
  });

  it('happy path: PATCH non-time fields on timeless activity → 200 (no linked validation triggered)', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimelessActivity);
    activityModel.updateActivity.mockResolvedValue({
      ...mockTimelessActivity,
      name: 'Updated Free Day',
    });

    const res = await request(
      buildApp(),
      'PATCH',
      `${BASE_URL}/${ACTIVITY_UUID_2}`,
      { name: 'Updated Free Day' },
      AUTH,
    );

    // Merged times: start=null (existing), end=null (existing) → both null → valid
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Free Day');
    expect(res.body.data.start_time).toBeNull();
    expect(res.body.data.end_time).toBeNull();
  });

  it('happy path: PATCH name on timed activity → 200 (no time change)', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimedActivity);
    activityModel.updateActivity.mockResolvedValue({
      ...mockTimedActivity,
      name: 'Renamed Activity',
    });

    const res = await request(
      buildApp(),
      'PATCH',
      `${BASE_URL}/${ACTIVITY_UUID}`,
      { name: 'Renamed Activity' },
      AUTH,
    );

    // Merged times: start=09:00:00 (existing), end=14:00:00 (existing) → both non-null, end > start → valid
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Renamed Activity');
  });
});

// =============================================================================
// T-043 — DELETE: Timeless activity
// =============================================================================

describe('T-043: DELETE /activities — timeless activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('happy path: delete timeless activity → 204 (same as timed)', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimelessActivity);
    activityModel.deleteActivity.mockResolvedValue(1);

    const res = await request(
      buildApp(),
      'DELETE',
      `${BASE_URL}/${ACTIVITY_UUID_2}`,
      null,
      AUTH,
    );

    expect(res.status).toBe(204);
    expect(activityModel.deleteActivity).toHaveBeenCalledWith(ACTIVITY_UUID_2);
  });
});

// =============================================================================
// Regression: Sprint 1/2 activity tests still work after T-043
// =============================================================================

describe('Regression: Sprint 1/2 activities API still works after T-043', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('GET /activities still returns 200 with list', async () => {
    activityModel.listActivitiesByTrip.mockResolvedValue([mockTimedActivity]);

    const res = await request(buildApp(), 'GET', BASE_URL, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('POST timed activity still works (regression)', async () => {
    activityModel.createActivity.mockResolvedValue(mockTimedActivity);

    const res = await request(buildApp(), 'POST', BASE_URL, {
      name: "Fisherman's Wharf",
      activity_date: '2026-08-08',
      start_time: '09:00',
      end_time: '14:00',
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.start_time).toBe('09:00:00');
  });

  it('DELETE timed activity still works (regression)', async () => {
    activityModel.findActivityById.mockResolvedValue(mockTimedActivity);
    activityModel.deleteActivity.mockResolvedValue(1);

    const res = await request(buildApp(), 'DELETE', `${BASE_URL}/${ACTIVITY_UUID}`, null, AUTH);

    expect(res.status).toBe(204);
  });

  it('401 without auth still works', async () => {
    const res = await request(buildApp(), 'GET', BASE_URL, null);
    expect(res.status).toBe(401);
  });

  it('404 for non-existent trip still works', async () => {
    tripModel.findTripById.mockResolvedValue(null);

    const res = await request(
      buildApp(),
      'GET',
      `/api/v1/trips/550e8400-e29b-41d4-a716-446655440099/activities`,
      null,
      AUTH,
    );

    expect(res.status).toBe(404);
  });

  it('403 for wrong trip owner still works', async () => {
    tripModel.findTripById.mockResolvedValue({ ...mockTrip, user_id: 'other-user' });

    const res = await request(buildApp(), 'GET', BASE_URL, null, AUTH);

    expect(res.status).toBe(403);
  });

  it('POST with invalid date format still returns 400', async () => {
    const res = await request(buildApp(), 'POST', BASE_URL, {
      name: 'Test',
      activity_date: '08-08-2026',
      start_time: '09:00',
      end_time: '14:00',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields.activity_date).toMatch(/YYYY-MM-DD/);
  });

  it('activity_date format is YYYY-MM-DD in response (B-010 regression)', async () => {
    activityModel.createActivity.mockResolvedValue(mockTimedActivity);

    const res = await request(buildApp(), 'POST', BASE_URL, {
      name: 'Museum',
      activity_date: '2026-08-08',
      start_time: '09:00',
      end_time: '14:00',
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.activity_date).toBe('2026-08-08');
    expect(res.body.data.activity_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
