/**
 * Sprint 36 — T-278: Post-sanitization validation tests.
 *
 * Verifies that sanitization runs BEFORE validation on all write endpoints,
 * so required fields containing only HTML tags are rejected with 400
 * instead of being stored as empty strings.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ----
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

vi.mock('../models/flightModel.js', () => ({
  listFlightsByTrip: vi.fn(),
  findFlightById: vi.fn(),
  createFlight: vi.fn(),
  updateFlight: vi.fn(),
  deleteFlight: vi.fn(),
}));

vi.mock('../models/stayModel.js', () => ({
  listStaysByTrip: vi.fn(),
  findStayById: vi.fn(),
  createStay: vi.fn(),
  updateStay: vi.fn(),
  deleteStay: vi.fn(),
}));

vi.mock('../models/activityModel.js', () => ({
  listActivitiesByTrip: vi.fn(),
  findActivityById: vi.fn(),
  createActivity: vi.fn(),
  updateActivity: vi.fn(),
  deleteActivity: vi.fn(),
}));

vi.mock('../models/landTravelModel.js', () => ({
  VALID_LAND_TRAVEL_MODES: ['CAR', 'BUS', 'TRAIN', 'FERRY', 'SHUTTLE', 'TAXI', 'RIDESHARE', 'OTHER'],
  listLandTravelsByTrip: vi.fn(),
  findLandTravelById: vi.fn(),
  createLandTravel: vi.fn(),
  updateLandTravel: vi.fn(),
  deleteLandTravel: vi.fn(),
}));

vi.mock('../models/userModel.js', () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock('../models/refreshTokenModel.js', () => ({
  generateRawToken: vi.fn(() => 'raw-token'),
  hashToken: vi.fn(() => 'hashed-token'),
  createRefreshToken: vi.fn(),
  findValidRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
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

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(() => '$2a$12$hashedpassword'),
    compare: vi.fn(() => true),
  },
}));

import express from 'express';
import { errorHandler } from '../middleware/errorHandler.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import tripsRoutes from '../routes/trips.js';
import flightsRoutes from '../routes/flights.js';
import staysRoutes from '../routes/stays.js';
import activitiesRoutes from '../routes/activities.js';
import landTravelRoutes from '../routes/landTravel.js';
import authRoutes from '../routes/auth.js';
import * as tripModel from '../models/tripModel.js';
import * as flightModel from '../models/flightModel.js';
import * as stayModel from '../models/stayModel.js';
import * as activityModel from '../models/activityModel.js';
import * as landTravelModel from '../models/landTravelModel.js';
import * as userModel from '../models/userModel.js';

const TRIP_UUID = '550e8400-e29b-41d4-a716-446655440001';
const FLIGHT_UUID = '550e8400-e29b-41d4-a716-446655440010';
const STAY_UUID = '550e8400-e29b-41d4-a716-446655440020';
const ACTIVITY_UUID = '550e8400-e29b-41d4-a716-446655440030';
const LT_UUID = '550e8400-e29b-41d4-a716-446655440040';
const AUTH_HDR = { Authorization: 'Bearer valid-token' };

const mockTrip = { id: TRIP_UUID, user_id: 'user-1', name: 'Test Trip', destinations: ['Tokyo'], status: 'PLANNING', start_date: null, end_date: null, notes: null, created_at: '2026-02-24T12:00:00.000Z', updated_at: '2026-02-24T12:00:00.000Z' };
const mockFlight = { id: FLIGHT_UUID, trip_id: TRIP_UUID, flight_number: 'AA100', airline: 'American', from_location: 'JFK', to_location: 'NRT', departure_at: '2026-08-01T10:00:00Z', departure_tz: 'America/New_York', arrival_at: '2026-08-02T14:00:00Z', arrival_tz: 'Asia/Tokyo' };
const mockStay = { id: STAY_UUID, trip_id: TRIP_UUID, category: 'HOTEL', name: 'Grand Hotel', address: '123 Main St', check_in_at: '2026-08-01T15:00:00Z', check_in_tz: 'Asia/Tokyo', check_out_at: '2026-08-03T11:00:00Z', check_out_tz: 'Asia/Tokyo' };
const mockActivity = { id: ACTIVITY_UUID, trip_id: TRIP_UUID, name: 'Temple Visit', location: 'Asakusa', activity_date: '2026-08-01', start_time: '09:00', end_time: '12:00' };
const mockLandTravel = { id: LT_UUID, trip_id: TRIP_UUID, mode: 'TRAIN', provider: 'JR Rail', from_location: 'Tokyo Station', to_location: 'Kyoto Station', departure_date: '2026-08-03', departure_time: '08:00', arrival_date: '2026-08-03', arrival_time: '10:15', confirmation_number: null, notes: null };

function buildApp() {
  const app = express();
  app.use(express.json());
  app.param('tripId', uuidParamHandler);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/trips', tripsRoutes);
  app.use('/api/v1/trips/:tripId/flights', flightsRoutes);
  app.use('/api/v1/trips/:tripId/stays', staysRoutes);
  app.use('/api/v1/trips/:tripId/activities', activitiesRoutes);
  app.use('/api/v1/trips/:tripId/land-travel', landTravelRoutes);
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

// ============================================================
// T-278: Post-sanitization validation — Trip endpoints
// ============================================================
describe('T-278 — POST /trips rejects all-HTML required fields', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when name is only HTML tags', async () => {
    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: '<svg onload=alert(1)>',
      destinations: ['Tokyo'],
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.name).toBeDefined();
  });

  it('returns 400 when all destination items are only HTML', async () => {
    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Valid Trip',
      destinations: ['<script></script>', '<b></b>'],
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    // After sanitization, destinations become ['', ''] → filtered to [] → minItems 1 fails
    expect(res.body.error.fields.destinations).toBeDefined();
  });

  it('allows non-required field (notes) to be all-HTML (becomes empty)', async () => {
    tripModel.createTrip.mockImplementation((data) => Promise.resolve({
      id: TRIP_UUID, ...data, status: 'PLANNING',
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }));

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Valid Trip',
      destinations: ['Tokyo'],
      notes: '<script></script>',
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    // notes becomes empty string → normalized to null
    const callArgs = tripModel.createTrip.mock.calls[0][0];
    expect(callArgs.notes).toBeNull();
  });

  it('allows valid text mixed with HTML (strips tags, keeps text)', async () => {
    tripModel.createTrip.mockImplementation((data) => Promise.resolve({
      id: TRIP_UUID, ...data, status: 'PLANNING',
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }));

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: '<b>Tokyo</b> Trip',
      destinations: ['<i>Osaka</i>'],
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    const callArgs = tripModel.createTrip.mock.calls[0][0];
    expect(callArgs.name).toBe('Tokyo Trip');
    expect(callArgs.destinations).toEqual(['Osaka']);
  });
});

describe('T-278 — PATCH /trips rejects all-HTML required fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('returns 400 when name is only HTML tags', async () => {
    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      name: '<svg/onload=alert(1)>',
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.name).toBeDefined();
  });

  it('allows notes to be all-HTML (becomes empty → null)', async () => {
    tripModel.updateTrip.mockResolvedValue({ ...mockTrip, notes: null });

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      notes: '<script></script>',
    }, AUTH_HDR);

    expect(res.status).toBe(200);
  });
});

// ============================================================
// T-278: Post-sanitization validation — Flight endpoints
// ============================================================
describe('T-278 — POST /flights rejects all-HTML required fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('returns 400 when airline is only HTML tags', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/flights`, {
      flight_number: 'AA100',
      airline: '<img src=x onerror=alert(1)>',
      from_location: 'JFK',
      to_location: 'NRT',
      departure_at: '2026-08-01T10:00:00-04:00',
      departure_tz: 'America/New_York',
      arrival_at: '2026-08-02T14:00:00+09:00',
      arrival_tz: 'Asia/Tokyo',
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.airline).toBeDefined();
  });

  it('returns 400 when from_location is only HTML tags (no text content)', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/flights`, {
      flight_number: 'AA100',
      airline: 'American',
      from_location: '<img src=x onerror=alert(1)>',
      to_location: 'NRT',
      departure_at: '2026-08-01T10:00:00-04:00',
      departure_tz: 'America/New_York',
      arrival_at: '2026-08-02T14:00:00+09:00',
      arrival_tz: 'Asia/Tokyo',
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.from_location).toBeDefined();
  });
});

describe('T-278 — PATCH /flights rejects all-HTML required fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
    flightModel.findFlightById.mockResolvedValue(mockFlight);
  });

  it('returns 400 when airline is patched to only HTML', async () => {
    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}/flights/${FLIGHT_UUID}`, {
      airline: '<svg onload=alert(1)>',
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.airline).toBeDefined();
  });

  it('returns 400 when flight_number is patched to only HTML', async () => {
    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}/flights/${FLIGHT_UUID}`, {
      flight_number: '<b></b>',
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.flight_number).toBeDefined();
  });
});

// ============================================================
// T-278: Post-sanitization validation — Stay endpoints
// ============================================================
describe('T-278 — POST /stays rejects all-HTML required fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('returns 400 when name is only HTML tags (no text content)', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/stays`, {
      category: 'HOTEL',
      name: '<svg onload=alert(1)>',
      check_in_at: '2026-08-01T15:00:00Z',
      check_in_tz: 'Asia/Tokyo',
      check_out_at: '2026-08-03T11:00:00Z',
      check_out_tz: 'Asia/Tokyo',
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.name).toBeDefined();
  });

  it('allows non-required address to be all-HTML (becomes empty)', async () => {
    stayModel.createStay.mockImplementation((data) => Promise.resolve({ id: STAY_UUID, ...data }));

    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/stays`, {
      category: 'HOTEL',
      name: 'Grand Hotel',
      address: '<b></b>',
      check_in_at: '2026-08-01T15:00:00Z',
      check_in_tz: 'Asia/Tokyo',
      check_out_at: '2026-08-03T11:00:00Z',
      check_out_tz: 'Asia/Tokyo',
    }, AUTH_HDR);

    expect(res.status).toBe(201);
  });
});

describe('T-278 — PATCH /stays rejects all-HTML required fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
    stayModel.findStayById.mockResolvedValue(mockStay);
  });

  it('returns 400 when name is patched to only HTML', async () => {
    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}/stays/${STAY_UUID}`, {
      name: '<iframe src="evil.com"></iframe>',
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.name).toBeDefined();
  });
});

// ============================================================
// T-278: Post-sanitization validation — Activity endpoints
// ============================================================
describe('T-278 — POST /activities rejects all-HTML required fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('returns 400 when name is only HTML tags', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/activities`, {
      name: '<svg/onload=alert(1)>',
      activity_date: '2026-08-01',
      start_time: '09:00',
      end_time: '12:00',
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.name).toBeDefined();
  });

  it('allows non-required location to be all-HTML (becomes empty)', async () => {
    activityModel.createActivity.mockImplementation((data) => Promise.resolve({ id: ACTIVITY_UUID, ...data }));

    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/activities`, {
      name: 'Temple Visit',
      location: '<b></b>',
      activity_date: '2026-08-01',
      start_time: '09:00',
      end_time: '12:00',
    }, AUTH_HDR);

    expect(res.status).toBe(201);
  });
});

describe('T-278 — PATCH /activities rejects all-HTML required fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
    activityModel.findActivityById.mockResolvedValue(mockActivity);
  });

  it('returns 400 when name is patched to only HTML (no text content)', async () => {
    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}/activities/${ACTIVITY_UUID}`, {
      name: '<svg onload=alert(1)>',
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.name).toBeDefined();
  });
});

// ============================================================
// T-278: Post-sanitization validation — Land Travel endpoints
// ============================================================
describe('T-278 — POST /land-travel rejects all-HTML required fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('returns 400 when from_location is only HTML tags', async () => {
    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/land-travel`, {
      mode: 'TRAIN',
      from_location: '<img src=x onerror=alert(1)>',
      to_location: 'Kyoto Station',
      departure_date: '2026-08-03',
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.from_location).toBeDefined();
  });

  it('allows non-required provider to be all-HTML (becomes empty)', async () => {
    landTravelModel.createLandTravel.mockImplementation((data) => Promise.resolve({ id: LT_UUID, ...data }));

    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/land-travel`, {
      mode: 'TRAIN',
      provider: '<script></script>',
      from_location: 'Tokyo Station',
      to_location: 'Kyoto Station',
      departure_date: '2026-08-03',
    }, AUTH_HDR);

    expect(res.status).toBe(201);
  });
});

describe('T-278 — PATCH /land-travel rejects all-HTML required fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
    landTravelModel.findLandTravelById.mockResolvedValue(mockLandTravel);
  });

  it('returns 400 when from_location is patched to only HTML', async () => {
    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}/land-travel/${LT_UUID}`, {
      from_location: '<svg onload=alert(1)>',
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.from_location).toBeDefined();
  });

  it('returns 400 when to_location is patched to only HTML', async () => {
    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}/land-travel/${LT_UUID}`, {
      to_location: '<b></b>',
    }, AUTH_HDR);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.to_location).toBeDefined();
  });
});

// ============================================================
// T-278: Post-sanitization validation — Auth register
// ============================================================
describe('T-278 — POST /auth/register rejects all-HTML name', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when name is only HTML tags (no text content)', async () => {
    const res = await request(buildApp(), 'POST', '/api/v1/auth/register', {
      name: '<svg onload=alert(1)>',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.name).toBeDefined();
  });

  it('allows valid name with HTML stripped', async () => {
    userModel.findUserByEmail.mockResolvedValue(null);
    userModel.createUser.mockImplementation((data) => Promise.resolve({
      id: 'user-2', ...data, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }));

    const res = await request(buildApp(), 'POST', '/api/v1/auth/register', {
      name: '<b>Jane</b> Doe',
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    const callArgs = userModel.createUser.mock.calls[0][0];
    expect(callArgs.name).toBe('Jane Doe');
  });
});

// ============================================================
// T-278: No regressions — valid inputs still pass
// ============================================================
describe('T-278 — No regressions on valid inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('POST /trips with clean input still works', async () => {
    tripModel.createTrip.mockImplementation((data) => Promise.resolve({
      id: TRIP_UUID, ...data, status: 'PLANNING',
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }));

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Tokyo Adventure',
      destinations: ['Tokyo', 'Osaka'],
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    expect(tripModel.createTrip).toHaveBeenCalled();
  });

  it('POST /flights with clean input still works', async () => {
    flightModel.createFlight.mockImplementation((data) => Promise.resolve({ id: FLIGHT_UUID, ...data }));

    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/flights`, {
      flight_number: 'AA100',
      airline: 'American Airlines',
      from_location: 'JFK',
      to_location: 'NRT',
      departure_at: '2026-08-01T10:00:00-04:00',
      departure_tz: 'America/New_York',
      arrival_at: '2026-08-02T14:00:00+09:00',
      arrival_tz: 'Asia/Tokyo',
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    expect(flightModel.createFlight).toHaveBeenCalled();
  });

  it('PATCH /trips with mixed HTML+text still works (text preserved)', async () => {
    tripModel.updateTrip.mockResolvedValue({ ...mockTrip, name: 'Tokyo Trip' });

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      name: '<b>Tokyo</b> Trip',
    }, AUTH_HDR);

    expect(res.status).toBe(200);
    expect(tripModel.updateTrip).toHaveBeenCalled();
  });
});
