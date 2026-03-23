/**
 * Unit tests for calendarModel.js helper logic (T-212, Sprint 25)
 *
 * Tests the pure transformation and sorting functions without a database.
 * The db-level getCalendarEvents function is covered by the route-layer
 * integration mocks in sprint25.test.js.
 *
 * We test the exported helpers indirectly by calling getCalendarEvents
 * with a fully mocked Knex db instance.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock the db module so calendarModel can import without a real DB ----
vi.mock('../config/database.js', () => {
  const mockDb = vi.fn();
  // chainable query builder stub
  const chain = {
    where: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    then: undefined, // not a Promise itself — resolved via mockResolvedValue on select
  };
  // default: return empty arrays
  chain.select.mockResolvedValue([]);
  mockDb.mockReturnValue(chain);
  mockDb.raw = vi.fn((sql) => sql);
  return { default: mockDb };
});

import db from '../config/database.js';
import { getCalendarEvents } from '../models/calendarModel.js';

// ---- Helpers to build mock DB rows ----

function makeFlight(overrides = {}) {
  return {
    id: 'aaaa0001-0000-4000-8000-000000000001',
    airline: 'Delta',
    flight_number: 'DL123',
    from_location: 'JFK',
    to_location: 'LAX',
    departure_at: '2026-08-07T14:00:00.000Z', // 10:00 EDT (America/New_York)
    departure_tz: 'America/New_York',
    arrival_at: '2026-08-07T20:30:00.000Z',   // 13:30 PDT (America/Los_Angeles)
    arrival_tz: 'America/Los_Angeles',
    ...overrides,
  };
}

function makeStay(overrides = {}) {
  return {
    id: 'bbbb0001-0000-4000-8000-000000000001',
    name: 'Grand Hyatt LA',
    check_in_at: '2026-08-07T22:00:00.000Z',  // 15:00 PDT
    check_in_tz: 'America/Los_Angeles',
    check_out_at: '2026-08-10T18:00:00.000Z', // 11:00 PDT
    check_out_tz: 'America/Los_Angeles',
    ...overrides,
  };
}

function makeActivity(overrides = {}) {
  return {
    id: 'cccc0001-0000-4000-8000-000000000001',
    name: 'Getty Museum Visit',
    activity_date: '2026-08-08',
    start_time: '10:00:00',
    end_time: '13:00:00',
    ...overrides,
  };
}

function makeLandTravel(overrides = {}) {
  return {
    id: 'dddd0001-0000-4000-8000-000000000001',
    mode: 'TRAIN',
    from_location: 'Tokyo',
    to_location: 'Osaka',
    departure_date: '2026-08-12',
    departure_time: '10:00:00',
    arrival_date: '2026-08-12',
    arrival_time: '12:30:00',
    ...overrides,
  };
}

// Helper: configure mock db to return specific rows for each table
function setupDbMocks({ flights = [], stays = [], activities = [], landTravels = [] } = {}) {
  const makeChain = (rows) => {
    const chain = { where: vi.fn().mockReturnThis(), select: vi.fn() };
    chain.select.mockResolvedValue(rows);
    return chain;
  };

  db.mockImplementation((table) => {
    if (table === 'flights') return makeChain(flights);
    if (table === 'stays') return makeChain(stays);
    if (table === 'activities') return makeChain(activities);
    if (table === 'land_travels') return makeChain(landTravels);
    return makeChain([]);
  });
  db.raw = vi.fn((sql) => sql);
}

// ============================================================

describe('calendarModel — getCalendarEvents()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Empty trip ----

  it('returns an empty array when no sub-resources exist', async () => {
    setupDbMocks();
    const events = await getCalendarEvents('trip-id');
    expect(events).toEqual([]);
  });

  // ---- FLIGHT event transformation ----

  it('transforms a flight into a FLIGHT event with correct id prefix', async () => {
    setupDbMocks({ flights: [makeFlight()] });
    const events = await getCalendarEvents('trip-id');

    expect(events).toHaveLength(1);
    const e = events[0];
    expect(e.type).toBe('FLIGHT');
    expect(e.id).toBe(`flight-${makeFlight().id}`);
    expect(e.source_id).toBe(makeFlight().id);
  });

  it('derives FLIGHT title as "{airline} {flight_number} — {from} → {to}"', async () => {
    setupDbMocks({ flights: [makeFlight()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].title).toBe('Delta DL123 — JFK → LAX');
  });

  it('derives FLIGHT start_date in departure_tz local date', async () => {
    // departure_at: 2026-08-07T14:00:00Z → 10:00 EDT on 2026-08-07
    setupDbMocks({ flights: [makeFlight()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].start_date).toBe('2026-08-07');
  });

  it('derives FLIGHT start_time in HH:MM format', async () => {
    setupDbMocks({ flights: [makeFlight()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].start_time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('sets FLIGHT timezone to departure_tz', async () => {
    setupDbMocks({ flights: [makeFlight()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].timezone).toBe('America/New_York');
  });

  it('handles overnight flight: start_date !== end_date', async () => {
    const overnightFlight = makeFlight({
      departure_at: '2026-08-07T22:00:00.000Z', // 18:00 EDT Aug 7
      departure_tz: 'America/New_York',
      arrival_at: '2026-08-08T10:00:00.000Z',   // 03:00 PDT Aug 8
      arrival_tz: 'America/Los_Angeles',
    });
    setupDbMocks({ flights: [overnightFlight] });
    const events = await getCalendarEvents('trip-id');
    // start_date should be Aug 7, end_date Aug 8
    expect(events[0].start_date).toBe('2026-08-07');
    expect(events[0].end_date).toBe('2026-08-08');
  });

  // ---- STAY event transformation ----

  it('transforms a stay into a STAY event with correct id prefix', async () => {
    setupDbMocks({ stays: [makeStay()] });
    const events = await getCalendarEvents('trip-id');

    expect(events).toHaveLength(1);
    const e = events[0];
    expect(e.type).toBe('STAY');
    expect(e.id).toBe(`stay-${makeStay().id}`);
    expect(e.source_id).toBe(makeStay().id);
  });

  it('uses stay.name as the STAY title', async () => {
    setupDbMocks({ stays: [makeStay()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].title).toBe('Grand Hyatt LA');
  });

  it('derives STAY start_date in check_in_tz local date', async () => {
    // check_in_at: 2026-08-07T22:00:00Z → 15:00 PDT on 2026-08-07
    setupDbMocks({ stays: [makeStay()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].start_date).toBe('2026-08-07');
  });

  it('derives STAY end_date correctly for multi-night stays', async () => {
    // check_out_at: 2026-08-10T18:00:00Z → 11:00 PDT on 2026-08-10
    setupDbMocks({ stays: [makeStay()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].end_date).toBe('2026-08-10');
  });

  it('sets STAY timezone to check_in_tz', async () => {
    setupDbMocks({ stays: [makeStay()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].timezone).toBe('America/Los_Angeles');
  });

  // ---- ACTIVITY event transformation ----

  it('transforms an activity into an ACTIVITY event with correct id prefix', async () => {
    setupDbMocks({ activities: [makeActivity()] });
    const events = await getCalendarEvents('trip-id');

    expect(events).toHaveLength(1);
    const e = events[0];
    expect(e.type).toBe('ACTIVITY');
    expect(e.id).toBe(`activity-${makeActivity().id}`);
    expect(e.source_id).toBe(makeActivity().id);
  });

  it('uses activity.name as the ACTIVITY title', async () => {
    setupDbMocks({ activities: [makeActivity()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].title).toBe('Getty Museum Visit');
  });

  it('ACTIVITY: start_date equals end_date (single-day)', async () => {
    setupDbMocks({ activities: [makeActivity()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].start_date).toBe('2026-08-08');
    expect(events[0].end_date).toBe('2026-08-08');
  });

  it('ACTIVITY: normalizes "HH:MM:SS" time to "HH:MM"', async () => {
    setupDbMocks({ activities: [makeActivity({ start_time: '09:30:00', end_time: '12:00:00' })] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].start_time).toBe('09:30');
    expect(events[0].end_time).toBe('12:00');
  });

  it('ACTIVITY: null start_time and end_time stay null (all-day)', async () => {
    setupDbMocks({ activities: [makeActivity({ start_time: null, end_time: null })] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].start_time).toBeNull();
    expect(events[0].end_time).toBeNull();
  });

  it('ACTIVITY: timezone is always null', async () => {
    setupDbMocks({ activities: [makeActivity()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].timezone).toBeNull();
  });

  // ---- Sort order ----

  it('sorts events by start_date ASC', async () => {
    setupDbMocks({
      activities: [
        makeActivity({ id: 'cccc0001-0000-4000-8000-000000000002', activity_date: '2026-08-10', name: 'Later' }),
        makeActivity({ id: 'cccc0001-0000-4000-8000-000000000001', activity_date: '2026-08-08', name: 'Earlier' }),
      ],
    });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].title).toBe('Earlier');
    expect(events[1].title).toBe('Later');
  });

  it('sorts timed events before all-day events on the same date (NULLS LAST)', async () => {
    setupDbMocks({
      activities: [
        makeActivity({ id: 'cccc0001-0000-4000-8000-000000000002', name: 'All-day', start_time: null, end_time: null }),
        makeActivity({ id: 'cccc0001-0000-4000-8000-000000000001', name: 'Timed', start_time: '09:00:00', end_time: '10:00:00' }),
      ],
    });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].title).toBe('Timed');
    expect(events[1].title).toBe('All-day');
  });

  // ---- LAND_TRAVEL event transformation (T-242) ----

  it('transforms a land travel into a LAND_TRAVEL event with correct id prefix', async () => {
    setupDbMocks({ landTravels: [makeLandTravel()] });
    const events = await getCalendarEvents('trip-id');

    expect(events).toHaveLength(1);
    const e = events[0];
    expect(e.type).toBe('LAND_TRAVEL');
    expect(e.id).toBe(`land-travel-${makeLandTravel().id}`);
    expect(e.source_id).toBe(makeLandTravel().id);
  });

  it('derives LAND_TRAVEL title as "{mode} — {from_location} → {to_location}"', async () => {
    setupDbMocks({ landTravels: [makeLandTravel()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].title).toBe('TRAIN — Tokyo → Osaka');
  });

  it('uses departure_date as start_date and arrival_date as end_date', async () => {
    setupDbMocks({ landTravels: [makeLandTravel()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].start_date).toBe('2026-08-12');
    expect(events[0].end_date).toBe('2026-08-12');
  });

  it('normalizes departure_time and arrival_time to HH:MM', async () => {
    setupDbMocks({ landTravels: [makeLandTravel({ departure_time: '10:00:00', arrival_time: '12:30:00' })] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].start_time).toBe('10:00');
    expect(events[0].end_time).toBe('12:30');
  });

  it('falls back end_date to departure_date when arrival_date is null', async () => {
    setupDbMocks({ landTravels: [makeLandTravel({ arrival_date: null })] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].start_date).toBe('2026-08-12');
    expect(events[0].end_date).toBe('2026-08-12'); // fallback to departure_date
  });

  it('returns null start_time and end_time when departure_time and arrival_time are null', async () => {
    setupDbMocks({ landTravels: [makeLandTravel({ departure_time: null, arrival_time: null })] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].start_time).toBeNull();
    expect(events[0].end_time).toBeNull();
  });

  it('LAND_TRAVEL timezone is always null', async () => {
    setupDbMocks({ landTravels: [makeLandTravel()] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].timezone).toBeNull();
  });

  it('returns no LAND_TRAVEL events when land_travels table has no rows for trip', async () => {
    setupDbMocks({ landTravels: [] });
    const events = await getCalendarEvents('trip-id');
    expect(events.filter(e => e.type === 'LAND_TRAVEL')).toHaveLength(0);
  });

  it('returns all four event types when all sub-resources are present', async () => {
    setupDbMocks({
      flights: [makeFlight()],
      stays: [makeStay()],
      activities: [makeActivity()],
      landTravels: [makeLandTravel()],
    });
    const events = await getCalendarEvents('trip-id');
    const types = events.map(e => e.type);
    expect(types).toContain('FLIGHT');
    expect(types).toContain('STAY');
    expect(types).toContain('ACTIVITY');
    expect(types).toContain('LAND_TRAVEL');
    expect(events).toHaveLength(4);
  });

  it('sorts LAND_TRAVEL events by start_date with other event types', async () => {
    // LAND_TRAVEL on 2026-08-12, ACTIVITY on 2026-08-08 → ACTIVITY first
    setupDbMocks({
      activities: [makeActivity({ activity_date: '2026-08-08' })],
      landTravels: [makeLandTravel({ departure_date: '2026-08-12' })],
    });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].type).toBe('ACTIVITY');
    expect(events[1].type).toBe('LAND_TRAVEL');
  });

  it('uses alphabetical type tiebreaker: LAND_TRAVEL after FLIGHT on same date+time', async () => {
    // FLIGHT and LAND_TRAVEL on same date+time → FLIGHT < LAND_TRAVEL alphabetically
    const flight = makeFlight({
      departure_at: '2026-08-12T15:00:00.000Z',
      departure_tz: 'UTC',
      arrival_at: '2026-08-12T17:00:00.000Z',
      arrival_tz: 'UTC',
    });
    const lt = makeLandTravel({
      departure_date: '2026-08-12',
      departure_time: '15:00:00', // same local time
    });
    setupDbMocks({ flights: [flight], landTravels: [lt] });
    const events = await getCalendarEvents('trip-id');
    expect(events[0].type).toBe('FLIGHT');
    expect(events[1].type).toBe('LAND_TRAVEL');
  });

  it('uses type as alphabetical tiebreaker (ACTIVITY < FLIGHT < STAY)', async () => {
    // Same date, same time → alphabetical type order
    const flight = makeFlight({
      departure_at: '2026-08-07T15:00:00.000Z',
      departure_tz: 'UTC',
      arrival_at: '2026-08-07T16:00:00.000Z',
      arrival_tz: 'UTC',
    });
    const stay = makeStay({
      check_in_at: '2026-08-07T15:00:00.000Z',
      check_in_tz: 'UTC',
      check_out_at: '2026-08-08T10:00:00.000Z',
      check_out_tz: 'UTC',
    });
    const activity = makeActivity({
      activity_date: '2026-08-07',
      start_time: '15:00:00',
      end_time: '16:00:00',
    });

    setupDbMocks({ flights: [flight], stays: [stay], activities: [activity] });
    const events = await getCalendarEvents('trip-id');

    // All on 2026-08-07, same start_time → alphabetical: ACTIVITY, FLIGHT, STAY
    const types = events.map((e) => e.type);
    expect(types[0]).toBe('ACTIVITY');
    expect(types[1]).toBe('FLIGHT');
    expect(types[2]).toBe('STAY');
  });
});
