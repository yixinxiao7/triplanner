/**
 * Sprint 30 — Integration tests
 *
 * Covers:
 *   T-238 — Trip status persistence: PATCH /trips/:id status round-trip
 *   T-240 — Flight timezone: naive datetime strings rejected with 400
 *   T-242 — LAND_TRAVEL events in GET /trips/:id/calendar
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// T-238 — Trip status persistence
// ============================================================================
//
// Tests the PATCH /trips/:id route to confirm that:
//   1. Status is persisted to the DB and returned as-is in the 200 response.
//   2. computeTripStatus() no longer overrides a user-set status, even when
//      start_date and end_date are both set.
//   3. All three transitions (PLANNING → ONGOING → COMPLETED → PLANNING) work.
// ============================================================================

vi.mock('../models/tripModel.js', () => ({
  findTripById: vi.fn(),
  createTrip: vi.fn(),
  updateTrip: vi.fn(),
  deleteTrip: vi.fn(),
  listTripsByUser: vi.fn(),
  VALID_SORT_BY: ['name', 'created_at', 'start_date'],
  VALID_SORT_ORDER: ['asc', 'desc'],
  VALID_STATUS_FILTER: ['PLANNING', 'ONGOING', 'COMPLETED'],
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
import tripsRoutes from '../routes/trips.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as tripModel from '../models/tripModel.js';

const TRIP_UUID   = '550e8400-e29b-41d4-a716-446655440001';
const AUTH = { Authorization: 'Bearer valid-token' };

function buildTripsApp() {
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
      const options = { method: method.toUpperCase(), headers: { 'Content-Type': 'application/json', ...headers } };
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

// Base mock trip — has BOTH start_date and end_date set (future dates)
// Before T-238 fix, computeTripStatus() would override status → 'PLANNING'.
const mockTripWithDates = {
  id: TRIP_UUID,
  user_id: 'user-1',
  name: 'Japan 2027',
  destinations: ['Tokyo', 'Osaka'],
  status: 'PLANNING',
  start_date: '2027-06-01',
  end_date: '2027-06-14',
  notes: null,
  created_at: '2026-02-24T12:00:00.000Z',
  updated_at: '2026-03-17T10:00:00.000Z',
};

describe('T-238 — PATCH /trips/:id status round-trip (dates present)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('PATCH status:ONGOING on trip with future dates → 200 returns ONGOING', async () => {
    const updatedTrip = { ...mockTripWithDates, status: 'ONGOING' };
    tripModel.findTripById.mockResolvedValue(mockTripWithDates);
    tripModel.updateTrip.mockResolvedValue(updatedTrip);

    const res = await request(buildTripsApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`,
      { status: 'ONGOING' }, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ONGOING');
  });

  it('PATCH status:COMPLETED on trip with future dates → 200 returns COMPLETED', async () => {
    const updatedTrip = { ...mockTripWithDates, status: 'COMPLETED' };
    tripModel.findTripById.mockResolvedValue(mockTripWithDates);
    tripModel.updateTrip.mockResolvedValue(updatedTrip);

    const res = await request(buildTripsApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`,
      { status: 'COMPLETED' }, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('PATCH status:PLANNING → 200 returns PLANNING', async () => {
    const updatedTrip = { ...mockTripWithDates, status: 'PLANNING' };
    tripModel.findTripById
      .mockResolvedValueOnce({ ...mockTripWithDates, status: 'ONGOING' }) // pre-check fetch
    tripModel.updateTrip.mockResolvedValue(updatedTrip);

    const res = await request(buildTripsApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`,
      { status: 'PLANNING' }, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PLANNING');
  });

  it('transition: PLANNING→ONGOING→COMPLETED→PLANNING round-trips correctly', async () => {
    const app = buildTripsApp();

    // PLANNING → ONGOING
    tripModel.findTripById.mockResolvedValue({ ...mockTripWithDates, status: 'PLANNING' });
    tripModel.updateTrip.mockResolvedValue({ ...mockTripWithDates, status: 'ONGOING' });
    const r1 = await request(app, 'PATCH', `/api/v1/trips/${TRIP_UUID}`, { status: 'ONGOING' }, AUTH);
    expect(r1.body.data.status).toBe('ONGOING');

    // ONGOING → COMPLETED
    tripModel.findTripById.mockResolvedValue({ ...mockTripWithDates, status: 'ONGOING' });
    tripModel.updateTrip.mockResolvedValue({ ...mockTripWithDates, status: 'COMPLETED' });
    const r2 = await request(app, 'PATCH', `/api/v1/trips/${TRIP_UUID}`, { status: 'COMPLETED' }, AUTH);
    expect(r2.body.data.status).toBe('COMPLETED');

    // COMPLETED → PLANNING
    tripModel.findTripById.mockResolvedValue({ ...mockTripWithDates, status: 'COMPLETED' });
    tripModel.updateTrip.mockResolvedValue({ ...mockTripWithDates, status: 'PLANNING' });
    const r3 = await request(app, 'PATCH', `/api/v1/trips/${TRIP_UUID}`, { status: 'PLANNING' }, AUTH);
    expect(r3.body.data.status).toBe('PLANNING');
  });

  it('PATCH with invalid status value → 400 VALIDATION_ERROR', async () => {
    tripModel.findTripById.mockResolvedValue(mockTripWithDates);

    const res = await request(buildTripsApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`,
      { status: 'INVALID' }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.status).toBeDefined();
  });
});

// ============================================================================
// T-240 — Flight timezone: naive datetime strings rejected
// ============================================================================
//
// Tests that POST and PATCH /trips/:id/flights returns 400 when
// departure_at or arrival_at is a naive ISO string (no UTC offset).
// Strings that include Z or ±HH:MM are accepted.
// ============================================================================

vi.mock('../models/flightModel.js', () => ({
  listFlightsByTrip: vi.fn(),
  findFlightById: vi.fn(),
  createFlight: vi.fn(),
  updateFlight: vi.fn(),
  deleteFlight: vi.fn(),
}));

import flightsRoutes from '../routes/flights.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import * as flightModel from '../models/flightModel.js';

const FLIGHT_UUID = '550e8400-e29b-41d4-a716-446655440010';

function buildFlightsApp() {
  const app = express();
  app.use(express.json());
  app.param('tripId', uuidParamHandler);
  app.use('/api/v1/trips/:tripId/flights', flightsRoutes);
  app.use(errorHandler);
  return app;
}

const mockTrip = { id: TRIP_UUID, user_id: 'user-1', name: 'Test Trip' };
const mockFlight = {
  id: FLIGHT_UUID,
  trip_id: TRIP_UUID,
  flight_number: 'JL7',
  airline: 'JAL',
  from_location: 'JFK',
  to_location: 'NRT',
  departure_at: '2026-08-07T10:50:00.000Z',
  departure_tz: 'America/New_York',
  arrival_at: '2026-08-08T09:30:00.000Z',
  arrival_tz: 'Asia/Tokyo',
  created_at: '2026-02-24T12:00:00.000Z',
  updated_at: '2026-02-24T12:00:00.000Z',
};

const validFlightBody = {
  flight_number: 'JL7',
  airline: 'JAL',
  from_location: 'JFK',
  to_location: 'NRT',
  departure_at: '2026-08-07T06:50:00-04:00',   // offset present ✓
  departure_tz: 'America/New_York',
  arrival_at:   '2026-08-08T09:30:00+09:00',   // offset present ✓
  arrival_tz: 'Asia/Tokyo',
};

describe('T-240 — POST /trips/:id/flights — naive datetime strings rejected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
    flightModel.createFlight.mockResolvedValue(mockFlight);
  });

  it('happy path: accepts ISO strings with UTC offset (-04:00)', async () => {
    const res = await request(buildFlightsApp(), 'POST',
      `/api/v1/trips/${TRIP_UUID}/flights`, validFlightBody, AUTH);

    expect(res.status).toBe(201);
  });

  it('happy path: accepts ISO strings with Z suffix', async () => {
    const body = {
      ...validFlightBody,
      departure_at: '2026-08-07T10:50:00Z',
      arrival_at:   '2026-08-08T00:30:00Z',
    };
    const res = await request(buildFlightsApp(), 'POST',
      `/api/v1/trips/${TRIP_UUID}/flights`, body, AUTH);

    expect(res.status).toBe(201);
  });

  it('error path: naive departure_at (no offset) → 400 VALIDATION_ERROR', async () => {
    const body = { ...validFlightBody, departure_at: '2026-08-07T06:50:00' };
    const res = await request(buildFlightsApp(), 'POST',
      `/api/v1/trips/${TRIP_UUID}/flights`, body, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.departure_at).toMatch(/timezone offset/i);
  });

  it('error path: naive arrival_at (no offset) → 400 VALIDATION_ERROR', async () => {
    const body = { ...validFlightBody, arrival_at: '2026-08-08T09:30:00' };
    const res = await request(buildFlightsApp(), 'POST',
      `/api/v1/trips/${TRIP_UUID}/flights`, body, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.arrival_at).toMatch(/timezone offset/i);
  });

  it('error path: completely invalid departure_at string → 400 VALIDATION_ERROR', async () => {
    const body = { ...validFlightBody, departure_at: 'not-a-date' };
    const res = await request(buildFlightsApp(), 'POST',
      `/api/v1/trips/${TRIP_UUID}/flights`, body, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.departure_at).toBeDefined();
  });
});

describe('T-240 — PATCH /trips/:id/flights/:id — naive datetime strings rejected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
    flightModel.findFlightById.mockResolvedValue(mockFlight);
    flightModel.updateFlight.mockResolvedValue(mockFlight);
  });

  it('happy path: PATCH with offset string accepted', async () => {
    const res = await request(buildFlightsApp(), 'PATCH',
      `/api/v1/trips/${TRIP_UUID}/flights/${FLIGHT_UUID}`,
      { departure_at: '2026-08-07T06:50:00-04:00' }, AUTH);

    expect(res.status).toBe(200);
  });

  it('error path: PATCH with naive departure_at → 400', async () => {
    const res = await request(buildFlightsApp(), 'PATCH',
      `/api/v1/trips/${TRIP_UUID}/flights/${FLIGHT_UUID}`,
      { departure_at: '2026-08-07T06:50:00' }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.departure_at).toMatch(/timezone offset/i);
  });

  it('error path: PATCH with naive arrival_at → 400', async () => {
    const res = await request(buildFlightsApp(), 'PATCH',
      `/api/v1/trips/${TRIP_UUID}/flights/${FLIGHT_UUID}`,
      { arrival_at: '2026-08-08T09:30:00' }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.arrival_at).toMatch(/timezone offset/i);
  });
});

// ============================================================================
// T-242 — LAND_TRAVEL events in GET /trips/:id/calendar
// ============================================================================
//
// Tests the calendar route integration with mocked calendarModel.
// Verifies that LAND_TRAVEL events are included in the response when present.
// ============================================================================

vi.mock('../models/calendarModel.js', () => ({
  getCalendarEvents: vi.fn(),
}));

import calendarRoutes from '../routes/calendar.js';
import * as calendarModel from '../models/calendarModel.js';

function buildCalendarApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/trips', tripsRoutes);
  app.param('id', uuidParamHandler);
  app.use('/api/v1/trips/:id/calendar', calendarRoutes);
  app.use(errorHandler);
  return app;
}

describe('T-242 — GET /trips/:id/calendar includes LAND_TRAVEL events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTripWithDates);
  });

  it('happy path: LAND_TRAVEL event returned when land travel exists', async () => {
    calendarModel.getCalendarEvents.mockResolvedValue([
      {
        id: 'land-travel-dddd0001-0000-4000-8000-000000000001',
        type: 'LAND_TRAVEL',
        title: 'TRAIN — Tokyo → Osaka',
        start_date: '2026-08-12',
        end_date: '2026-08-12',
        start_time: '10:00',
        end_time: '12:30',
        timezone: null,
        source_id: 'dddd0001-0000-4000-8000-000000000001',
      },
    ]);

    const res = await request(buildCalendarApp(), 'GET',
      `/api/v1/trips/${TRIP_UUID}/calendar`, null, AUTH);

    expect(res.status).toBe(200);
    const landTravelEvents = res.body.data.events.filter(e => e.type === 'LAND_TRAVEL');
    expect(landTravelEvents).toHaveLength(1);
    expect(landTravelEvents[0].title).toBe('TRAIN — Tokyo → Osaka');
    expect(landTravelEvents[0].id).toMatch(/^land-travel-/);
    expect(landTravelEvents[0].timezone).toBeNull();
  });

  it('happy path: no LAND_TRAVEL events when none exist', async () => {
    calendarModel.getCalendarEvents.mockResolvedValue([
      {
        id: 'flight-aaaa0001',
        type: 'FLIGHT',
        title: 'JAL JL7 — JFK → NRT',
        start_date: '2026-08-07',
        end_date: '2026-08-08',
        start_time: '06:50',
        end_time: '09:30',
        timezone: 'America/New_York',
        source_id: 'aaaa0001',
      },
    ]);

    const res = await request(buildCalendarApp(), 'GET',
      `/api/v1/trips/${TRIP_UUID}/calendar`, null, AUTH);

    expect(res.status).toBe(200);
    const landTravelEvents = res.body.data.events.filter(e => e.type === 'LAND_TRAVEL');
    expect(landTravelEvents).toHaveLength(0);
  });

  it('happy path: mixed event types all returned', async () => {
    calendarModel.getCalendarEvents.mockResolvedValue([
      { id: 'flight-1', type: 'FLIGHT', title: 'JAL JL7 — JFK → NRT',
        start_date: '2026-08-07', end_date: '2026-08-08',
        start_time: '06:50', end_time: '09:30', timezone: 'America/New_York', source_id: '1' },
      { id: 'land-travel-2', type: 'LAND_TRAVEL', title: 'TRAIN — Tokyo → Osaka',
        start_date: '2026-08-12', end_date: '2026-08-12',
        start_time: '10:00', end_time: '12:30', timezone: null, source_id: '2' },
      { id: 'stay-3', type: 'STAY', title: 'Park Hyatt Tokyo',
        start_date: '2026-08-08', end_date: '2026-08-15',
        start_time: '15:00', end_time: '11:00', timezone: 'Asia/Tokyo', source_id: '3' },
    ]);

    const res = await request(buildCalendarApp(), 'GET',
      `/api/v1/trips/${TRIP_UUID}/calendar`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.events).toHaveLength(3);
    const types = res.body.data.events.map(e => e.type);
    expect(types).toContain('FLIGHT');
    expect(types).toContain('LAND_TRAVEL');
    expect(types).toContain('STAY');
  });

  it('error path: 401 when not authenticated', async () => {
    calendarModel.getCalendarEvents.mockResolvedValue([]);

    const res = await request(buildCalendarApp(), 'GET',
      `/api/v1/trips/${TRIP_UUID}/calendar`, null);

    expect(res.status).toBe(401);
  });
});
