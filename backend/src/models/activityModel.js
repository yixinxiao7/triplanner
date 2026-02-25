import db from '../config/database.js';

/**
 * Builds a Knex query that selects all activity columns with activity_date
 * cast to a YYYY-MM-DD string via TO_CHAR (B-010 / T-027 fix).
 *
 * PostgreSQL DATE columns can be returned as Date objects by the pg driver,
 * causing JSON.stringify to produce an ISO timestamp (e.g., "2026-08-08T04:00:00.000Z")
 * instead of the expected "2026-08-08" string. TO_CHAR forces a string at the DB level,
 * making the output timezone-independent.
 */
function activityQuery() {
  return db('activities').select(
    'id',
    'trip_id',
    'name',
    'location',
    db.raw("TO_CHAR(activity_date, 'YYYY-MM-DD') AS activity_date"),
    'start_time',
    'end_time',
    'created_at',
    'updated_at',
  );
}

/**
 * List all activities for a trip, ordered by activity_date ASC, start_time ASC, name ASC.
 * @param {string} tripId
 * @returns {Promise<Array>}
 */
export async function listActivitiesByTrip(tripId) {
  return activityQuery()
    .where({ trip_id: tripId })
    .orderBy([
      { column: 'activity_date', order: 'asc' },
      { column: 'start_time', order: 'asc' },
      { column: 'name', order: 'asc' },
    ]);
}

/**
 * Find an activity by ID, scoped to a trip.
 * @param {string} id
 * @param {string} tripId
 * @returns {Promise<Object|undefined>}
 */
export async function findActivityById(id, tripId) {
  return activityQuery().where({ id, trip_id: tripId }).first();
}

/**
 * Create a new activity.
 * Inserts the record and then re-queries via findActivityById to ensure
 * activity_date is returned as YYYY-MM-DD (via TO_CHAR, consistent with all reads).
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function createActivity(data) {
  const [{ id }] = await db('activities')
    .insert({
      trip_id: data.trip_id,
      name: data.name,
      location: data.location ?? null,
      activity_date: data.activity_date,
      start_time: data.start_time,
      end_time: data.end_time,
    })
    .returning('id');

  // Re-query to get properly formatted activity_date via TO_CHAR
  return findActivityById(id, data.trip_id);
}

/**
 * Update an activity by ID.
 * Updates the record and then re-queries via findActivityById to ensure
 * activity_date is returned as YYYY-MM-DD (via TO_CHAR, consistent with all reads).
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateActivity(id, updates) {
  await db('activities')
    .where({ id })
    .update({ ...updates, updated_at: new Date() });

  // Fetch trip_id so we can re-query via findActivityById (which uses TO_CHAR)
  const row = await db('activities').where({ id }).select('trip_id').first();
  return findActivityById(id, row.trip_id);
}

/**
 * Delete an activity by ID.
 * @param {string} id
 * @returns {Promise<number>}
 */
export async function deleteActivity(id) {
  return db('activities').where({ id }).delete();
}
