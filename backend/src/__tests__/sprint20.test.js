/**
 * Sprint 20 Tests — T-186 + T-188
 *
 * T-186: Fix Sprint 19 Joi destination validation gaps (FB-008 + FB-009)
 * ──────────────────────────────────────────────────────────────────────
 * The validate.js middleware is extended with `itemMaxLength` support,
 * and the trips POST + PATCH schemas are updated to:
 *   - Enforce itemMaxLength: 100 on each destination string
 *   - Return a human-friendly "At least one destination is required" message
 *     when PATCH receives destinations: [] (previously returned raw Joi-like text)
 *
 * Tests:
 *   (A) POST /trips with a 101-char destination → 400 VALIDATION_ERROR (destinations field)
 *   (B) PATCH /trips/:id with a 101-char destination → 400 VALIDATION_ERROR (destinations field)
 *   (C) PATCH /trips/:id with destinations: [] → 400 "At least one destination is required"
 *   (D) Happy path — POST with valid 100-char destination → 201
 *   (E) Happy path — PATCH with valid 100-char destination → 200
 *
 * T-188: Trip notes field (backend)
 * ──────────────────────────────────
 * Migration 010 adds `notes TEXT NULL` to trips (completed as T-103 in Sprint 7).
 * Routes and model already support notes. These tests confirm the T-188 acceptance
 * criteria are met:
 *   (F) POST /trips with notes → 201, notes in response
 *   (G) PATCH /trips/:id with notes update → 200, notes updated
 *   (H) PATCH /trips/:id with notes: null → 200, notes cleared (null)
 *   (I) GET /trips/:id → notes field present (null when unset)
 *   (J) POST /trips without notes field → 201, notes: null
 *   (K) POST /trips with notes > 2000 chars → 400 VALIDATION_ERROR
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks (declared before any import that transitively uses these modules)
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

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-token'),
    verify: vi.fn((token) => {
      if (token === 'valid-token') {
        return { id: 'user-s20', email: 'sprint20@example.com', name: 'Sprint20' };
      }
      throw new Error('Invalid token');
    }),
  },
}));

import express from 'express';
import tripsRoutes from '../routes/trips.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as tripModel from '../models/tripModel.js';

// ============================================================================
// Helpers
// ============================================================================

const TRIP_UUID = '550e8400-e29b-41d4-a716-446655440020';
const AUTH = { Authorization: 'Bearer valid-token' };

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
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            server.close();
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
          });
        });
        req.on('error', (err) => { server.close(); reject(err); });
        if (body !== null && body !== undefined) req.write(JSON.stringify(body));
        req.end();
      });
    });
  });
}

/** A destination string that is exactly 100 characters (the max). */
const DEST_100 = 'A'.repeat(100);
/** A destination string that is 101 characters (one over the limit). */
const DEST_101 = 'A'.repeat(101);

const BASE_TRIP = {
  id: TRIP_UUID,
  user_id: 'user-s20',
  name: 'Sprint 20 Trip',
  destinations: ['Tokyo'],
  status: 'PLANNING',
  notes: null,
  start_date: null,
  end_date: null,
  created_at: '2026-03-10T08:00:00.000Z',
  updated_at: '2026-03-10T08:00:00.000Z',
};

// ============================================================================
// T-186 Test (A) — POST /trips with 101-char destination → 400 VALIDATION_ERROR
// ============================================================================

describe('T-186 (A) — POST /api/v1/trips with 101-char destination returns 400', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 400 VALIDATION_ERROR when a destination exceeds 100 characters', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/trips', {
      name: 'Sprint 20 Trip',
      destinations: [DEST_101],
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toBeDefined();
    expect(res.body.error.fields.destinations).toBeDefined();
    // Must not call the model
    expect(tripModel.createTrip).not.toHaveBeenCalled();
  });

  it('returns 400 VALIDATION_ERROR even when mixed with valid destinations', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/trips', {
      name: 'Sprint 20 Trip',
      destinations: ['Tokyo', DEST_101],
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.destinations).toBeDefined();
  });
});

// ============================================================================
// T-186 Test (B) — PATCH /trips/:id with 101-char destination → 400 VALIDATION_ERROR
// ============================================================================

describe('T-186 (B) — PATCH /api/v1/trips/:id with 101-char destination returns 400', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(BASE_TRIP);
  });

  it('returns 400 VALIDATION_ERROR when a destination exceeds 100 characters', async () => {
    const app = buildApp();
    const res = await request(app, 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      destinations: [DEST_101],
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toBeDefined();
    expect(res.body.error.fields.destinations).toBeDefined();
    // Must not call updateTrip
    expect(tripModel.updateTrip).not.toHaveBeenCalled();
  });

  it('returns 400 with destinations error when the oversized item is one of many', async () => {
    const app = buildApp();
    const res = await request(app, 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      destinations: ['Osaka', 'Kyoto', DEST_101],
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.destinations).toBeDefined();
  });
});

// ============================================================================
// T-186 Test (C) — PATCH /trips/:id with destinations: [] → 400 human-friendly message
// ============================================================================

describe('T-186 (C) — PATCH /api/v1/trips/:id with empty destinations returns human-friendly 400', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(BASE_TRIP);
  });

  it('returns 400 with "At least one destination is required" message for empty array', async () => {
    const app = buildApp();
    const res = await request(app, 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      destinations: [],
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toBeDefined();
    expect(res.body.error.fields.destinations).toBe('At least one destination is required');
    // Must not call updateTrip
    expect(tripModel.updateTrip).not.toHaveBeenCalled();
  });

  it('message for empty PATCH destinations matches the POST "required" message', async () => {
    // Verifies FB-008: PATCH empty-array error message is consistent with POST missing-field error
    const app = buildApp();
    const patchRes = await request(app, 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      destinations: [],
    }, AUTH);

    const postRes = await request(app, 'POST', '/api/v1/trips', {
      name: 'Trip',
      destinations: [],
    }, AUTH);

    expect(patchRes.status).toBe(400);
    expect(postRes.status).toBe(400);
    expect(patchRes.body.error.fields.destinations).toBe(
      postRes.body.error.fields.destinations,
    );
  });
});

// ============================================================================
// T-186 Test (D) — Happy path: POST with valid 100-char destination → 201
// ============================================================================

describe('T-186 (D) — Happy path: POST with exactly 100-char destination succeeds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.createTrip.mockResolvedValue({
      ...BASE_TRIP,
      destinations: [DEST_100],
    });
  });

  it('returns 201 when destination is exactly 100 characters (boundary)', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/trips', {
      name: 'Sprint 20 Trip',
      destinations: [DEST_100],
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(tripModel.createTrip).toHaveBeenCalledWith(
      expect.objectContaining({ destinations: [DEST_100] }),
    );
  });

  it('returns 201 for a mix of short and 100-char destinations', async () => {
    tripModel.createTrip.mockResolvedValue({
      ...BASE_TRIP,
      destinations: ['Tokyo', DEST_100],
    });

    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/trips', {
      name: 'Sprint 20 Trip',
      destinations: ['Tokyo', DEST_100],
    }, AUTH);

    expect(res.status).toBe(201);
    expect(tripModel.createTrip).toHaveBeenCalled();
  });
});

// ============================================================================
// T-186 Test (E) — Happy path: PATCH with valid 100-char destination → 200
// ============================================================================

describe('T-186 (E) — Happy path: PATCH with exactly 100-char destination succeeds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(BASE_TRIP);
    tripModel.updateTrip.mockResolvedValue({
      ...BASE_TRIP,
      destinations: [DEST_100],
    });
  });

  it('returns 200 when PATCH destination is exactly 100 characters (boundary)', async () => {
    const app = buildApp();
    const res = await request(app, 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      destinations: [DEST_100],
    }, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(tripModel.updateTrip).toHaveBeenCalledWith(
      TRIP_UUID,
      expect.objectContaining({ destinations: [DEST_100] }),
    );
  });
});

// ============================================================================
// T-188 (F) — POST /trips with notes → 201, notes in response
// ============================================================================

describe('T-188 (F) — POST /api/v1/trips with notes returns 201 with notes', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 201 and includes notes in response when notes provided', async () => {
    const noteText = 'Pack light — no checked bags on this trip.';
    tripModel.createTrip.mockResolvedValue({ ...BASE_TRIP, notes: noteText });

    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/trips', {
      name: 'Sprint 20 Trip',
      destinations: ['Tokyo'],
      notes: noteText,
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.notes).toBe(noteText);
    expect(tripModel.createTrip).toHaveBeenCalledWith(
      expect.objectContaining({ notes: noteText }),
    );
  });
});

// ============================================================================
// T-188 (G) — PATCH /trips/:id with notes update → 200, notes updated
// ============================================================================

describe('T-188 (G) — PATCH /api/v1/trips/:id updates notes field', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue(BASE_TRIP);
  });

  it('returns 200 with updated notes after PATCH', async () => {
    const updatedNote = 'Updated: bring sunscreen and extra cash.';
    tripModel.updateTrip.mockResolvedValue({ ...BASE_TRIP, notes: updatedNote });

    const app = buildApp();
    const res = await request(app, 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      notes: updatedNote,
    }, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe(updatedNote);
    expect(tripModel.updateTrip).toHaveBeenCalledWith(
      TRIP_UUID,
      expect.objectContaining({ notes: updatedNote }),
    );
  });
});

// ============================================================================
// T-188 (H) — PATCH /trips/:id with notes: null → 200, notes cleared
// ============================================================================

describe('T-188 (H) — PATCH /api/v1/trips/:id with notes: null clears the field', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tripModel.findTripById.mockResolvedValue({ ...BASE_TRIP, notes: 'Old note text' });
  });

  it('returns 200 with notes: null when notes is explicitly cleared', async () => {
    tripModel.updateTrip.mockResolvedValue({ ...BASE_TRIP, notes: null });

    const app = buildApp();
    const res = await request(app, 'PATCH', `/api/v1/trips/${TRIP_UUID}`, {
      notes: null,
    }, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBeNull();
    expect(tripModel.updateTrip).toHaveBeenCalledWith(
      TRIP_UUID,
      expect.objectContaining({ notes: null }),
    );
  });
});

// ============================================================================
// T-188 (I) — GET /trips/:id → notes field always present
// ============================================================================

describe('T-188 (I) — GET /api/v1/trips/:id always includes notes field', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns notes: null in response when no notes set', async () => {
    tripModel.findTripById.mockResolvedValue({ ...BASE_TRIP, notes: null });

    const app = buildApp();
    const res = await request(app, 'GET', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(200);
    expect(Object.prototype.hasOwnProperty.call(res.body.data, 'notes')).toBe(true);
    expect(res.body.data.notes).toBeNull();
  });

  it('returns notes string when notes exist', async () => {
    tripModel.findTripById.mockResolvedValue({ ...BASE_TRIP, notes: 'Cherry blossom season!' });

    const app = buildApp();
    const res = await request(app, 'GET', `/api/v1/trips/${TRIP_UUID}`, null, AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('Cherry blossom season!');
  });
});

// ============================================================================
// T-188 (J) — POST /trips without notes → 201, notes: null
// ============================================================================

describe('T-188 (J) — POST /api/v1/trips without notes field returns notes: null', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 201 with notes: null when notes field omitted from request', async () => {
    tripModel.createTrip.mockResolvedValue({ ...BASE_TRIP, notes: null });

    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/trips', {
      name: 'No-notes trip',
      destinations: ['Osaka'],
    }, AUTH);

    expect(res.status).toBe(201);
    expect(res.body.data.notes).toBeNull();
    // notes key must NOT be passed to createTrip when omitted from request
    expect(tripModel.createTrip).toHaveBeenCalledWith(
      expect.not.objectContaining({ notes: expect.anything() }),
    );
  });
});

// ============================================================================
// T-188 (K) — POST /trips with notes > 2000 chars → 400 VALIDATION_ERROR
// ============================================================================

describe('T-188 (K) — POST /api/v1/trips with notes > 2000 chars returns 400', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 400 VALIDATION_ERROR with notes field error when notes exceeds 2000 chars', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/trips', {
      name: 'Over-limit notes trip',
      destinations: ['Tokyo'],
      notes: 'N'.repeat(2001),
    }, AUTH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toBeDefined();
    expect(res.body.error.fields.notes).toBeDefined();
    expect(tripModel.createTrip).not.toHaveBeenCalled();
  });

  it('accepts notes of exactly 2000 characters (boundary)', async () => {
    const longNote = 'X'.repeat(2000);
    tripModel.createTrip.mockResolvedValue({ ...BASE_TRIP, notes: longNote });

    const app = buildApp();
    const res = await request(app, 'POST', '/api/v1/trips', {
      name: 'Max notes trip',
      destinations: ['Tokyo'],
      notes: longNote,
    }, AUTH);

    expect(res.status).toBe(201);
    expect(tripModel.createTrip).toHaveBeenCalled();
  });
});
