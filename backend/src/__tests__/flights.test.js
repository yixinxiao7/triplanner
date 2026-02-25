import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/tripModel.js', () => ({
  findTripById: vi.fn(),
}));

vi.mock('../models/flightModel.js', () => ({
  listFlightsByTrip: vi.fn(),
  findFlightById: vi.fn(),
  createFlight: vi.fn(),
  updateFlight: vi.fn(),
  deleteFlight: vi.fn(),
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
import flightsRoutes from '../routes/flights.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import * as tripModel from '../models/tripModel.js';
import * as flightModel from '../models/flightModel.js';

const TRIP_UUID = '550e8400-e29b-41d4-a716-446655440001';
const FLIGHT_UUID = '550e8400-e29b-41d4-a716-446655440010';
const NOTFOUND_UUID = '550e8400-e29b-41d4-a716-446655440099';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.param('tripId', uuidParamHandler);
  app.use('/api/v1/trips/:tripId/flights', flightsRoutes);
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
const mockFlight = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  trip_id: '550e8400-e29b-41d4-a716-446655440001',
  flight_number: 'AA100',
  airline: 'American Airlines',
  from_location: 'JFK',
  to_location: 'LAX',
  departure_at: '2026-08-07T10:00:00.000Z',
  departure_tz: 'America/New_York',
  arrival_at: '2026-08-07T16:00:00.000Z',
  arrival_tz: 'America/Los_Angeles',
  created_at: '2026-02-24T12:00:00.000Z',
  updated_at: '2026-02-24T12:00:00.000Z',
};

describe('GET /api/v1/trips/:tripId/flights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('happy path: returns list of flights', async () => {
    flightModel.listFlightsByTrip.mockResolvedValue([mockFlight]);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/flights`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].flight_number).toBe('AA100');
  });

  it('happy path: returns empty array when no flights', async () => {
    flightModel.listFlightsByTrip.mockResolvedValue([]);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/flights`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('error path: returns 404 when trip not found', async () => {
    tripModel.findTripById.mockResolvedValue(null);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${NOTFOUND_UUID}/flights`, null, AUTH);

    expect(res.status).toBe(404);
  });

  it('error path: returns 401 without auth', async () => {
    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/flights`, null);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/trips/:tripId/flights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
    flightModel.createFlight.mockResolvedValue(mockFlight);
  });

  it('happy path: creates flight and returns 201', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/flights`, {
      flight_number: 'AA100',
      airline: 'American Airlines',
      from_location: 'JFK',
      to_location: 'LAX',
      departure_at: '2026-08-07T10:00:00.000Z',
      departure_tz: 'America/New_York',
      arrival_at: '2026-08-07T16:00:00.000Z',
      arrival_tz: 'America/Los_Angeles',
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.flight_number).toBe('AA100');
  });

  it('error path: returns 400 when arrival is before departure', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/flights`, {
      flight_number: 'AA100',
      airline: 'American Airlines',
      from_location: 'JFK',
      to_location: 'LAX',
      departure_at: '2026-08-07T16:00:00.000Z',
      departure_tz: 'America/New_York',
      arrival_at: '2026-08-07T10:00:00.000Z', // BEFORE departure
      arrival_tz: 'America/Los_Angeles',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields.arrival_at).toMatch(/after departure/);
  });

  it('error path: returns 400 when required fields are missing', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/flights`, {
      airline: 'American Airlines',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.flight_number).toBeDefined();
  });

  it('error path: returns 403 when trip belongs to another user', async () => {
    tripModel.findTripById.mockResolvedValue({ ...mockTrip, user_id: 'other-user' });

    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/flights`, {
      flight_number: 'AA100',
      airline: 'Test',
      from_location: 'JFK',
      to_location: 'LAX',
      departure_at: '2026-08-07T10:00:00.000Z',
      departure_tz: 'America/New_York',
      arrival_at: '2026-08-07T16:00:00.000Z',
      arrival_tz: 'America/Los_Angeles',
    }, AUTH);

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/v1/trips/:tripId/flights/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('happy path: deletes flight and returns 204', async () => {
    flightModel.findFlightById.mockResolvedValue(mockFlight);
    flightModel.deleteFlight.mockResolvedValue(1);

    const res = await request(buildApp(), 'DELETE', `/api/v1/trips/${TRIP_UUID}/flights/${FLIGHT_UUID}`, null, AUTH);

    expect(res.status).toBe(204);
  });

  it('error path: returns 404 when flight not found', async () => {
    flightModel.findFlightById.mockResolvedValue(null);

    const res = await request(buildApp(), 'DELETE', `/api/v1/trips/${TRIP_UUID}/flights/${NOTFOUND_UUID}`, null, AUTH);

    expect(res.status).toBe(404);
  });
});
