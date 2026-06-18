import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the import model (transaction-backed append) ────────────────────────
vi.mock('../models/importModel.js', () => ({
  appendImportToTrip: vi.fn(),
}));

// ── Mock the trip model (ownership lookup) ───────────────────────────────────
vi.mock('../models/tripModel.js', () => ({
  findTripById: vi.fn(),
}));

// The route transitively imports the resource route files for their validation
// schemas; those pull in models → config/database.js, which calls knex() at
// module load and crashes under NODE_ENV=test (no test db config). Stub the db
// module so only the schemas (not real DB access) are exercised.
vi.mock('../config/database.js', () => ({
  default: { transaction: vi.fn(), raw: vi.fn((sql) => sql) },
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
import tripImportRoutes from '../routes/tripImport.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import * as importModel from '../models/importModel.js';
import * as tripModel from '../models/tripModel.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.param('tripId', uuidParamHandler);
  app.use('/api/v1/trips/:tripId/import', tripImportRoutes);
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
          res.on('end', () => { server.close(); resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }); });
        });
        req.on('error', (e) => { server.close(); reject(e); });
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    });
  });
}

const AUTH = { Authorization: 'Bearer valid-token' };
const TRIP_ID = '550e8400-e29b-41d4-a716-446655440001';
const URL = `/api/v1/trips/${TRIP_ID}/import`;

const ownedTrip = { id: TRIP_ID, user_id: 'user-1', name: 'Japan 2026' };

/** A fully-valid append payload with one of each child (no trip meta). */
function validPayload() {
  return {
    flights: [{
      flight_number: 'AA100', airline: 'American', from_location: 'JFK', to_location: 'HND',
      departure_at: '2026-08-07T06:50:00-04:00', departure_tz: 'America/New_York',
      arrival_at: '2026-08-08T11:00:00+09:00', arrival_tz: 'Asia/Tokyo',
    }],
    stays: [{
      category: 'HOTEL', name: 'Park Hyatt', address: 'Shinjuku',
      check_in_at: '2026-08-08T15:00:00+09:00', check_in_tz: 'Asia/Tokyo',
      check_out_at: '2026-08-10T11:00:00+09:00', check_out_tz: 'Asia/Tokyo',
    }],
    activities: [{ name: 'TeamLab', location: 'Odaiba', activity_date: '2026-08-09', start_time: '10:00', end_time: '12:00', notes: null }],
    land_travels: [{
      mode: 'TRAIN', provider: 'JR', from_location: 'Tokyo', to_location: 'Osaka',
      departure_date: '2026-08-11', departure_time: '09:00', arrival_date: '2026-08-11', arrival_time: '11:30',
      confirmation_number: 'ABC123', notes: null,
    }],
  };
}

describe('POST /api/v1/trips/:tripId/import (append into existing trip)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(ownedTrip);
    importModel.appendImportToTrip.mockResolvedValue({
      flights: [{ id: 'f1' }], stays: [{ id: 's1' }], activities: [{ id: 'a1' }], land_travels: [{ id: 'l1' }],
    });
  });

  it('happy path: appends all children, returns 201 with created rows', async () => {
    const res = await request(buildApp(), 'POST', URL, validPayload(), AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.flights).toHaveLength(1);
    expect(res.body.data.stays).toHaveLength(1);
    expect(res.body.data.activities).toHaveLength(1);
    expect(res.body.data.land_travels).toHaveLength(1);
    expect(importModel.appendImportToTrip).toHaveBeenCalledOnce();
    const [tripId, committed] = importModel.appendImportToTrip.mock.calls[0];
    expect(tripId).toBe(TRIP_ID);
    expect(committed.flights).toHaveLength(1);
    expect(committed.land_travels).toHaveLength(1);
  });

  it('happy path: a subset of resources (only activities) is valid', async () => {
    const res = await request(buildApp(), 'POST', URL, {
      activities: [{ name: 'Walk', activity_date: '2026-08-09' }],
    }, AUTH);

    expect(res.status).toBe(201);
    expect(importModel.appendImportToTrip).toHaveBeenCalledOnce();
  });

  it('empty payload (zero items across all arrays) → 400 EMPTY_IMPORT', async () => {
    const res = await request(buildApp(), 'POST', URL, {
      flights: [], stays: [], activities: [], land_travels: [],
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMPTY_IMPORT');
    expect(res.body.error.message).toBe('No items to import');
    expect(importModel.appendImportToTrip).not.toHaveBeenCalled();
  });

  it('empty payload (no keys at all) → 400 EMPTY_IMPORT', async () => {
    const res = await request(buildApp(), 'POST', URL, {}, AUTH);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMPTY_IMPORT');
    expect(importModel.appendImportToTrip).not.toHaveBeenCalled();
  });

  it('ownership: trip not found → 404', async () => {
    tripModel.findTripById.mockResolvedValue(undefined);
    const res = await request(buildApp(), 'POST', URL, validPayload(), AUTH);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(importModel.appendImportToTrip).not.toHaveBeenCalled();
  });

  it('ownership: trip owned by another user → 404 (not 403, no leak)', async () => {
    tripModel.findTripById.mockResolvedValue({ ...ownedTrip, user_id: 'someone-else' });
    const res = await request(buildApp(), 'POST', URL, validPayload(), AUTH);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(importModel.appendImportToTrip).not.toHaveBeenCalled();
  });

  it('validation: invalid child (naive datetime) → 400 with indexed path, nothing committed', async () => {
    const payload = validPayload();
    payload.flights[0].departure_at = '2026-08-07T06:50:00'; // no offset

    const res = await request(buildApp(), 'POST', URL, payload, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields['flights[0].departure_at']).toBeDefined();
    expect(importModel.appendImportToTrip).not.toHaveBeenCalled();
  });

  it('validation: stay with naive check_in_at (no offset) → 400 with indexed path (M2)', async () => {
    const payload = validPayload();
    payload.stays[0].check_in_at = '2026-08-08T15:00:00'; // no offset

    const res = await request(buildApp(), 'POST', URL, payload, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields['stays[0].check_in_at']).toBeDefined();
    expect(importModel.appendImportToTrip).not.toHaveBeenCalled();
  });

  it('validation: invalid stay category → 400 with indexed path', async () => {
    const payload = validPayload();
    payload.stays[0].category = 'MOTEL';

    const res = await request(buildApp(), 'POST', URL, payload, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields['stays[0].category']).toBeDefined();
    expect(importModel.appendImportToTrip).not.toHaveBeenCalled();
  });

  it('validation: activity with start_time but no end_time → 400 linked-time error', async () => {
    const payload = validPayload();
    payload.activities[0].end_time = null;

    const res = await request(buildApp(), 'POST', URL, payload, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields['activities[0].end_time']).toBeDefined();
    expect(importModel.appendImportToTrip).not.toHaveBeenCalled();
  });

  it('validation: invalid land_travel (bad mode) → 400 with indexed path, nothing committed', async () => {
    const payload = validPayload();
    payload.land_travels[0].mode = 'SUBMARINE';

    const res = await request(buildApp(), 'POST', URL, payload, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields['land_travels[0].mode']).toBeDefined();
    expect(importModel.appendImportToTrip).not.toHaveBeenCalled();
  });

  it('validation: a later array index reports the correct indexed path (not index 0)', async () => {
    const payload = { activities: [
      { name: 'Valid', activity_date: '2026-08-09' },
      { name: '', activity_date: '2026-08-10' }, // index 1 invalid (empty name)
    ] };

    const res = await request(buildApp(), 'POST', URL, payload, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields['activities[1].name']).toBeDefined();
    expect(res.body.error.fields['activities[0].name']).toBeUndefined();
    expect(importModel.appendImportToTrip).not.toHaveBeenCalled();
  });

  it('non-empty payload reaches the model exactly once (route does not double-commit)', async () => {
    await request(buildApp(), 'POST', URL, validPayload(), AUTH);
    expect(importModel.appendImportToTrip).toHaveBeenCalledTimes(1);
  });

  it('validation: non-array child collection → 400', async () => {
    const res = await request(buildApp(), 'POST', URL, { flights: 'not-an-array' }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields.flights).toBeDefined();
    expect(importModel.appendImportToTrip).not.toHaveBeenCalled();
  });

  it('error path: 401 without auth', async () => {
    const res = await request(buildApp(), 'POST', URL, validPayload());
    expect(res.status).toBe(401);
    expect(importModel.appendImportToTrip).not.toHaveBeenCalled();
  });

  it('error path: invalid (non-UUID) trip id → 400', async () => {
    const res = await request(buildApp(), 'POST', '/api/v1/trips/not-a-uuid/import', validPayload(), AUTH);
    expect(res.status).toBe(400);
    expect(importModel.appendImportToTrip).not.toHaveBeenCalled();
  });
});
