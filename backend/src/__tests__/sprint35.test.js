/**
 * Sprint 35 — T-272: Server-side input sanitization tests.
 *
 * Tests that HTML tags are stripped from all user-provided text fields across
 * all models, while preserving Unicode, emoji, and legitimate special characters.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Unit tests for sanitizeHtml utility
// ============================================================
import { sanitizeHtml } from '../middleware/sanitize.js';

describe('sanitizeHtml — unit tests', () => {
  it('strips <script> tags and preserves text content', () => {
    expect(sanitizeHtml('<script>alert(1)</script>Tokyo Trip')).toBe('alert(1)Tokyo Trip');
  });

  it('strips attribute-based XSS (img onerror)', () => {
    expect(sanitizeHtml('<img src=x onerror=alert(1)>Trip')).toBe('Trip');
  });

  it('strips nested tags', () => {
    expect(sanitizeHtml('<div><script>alert(1)</script></div>')).toBe('alert(1)');
  });

  it('strips svg/onload XSS', () => {
    expect(sanitizeHtml('<svg/onload=alert(1)>Trip')).toBe('Trip');
  });

  it('strips iframe tags', () => {
    expect(sanitizeHtml('<iframe src="https://evil.com"></iframe>Safe content')).toBe('Safe content');
  });

  it('strips style tags', () => {
    expect(sanitizeHtml('<style>body{display:none}</style>Visible')).toBe('body{display:none}Visible');
  });

  it('strips bold/italic tags and preserves text', () => {
    expect(sanitizeHtml('Hello <b>world</b>')).toBe('Hello world');
  });

  it('strips anchor tags and preserves text', () => {
    expect(sanitizeHtml('<a href="https://evil.com">Click here</a>')).toBe('Click here');
  });

  it('strips self-closing tags', () => {
    expect(sanitizeHtml('Line1<br/>Line2')).toBe('Line1Line2');
  });

  it('strips HTML comments', () => {
    expect(sanitizeHtml('Hello <!-- comment --> World')).toBe('Hello  World');
  });

  it('preserves Unicode characters', () => {
    expect(sanitizeHtml('東京旅行 🗼 cafe\u0301')).toBe('東京旅行 🗼 cafe\u0301');
  });

  it('preserves emoji', () => {
    expect(sanitizeHtml('Trip 🎉🌍✈️')).toBe('Trip 🎉🌍✈️');
  });

  it('preserves special characters (ampersand, quotes)', () => {
    expect(sanitizeHtml('Tom & Jerry\'s "Excellent" Trip')).toBe('Tom & Jerry\'s "Excellent" Trip');
  });

  it('preserves angle brackets in non-tag context', () => {
    expect(sanitizeHtml('5 < 10 & 10 > 5')).toBe('5 < 10 & 10 > 5');
  });

  it('returns empty string unchanged', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('returns non-string input unchanged', () => {
    expect(sanitizeHtml(42)).toBe(42);
    expect(sanitizeHtml(null)).toBe(null);
    expect(sanitizeHtml(undefined)).toBe(undefined);
  });

  it('does not double-encode HTML entities', () => {
    expect(sanitizeHtml('&amp; &lt; &gt;')).toBe('&amp; &lt; &gt;');
  });

  it('strips multiple different tags from one string', () => {
    expect(sanitizeHtml('<b>Bold</b> and <i>italic</i> and <script>xss</script>'))
      .toBe('Bold and italic and xss');
  });
});

// ============================================================
// Integration tests — sanitization applied on POST/PATCH routes
// ============================================================

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
// Trip sanitization
// ============================================================
describe('T-272 — Trip sanitization', () => {
  beforeEach(() => vi.clearAllMocks());

  it('POST /trips strips HTML from name, destinations, notes', async () => {
    tripModel.createTrip.mockImplementation((data) => Promise.resolve({ id: TRIP_UUID, ...data, status: 'PLANNING', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }));

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: '<script>alert(1)</script>Tokyo Trip',
      destinations: ['<b>Tokyo</b>', 'Osaka'],
      notes: '<img src=x onerror=alert(1)>My notes',
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    const callArgs = tripModel.createTrip.mock.calls[0][0];
    expect(callArgs.name).toBe('alert(1)Tokyo Trip');
    expect(callArgs.destinations).toEqual(['Tokyo', 'Osaka']);
    expect(callArgs.notes).toBe('My notes');
  });

  it('POST /trips preserves Unicode and emoji', async () => {
    tripModel.createTrip.mockImplementation((data) => Promise.resolve({ id: TRIP_UUID, ...data, status: 'PLANNING', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }));

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: '東京旅行 🗼',
      destinations: ['cafe\u0301 🌍'],
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    const callArgs = tripModel.createTrip.mock.calls[0][0];
    expect(callArgs.name).toBe('東京旅行 🗼');
    expect(callArgs.destinations[0]).toBe('cafe\u0301 🌍');
  });

  it('POST /trips preserves special characters', async () => {
    tripModel.createTrip.mockImplementation((data) => Promise.resolve({ id: TRIP_UUID, ...data, status: 'PLANNING', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }));

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Tom & Jerry\'s "Excellent" Trip',
      destinations: ['Paris'],
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    expect(tripModel.createTrip.mock.calls[0][0].name).toBe('Tom & Jerry\'s "Excellent" Trip');
  });

  it('PATCH /trips/:id strips HTML from name and notes', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);
    tripModel.updateTrip.mockImplementation((_id, data) => Promise.resolve({ ...mockTrip, ...data }));

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      name: '<div>Sanitized</div>',
      notes: '<a href="javascript:alert(1)">Click</a>',
    }, AUTH_HDR);

    expect(res.status).toBe(200);
    const callArgs = tripModel.updateTrip.mock.calls[0][1];
    expect(callArgs.name).toBe('Sanitized');
    expect(callArgs.notes).toBe('Click');
  });
});

// ============================================================
// Flight sanitization
// ============================================================
describe('T-272 — Flight sanitization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('POST /flights strips HTML from text fields', async () => {
    flightModel.createFlight.mockImplementation((data) => Promise.resolve({ id: FLIGHT_UUID, ...data }));

    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/flights`, {
      flight_number: '<b>AA100</b>',
      airline: '<script>xss</script>Delta',
      from_location: '<img src=x>JFK',
      to_location: '<svg>NRT</svg>',
      departure_at: '2026-08-01T10:00:00+09:00',
      departure_tz: 'America/New_York',
      arrival_at: '2026-08-01T23:00:00+09:00',
      arrival_tz: 'Asia/Tokyo',
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    const callArgs = flightModel.createFlight.mock.calls[0][0];
    expect(callArgs.flight_number).toBe('AA100');
    expect(callArgs.airline).toBe('xssDelta');
    expect(callArgs.from_location).toBe('JFK');
    expect(callArgs.to_location).toBe('NRT');
  });

  it('PATCH /flights/:id strips HTML from text fields', async () => {
    const existingFlight = {
      id: FLIGHT_UUID, trip_id: TRIP_UUID, flight_number: 'AA100', airline: 'Delta',
      from_location: 'JFK', to_location: 'NRT',
      departure_at: '2026-08-01T10:00:00.000Z', departure_tz: 'America/New_York',
      arrival_at: '2026-08-01T23:00:00.000Z', arrival_tz: 'Asia/Tokyo',
    };
    flightModel.findFlightById.mockResolvedValue(existingFlight);
    flightModel.updateFlight.mockImplementation((_id, data) => Promise.resolve({ ...existingFlight, ...data }));

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}/flights/${FLIGHT_UUID}`, {
      airline: '<b>United</b>',
    }, AUTH_HDR);

    expect(res.status).toBe(200);
    expect(flightModel.updateFlight.mock.calls[0][1].airline).toBe('United');
  });
});

// ============================================================
// Stay sanitization
// ============================================================
describe('T-272 — Stay sanitization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('POST /stays strips HTML from name and address', async () => {
    stayModel.createStay.mockImplementation((data) => Promise.resolve({ id: STAY_UUID, ...data }));

    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/stays`, {
      category: 'HOTEL',
      name: '<script>alert(1)</script>Park Hyatt',
      address: '<b>Shinjuku</b>, Tokyo',
      check_in_at: '2026-08-01T15:00:00Z',
      check_in_tz: 'Asia/Tokyo',
      check_out_at: '2026-08-05T11:00:00Z',
      check_out_tz: 'Asia/Tokyo',
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    const callArgs = stayModel.createStay.mock.calls[0][0];
    expect(callArgs.name).toBe('alert(1)Park Hyatt');
    expect(callArgs.address).toBe('Shinjuku, Tokyo');
  });

  it('PATCH /stays/:id strips HTML from name', async () => {
    const existingStay = {
      id: STAY_UUID, trip_id: TRIP_UUID, category: 'HOTEL', name: 'Park Hyatt',
      address: 'Shinjuku', check_in_at: '2026-08-01T15:00:00Z', check_in_tz: 'Asia/Tokyo',
      check_out_at: '2026-08-05T11:00:00Z', check_out_tz: 'Asia/Tokyo',
    };
    stayModel.findStayById.mockResolvedValue(existingStay);
    stayModel.updateStay.mockImplementation((_id, data) => Promise.resolve({ ...existingStay, ...data }));

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}/stays/${STAY_UUID}`, {
      name: '<iframe>Ritz</iframe>',
    }, AUTH_HDR);

    expect(res.status).toBe(200);
    expect(stayModel.updateStay.mock.calls[0][1].name).toBe('Ritz');
  });
});

// ============================================================
// Activity sanitization
// ============================================================
describe('T-272 — Activity sanitization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('POST /activities strips HTML from name and location', async () => {
    activityModel.createActivity.mockImplementation((data) => Promise.resolve({ id: ACTIVITY_UUID, ...data }));

    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/activities`, {
      name: '<b>Visit</b> <script>xss</script>Temple',
      location: '<a href="evil">Kyoto</a>',
      activity_date: '2026-08-02',
      start_time: '09:00',
      end_time: '12:00',
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    const callArgs = activityModel.createActivity.mock.calls[0][0];
    expect(callArgs.name).toBe('Visit xssTemple');
    expect(callArgs.location).toBe('Kyoto');
  });

  it('PATCH /activities/:id strips HTML from location', async () => {
    const existingActivity = {
      id: ACTIVITY_UUID, trip_id: TRIP_UUID, name: 'Temple Visit',
      location: 'Kyoto', activity_date: '2026-08-02',
      start_time: '09:00', end_time: '12:00',
    };
    activityModel.findActivityById.mockResolvedValue(existingActivity);
    activityModel.updateActivity.mockImplementation((_id, data) => Promise.resolve({ ...existingActivity, ...data }));

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}/activities/${ACTIVITY_UUID}`, {
      location: '<div><b>New</b> Location</div>',
    }, AUTH_HDR);

    expect(res.status).toBe(200);
    expect(activityModel.updateActivity.mock.calls[0][1].location).toBe('New Location');
  });
});

// ============================================================
// Land Travel sanitization
// ============================================================
describe('T-272 — Land Travel sanitization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(mockTrip);
  });

  it('POST /land-travel strips HTML from provider, from_location, to_location', async () => {
    landTravelModel.createLandTravel.mockImplementation((data) => Promise.resolve({ id: LT_UUID, ...data }));

    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/land-travel`, {
      mode: 'TRAIN',
      provider: '<script>alert(1)</script>JR East',
      from_location: '<b>Tokyo</b> Station',
      to_location: '<img src=x>Kyoto Station',
      departure_date: '2026-08-03',
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    const callArgs = landTravelModel.createLandTravel.mock.calls[0][0];
    expect(callArgs.provider).toBe('alert(1)JR East');
    expect(callArgs.from_location).toBe('Tokyo Station');
    expect(callArgs.to_location).toBe('Kyoto Station');
  });

  it('PATCH /land-travel/:ltId strips HTML from text fields', async () => {
    const existingLT = {
      id: LT_UUID, trip_id: TRIP_UUID, mode: 'TRAIN',
      provider: 'JR East', from_location: 'Tokyo Station', to_location: 'Kyoto Station',
      departure_date: '2026-08-03', departure_time: null,
      arrival_date: null, arrival_time: null,
      confirmation_number: null, notes: null,
    };
    landTravelModel.findLandTravelById.mockResolvedValue(existingLT);
    landTravelModel.updateLandTravel.mockImplementation((_id, data) => Promise.resolve({ ...existingLT, ...data }));

    const res = await request(buildApp(), 'PATCH', `/api/v1/trips/${TRIP_UUID}/land-travel/${LT_UUID}`, {
      provider: '<svg onload=alert(1)>Shinkansen</svg>',
    }, AUTH_HDR);

    expect(res.status).toBe(200);
    expect(landTravelModel.updateLandTravel.mock.calls[0][1].provider).toBe('Shinkansen');
  });
});

// ============================================================
// Auth (register) sanitization
// ============================================================
describe('T-272 — Auth register sanitization', () => {
  beforeEach(() => vi.clearAllMocks());

  it('POST /auth/register strips HTML from name', async () => {
    userModel.findUserByEmail.mockResolvedValue(null);
    userModel.createUser.mockImplementation((data) => Promise.resolve({
      id: 'user-new', name: data.name, email: data.email, created_at: '2026-01-01T00:00:00Z',
    }));

    const res = await request(buildApp(), 'POST', '/api/v1/auth/register', {
      name: '<script>alert(1)</script>Jane Doe',
      email: 'jane@example.com',
      password: 'securepassword123',
    });

    expect(res.status).toBe(201);
    const callArgs = userModel.createUser.mock.calls[0][0];
    expect(callArgs.name).toBe('alert(1)Jane Doe');
  });

  it('POST /auth/register preserves emoji in name', async () => {
    userModel.findUserByEmail.mockResolvedValue(null);
    userModel.createUser.mockImplementation((data) => Promise.resolve({
      id: 'user-new', name: data.name, email: data.email, created_at: '2026-01-01T00:00:00Z',
    }));

    const res = await request(buildApp(), 'POST', '/api/v1/auth/register', {
      name: 'Jane 🎉',
      email: 'jane2@example.com',
      password: 'securepassword123',
    });

    expect(res.status).toBe(201);
    expect(userModel.createUser.mock.calls[0][0].name).toBe('Jane 🎉');
  });
});

// ============================================================
// Edge cases
// ============================================================
describe('T-272 — Edge cases', () => {
  beforeEach(() => vi.clearAllMocks());

  it('array field sanitization: strips tags from each element', async () => {
    tripModel.createTrip.mockImplementation((data) => Promise.resolve({ id: TRIP_UUID, ...data, status: 'PLANNING', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }));

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Test',
      destinations: ['<b>Tokyo</b>', '<script>alert(1)</script>Osaka', 'Kyoto'],
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    expect(tripModel.createTrip.mock.calls[0][0].destinations).toEqual(['Tokyo', 'alert(1)Osaka', 'Kyoto']);
  });

  it('angle brackets in non-tag context are preserved', async () => {
    tripModel.createTrip.mockImplementation((data) => Promise.resolve({ id: TRIP_UUID, ...data, status: 'PLANNING', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }));

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Budget < 1000 & days > 5',
      destinations: ['Paris'],
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    expect(tripModel.createTrip.mock.calls[0][0].name).toBe('Budget < 1000 & days > 5');
  });

  it('null fields are not affected by sanitization', async () => {
    tripModel.createTrip.mockImplementation((data) => Promise.resolve({ id: TRIP_UUID, ...data, status: 'PLANNING', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }));

    const res = await request(buildApp(), 'POST', '/api/v1/trips', {
      name: 'Test Trip',
      destinations: ['Tokyo'],
      notes: null,
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    // notes=null should pass through without error
  });

  it('non-text fields (enums, dates, times) are NOT sanitized', async () => {
    tripModel.findTripById.mockResolvedValue(mockTrip);
    activityModel.createActivity.mockImplementation((data) => Promise.resolve({ id: ACTIVITY_UUID, ...data }));

    const res = await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/activities`, {
      name: 'Temple Visit',
      location: 'Kyoto',
      activity_date: '2026-08-02',
      start_time: '09:00',
      end_time: '12:00',
    }, AUTH_HDR);

    expect(res.status).toBe(201);
    const callArgs = activityModel.createActivity.mock.calls[0][0];
    // Date and time fields should pass through unchanged
    expect(callArgs.activity_date).toBe('2026-08-02');
    expect(callArgs.start_time).toBe('09:00');
    expect(callArgs.end_time).toBe('12:00');
  });
});
