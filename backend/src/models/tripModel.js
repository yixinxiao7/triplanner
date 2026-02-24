import db from '../config/database.js';

/**
 * List all trips for a user, ordered by created_at DESC.
 * @param {string} userId
 * @param {number} page - 1-indexed
 * @param {number} limit
 * @returns {Promise<{ trips: Array, total: number }>}
 */
export async function listTripsByUser(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const [{ count }] = await db('trips').where({ user_id: userId }).count('id as count');
  const total = parseInt(count, 10);

  const trips = await db('trips')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .select('id', 'user_id', 'name', 'destinations', 'status', 'created_at', 'updated_at');

  return { trips, total };
}

/**
 * Find a trip by ID.
 * @param {string} id - UUID
 * @returns {Promise<Object|undefined>}
 */
export async function findTripById(id) {
  return db('trips')
    .where({ id })
    .select('id', 'user_id', 'name', 'destinations', 'status', 'created_at', 'updated_at')
    .first();
}

/**
 * Create a new trip.
 * @param {Object} data - { user_id, name, destinations }
 * @returns {Promise<Object>}
 */
export async function createTrip(data) {
  const [trip] = await db('trips')
    .insert({
      user_id: data.user_id,
      name: data.name,
      destinations: data.destinations,
    })
    .returning(['id', 'user_id', 'name', 'destinations', 'status', 'created_at', 'updated_at']);
  return trip;
}

/**
 * Update a trip by ID.
 * @param {string} id
 * @param {Object} updates - partial { name, destinations, status }
 * @returns {Promise<Object>}
 */
export async function updateTrip(id, updates) {
  const [trip] = await db('trips')
    .where({ id })
    .update({ ...updates, updated_at: new Date() })
    .returning(['id', 'user_id', 'name', 'destinations', 'status', 'created_at', 'updated_at']);
  return trip;
}

/**
 * Delete a trip by ID.
 * @param {string} id
 * @returns {Promise<number>} - rows deleted
 */
export async function deleteTrip(id) {
  return db('trips').where({ id }).delete();
}
