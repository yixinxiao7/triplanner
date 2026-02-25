import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/tripModel.js', () => ({
  findTripById: vi.fn(),
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
    verify: vi.fn((token) => {
      if (token === 'valid-token') return { id: 'user-1', email: 'jane@example.com', name: 'Jane' };
      throw new Error('Invalid token');
    }),
  },
}));

import express from 'express';
import staysRoutes from '../routes/stays.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import * as tripModel from '../models/tripModel.js';
import * as stayModel from '../models/stayModel.js';

const TRIP_UUID = '550e8400-e29b-41d4-a716-446655440001';
const STAY_UUID = '550e8400-e29b-41d4-a716-446655440020';
const NOTFOUND_UUID = '550e8400-e29b-41d4-a716-446655440099';

function buildApp() {
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
const mockTrip = { id: '550e8400-e29b-41d4-a716-446655440001', user_id: 'user-1', name: 'Test Trip' };
const mockStay = {
  id: '550e8400-e29b-41d4-a716-446655440020',
  trip_id: '550e8400-e29b-41d4-a716-446655440001',
  category: 'HOTEL',
  name: 'Hyatt Regency',
  address: '5 Embarcadero Center',
  check_in_at: '2026-08-07T20:00:00.000Z',
  check_in_tz: 'America/Los_Angeles',
  check_out_at: '2026-08-09T15:00:00.000Z',
  check_out_tz: 'America/Los_Angeles',
  created_at: '2026-02-24T12:00:00.000Z',
  updated_at: '2026-02-24T12:00:00.000Z',
};

describe('GET /api/v1/trips/:tripId/stays', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('happy path: returns list of stays', async () => {
    stayModel.listStaysByTrip.mockResolvedValue([mockStay]);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/stays`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].category).toBe('HOTEL');
  });

  it('error path: returns 401 without auth', async () => {
    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/stays`, null);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/trips/:tripId/stays', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
    stayModel.createStay.mockResolvedValue(mockStay);
  });

  it('happy path: creates stay and returns 201', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/stays`, {
      category: 'HOTEL',
      name: 'Hyatt Regency',
      address: '5 Embarcadero Center',
      check_in_at: '2026-08-07T20:00:00.000Z',
      check_in_tz: 'America/Los_Angeles',
      check_out_at: '2026-08-09T15:00:00.000Z',
      check_out_tz: 'America/Los_Angeles',
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.category).toBe('HOTEL');
  });

  it('happy path: address is optional (null)', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/stays`, {
      category: 'AIRBNB',
      name: 'Nice Airbnb',
      check_in_at: '2026-08-07T20:00:00.000Z',
      check_in_tz: 'America/Los_Angeles',
      check_out_at: '2026-08-09T15:00:00.000Z',
      check_out_tz: 'America/Los_Angeles',
    }, AUTH);

    expect(res.status).toBe(201);
  });

  it('error path: returns 400 for invalid category', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/stays`, {
      category: 'HOSTEL',
      name: 'Test',
      check_in_at: '2026-08-07T20:00:00.000Z',
      check_in_tz: 'America/Los_Angeles',
      check_out_at: '2026-08-09T15:00:00.000Z',
      check_out_tz: 'America/Los_Angeles',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields.category).toMatch(/HOTEL.*AIRBNB.*VRBO/);
  });

  it('error path: returns 400 when check_out is before check_in', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/stays`, {
      category: 'HOTEL',
      name: 'Test Hotel',
      check_in_at: '2026-08-09T15:00:00.000Z',
      check_in_tz: 'America/Los_Angeles',
      check_out_at: '2026-08-07T20:00:00.000Z', // BEFORE check-in
      check_out_tz: 'America/Los_Angeles',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields.check_out_at).toMatch(/after check-in/);
  });
});

describe('DELETE /api/v1/trips/:tripId/stays/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('happy path: deletes stay and returns 204', async () => {
    stayModel.findStayById.mockResolvedValue(mockStay);
    stayModel.deleteStay.mockResolvedValue(1);

    const res = await request(buildApp(), 'DELETE', `/api/v1/trips/${TRIP_UUID}/stays/${STAY_UUID}`, null, AUTH);

    expect(res.status).toBe(204);
  });

  it('error path: returns 404 when stay not found', async () => {
    stayModel.findStayById.mockResolvedValue(null);

    const res = await request(buildApp(), 'DELETE', `/api/v1/trips/${TRIP_UUID}/stays/${NOTFOUND_UUID}`, null, AUTH);

    expect(res.status).toBe(404);
  });
});
