/**
 * Tests for Google Calendar export (T-343).
 *
 * Covers:
 *   POST /api/v1/trips/:tripId/export/google-calendar
 *     - Happy path: creates calendar, persists calendar id, returns counts
 *     - Re-export: passes previously stored calendar id for wipe-and-recreate
 *     - 409 GOOGLE_CALENDAR_AUTH_REQUIRED when no refresh token stored
 *     - 409 + token clearing when Google reports the grant revoked
 *     - 503 when Google Calendar env vars are unset
 *     - 401 / 403 / 404 / 400 guard rails
 *   GET /api/v1/auth/google/calendar/url
 *     - Returns consent URL with signed state (happy path)
 *     - 503 when unconfigured, 401 when unauthenticated
 *   GET /api/v1/auth/google/calendar/callback
 *     - Redirects ?gcal=connected and saves tokens on success
 *     - Redirects ?gcal=denied on user cancel, ?gcal=error on bad state
 *
 * Follows the project vitest pattern: mock the model modules (short-circuits
 * config/database.js) and the googleCalendarService (no live Google).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock db-backed model modules ----
vi.mock('../models/tripModel.js', () => ({
  findTripById: vi.fn(),
  getGoogleCalendarId: vi.fn(),
  setGoogleCalendarId: vi.fn(),
}));

vi.mock('../models/userModel.js', () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  findUserByGoogleId: vi.fn(),
  createGoogleUser: vi.fn(),
  linkGoogleId: vi.fn(),
  saveGoogleCalendarTokens: vi.fn(),
  getGoogleCalendarTokens: vi.fn(),
  clearGoogleCalendarTokens: vi.fn(),
}));

vi.mock('../models/flightModel.js', () => ({ listFlightsByTrip: vi.fn() }));
vi.mock('../models/stayModel.js', () => ({ listStaysByTrip: vi.fn() }));
vi.mock('../models/activityModel.js', () => ({ listActivitiesByTrip: vi.fn() }));
vi.mock('../models/landTravelModel.js', () => ({ listLandTravelsByTrip: vi.fn() }));

vi.mock('../models/refreshTokenModel.js', () => ({
  generateRawToken: vi.fn(() => 'raw-token-abc'),
  hashToken: vi.fn((t) => `hash-of-${t}`),
  createRefreshToken: vi.fn(),
  findValidRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

// ---- Mock the Google Calendar service (no live Google) ----
vi.mock('../services/googleCalendarService.js', () => ({
  isGoogleCalendarConfigured: vi.fn(() => true),
  buildAuthUrl: vi.fn((state) => `https://accounts.google.com/o/oauth2/auth?state=${state}`),
  exchangeCodeForTokens: vi.fn(),
  exportTripToCalendar: vi.fn(),
  isAuthRevokedError: vi.fn(() => false),
  isInsufficientScopeError: vi.fn(() => false),
  isApiNotEnabledError: vi.fn(() => false),
}));

// ---- Mock JWT (auth middleware + state signing) ----
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'signed-state-jwt'),
    verify: vi.fn((token) => {
      if (token === 'valid-token') {
        return { id: 'user-1', email: 'jane@example.com', name: 'Jane' };
      }
      if (token === 'valid-state') {
        return { uid: 'user-1', trip_id: TRIP_UUID, purpose: 'gcal_connect' };
      }
      if (token === 'wrong-purpose-state') {
        return { uid: 'user-1', trip_id: null, purpose: 'something_else' };
      }
      throw new Error('Invalid token');
    }),
  },
}));

import express from 'express';
import calendarExportRoutes from '../routes/calendarExport.js';
import authRoutes from '../routes/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { uuidParamHandler } from '../middleware/validateUUID.js';
import * as tripModel from '../models/tripModel.js';
import * as userModel from '../models/userModel.js';
import * as flightModel from '../models/flightModel.js';
import * as stayModel from '../models/stayModel.js';
import * as activityModel from '../models/activityModel.js';
import * as landTravelModel from '../models/landTravelModel.js';
import * as gcalService from '../services/googleCalendarService.js';

const TRIP_UUID = '550e8400-e29b-41d4-a716-446655440001';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.param('tripId', uuidParamHandler);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/trips/:tripId/export', calendarExportRoutes);
  app.use(errorHandler);
  return app;
}

// HTTP test helper (does NOT follow redirects — mirrors googleAuth.test.js)
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
            let parsed = null;
            try { parsed = data ? JSON.parse(data) : null; } catch { parsed = data; }
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
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

const mockTrip = { id: TRIP_UUID, user_id: 'user-1', name: "Anaheed Mobaraki's Trip to India" };
const mockTokens = {
  google_calendar_access_token: 'at',
  google_calendar_refresh_token: 'rt',
  google_calendar_token_expiry: new Date().toISOString(),
};

describe('POST /api/v1/trips/:tripId/export/google-calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gcalService.isGoogleCalendarConfigured.mockReturnValue(true);
    gcalService.isAuthRevokedError.mockReturnValue(false);
    gcalService.isInsufficientScopeError.mockReturnValue(false);
    gcalService.isApiNotEnabledError.mockReturnValue(false);
    tripModel.findTripById.mockResolvedValue(mockTrip);
    tripModel.getGoogleCalendarId.mockResolvedValue(null);
    tripModel.setGoogleCalendarId.mockResolvedValue(1);
    userModel.getGoogleCalendarTokens.mockResolvedValue(mockTokens);
    flightModel.listFlightsByTrip.mockResolvedValue([{ id: 'f1' }]);
    stayModel.listStaysByTrip.mockResolvedValue([{ id: 's1' }]);
    activityModel.listActivitiesByTrip.mockResolvedValue([{ id: 'a1' }]);
    landTravelModel.listLandTravelsByTrip.mockResolvedValue([]);
    gcalService.exportTripToCalendar.mockResolvedValue({
      calendarId: 'gcal-abc@group.calendar.google.com',
      eventsCreated: 3,
    });
  });

  it('happy path: exports and returns calendar id + event count', async () => {
    const res = await request(
      buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/export/google-calendar`, null, AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      calendar_id: 'gcal-abc@group.calendar.google.com',
      calendar_name: "Anaheed Mobaraki's Trip to India",
      events_created: 3,
    });
    expect(gcalService.exportTripToCalendar).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: mockTokens,
        existingCalendarId: null,
        tripName: mockTrip.name,
      }),
    );
    expect(tripModel.setGoogleCalendarId).toHaveBeenCalledWith(
      TRIP_UUID,
      'gcal-abc@group.calendar.google.com',
    );
  });

  it('re-export: passes the previously stored calendar id for wipe-and-recreate', async () => {
    tripModel.getGoogleCalendarId.mockResolvedValue('old-calendar-id');

    await request(buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/export/google-calendar`, null, AUTH);

    expect(gcalService.exportTripToCalendar).toHaveBeenCalledWith(
      expect.objectContaining({ existingCalendarId: 'old-calendar-id' }),
    );
  });

  it('409 GOOGLE_CALENDAR_AUTH_REQUIRED when no refresh token is stored', async () => {
    userModel.getGoogleCalendarTokens.mockResolvedValue({
      google_calendar_refresh_token: null,
    });

    const res = await request(
      buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/export/google-calendar`, null, AUTH,
    );

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('GOOGLE_CALENDAR_AUTH_REQUIRED');
    expect(gcalService.exportTripToCalendar).not.toHaveBeenCalled();
  });

  it('409 + clears tokens when Google reports the grant revoked', async () => {
    gcalService.exportTripToCalendar.mockRejectedValue(new Error('invalid_grant'));
    gcalService.isAuthRevokedError.mockReturnValue(true);

    const res = await request(
      buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/export/google-calendar`, null, AUTH,
    );

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('GOOGLE_CALENDAR_AUTH_REQUIRED');
    expect(userModel.clearGoogleCalendarTokens).toHaveBeenCalledWith('user-1');
    expect(tripModel.setGoogleCalendarId).not.toHaveBeenCalled();
  });

  it('409 + clears tokens when the token lacks the calendar scope', async () => {
    gcalService.exportTripToCalendar.mockRejectedValue(new Error('insufficient permissions'));
    gcalService.isInsufficientScopeError.mockReturnValue(true);

    const res = await request(
      buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/export/google-calendar`, null, AUTH,
    );

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('GOOGLE_CALENDAR_AUTH_REQUIRED');
    expect(userModel.clearGoogleCalendarTokens).toHaveBeenCalledWith('user-1');
  });

  it('502 GOOGLE_CALENDAR_API_DISABLED when the Calendar API is not enabled (bug-044)', async () => {
    const err = new Error('Google Calendar API has not been used in project 123 before');
    err.status = 403;
    gcalService.exportTripToCalendar.mockRejectedValue(err);
    gcalService.isApiNotEnabledError.mockReturnValue(true);

    const res = await request(
      buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/export/google-calendar`, null, AUTH,
    );

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('GOOGLE_CALENDAR_API_DISABLED');
    expect(res.body.error.message).toMatch(/Google Cloud/);
    expect(userModel.clearGoogleCalendarTokens).not.toHaveBeenCalled();
  });

  it('502 GOOGLE_CALENDAR_API_ERROR for other Google-side errors — status does NOT leak (bug-044)', async () => {
    const err = new Error('Rate limit exceeded');
    err.status = 403; // would previously surface as OUR 403 FORBIDDEN via errorHandler
    gcalService.exportTripToCalendar.mockRejectedValue(err);

    const res = await request(
      buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/export/google-calendar`, null, AUTH,
    );

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('GOOGLE_CALENDAR_API_ERROR');
  });

  it('500 when the export fails for a non-Google, non-auth reason', async () => {
    gcalService.exportTripToCalendar.mockRejectedValue(new Error('DB connection lost'));

    const res = await request(
      buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/export/google-calendar`, null, AUTH,
    );

    expect(res.status).toBe(500);
    expect(userModel.clearGoogleCalendarTokens).not.toHaveBeenCalled();
  });

  it('503 GOOGLE_CALENDAR_UNAVAILABLE when not configured', async () => {
    gcalService.isGoogleCalendarConfigured.mockReturnValue(false);

    const res = await request(
      buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/export/google-calendar`, null, AUTH,
    );

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('GOOGLE_CALENDAR_UNAVAILABLE');
  });

  it('401 without a token', async () => {
    const res = await request(
      buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/export/google-calendar`, null,
    );
    expect(res.status).toBe(401);
  });

  it('403 when the trip belongs to another user', async () => {
    tripModel.findTripById.mockResolvedValue({ ...mockTrip, user_id: 'other-user' });

    const res = await request(
      buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/export/google-calendar`, null, AUTH,
    );

    expect(res.status).toBe(403);
    expect(gcalService.exportTripToCalendar).not.toHaveBeenCalled();
  });

  it('404 when the trip does not exist', async () => {
    tripModel.findTripById.mockResolvedValue(null);

    const res = await request(
      buildApp(), 'POST', `/api/v1/trips/${TRIP_UUID}/export/google-calendar`, null, AUTH,
    );

    expect(res.status).toBe(404);
  });

  it('400 when the trip ID is not a valid UUID', async () => {
    const res = await request(
      buildApp(), 'POST', '/api/v1/trips/not-a-uuid/export/google-calendar', null, AUTH,
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/auth/google/calendar/url', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gcalService.isGoogleCalendarConfigured.mockReturnValue(true);
    gcalService.buildAuthUrl.mockImplementation(
      (state) => `https://accounts.google.com/o/oauth2/auth?state=${state}`,
    );
  });

  it('happy path: returns the consent URL built from the signed state', async () => {
    const res = await request(
      buildApp(), 'GET', `/api/v1/auth/google/calendar/url?trip_id=${TRIP_UUID}`, null, AUTH,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.url).toBe(
      'https://accounts.google.com/o/oauth2/auth?state=signed-state-jwt',
    );
    expect(gcalService.buildAuthUrl).toHaveBeenCalledWith('signed-state-jwt');
  });

  it('503 when Google Calendar is not configured', async () => {
    gcalService.isGoogleCalendarConfigured.mockReturnValue(false);

    const res = await request(buildApp(), 'GET', '/api/v1/auth/google/calendar/url', null, AUTH);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('GOOGLE_CALENDAR_UNAVAILABLE');
  });

  it('401 when unauthenticated', async () => {
    const res = await request(buildApp(), 'GET', '/api/v1/auth/google/calendar/url');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/google/calendar/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gcalService.isGoogleCalendarConfigured.mockReturnValue(true);
    gcalService.exchangeCodeForTokens.mockResolvedValue({
      access_token: 'new-at',
      refresh_token: 'new-rt',
      expiry_date: 1790000000000,
    });
  });

  it('happy path: saves tokens and redirects to the trip page with ?gcal=connected', async () => {
    const res = await request(
      buildApp(), 'GET',
      '/api/v1/auth/google/calendar/callback?code=auth-code&state=valid-state',
    );

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(new RegExp(`/trips/${TRIP_UUID}\\?gcal=connected$`));
    expect(gcalService.exchangeCodeForTokens).toHaveBeenCalledWith('auth-code');
    expect(userModel.saveGoogleCalendarTokens).toHaveBeenCalledWith('user-1', {
      access_token: 'new-at',
      refresh_token: 'new-rt',
      expiry_date: 1790000000000,
    });
  });

  it('redirects ?gcal=denied when the user cancels on the consent screen', async () => {
    const res = await request(
      buildApp(), 'GET',
      '/api/v1/auth/google/calendar/callback?error=access_denied&state=valid-state',
    );

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/gcal=denied$/);
    expect(userModel.saveGoogleCalendarTokens).not.toHaveBeenCalled();
  });

  it('redirects ?gcal=error when the state is invalid', async () => {
    const res = await request(
      buildApp(), 'GET',
      '/api/v1/auth/google/calendar/callback?code=auth-code&state=tampered',
    );

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/gcal=error$/);
    expect(userModel.saveGoogleCalendarTokens).not.toHaveBeenCalled();
  });

  it('redirects ?gcal=error when the state was signed for another purpose', async () => {
    const res = await request(
      buildApp(), 'GET',
      '/api/v1/auth/google/calendar/callback?code=auth-code&state=wrong-purpose-state',
    );

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/gcal=error$/);
  });

  it('redirects ?gcal=error when the code exchange fails', async () => {
    gcalService.exchangeCodeForTokens.mockRejectedValue(new Error('bad code'));

    const res = await request(
      buildApp(), 'GET',
      '/api/v1/auth/google/calendar/callback?code=auth-code&state=valid-state',
    );

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(new RegExp(`/trips/${TRIP_UUID}\\?gcal=error$`));
  });
});
