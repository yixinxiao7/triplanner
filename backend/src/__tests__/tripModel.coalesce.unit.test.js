/**
 * T-229 (Sprint 28) — TRIP_COLUMNS COALESCE SQL structure unit tests
 *
 * Verifies that the TRIP_COLUMNS db.raw() expressions in tripModel.js use
 * COALESCE(trips.start_date, LEAST(…)) and COALESCE(trips.end_date, GREATEST(…))
 * so that user-provided dates take precedence over sub-resource aggregates.
 *
 * This file is separate from sprint28.test.js because that file mocks tripModel.js
 * at module scope (for route-level tests), which would prevent importing the real
 * model implementation here. Vitest isolates modules between test files.
 *
 * Strategy: mock only `../config/database.js` so that db.raw() calls are captured
 * without attempting a real DB connection, then load the real tripModel.js and
 * inspect the SQL strings passed to db.raw() at module-load time.
 */

import { describe, it, expect, vi } from 'vitest';

// Capture every SQL string passed to db.raw() when tripModel.js is imported.
// TRIP_COLUMNS is defined at module scope, so db.raw() fires on first import.
const rawCalls = [];

vi.mock('../config/database.js', () => ({
  default: {
    raw: vi.fn((sql) => {
      rawCalls.push(sql);
      // Return a minimal object that satisfies any Knex column reference usage
      return { toSQL: () => sql, __raw: sql };
    }),
    // Stub any other db methods that might be called at import time
    fn: vi.fn(),
  },
}));

// Import the real tripModel.js — db.raw() calls happen here and populate rawCalls
await import('../models/tripModel.js');

// ============================================================================
// COALESCE structure — start_date
// ============================================================================

describe('T-229 — TRIP_COLUMNS start_date SQL uses COALESCE(trips.start_date, LEAST(…))', () => {
  it('start_date raw SQL is captured (db.raw was called)', () => {
    const startDateSql = rawCalls.find((sql) => sql.includes('AS start_date'));
    expect(startDateSql).toBeDefined();
  });

  it('start_date expression is wrapped in COALESCE with trips.start_date as first arg', () => {
    const startDateSql = rawCalls.find((sql) => sql.includes('AS start_date'));
    expect(startDateSql).toMatch(/COALESCE\s*\(\s*trips\.start_date/i);
  });

  it('start_date COALESCE second arg is LEAST()', () => {
    const startDateSql = rawCalls.find((sql) => sql.includes('AS start_date'));
    expect(startDateSql).toMatch(/LEAST\s*\(/i);
  });

  it('start_date LEAST() still references all sub-resource tables', () => {
    const startDateSql = rawCalls.find((sql) => sql.includes('AS start_date'));
    expect(startDateSql).toMatch(/FROM flights/);
    expect(startDateSql).toMatch(/FROM stays/);
    expect(startDateSql).toMatch(/FROM activities/);
    expect(startDateSql).toMatch(/FROM land_travels/);
  });
});

// ============================================================================
// COALESCE structure — end_date
// ============================================================================

describe('T-229 — TRIP_COLUMNS end_date SQL uses COALESCE(trips.end_date, GREATEST(…))', () => {
  it('end_date raw SQL is captured (db.raw was called)', () => {
    const endDateSql = rawCalls.find((sql) => sql.includes('AS end_date'));
    expect(endDateSql).toBeDefined();
  });

  it('end_date expression is wrapped in COALESCE with trips.end_date as first arg', () => {
    const endDateSql = rawCalls.find((sql) => sql.includes('AS end_date'));
    expect(endDateSql).toMatch(/COALESCE\s*\(\s*trips\.end_date/i);
  });

  it('end_date COALESCE second arg is GREATEST()', () => {
    const endDateSql = rawCalls.find((sql) => sql.includes('AS end_date'));
    expect(endDateSql).toMatch(/GREATEST\s*\(/i);
  });

  it('end_date GREATEST() still references all sub-resource tables', () => {
    const endDateSql = rawCalls.find((sql) => sql.includes('AS end_date'));
    expect(endDateSql).toMatch(/FROM flights/);
    expect(endDateSql).toMatch(/FROM stays/);
    expect(endDateSql).toMatch(/FROM activities/);
    expect(endDateSql).toMatch(/FROM land_travels/);
  });
});
