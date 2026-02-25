import { describe, it, expect, vi, beforeEach } from 'vitest';

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

const TRIP_UUID = '550e8400-e29b-41d4-a716-446655440001';
const ACTIVITY_UUID = '550e8400-e29b-41d4-a716-446655440030';
const NOTFOUND_UUID = '550e8400-e29b-41d4-a716-446655440099';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.param('tripId', uuidParamHandler);
  app.use('/api/v1/trips/:tripId/activities', activitiesRoutes);
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
const mockActivity = {
  id: '550e8400-e29b-41d4-a716-446655440030',
  trip_id: '550e8400-e29b-41d4-a716-446655440001',
  name: "Fisherman's Wharf",
  location: "Fisherman's Wharf, SF",
  activity_date: '2026-08-08',
  start_time: '09:00:00',
  end_time: '14:00:00',
  created_at: '2026-02-24T12:00:00.000Z',
  updated_at: '2026-02-24T12:00:00.000Z',
};

describe('GET /api/v1/trips/:tripId/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('happy path: returns list of activities', async () => {
    activityModel.listActivitiesByTrip.mockResolvedValue([mockActivity]);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/activities`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Fisherman's Wharf");
  });

  it('happy path: returns empty array when no activities', async () => {
    activityModel.listActivitiesByTrip.mockResolvedValue([]);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/activities`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('error path: returns 401 without auth', async () => {
    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}/activities`, null);
    expect(res.status).toBe(401);
  });

  it('error path: returns 404 when trip not found', async () => {
    tripModel.findTripById.mockResolvedValue(null);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${NOTFOUND_UUID}/activities`, null, AUTH);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/trips/:tripId/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
    activityModel.createActivity.mockResolvedValue(mockActivity);
  });

  it('happy path: creates activity and returns 201', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/activities`, {
      name: "Fisherman's Wharf",
      location: "Fisherman's Wharf, SF",
      activity_date: '2026-08-08',
      start_time: '09:00',
      end_time: '14:00',
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Fisherman's Wharf");
  });

  it('happy path: location is optional', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/activities`, {
      name: 'Museum Visit',
      activity_date: '2026-08-08',
      start_time: '10:00',
      end_time: '12:00',
    }, AUTH);

    expect(res.status).toBe(201);
  });

  it('error path: returns 400 for invalid date format', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/activities`, {
      name: 'Test',
      activity_date: '08-08-2026', // wrong format
      start_time: '09:00',
      end_time: '14:00',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields.activity_date).toMatch(/YYYY-MM-DD/);
  });

  it('error path: returns 400 when end_time is before start_time', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/activities`, {
      name: 'Test Activity',
      activity_date: '2026-08-08',
      start_time: '14:00',
      end_time: '09:00', // BEFORE start
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields.end_time).toMatch(/after start/);
  });

  it('error path: returns 400 when required fields missing', async () => {
    // name is provided, activity_date is still required.
    // start_time and end_time are optional since T-043 (Sprint 3) — both omitted = "all day" activity.
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/activities`, {}, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields.name).toBeDefined();
    expect(res.body.error.fields.activity_date).toBeDefined();
  });

  it('error path: returns 403 for wrong trip owner', async () => {
    tripModel.findTripById.mockResolvedValue({ ...mockTrip, user_id: 'other-user' });

    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/activities`, {
      name: 'Test',
      activity_date: '2026-08-08',
      start_time: '09:00',
      end_time: '14:00',
    }, AUTH);

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/v1/trips/:tripId/activities/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('happy path: deletes activity and returns 204', async () => {
    activityModel.findActivityById.mockResolvedValue(mockActivity);
    activityModel.deleteActivity.mockResolvedValue(1);

    const res = await request(buildApp(), 'DELETE', `/api/v1/trips/${TRIP_UUID}/activities/${ACTIVITY_UUID}`, null, AUTH);

    expect(res.status).toBe(204);
  });

  it('error path: returns 404 when activity not found', async () => {
    activityModel.findActivityById.mockResolvedValue(null);

    const res = await request(buildApp(), 'DELETE', `/api/v1/trips/${TRIP_UUID}/activities/${NOTFOUND_UUID}`, null, AUTH);

    expect(res.status).toBe(404);
  });
});
