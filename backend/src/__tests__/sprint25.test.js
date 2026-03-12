/**
 * Sprint 25 — Calendar Data Aggregation Endpoint Tests (T-212)
 *
 * Tests for GET /api/v1/trips/:tripId/calendar
 *
 * Covers:
 *   - Happy path: events from all three types (FLIGHT, STAY, ACTIVITY)
 *   - Happy path: empty trip returns empty events array
 *   - Auth enforcement: 401 without token
 *   - Ownership enforcement: 403 for wrong user
 *   - Trip not found: 404 for unknown trip UUID
 *   - Invalid UUID: 400 for non-UUID trip ID
 *   - Event shape: correct field derivation per type
 *   - Sort order: start_date ASC, start_time ASC NULLS LAST, type ASC
 *   - All-day activity (null start_time / end_time)
 *   - FLIGHT title derivation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock db-backed model modules ----
vi.mock('../models/tripModel.js', () => ({
  findTripById: vi.fn(),
}));

vi.mock('../models/calendarModel.js', () => ({
  getCalendarEvents: vi.fn(),
}));

// ---- Mock JWT ----
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn((token) => {
      if (token === 'valid-token') return { id: 'user-1', email: 'jane@example.com', name: 'Jane' };
      throw new Error('Invalid token');
    }),
  },
}));

import express from 'express';
import calendarRoutes from '../routes/calendar.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import * as tripModel from '../models/tripModel.js';
import * as calendarModel from '../models/calendarModel.js';

// ---- Test UUIDs ----
const TRIP_UUID = '550e8400-e29b-41d4-a716-446655440001';
const OTHER_TRIP_UUID = '550e8400-e29b-41d4-a716-446655440002';
const NOTFOUND_UUID = '550e8400-e29b-41d4-a716-446655440099';

// ---- App factory ----
function buildApp() {
  const app = express();
  app.use(express.json());
  app.param('tripId', uuidParamHandler);
  app.use('/api/v1/trips/:tripId/calendar', calendarRoutes);
  app.use(errorHandler);
  return app;
}

// ---- HTTP test helper (mirrors existing test pattern) ----
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
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    });
  });
}

// ---- Constants ----
const AUTH = { Authorization: 'Bearer valid-token' };

const mockTrip = {
  id: TRIP_UUID,
  user_id: 'user-1',
  name: 'Test Trip',
};

// ---- Fixture events ----
const mockFlightEvent = {
  id: 'flight-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  type: 'FLIGHT',
  title: 'Delta DL123 — JFK → LAX',
  start_date: '2026-08-07',
  end_date: '2026-08-07',
  start_time: '10:00',
  end_time: '13:30',
  timezone: 'America/New_York',
  source_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
};

const mockStayEvent = {
  id: 'stay-b2c3d4e5-f6a7-8901-bcde-f12345678901',
  type: 'STAY',
  title: 'Grand Hyatt LA',
  start_date: '2026-08-07',
  end_date: '2026-08-10',
  start_time: '15:00',
  end_time: '11:00',
  timezone: 'America/Los_Angeles',
  source_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
};

const mockActivityEvent = {
  id: 'activity-c3d4e5f6-a7b8-9012-cdef-123456789012',
  type: 'ACTIVITY',
  title: 'Getty Museum Visit',
  start_date: '2026-08-08',
  end_date: '2026-08-08',
  start_time: '10:00',
  end_time: '13:00',
  timezone: null,
  source_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
};

const mockAllDayActivityEvent = {
  id: 'activity-d4e5f6a7-b8c9-0123-defa-234567890123',
  type: 'ACTIVITY',
  title: 'Free afternoon',
  start_date: '2026-08-09',
  end_date: '2026-08-09',
  start_time: null,
  end_time: null,
  timezone: null,
  source_id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
};

// ============================================================
// Test suites
// ============================================================

describe('GET /api/v1/trips/:tripId/calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
    calendarModel.getCalendarEvents.mockResolvedValue([]);
  });

  // ---- Happy paths ----

  it('happy path: returns 200 with trip_id and events array', async () => {
    calendarModel.getCalendarEvents.mockResolvedValue([
      mockFlightEvent,
      mockStayEvent,
      mockActivityEvent,
    ]);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/calendar`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.trip_id).toBe(TRIP_UUID);
    expect(res.body.data.events).toHaveLength(3);
  });

  it('happy path: FLIGHT event has correct shape and fields', async () => {
    calendarModel.getCalendarEvents.mockResolvedValue([mockFlightEvent]);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/calendar`, null, AUTH);

    const event = res.body.data.events[0];
    expect(event.type).toBe('FLIGHT');
    expect(event.id).toMatch(/^flight-/);
    expect(event.title).toContain('→');
    expect(event.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(event.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(event.start_time).toMatch(/^\d{2}:\d{2}$/);
    expect(event.end_time).toMatch(/^\d{2}:\d{2}$/);
    expect(event.timezone).toBeTruthy();
    expect(event.source_id).toBe(mockFlightEvent.source_id);
  });

  it('happy path: STAY event has correct shape and fields', async () => {
    calendarModel.getCalendarEvents.mockResolvedValue([mockStayEvent]);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/calendar`, null, AUTH);

    const event = res.body.data.events[0];
    expect(event.type).toBe('STAY');
    expect(event.id).toMatch(/^stay-/);
    expect(event.title).toBe('Grand Hyatt LA');
    expect(event.start_date).toBe('2026-08-07');
    expect(event.end_date).toBe('2026-08-10'); // multi-night stay
    expect(event.timezone).toBe('America/Los_Angeles');
    expect(event.source_id).toBe(mockStayEvent.source_id);
  });

  it('happy path: ACTIVITY event has correct shape with timezone null', async () => {
    calendarModel.getCalendarEvents.mockResolvedValue([mockActivityEvent]);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/calendar`, null, AUTH);

    const event = res.body.data.events[0];
    expect(event.type).toBe('ACTIVITY');
    expect(event.id).toMatch(/^activity-/);
    expect(event.timezone).toBeNull();
    expect(event.start_date).toBe(event.end_date); // single-day
    expect(event.source_id).toBe(mockActivityEvent.source_id);
  });

  it('happy path: all-day activity has null start_time and end_time', async () => {
    calendarModel.getCalendarEvents.mockResolvedValue([mockAllDayActivityEvent]);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/calendar`, null, AUTH);

    const event = res.body.data.events[0];
    expect(event.type).toBe('ACTIVITY');
    expect(event.start_time).toBeNull();
    expect(event.end_time).toBeNull();
  });

  it('happy path: empty trip returns empty events array', async () => {
    calendarModel.getCalendarEvents.mockResolvedValue([]);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/calendar`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.trip_id).toBe(TRIP_UUID);
    expect(res.body.data.events).toEqual([]);
  });

  it('happy path: events are returned in the order provided by calendarModel', async () => {
    // Sort order is enforced by calendarModel — route passes through unchanged
    calendarModel.getCalendarEvents.mockResolvedValue([
      mockFlightEvent,
      mockStayEvent,
      mockActivityEvent,
      mockAllDayActivityEvent,
    ]);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/calendar`, null, AUTH);

    const types = res.body.data.events.map((e) => e.type);
    expect(types).toEqual(['FLIGHT', 'STAY', 'ACTIVITY', 'ACTIVITY']);
  });

  // ---- Auth enforcement ----

  it('error path: returns 401 when Authorization header is missing', async () => {
    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/calendar`, null);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('error path: returns 401 when Bearer token is invalid', async () => {
    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/calendar`, null, {
      Authorization: 'Bearer bad-token',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  // ---- Ownership enforcement ----

  it('error path: returns 403 when trip belongs to a different user', async () => {
    tripModel.findTripById.mockResolvedValue({ ...mockTrip, user_id: 'other-user' });

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/calendar`, null, AUTH);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // ---- Trip not found ----

  it('error path: returns 404 when trip does not exist', async () => {
    tripModel.findTripById.mockResolvedValue(null);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${NOTFOUND_UUID}/calendar`, null, AUTH);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // ---- UUID validation ----

  it('error path: returns 400 when trip ID is not a valid UUID', async () => {
    const res = await request(buildApp(), 'GET', '/api/v1/trips/not-a-uuid/calendar', null, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // ---- Model not called for auth/ownership failures ----

  it('getCalendarEvents is NOT called when trip is not found', async () => {
    tripModel.findTripById.mockResolvedValue(null);

    await request(buildApp(), 'GET', `/api/v1/trips/${NOTFOUND_UUID}/calendar`, null, AUTH);

    expect(calendarModel.getCalendarEvents).not.toHaveBeenCalled();
  });

  it('getCalendarEvents is NOT called when user does not own the trip', async () => {
    tripModel.findTripById.mockResolvedValue({ ...mockTrip, user_id: 'other-user' });

    await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/calendar`, null, AUTH);

    expect(calendarModel.getCalendarEvents).not.toHaveBeenCalled();
  });

  // ---- Internal error handling ----

  it('error path: returns 500 when calendarModel throws', async () => {
    calendarModel.getCalendarEvents.mockRejectedValue(new Error('DB failure'));

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/calendar`, null, AUTH);

    expect(res.status).toBe(500);
  });
});
