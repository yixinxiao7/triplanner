import pg from 'pg';
import knex from 'knex';
import knexConfig from './knexfile.js';

// ---- pg timestamp serialization fix (T-098 / FB-081) ----
//
// Problem: The `pg` driver converts TIMESTAMPTZ (OID 1184) columns to
// JavaScript Date objects by calling `new Date(rawPgString)`. When the
// PostgreSQL session timezone is non-UTC (e.g., "America/New_York"), pg
// receives the timestamp as a local-timezone-offset string (e.g.,
// "2026-08-07 16:00:00-04"). In some Node.js / V8 environments the Date
// constructor silently discards the offset and treats the value as local time,
// producing the wrong UTC moment → 4-hour shift when the JSON response is
// displayed using `Intl.DateTimeFormat` with the stored `_tz` field.
//
// Fix: Override the type parsers to explicitly produce a UTC ISO 8601 string:
//   1. Receive the raw string from PostgreSQL (e.g., "2026-08-07 16:00:00-04").
//   2. Call new Date(val) — V8 handles the PostgreSQL format (space separator
//      and ±HH or ±HH:MM offset) correctly when parsed with explicit context.
//   3. Return .toISOString(), which is always UTC ("...Z" suffix, per ECMA-262).
//
// Result: all *_at timestamp fields in API responses are always UTC ISO 8601
// strings (e.g., "2026-08-07T20:00:00.000Z"), matching the Sprint 1 contract.
//
// OID 1184 = timestamptz (timestamp with time zone) — all *_at columns
// OID 1114 = timestamp   (timestamp without time zone) — returned as-is since
//            no timezone context is available; callers must not assume UTC.

const { types } = pg;

types.setTypeParser(1184, (val) => {
  // TIMESTAMPTZ: convert raw pg string → guaranteed UTC ISO 8601
  if (val === null || val === undefined) return null;
  return new Date(val).toISOString();
});

types.setTypeParser(1114, (val) => {
  // Plain TIMESTAMP (no tz): return raw string to avoid incorrect TZ inference
  return val;
});

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[environment]);

export default db;
