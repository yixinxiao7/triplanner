/**
 * Unit tests for computeTripStatus (T-030)
 *
 * Tests the pure status auto-calculation logic directly, without route or DB involvement.
 * computeTripStatus is exported from tripModel.js and called by findTripById / listTripsByUser.
 *
 * Auto-calculation rules:
 *   - Both start_date AND end_date must be non-null; otherwise stored status is returned
 *   - end_date < today              → COMPLETED
 *   - start_date <= today <= end_date → ONGOING
 *   - start_date > today            → PLANNING
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the database module so importing tripModel.js doesn't attempt a DB connection.
// TRIP_COLUMNS in tripModel.js calls db.raw() at module load time, so the mock must
// expose a `raw` method (or any method that won't throw on import).
vi.mock('../config/database.js', () => ({
  default: {
    raw: vi.fn((sql) => ({ toSQL: () => sql, __raw: sql })),
  },
}));

import { computeTripStatus } from '../models/tripModel.js';

// ---- Fixed "today" for deterministic tests ----
// We pin today to 2026-02-25 (the current sprint date) so tests are stable.
const FIXED_TODAY = '2026-02-25';

let dateSpy;
beforeEach(() => {
  // Override Date.prototype to return a fixed "now" for toISOString()
  dateSpy = vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(`${FIXED_TODAY}T00:00:00.000Z`);
});

afterEach(() => {
  dateSpy.mockRestore();
});

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
// Guard clauses
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
// No dates — fall back to stored status
// =============================================================================

describe('computeTripStatus — null dates → stored status unchanged', () => {
  it('returns stored status when both start_date and end_date are null', () => {
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
    // Even if end_date is in the past, auto-calc requires BOTH dates
    const trip = makeTrip({ status: 'ONGOING', start_date: null, end_date: '2025-01-01' });
    expect(computeTripStatus(trip).status).toBe('ONGOING');
  });
});

// =============================================================================
// Both dates set — COMPLETED (end_date < today)
// =============================================================================

describe('computeTripStatus — COMPLETED (trip already ended)', () => {
  it('returns COMPLETED when end_date is before today', () => {
    const trip = makeTrip({
      status: 'PLANNING',
      start_date: '2025-11-01',
      end_date: '2025-11-07',   // 2025-11-07 < 2026-02-25 → COMPLETED
    });
    expect(computeTripStatus(trip).status).toBe('COMPLETED');
  });

  it('returns COMPLETED even when stored status was PLANNING', () => {
    const trip = makeTrip({
      status: 'PLANNING',
      start_date: '2020-01-01',
      end_date: '2020-01-10',
    });
    expect(computeTripStatus(trip).status).toBe('COMPLETED');
  });

  it('returns COMPLETED for end_date === yesterday', () => {
    const trip = makeTrip({
      status: 'ONGOING',
      start_date: '2026-02-20',
      end_date: '2026-02-24',   // yesterday → COMPLETED
    });
    expect(computeTripStatus(trip).status).toBe('COMPLETED');
  });

  it('does NOT mutate the original trip object', () => {
    const trip = makeTrip({
      status: 'PLANNING',
      start_date: '2025-01-01',
      end_date: '2025-01-07',
    });
    const result = computeTripStatus(trip);
    expect(result.status).toBe('COMPLETED');
    expect(trip.status).toBe('PLANNING');   // original unchanged
  });
});

// =============================================================================
// Both dates set — ONGOING (today is within the range)
// =============================================================================

describe('computeTripStatus — ONGOING (trip in progress)', () => {
  it('returns ONGOING when today is within [start_date, end_date]', () => {
    const trip = makeTrip({
      status: 'PLANNING',
      start_date: '2026-02-20',   // before today (2026-02-25)
      end_date: '2026-02-28',     // after today
    });
    expect(computeTripStatus(trip).status).toBe('ONGOING');
  });

  it('returns ONGOING when start_date === today', () => {
    const trip = makeTrip({
      status: 'PLANNING',
      start_date: '2026-02-25',   // = today
      end_date: '2026-03-05',
    });
    expect(computeTripStatus(trip).status).toBe('ONGOING');
  });

  it('returns ONGOING when end_date === today', () => {
    const trip = makeTrip({
      status: 'PLANNING',
      start_date: '2026-02-20',
      end_date: '2026-02-25',     // = today
    });
    expect(computeTripStatus(trip).status).toBe('ONGOING');
  });

  it('returns ONGOING when start_date === end_date === today (single-day trip)', () => {
    const trip = makeTrip({
      status: 'PLANNING',
      start_date: '2026-02-25',
      end_date: '2026-02-25',
    });
    expect(computeTripStatus(trip).status).toBe('ONGOING');
  });
});

// =============================================================================
// Both dates set — PLANNING (trip is in the future)
// =============================================================================

describe('computeTripStatus — PLANNING (trip not yet started)', () => {
  it('returns PLANNING when start_date is after today', () => {
    const trip = makeTrip({
      status: 'ONGOING',          // stored status doesn't matter when dates present
      start_date: '2027-06-01',
      end_date: '2027-06-14',
    });
    expect(computeTripStatus(trip).status).toBe('PLANNING');
  });

  it('returns PLANNING for start_date = tomorrow', () => {
    const trip = makeTrip({
      status: 'COMPLETED',
      start_date: '2026-02-26',   // tomorrow
      end_date: '2026-03-01',
    });
    expect(computeTripStatus(trip).status).toBe('PLANNING');
  });
});

// =============================================================================
// Return object shape — other fields preserved
// =============================================================================

describe('computeTripStatus — returned object preserves all other fields', () => {
  it('preserves id, name, destinations, user_id, dates, timestamps', () => {
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

  it('when no dates — returns same object reference (no copy made)', () => {
    const trip = makeTrip({ start_date: null, end_date: null });
    const result = computeTripStatus(trip);
    // Without dates, function returns the original object reference unchanged
    expect(result).toBe(trip);
  });
});
