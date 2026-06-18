import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the db module: importModel uses db.transaction + db('table').insert ────
// We model knex transaction semantics: db.transaction(cb) runs cb(trx); if cb
// throws, the promise rejects (a real transaction would ROLL BACK at this point).
//
// vi.hoisted ensures these mocks exist before the (hoisted) vi.mock factory and
// the module imports run.
const { trxInsert, findFirst, transaction } = vi.hoisted(() => {
  const trxInsert = vi.fn();
  const findFirst = vi.fn();
  // insert(rows) is awaitable on its own (children: `await trx(t).insert(rows)`)
  // AND chainable via .returning() (trip: `await trx('trips').insert(...).returning('id')`).
  // Both paths delegate to the same trxInsert(table, rows) mock so a rejection
  // surfaces no matter which form importModel uses.
  const trxFactory = (table) => ({
    insert: (rows) => {
      const promise = Promise.resolve().then(() => trxInsert(table, rows));
      promise.returning = () => promise;
      return promise;
    },
  });
  const transaction = vi.fn(async (cb) => cb(trxFactory));
  return { trxInsert, findFirst, transaction };
});

vi.mock('../config/database.js', () => {
  // db(tableName) used by findTripById (outside the transaction).
  function dbFn() {
    return {
      where: () => ({ select: () => ({ first: findFirst }) }),
    };
  }
  dbFn.transaction = transaction;
  dbFn.raw = (sql) => sql;
  return { default: dbFn };
});

// ── Mock the per-resource find helpers used to re-query created rows ──────────
// appendImportToTrip re-queries each inserted id OUTSIDE the transaction via
// these; stub them so the unit test needs no real DB.
// findTripById delegates to the same hoisted `findFirst` the db mock uses, so the
// existing importTrip tests (which drive findFirst) keep working after this module
// is mocked. deduplicateDestinations is passthrough.
vi.mock('../models/tripModel.js', () => ({
  deduplicateDestinations: (d) => d,
  findTripById: vi.fn((...args) => findFirst(...args)),
}));
vi.mock('../models/flightModel.js', () => ({ findFlightById: vi.fn((id) => Promise.resolve({ id, kind: 'flight' })) }));
vi.mock('../models/stayModel.js', () => ({ findStayById: vi.fn((id) => Promise.resolve({ id, kind: 'stay' })) }));
vi.mock('../models/activityModel.js', () => ({ findActivityById: vi.fn((id) => Promise.resolve({ id, kind: 'activity' })) }));
vi.mock('../models/landTravelModel.js', () => ({ findLandTravelById: vi.fn((id) => Promise.resolve({ id, kind: 'land' })) }));

import { importTrip, appendImportToTrip } from '../models/importModel.js';
import { findFlightById } from '../models/flightModel.js';

const basePayload = {
  trip: { name: 'Japan', destinations: ['Tokyo'], start_date: null, end_date: null, notes: null },
  flights: [{
    flight_number: 'AA100', airline: 'American', from_location: 'JFK', to_location: 'HND',
    departure_at: '2026-08-07T06:50:00-04:00', departure_tz: 'America/New_York',
    arrival_at: '2026-08-08T11:00:00+09:00', arrival_tz: 'Asia/Tokyo',
  }],
  stays: [],
  activities: [],
  land_travels: [],
};

describe('importModel.importTrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('happy path: inserts trip + children in one transaction, returns the trip', async () => {
    // trips insert returns the new id; child inserts resolve.
    trxInsert.mockImplementation((table) => {
      if (table === 'trips') return Promise.resolve([{ id: 'trip-1' }]);
      return Promise.resolve([1]);
    });
    findFirst.mockResolvedValue({ id: 'trip-1', name: 'Japan' });

    const result = await importTrip('user-1', basePayload);

    expect(transaction).toHaveBeenCalledOnce();
    // Trip inserted under the right user.
    const tripCall = trxInsert.mock.calls.find((c) => c[0] === 'trips');
    expect(tripCall[1].user_id).toBe('user-1');
    // Flight inserted with the new trip_id.
    const flightCall = trxInsert.mock.calls.find((c) => c[0] === 'flights');
    expect(flightCall[1][0].trip_id).toBe('trip-1');
    // Returns the re-queried trip.
    expect(result).toEqual({ id: 'trip-1', name: 'Japan' });
  });

  it('rollback: a failing child insert rejects the whole transaction (no commit, no re-query)', async () => {
    trxInsert.mockImplementation((table) => {
      if (table === 'trips') return Promise.resolve([{ id: 'trip-1' }]);
      if (table === 'flights') return Promise.reject(new Error('insert failed: bad datetime'));
      return Promise.resolve([1]);
    });

    await expect(importTrip('user-1', basePayload)).rejects.toThrow(/insert failed/);
    // The transaction rejected → findTripById (the post-commit re-query) never ran.
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('skips child inserts for empty collections', async () => {
    trxInsert.mockImplementation((table) => {
      if (table === 'trips') return Promise.resolve([{ id: 'trip-2' }]);
      return Promise.resolve([1]);
    });
    findFirst.mockResolvedValue({ id: 'trip-2' });

    await importTrip('user-1', {
      trip: { name: 'Solo', destinations: ['Kyoto'] },
      flights: [], stays: [], activities: [], land_travels: [],
    });

    // Only the trips table was inserted into.
    const tables = trxInsert.mock.calls.map((c) => c[0]);
    expect(tables).toEqual(['trips']);
  });
});

describe('importModel.appendImportToTrip', () => {
  const TRIP_ID = 'trip-existing';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fullChildren = {
    flights: [{ flight_number: 'AA1', airline: 'AA', from_location: 'A', to_location: 'B', departure_at: 'x', departure_tz: 'tz', arrival_at: 'y', arrival_tz: 'tz' }],
    stays: [{ category: 'HOTEL', name: 'H', check_in_at: 'x', check_in_tz: 'tz', check_out_at: 'y', check_out_tz: 'tz' }],
    activities: [{ name: 'Act', activity_date: '2026-08-09' }],
    land_travels: [{ mode: 'TRAIN', from_location: 'A', to_location: 'B', departure_date: '2026-08-10' }],
  };

  it('inserts every child onto the existing trip_id in one transaction and never touches trips', async () => {
    trxInsert.mockImplementation(() => Promise.resolve([{ id: 'new-id' }]));

    const result = await appendImportToTrip(TRIP_ID, fullChildren);

    expect(transaction).toHaveBeenCalledOnce();
    const tables = trxInsert.mock.calls.map((c) => c[0]);
    // The trip row is NEVER inserted/updated on append.
    expect(tables).not.toContain('trips');
    expect(tables.sort()).toEqual(['activities', 'flights', 'land_travels', 'stays']);
    // Every child carries the existing trip_id.
    trxInsert.mock.calls.forEach(([, rows]) => {
      expect(rows[0].trip_id).toBe(TRIP_ID);
    });
    // Returns the re-queried rows for each collection.
    expect(result.flights).toHaveLength(1);
    expect(result.stays).toHaveLength(1);
    expect(result.activities).toHaveLength(1);
    expect(result.land_travels).toHaveLength(1);
  });

  it('rollback: a failing child insert rejects the whole transaction (no re-query)', async () => {
    trxInsert.mockImplementation((table) => {
      if (table === 'activities') return Promise.reject(new Error('insert failed: bad row'));
      return Promise.resolve([{ id: 'new-id' }]);
    });

    await expect(appendImportToTrip(TRIP_ID, fullChildren)).rejects.toThrow(/insert failed/);
    // Post-commit re-queries never ran.
    expect(findFlightById).not.toHaveBeenCalled();
  });

  it('skips inserts for empty collections (only the populated ones are written)', async () => {
    trxInsert.mockImplementation(() => Promise.resolve([{ id: 'new-id' }]));

    await appendImportToTrip(TRIP_ID, {
      flights: [], stays: [], activities: [{ name: 'Solo', activity_date: '2026-08-09' }], land_travels: [],
    });

    const tables = trxInsert.mock.calls.map((c) => c[0]);
    expect(tables).toEqual(['activities']);
  });
});
