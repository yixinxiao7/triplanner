import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the import model (transaction-backed commit) ─────────────────────────
vi.mock('../models/importModel.js', () => ({
  importTrip: vi.fn(),
}));

// The import route transitively imports the resource route files for their
// validation schemas; those pull in models → config/database.js, which calls
// knex() at module load and crashes under NODE_ENV=test (no test db config).
// Stub the db module so only the schemas (not real DB access) are exercised.
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
import importRoutes from '../routes/import.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as importModel from '../models/importModel.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/trips/import', importRoutes);
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

const createdTrip = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  user_id: 'user-1',
  name: 'Japan 2026',
  destinations: ['Tokyo', 'Osaka'],
  status: 'PLANNING',
  start_date: '2026-08-07',
  end_date: '2026-08-14',
  notes: null,
};

/** A fully-valid import payload with one of each child. */
function validPayload() {
  return {
    trip: { name: 'Japan 2026', destinations: ['Tokyo', 'Osaka'], start_date: '2026-08-07', end_date: '2026-08-14', notes: null },
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

describe('POST /api/v1/trips/import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    importModel.importTrip.mockResolvedValue(createdTrip);
  });

  it('happy path: creates trip + all children, returns 201', async () => {
    const payload = validPayload();
    const res = await request(buildApp(), 'POST', '/api/v1/trips/import', payload, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(createdTrip.id);
    expect(importModel.importTrip).toHaveBeenCalledOnce();
    // Ownership: committed under the authenticated user, with all children passed through.
    const [userId, committed] = importModel.importTrip.mock.calls[0];
    expect(userId).toBe('user-1');
    expect(committed.flights).toHaveLength(1);
    expect(committed.stays).toHaveLength(1);
    expect(committed.activities).toHaveLength(1);
    expect(committed.land_travels).toHaveLength(1);
  });

  it('happy path: trip meta only (empty child arrays) is valid', async () => {
    const res = await request(buildApp(), 'POST', '/api/v1/trips/import', {
      trip: { name: 'Solo', destinations: ['Kyoto'] },
      flights: [], stays: [], activities: [], land_travels: [],
    }, AUTH);

    expect(res.status).toBe(201);
    expect(importModel.importTrip).toHaveBeenCalledOnce();
  });

  it('rollback path: invalid child → 400, importTrip NOT called (no trip created)', async () => {
    const payload = validPayload();
    // Naive datetime (no offset) — the flight validator rejects this.
    payload.flights[0].departure_at = '2026-08-07T06:50:00';

    const res = await request(buildApp(), 'POST', '/api/v1/trips/import', payload, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    // Indexed field path points at the offending row.
    expect(res.body.error.fields['flights[0].departure_at']).toBeDefined();
    // Because validation failed, nothing is committed — no orphan trip.
    expect(importModel.importTrip).not.toHaveBeenCalled();
  });

  it('error path: invalid trip meta (missing name) → 400 with trip.name path', async () => {
    const payload = validPayload();
    delete payload.trip.name;

    const res = await request(buildApp(), 'POST', '/api/v1/trips/import', payload, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields['trip.name']).toBeDefined();
    expect(importModel.importTrip).not.toHaveBeenCalled();
  });

  it('error path: invalid stay category → 400 with indexed path', async () => {
    const payload = validPayload();
    payload.stays[0].category = 'MOTEL'; // not in HOTEL|AIRBNB|VRBO

    const res = await request(buildApp(), 'POST', '/api/v1/trips/import', payload, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields['stays[0].category']).toBeDefined();
    expect(importModel.importTrip).not.toHaveBeenCalled();
  });

  it('error path: activity with start_time but no end_time → 400 linked-time error', async () => {
    const payload = validPayload();
    payload.activities[0].end_time = null;

    const res = await request(buildApp(), 'POST', '/api/v1/trips/import', payload, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields['activities[0].end_time']).toBeDefined();
    expect(importModel.importTrip).not.toHaveBeenCalled();
  });

  it('error path: missing trip object → 400', async () => {
    const res = await request(buildApp(), 'POST', '/api/v1/trips/import', { flights: [] }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(importModel.importTrip).not.toHaveBeenCalled();
  });

  it('error path: non-array child collection → 400', async () => {
    const res = await request(buildApp(), 'POST', '/api/v1/trips/import', {
      trip: { name: 'X', destinations: ['Y'] },
      flights: 'not-an-array',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields.flights).toBeDefined();
    expect(importModel.importTrip).not.toHaveBeenCalled();
  });

  it('error path: 401 without auth', async () => {
    const res = await request(buildApp(), 'POST', '/api/v1/trips/import', validPayload());
    expect(res.status).toBe(401);
    expect(importModel.importTrip).not.toHaveBeenCalled();
  });
});
