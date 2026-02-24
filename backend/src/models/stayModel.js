import db from '../config/database.js';

const STAY_COLUMNS = [
  'id', 'trip_id', 'category', 'name', 'address',
  'check_in_at', 'check_in_tz', 'check_out_at', 'check_out_tz',
  'created_at', 'updated_at',
];

/**
 * List all stays for a trip, ordered by check_in_at ASC.
 * @param {string} tripId
 * @returns {Promise<Array>}
 */
export async function listStaysByTrip(tripId) {
  return db('stays')
    .where({ trip_id: tripId })
    .orderBy('check_in_at', 'asc')
    .select(STAY_COLUMNS);
}

/**
 * Find a stay by ID, scoped to a trip.
 * @param {string} id
 * @param {string} tripId
 * @returns {Promise<Object|undefined>}
 */
export async function findStayById(id, tripId) {
  return db('stays').where({ id, trip_id: tripId }).select(STAY_COLUMNS).first();
}

/**
 * Create a new stay.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function createStay(data) {
  const [stay] = await db('stays')
    .insert({
      trip_id: data.trip_id,
      category: data.category,
      name: data.name,
      address: data.address ?? null,
      check_in_at: data.check_in_at,
      check_in_tz: data.check_in_tz,
      check_out_at: data.check_out_at,
      check_out_tz: data.check_out_tz,
    })
    .returning(STAY_COLUMNS);
  return stay;
}

/**
 * Update a stay by ID.
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateStay(id, updates) {
  const [stay] = await db('stays')
    .where({ id })
    .update({ ...updates, updated_at: new Date() })
    .returning(STAY_COLUMNS);
  return stay;
}

/**
 * Delete a stay by ID.
 * @param {string} id
 * @returns {Promise<number>}
 */
export async function deleteStay(id) {
  return db('stays').where({ id }).delete();
}
