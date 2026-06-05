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

import { importTrip } from '../models/importModel.js';

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
