/**
 * Sprint 7 Tests — T-098 + T-103
 *
 * T-098: Stays UTC timestamp round-trip fix (backend route-level tests)
 * ─────────────────────────────────────────────────────────────────────
 * The root-cause fix is a pg type-parser override in database.js that converts
 * TIMESTAMPTZ raw strings to UTC ISO 8601 before JSON serialization (FB-081).
 * Because the DB is mocked in unit tests, these route-level tests verify that:
 *   (a) The stays route passes check_in_at / check_out_at to the model without
 *       any offset transformation.
 *   (b) The route returns whatever UTC string the model gives it — no mutation.
 *   (c) UTC reference values for common timezone pairings are correct, serving
 *       as living documentation of the intended round-trip behavior.
 *
 * UTC reference values used in tests:
 *   4:00 PM Eastern (EDT, UTC-4)  = 20:00 UTC → "2026-08-07T20:00:00.000Z"
 *   4:00 PM Pacific  (PDT, UTC-7) = 23:00 UTC → "2026-08-07T23:00:00.000Z"
 *   4:00 PM Pacific  (PST, UTC-8) = 00:00 UTC → "2026-12-07T00:00:00.000Z" (+1 day)
 *
 * T-103: Trip notes field
 * ───────────────────────
 * Migration 010 adds `notes TEXT NULL` to trips. Tests cover:
 *   - GET /trips/:id includes notes field (null when unset, string when set)
 *   - GET /trips list includes notes field on each trip object
 *   - PATCH /trips/:id accepts notes → updateTrip called with correct value
 *   - PATCH with notes > 2000 chars → 400 VALIDATION_ERROR
 *   - PATCH with notes: null → clears the field
 *   - PATCH without notes → existing value unchanged (not in updates)
 *   - POST /trips with notes → createTrip called with notes
 *   - POST /trips with notes > 2000 chars → 400 VALIDATION_ERROR
 *   - POST /trips without notes → notes key not passed to createTrip
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks (must be declared before imports that transitively import the modules)
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

vi.mock('../models/stayModel.js', () => ({
  listStaysByTrip: vi.fn(),
  findStayById: vi.fn(),
  createStay: vi.fn(),
  updateStay: vi.fn(),
  deleteStay: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-token'),
    verify: vi.fn((token) => {
      if (token === 'valid-token') {
        return { id: 'user-1', email: 'jane@example.com', name: 'Jane' };
      }
      throw new Error('Invalid token');
    }),
  },
}));

import express from 'express';
import { errorHandler } from '../middleware/errorHandler.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import tripsRoutes from '../routes/trips.js';
import staysRoutes from '../routes/stays.js';
import * as tripModel from '../models/tripModel.js';
import * as stayModel from '../models/stayModel.js';

// ============================================================================
// Test helpers
// ============================================================================

const TRIP_UUID     = '550e8400-e29b-41d4-a716-446655440001';
const STAY_UUID     = '550e8400-e29b-41d4-a716-446655440020';
const OTHER_UUID    = '550e8400-e29b-41d4-a716-446655440099';
const AUTH          = { Authorization: 'Bearer valid-token' };

function buildTripsApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/trips', tripsRoutes);
  app.use(errorHandler);
  return app;
}

function buildStaysApp() {
  const app = express();
  app.use(express.json());
  app.param('tripId', uuidParamHandler);
  app.use('/api/v1/trips/:tripId/stays', staysRoutes);
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
        if (body !== null && body !== undefined) req.write(JSON.stringify(body));
        req.end();
      });
    });
  });
}

// ============================================================================
// Shared fixtures
// ============================================================================

const BASE_TRIP = {
  id: TRIP_UUID,
  user_id: 'user-1',
  name: 'Tokyo Trip',
  destinations: ['Tokyo'],
  status: 'PLANNING',
  notes: null,
  start_date: null,
  end_date: null,
  created_at: '2026-02-24T12:00:00.000Z',
  updated_at: '2026-02-24T12:00:00.000Z',
};

const BASE_STAY = {
  id: STAY_UUID,
  trip_id: TRIP_UUID,
  category: 'HOTEL',
  name: 'Test Hotel',
  address: '123 Main St',
  // 4:00 PM EDT (America/New_York, UTC-4) = 20:00 UTC
  check_in_at:  '2026-08-07T20:00:00.000Z',
  check_in_tz:  'America/New_York',
  // 3:00 PM EDT = 19:00 UTC
  check_out_at: '2026-08-09T19:00:00.000Z',
  check_out_tz: 'America/New_York',
  created_at:   '2026-02-24T12:00:00.000Z',
  updated_at:   '2026-02-24T12:00:00.000Z',
};

// ============================================================================
// T-098 — GET /stays: UTC check_in_at returned unchanged
// ============================================================================

describe('T-098 — GET /stays returns check_in_at UTC string unchanged', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(BASE_TRIP);
  });

  it('returns check_in_at as UTC ISO string for Eastern timezone (4 PM EDT = T20:00Z)', async () => {
    const utcCheckIn = '2026-08-07T20:00:00.000Z'; // 4:00 PM America/New_York (EDT)
    stayModel.listStaysByTrip.mockResolvedValue([
      { ...BASE_STAY, check_in_at: utcCheckIn, check_in_tz: 'America/New_York' },
    ]);

    const res = await request(buildStaysApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/stays`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data[0].check_in_at).toBe(utcCheckIn);
    // UTC string must end with Z — not a local offset like "-04:00"
    expect(res.body.data[0].check_in_at.endsWith('Z')).toBe(true);
    expect(res.body.data[0].check_in_tz).toBe('America/New_York');
  });

  it('returns check_in_at as UTC ISO string for Pacific timezone (4 PM PDT = T23:00Z)', async () => {
    const utcCheckIn = '2026-08-07T23:00:00.000Z'; // 4:00 PM America/Los_Angeles (PDT, UTC-7)
    stayModel.listStaysByTrip.mockResolvedValue([
      { ...BASE_STAY, check_in_at: utcCheckIn, check_in_tz: 'America/Los_Angeles' },
    ]);

    const res = await request(buildStaysApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/stays`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data[0].check_in_at).toBe(utcCheckIn);
    expect(res.body.data[0].check_in_at.endsWith('Z')).toBe(true);
    expect(res.body.data[0].check_in_tz).toBe('America/Los_Angeles');
  });

  it('returns check_in_at as UTC ISO string for PST timezone (4 PM PST = T00:00Z next day)', async () => {
    // 4:00 PM PST (UTC-8, winter) rolls over to the next UTC day
    const utcCheckIn = '2026-12-07T00:00:00.000Z';
    stayModel.listStaysByTrip.mockResolvedValue([
      { ...BASE_STAY, check_in_at: utcCheckIn, check_in_tz: 'America/Los_Angeles' },
    ]);

    const res = await request(buildStaysApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/stays`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data[0].check_in_at).toBe(utcCheckIn);
    expect(res.body.data[0].check_in_at.endsWith('Z')).toBe(true);
  });
});

// ============================================================================
// T-098 — POST /stays: UTC check_in_at passed to model without modification
// ============================================================================

describe('T-098 — POST /stays passes UTC check_in_at to model without modification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(BASE_TRIP);
  });

  it('passes UTC check_in_at to createStay unchanged (4 PM EDT = T20:00Z)', async () => {
    const utcCheckIn  = '2026-08-07T20:00:00.000Z'; // 4:00 PM EDT
    const utcCheckOut = '2026-08-09T19:00:00.000Z'; // 3:00 PM EDT
    stayModel.createStay.mockResolvedValue({
      ...BASE_STAY,
      check_in_at: utcCheckIn,
      check_out_at: utcCheckOut,
    });

    const res = await request(buildStaysApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/stays`, {
      category:     'HOTEL',
      name:         'Test Hotel',
      check_in_at:  utcCheckIn,
      check_in_tz:  'America/New_York',
      check_out_at: utcCheckOut,
      check_out_tz: 'America/New_York',
    }, AUTH);

    expect(res.status).toBe(201);

    // Model must be called with the exact UTC string — no backend transformation
    expect(stayModel.createStay).toHaveBeenCalledWith(
      expect.objectContaining({
        check_in_at:  utcCheckIn,
        check_in_tz:  'America/New_York',
        check_out_at: utcCheckOut,
        check_out_tz: 'America/New_York',
      }),
    );

    // Response returns the model value unchanged
    expect(res.body.data.check_in_at).toBe(utcCheckIn);
    expect(res.body.data.check_in_at.endsWith('Z')).toBe(true);
  });
});

// ============================================================================
// T-098 — PATCH /stays: UTC check_in_at update passes through correctly
// ============================================================================

describe('T-098 — PATCH /stays updates UTC check_in_at without offset shift', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(BASE_TRIP);
  });

  it('passes updated UTC check_in_at to updateStay unchanged (4 PM PDT = T23:00Z)', async () => {
    const newUtcCheckIn = '2026-08-07T23:00:00.000Z'; // 4:00 PM PDT (UTC-7)
    stayModel.findStayById.mockResolvedValue(BASE_STAY);
    stayModel.updateStay.mockResolvedValue({
      ...BASE_STAY,
      check_in_at:  newUtcCheckIn,
      check_in_tz:  'America/Los_Angeles',
    });

    const res = await request(
      buildStaysApp(),
      'PATCH',
      `/api/v1/trips/${TRIP_UUID}/stays/${STAY_UUID}`,
      { check_in_at: newUtcCheckIn, check_in_tz: 'America/Los_Angeles' },
      AUTH,
    );

    expect(res.status).toBe(200);

    // Model called with exact UTC string — no offset transformation
    expect(stayModel.updateStay).toHaveBeenCalledWith(
      STAY_UUID,
      expect.objectContaining({
        check_in_at: newUtcCheckIn,
        check_in_tz: 'America/Los_Angeles',
      }),
    );

    // Response returns the model value unchanged
    expect(res.body.data.check_in_at).toBe(newUtcCheckIn);
    expect(res.body.data.check_in_at.endsWith('Z')).toBe(true);
  });
});

// ============================================================================
// T-103 — GET /trips/:id — notes field included in response
// ============================================================================

describe('T-103 — GET /trips/:id includes notes field', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns notes as null when field is not set', async () => {
    tripModel.findTripById.mockResolvedValue({ ...BASE_TRIP, notes: null });

    const res = await request(buildTripsApp(), 'GET', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(200);
    expect(Object.prototype.hasOwnProperty.call(res.body.data, 'notes')).toBe(true);
    expect(res.body.data.notes).toBeNull();
  });

  it('returns notes string when notes are set', async () => {
    tripModel.findTripById.mockResolvedValue({
      ...BASE_TRIP,
      notes: 'My Tokyo trip notes — cherry blossom season!',
    });

    const res = await request(buildTripsApp(), 'GET', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('My Tokyo trip notes — cherry blossom season!');
  });
});

// ============================================================================
// T-103 — GET /trips — notes field included in list
// ============================================================================

describe('T-103 — GET /trips list includes notes field in each trip', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns notes field on every trip in the list (set + null)', async () => {
    tripModel.listTripsByUser.mockResolvedValue({
      trips: [
        { ...BASE_TRIP, id: TRIP_UUID, notes: 'Trip 1 notes' },
        { ...BASE_TRIP, id: OTHER_UUID, notes: null },
      ],
      total: 2,
    });

    const res = await request(buildTripsApp(), 'GET', '/api/v1/trips', null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(Object.prototype.hasOwnProperty.call(res.body.data[0], 'notes')).toBe(true);
    expect(res.body.data[0].notes).toBe('Trip 1 notes');
    expect(res.body.data[1].notes).toBeNull();
  });
});

// ============================================================================
// T-103 — PATCH /trips/:id — notes field CRUD
// ============================================================================

describe('T-103 — PATCH /trips/:id notes field', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: sets notes on a trip', async () => {
    const notes = 'Pack an umbrella for rainy season.';
    tripModel.findTripById.mockResolvedValue(BASE_TRIP);
    tripModel.updateTrip.mockResolvedValue({ ...BASE_TRIP, notes });

    const res = await request(
      buildTripsApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`,
      { notes },
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(tripModel.updateTrip).toHaveBeenCalledWith(
      TRIP_UUID,
      expect.objectContaining({ notes }),
    );
    expect(res.body.data.notes).toBe(notes);
  });

  it('happy path: clears notes with null', async () => {
    const tripWithNotes = { ...BASE_TRIP, notes: 'Old notes' };
    tripModel.findTripById.mockResolvedValue(tripWithNotes);
    tripModel.updateTrip.mockResolvedValue({ ...tripWithNotes, notes: null });

    const res = await request(
      buildTripsApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`,
      { notes: null },
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(tripModel.updateTrip).toHaveBeenCalledWith(
      TRIP_UUID,
      expect.objectContaining({ notes: null }),
    );
    expect(res.body.data.notes).toBeNull();
  });

  it('happy path: notes exactly 2000 chars is accepted', async () => {
    const maxNotes = 'a'.repeat(2000);
    tripModel.findTripById.mockResolvedValue(BASE_TRIP);
    tripModel.updateTrip.mockResolvedValue({ ...BASE_TRIP, notes: maxNotes });

    const res = await request(
      buildTripsApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`,
      { notes: maxNotes },
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe(maxNotes);
  });

  it('error path: notes > 2000 chars returns 400 VALIDATION_ERROR', async () => {
    tripModel.findTripById.mockResolvedValue(BASE_TRIP);
    const tooLong = 'x'.repeat(2001);

    const res = await request(
      buildTripsApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`,
      { notes: tooLong },
      AUTH,
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.notes).toMatch(/2000/);
    // updateTrip must NOT be called — validation rejects before hitting the model
    expect(tripModel.updateTrip).not.toHaveBeenCalled();
  });

  it('happy path: PATCH without notes field leaves existing notes unchanged', async () => {
    const tripWithNotes = { ...BASE_TRIP, notes: 'Existing notes' };
    tripModel.findTripById.mockResolvedValue(tripWithNotes);
    tripModel.updateTrip.mockResolvedValue({ ...tripWithNotes, name: 'New Name' });

    const res = await request(
      buildTripsApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`,
      { name: 'New Name' }, // notes intentionally omitted
      AUTH,
    );

    expect(res.status).toBe(200);
    // updateTrip must NOT receive a notes key — omitting it means "don't touch it"
    const callArg = tripModel.updateTrip.mock.calls[0][1];
    expect(Object.prototype.hasOwnProperty.call(callArg, 'notes')).toBe(false);
  });

  it('happy path: empty-string notes normalized to null before storage', async () => {
    tripModel.findTripById.mockResolvedValue(BASE_TRIP);
    tripModel.updateTrip.mockResolvedValue({ ...BASE_TRIP, notes: null });

    const res = await request(
      buildTripsApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`,
      { notes: '   ' }, // whitespace-only → trimmed to '' → normalized to null
      AUTH,
    );

    expect(res.status).toBe(200);
    expect(tripModel.updateTrip).toHaveBeenCalledWith(
      TRIP_UUID,
      expect.objectContaining({ notes: null }),
    );
  });
});

// ============================================================================
// T-103 — POST /trips — notes field on creation
// ============================================================================

describe('T-103 — POST /trips notes field', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: creates trip with notes when provided', async () => {
    const notes = 'Initial notes for the trip.';
    tripModel.createTrip.mockResolvedValue({ ...BASE_TRIP, notes });

    const res = await request(buildTripsApp(), 'POST', '/api/v1/trips', {
      name: 'Tokyo Trip',
      destinations: ['Tokyo'],
      notes,
    }, AUTH);

    expect(res.status).toBe(201);
    expect(tripModel.createTrip).toHaveBeenCalledWith(
      expect.objectContaining({ notes }),
    );
    expect(res.body.data.notes).toBe(notes);
  });

  it('error path: notes > 2000 chars on POST returns 400 VALIDATION_ERROR', async () => {
    const res = await request(buildTripsApp(), 'POST', '/api/v1/trips', {
      name: 'Tokyo Trip',
      destinations: ['Tokyo'],
      notes: 'y'.repeat(2001),
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.notes).toMatch(/2000/);
    expect(tripModel.createTrip).not.toHaveBeenCalled();
  });

  it('happy path: creates trip without notes when field is omitted', async () => {
    tripModel.createTrip.mockResolvedValue({ ...BASE_TRIP, notes: null });

    const res = await request(buildTripsApp(), 'POST', '/api/v1/trips', {
      name: 'Tokyo Trip',
      destinations: ['Tokyo'],
      // notes intentionally omitted
    }, AUTH);

    expect(res.status).toBe(201);
    // createTrip must NOT receive a notes key — undefined means "don't set"
    const callArg = tripModel.createTrip.mock.calls[0][0];
    expect(Object.prototype.hasOwnProperty.call(callArg, 'notes')).toBe(false);
  });

  it('happy path: notes: null on POST stores null', async () => {
    tripModel.createTrip.mockResolvedValue({ ...BASE_TRIP, notes: null });

    const res = await request(buildTripsApp(), 'POST', '/api/v1/trips', {
      name: 'Tokyo Trip',
      destinations: ['Tokyo'],
      notes: null,
    }, AUTH);

    expect(res.status).toBe(201);
    expect(tripModel.createTrip).toHaveBeenCalledWith(
      expect.objectContaining({ notes: null }),
    );
  });

  it('happy path: empty-string notes on POST normalized to null (Sprint 9 contract correction)', async () => {
    // Sprint 9 / BE-S9: API contract correction — PATCH /trips/:id and POST /trips
    // must normalize notes: "" to null. GET endpoints never return "".
    // This test verifies POST-side normalization explicitly.
    tripModel.createTrip.mockResolvedValue({ ...BASE_TRIP, notes: null });

    const res = await request(buildTripsApp(), 'POST', '/api/v1/trips', {
      name: 'Tokyo Trip',
      destinations: ['Tokyo'],
      notes: '',   // empty string → route normalizes via `|| null` → null
    }, AUTH);

    expect(res.status).toBe(201);
    // createTrip must receive notes: null (not notes: "")
    expect(tripModel.createTrip).toHaveBeenCalledWith(
      expect.objectContaining({ notes: null }),
    );
    expect(res.body.data.notes).toBeNull();
  });
});
