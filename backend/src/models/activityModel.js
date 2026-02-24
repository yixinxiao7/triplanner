import db from '../config/database.js';

const ACTIVITY_COLUMNS = [
  'id', 'trip_id', 'name', 'location',
  'activity_date', 'start_time', 'end_time',
  'created_at', 'updated_at',
];

/**
 * List all activities for a trip, ordered by activity_date ASC, start_time ASC, name ASC.
 * @param {string} tripId
 * @returns {Promise<Array>}
 */
export async function listActivitiesByTrip(tripId) {
  return db('activities')
    .where({ trip_id: tripId })
    .orderBy([
      { column: 'activity_date', order: 'asc' },
      { column: 'start_time', order: 'asc' },
      { column: 'name', order: 'asc' },
    ])
    .select(ACTIVITY_COLUMNS);
}

/**
 * Find an activity by ID, scoped to a trip.
 * @param {string} id
 * @param {string} tripId
 * @returns {Promise<Object|undefined>}
 */
export async function findActivityById(id, tripId) {
  return db('activities').where({ id, trip_id: tripId }).select(ACTIVITY_COLUMNS).first();
}

/**
 * Create a new activity.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function createActivity(data) {
  const [activity] = await db('activities')
    .insert({
      trip_id: data.trip_id,
      name: data.name,
      location: data.location ?? null,
      activity_date: data.activity_date,
      start_time: data.start_time,
      end_time: data.end_time,
    })
    .returning(ACTIVITY_COLUMNS);
  return activity;
}

/**
 * Update an activity by ID.
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateActivity(id, updates) {
  const [activity] = await db('activities')
    .where({ id })
    .update({ ...updates, updated_at: new Date() })
    .returning(ACTIVITY_COLUMNS);
  return activity;
}

/**
 * Delete an activity by ID.
 * @param {string} id
 * @returns {Promise<number>}
 */
export async function deleteActivity(id) {
  return db('activities').where({ id }).delete();
}
