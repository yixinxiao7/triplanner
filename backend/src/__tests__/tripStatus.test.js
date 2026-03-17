/**
 * Unit tests for computeTripStatus (T-030, updated T-238 Sprint 30)
 *
 * T-238 change: computeTripStatus() is now a pass-through that always returns the
 * trip unchanged. The date-based auto-compute (PLANNING / ONGOING / COMPLETED
 * derived from start_date / end_date) was removed because it silently overrode
 * user-set status values on every read (FB-130 root cause).
 *
 * Status is now always the stored DB value, controlled exclusively by the user
 * via PATCH /trips/:id.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the database module so importing tripModel.js doesn't attempt a DB connection.
vi.mock('../config/database.js', () => ({
  default: {
    raw: vi.fn((sql) => ({ toSQL: () => sql, __raw: sql })),
  },
}));

import { computeTripStatus } from '../models/tripModel.js';

// ---- Helper ----
function makeTrip(overrides = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    user_id: 'user-1',
    name: 'Test Trip',
    destinations: ['Tokyo'],
    status: 'PLANNING',
    start_date: null,
    end_date: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// =============================================================================
// Guard clauses — undefined / null input
// =============================================================================

describe('computeTripStatus — null/undefined guard', () => {
  it('returns undefined when called with undefined', () => {
    expect(computeTripStatus(undefined)).toBeUndefined();
  });

  it('returns null when called with null', () => {
    expect(computeTripStatus(null)).toBeNull();
  });
});

// =============================================================================
// Stored status always returned — no dates
// =============================================================================

describe('computeTripStatus — null dates → stored status unchanged', () => {
  it('returns stored PLANNING when both dates are null', () => {
    const trip = makeTrip({ status: 'PLANNING', start_date: null, end_date: null });
    expect(computeTripStatus(trip).status).toBe('PLANNING');
  });

  it('returns stored ONGOING when both dates are null', () => {
    const trip = makeTrip({ status: 'ONGOING', start_date: null, end_date: null });
    expect(computeTripStatus(trip).status).toBe('ONGOING');
  });

  it('returns stored COMPLETED when both dates are null', () => {
    const trip = makeTrip({ status: 'COMPLETED', start_date: null, end_date: null });
    expect(computeTripStatus(trip).status).toBe('COMPLETED');
  });

  it('returns stored status when only start_date is set (end_date null)', () => {
    const trip = makeTrip({ status: 'PLANNING', start_date: '2025-11-01', end_date: null });
    expect(computeTripStatus(trip).status).toBe('PLANNING');
  });

  it('returns stored status when only end_date is set (start_date null)', () => {
    const trip = makeTrip({ status: 'ONGOING', start_date: null, end_date: '2025-01-01' });
    expect(computeTripStatus(trip).status).toBe('ONGOING');
  });
});

// =============================================================================
// T-238 — Stored status always returned even when both dates are present
// =============================================================================

describe('computeTripStatus — both dates present → stored status STILL returned (T-238)', () => {
  it('returns stored PLANNING even when dates are in the past (would have been COMPLETED before fix)', () => {
    // Before T-238 fix this would have returned COMPLETED. Now stored status wins.
    const trip = makeTrip({
      status: 'PLANNING',
      start_date: '2025-01-01',
      end_date: '2025-01-07',
    });
    expect(computeTripStatus(trip).status).toBe('PLANNING');
  });

  it('returns stored COMPLETED even when start_date is in the future (would have been PLANNING before fix)', () => {
    const trip = makeTrip({
      status: 'COMPLETED',
      start_date: '2027-06-01',
      end_date: '2027-06-14',
    });
    expect(computeTripStatus(trip).status).toBe('COMPLETED');
  });

  it('returns stored ONGOING even when dates are entirely in the past', () => {
    const trip = makeTrip({
      status: 'ONGOING',
      start_date: '2020-01-01',
      end_date: '2020-01-10',
    });
    expect(computeTripStatus(trip).status).toBe('ONGOING');
  });

  it('returns stored PLANNING even when dates span today (would have been ONGOING before fix)', () => {
    const trip = makeTrip({
      status: 'PLANNING',
      start_date: '2026-01-01',
      end_date: '2030-12-31',
    });
    expect(computeTripStatus(trip).status).toBe('PLANNING');
  });

  it('returns stored COMPLETED even when trip is currently active', () => {
    const trip = makeTrip({
      status: 'COMPLETED',
      start_date: '2026-01-01',
      end_date: '2030-12-31',
    });
    expect(computeTripStatus(trip).status).toBe('COMPLETED');
  });
});

// =============================================================================
// Return object shape — same reference returned, all fields preserved
// =============================================================================

describe('computeTripStatus — returns same object reference unchanged', () => {
  it('returns the same object reference for a trip with dates', () => {
    const trip = makeTrip({ start_date: '2025-01-01', end_date: '2025-01-07' });
    expect(computeTripStatus(trip)).toBe(trip);
  });

  it('returns the same object reference for a trip without dates', () => {
    const trip = makeTrip({ start_date: null, end_date: null });
    expect(computeTripStatus(trip)).toBe(trip);
  });

  it('preserves all fields: id, name, destinations, user_id, dates, timestamps', () => {
    const trip = makeTrip({
      status: 'PLANNING',
      start_date: '2025-01-01',
      end_date: '2025-01-07',
    });
    const result = computeTripStatus(trip);
    expect(result.id).toBe(trip.id);
    expect(result.name).toBe(trip.name);
    expect(result.destinations).toEqual(trip.destinations);
    expect(result.user_id).toBe(trip.user_id);
    expect(result.start_date).toBe(trip.start_date);
    expect(result.end_date).toBe(trip.end_date);
    expect(result.created_at).toBe(trip.created_at);
    expect(result.updated_at).toBe(trip.updated_at);
  });

  it('does NOT mutate the original trip object', () => {
    const trip = makeTrip({ status: 'PLANNING', start_date: '2025-01-01', end_date: '2025-01-07' });
    const result = computeTripStatus(trip);
    // Same reference — no copy is made. Status is not changed.
    expect(result).toBe(trip);
    expect(result.status).toBe('PLANNING');
  });
});
