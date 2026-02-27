import db from '../config/database.js';

/**
 * Valid mode values for land travel entries.
 * Enforced at both application layer (validation) and DB layer (CHECK constraint).
 */
export const VALID_LAND_TRAVEL_MODES = [
  'RENTAL_CAR',
  'BUS',
  'TRAIN',
  'RIDESHARE',
  'FERRY',
  'OTHER',
];

/**
 * Builds a Knex query that selects all land_travels columns with date/time
 * fields cast to YYYY-MM-DD / HH:MM:SS strings via TO_CHAR.
 *
 * PostgreSQL DATE and TIME columns can be returned as Date objects by the pg
 * driver, causing unexpected ISO timestamp serialization. TO_CHAR forces a
 * string at the DB level, making the output timezone-independent.
 *
 * Note: departure_time and arrival_time are stored as TIME (wall-clock, no tz).
 * They are returned as-is; no conversion is performed.
 */
function landTravelQuery() {
  return db('land_travels').select(
    'id',
    'trip_id',
    'mode',
    'provider',
    'from_location',
    'to_location',
    db.raw("TO_CHAR(departure_date, 'YYYY-MM-DD') AS departure_date"),
    db.raw(
      "CASE WHEN departure_time IS NULL THEN NULL ELSE TO_CHAR(departure_time, 'HH24:MI:SS') END AS departure_time",
    ),
    db.raw("CASE WHEN arrival_date IS NULL THEN NULL ELSE TO_CHAR(arrival_date, 'YYYY-MM-DD') END AS arrival_date"),
    db.raw(
      "CASE WHEN arrival_time IS NULL THEN NULL ELSE TO_CHAR(arrival_time, 'HH24:MI:SS') END AS arrival_time",
    ),
    'confirmation_number',
    'notes',
    'created_at',
    'updated_at',
  );
}

/**
 * List all land travel entries for a trip.
 * Ordered by: departure_date ASC, departure_time ASC NULLS LAST.
 *
 * NULLS LAST on departure_time ensures entries without a departure time
 * sort after timed entries on the same date.
 *
 * @param {string} tripId
 * @returns {Promise<Array>}
 */
export async function listLandTravelsByTrip(tripId) {
  return landTravelQuery()
    .where({ trip_id: tripId })
    .orderByRaw('departure_date ASC, departure_time ASC NULLS LAST');
}

/**
 * Find a land travel entry by ID, scoped to a trip.
 * @param {string} id
 * @param {string} tripId
 * @returns {Promise<Object|undefined>}
 */
export async function findLandTravelById(id, tripId) {
  return landTravelQuery().where({ id, trip_id: tripId }).first();
}

/**
 * Create a new land travel entry.
 * Inserts the record and re-queries via findLandTravelById to ensure
 * date fields are returned as YYYY-MM-DD strings (via TO_CHAR).
 *
 * @param {Object} data
 * @param {string} data.trip_id
 * @param {string} data.mode           - One of VALID_LAND_TRAVEL_MODES
 * @param {string|null} data.provider
 * @param {string} data.from_location
 * @param {string} data.to_location
 * @param {string} data.departure_date - YYYY-MM-DD
 * @param {string|null} data.departure_time - HH:MM or HH:MM:SS
 * @param {string|null} data.arrival_date - YYYY-MM-DD
 * @param {string|null} data.arrival_time - HH:MM or HH:MM:SS
 * @param {string|null} data.confirmation_number
 * @param {string|null} data.notes
 * @returns {Promise<Object>}
 */
export async function createLandTravel(data) {
  const [{ id }] = await db('land_travels')
    .insert({
      trip_id: data.trip_id,
      mode: data.mode,
      provider: data.provider ?? null,
      from_location: data.from_location,
      to_location: data.to_location,
      departure_date: data.departure_date,
      departure_time: data.departure_time ?? null,
      arrival_date: data.arrival_date ?? null,
      arrival_time: data.arrival_time ?? null,
      confirmation_number: data.confirmation_number ?? null,
      notes: data.notes ?? null,
    })
    .returning('id');

  // Re-query to get properly formatted date/time fields via TO_CHAR
  return findLandTravelById(id, data.trip_id);
}

/**
 * Update a land travel entry by ID.
 * Updates the record and re-queries via findLandTravelById to ensure
 * date fields are returned as YYYY-MM-DD strings (via TO_CHAR).
 *
 * @param {string} id
 * @param {Object} updates - partial land travel fields
 * @returns {Promise<Object>}
 */
export async function updateLandTravel(id, updates) {
  await db('land_travels')
    .where({ id })
    .update({ ...updates, updated_at: new Date() });

  // Fetch trip_id so we can re-query via findLandTravelById (which uses TO_CHAR)
  const row = await db('land_travels').where({ id }).select('trip_id').first();
  return findLandTravelById(id, row.trip_id);
}

/**
 * Delete a land travel entry by ID.
 * @param {string} id
 * @returns {Promise<number>} rows deleted
 */
export async function deleteLandTravel(id) {
  return db('land_travels').where({ id }).delete();
}
