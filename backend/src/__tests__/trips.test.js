import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/tripModel.js', () => ({
  listTripsByUser: vi.fn(),
  findTripById: vi.fn(),
  createTrip: vi.fn(),
  updateTrip: vi.fn(),
  deleteTrip: vi.fn(),
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

import express from 'express';
import tripsRoutes from '../routes/trips.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as tripModel from '../models/tripModel.js';

const TRIP_UUID = '550e8400-e29b-41d4-a716-446655440001';
const NOTFOUND_UUID = '550e8400-e29b-41d4-a716-446655440099';

function buildApp() {
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
      const url = `http://localhost:${port}${path}`;
      const options = {
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json', ...headers },
      };
      import('http').then(({ default: http }) => {
        const req = http.request(url, options, (res) => {
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

const AUTH = { Authorization: 'Bearer valid-token' };

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

describe('GET /api/v1/trips', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: returns 200 with trip list', async () => {
    tripModel.listTripsByUser.mockResolvedValue({ trips: [mockTrip], total: 1 });

    const res = await request(buildApp(), 'GET', '/api/v1/trips', null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });

  it('error path: returns 401 without auth token', async () => {
    const res = await request(buildApp(), 'GET', '/api/v1/trips', null);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/trips', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: creates trip and returns 201', async () => {
    tripModel.createTrip.mockResolvedValue(mockTrip);

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Japan 2026',
      destinations: ['Tokyo', 'Osaka'],
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Japan 2026');
  });

  it('happy path: accepts comma-separated destinations string', async () => {
    tripModel.createTrip.mockResolvedValue(mockTrip);

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Japan 2026',
      destinations: 'Tokyo, Osaka',
    }, AUTH);

    expect(res.status).toBe(201);
  });

  it('error path: returns 400 when name is missing', async () => {
    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      destinations: ['Tokyo'],
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.name).toBeDefined();
  });

  it('error path: returns 400 when destinations is empty', async () => {
    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Japan 2026',
      destinations: [],
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields.destinations).toBeDefined();
  });

  it('error path: returns 401 without auth', async () => {
    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Japan',
      destinations: ['Tokyo'],
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/trips/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: returns trip owned by user', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(TRIP_UUID);
  });

  it('error path: returns 404 when trip not found', async () => {
    tripModel.findTripById.mockResolvedValue(null);

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${NOTFOUND_UUID}`, null, AUTH);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('error path: returns 403 when trip belongs to another user', async () => {
    tripModel.findTripById.mockResolvedValue({ ...mockTrip, user_id: 'other-user' });

    const res = await request(buildApp(), 'GET', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('PATCH /api/v1/trips/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: updates trip name', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);
    tripModel.updateTrip.mockResolvedValue({ ...mockTrip, name: 'Japan Updated' });

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      name: 'Japan Updated',
    }, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Japan Updated');
  });

  it('error path: returns 400 for invalid status value', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      status: 'INVALID_STATUS',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.fields.status).toBeDefined();
  });

  it('error path: returns 400 when no updatable fields provided', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      unknownField: 'value',
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NO_UPDATABLE_FIELDS');
  });
});

describe('DELETE /api/v1/trips/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: deletes trip and returns 204', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);
    tripModel.deleteTrip.mockResolvedValue(1);

    const res = await request(buildApp(), 'DELETE', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(204);
  });

  it('error path: returns 404 when trip not found', async () => {
    tripModel.findTripById.mockResolvedValue(null);

    const res = await request(buildApp(), 'DELETE', `/api/v1/trips/${NOTFOUND_UUID}`, null, AUTH);

    expect(res.status).toBe(404);
  });

  it('error path: returns 403 when trip belongs to another user', async () => {
    tripModel.findTripById.mockResolvedValue({ ...mockTrip, user_id: 'other-user' });

    const res = await request(buildApp(), 'DELETE', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(403);
  });
});
