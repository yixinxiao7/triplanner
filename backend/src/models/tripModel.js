import db from '../config/database.js';

/**
 * Deduplicate a destinations array using case-insensitive comparison.
 * Preserves the original casing of the first occurrence of each destination.
 * Preserves the original order of first occurrences.
 *
 * T-058 / B-023 — Defense-in-depth measure ensuring data integrity regardless
 * of which client sends the request (frontend already does client-side dedup).
 *
 * @param {string[]} destinations - Array of trimmed destination strings
 * @returns {string[]} Deduplicated array with first-occurrence casing preserved
 */
export function deduplicateDestinations(destinations) {
  if (!Array.isArray(destinations)) return destinations;
  const seen = new Set();
  return destinations.filter(dest => {
    const lower = dest.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

/**
 * Trip column selection with date fields cast to YYYY-MM-DD strings via TO_CHAR.
 * Prevents PostgreSQL DATE columns from being serialized as ISO timestamps
 * (the same timezone-issue fix applied to activity_date in activityModel.js).
 *
 * Note: TO_CHAR(NULL, 'YYYY-MM-DD') returns NULL, so optional date fields
 * are returned as null (not an error) when not set.
 */
const TRIP_COLUMNS = [
  'id',
  'user_id',
  'name',
  'destinations',
  'status',
  db.raw("TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date"),
  db.raw("TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date"),
  'created_at',
  'updated_at',
];

/**
 * Compute the trip status based on start_date, end_date, and today's UTC date.
 * Status auto-calculation rules (T-030):
 *
 *   - Requires BOTH start_date AND end_date to be set (non-null). If either is null,
 *     the stored status is returned as-is (no auto-calc).
 *   - end_date < today                   → "COMPLETED"  (highest priority)
 *   - start_date <= today <= end_date    → "ONGOING"
 *   - start_date > today                 → "PLANNING"   (trip in the future)
 *
 * The stored status column in the DB is NOT mutated — this is a read-time transform.
 * PATCH /trips/:id still writes status overrides, reflected when dates are null.
 *
 * @param {Object|undefined} trip - raw trip row from DB (may include formatted date strings)
 * @returns {Object|undefined} trip with computed status applied
 */
export function computeTripStatus(trip) {
  if (!trip) return trip;

  const { start_date, end_date } = trip;

  // Only auto-calculate when BOTH dates are present
  if (!start_date || !end_date) {
    return trip;
  }

  // Today as YYYY-MM-DD in UTC — consistent with DATE column storage
  const today = new Date().toISOString().substring(0, 10);

  if (end_date < today) {
    return { ...trip, status: 'COMPLETED' };
  }
  if (start_date <= today && today <= end_date) {
    return { ...trip, status: 'ONGOING' };
  }
  // start_date > today: trip is in the future
  return { ...trip, status: 'PLANNING' };
}

/**
 * List all trips for a user, ordered by created_at DESC.
 * Status is computed dynamically via computeTripStatus (T-030).
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
    .select(TRIP_COLUMNS);

  return { trips: trips.map(computeTripStatus), total };
}

/**
 * Find a trip by ID.
 * Status is computed dynamically via computeTripStatus (T-030).
 * @param {string} id - UUID
 * @returns {Promise<Object|undefined>}
 */
export async function findTripById(id) {
  const trip = await db('trips')
    .where({ id })
    .select(TRIP_COLUMNS)
    .first();

  return computeTripStatus(trip);
}

/**
 * Create a new trip.
 * After inserting, re-queries via findTripById to get properly formatted date fields
 * (via TO_CHAR) and computed status (T-030).
 * @param {Object} data - { user_id, name, destinations, start_date?, end_date? }
 * @returns {Promise<Object>}
 */
export async function createTrip(data) {
  const insertData = {
    user_id: data.user_id,
    name: data.name,
    destinations: deduplicateDestinations(data.destinations),
  };

  // start_date and end_date are optional nullable fields (T-029)
  if (data.start_date !== undefined) {
    insertData.start_date = data.start_date ?? null;
  }
  if (data.end_date !== undefined) {
    insertData.end_date = data.end_date ?? null;
  }

  const [{ id }] = await db('trips').insert(insertData).returning('id');

  // Re-query to get formatted date fields and computed status
  return findTripById(id);
}

/**
 * Update a trip by ID.
 * After updating, re-queries via findTripById to get formatted date fields
 * (via TO_CHAR) and computed status (T-030).
 * @param {string} id
 * @param {Object} updates - partial { name, destinations, status, start_date, end_date }
 * @returns {Promise<Object>}
 */
export async function updateTrip(id, updates) {
  // Apply destination deduplication when destinations are being updated (T-058)
  const processedUpdates = { ...updates };
  if (processedUpdates.destinations !== undefined && Array.isArray(processedUpdates.destinations)) {
    processedUpdates.destinations = deduplicateDestinations(processedUpdates.destinations);
  }

  await db('trips')
    .where({ id })
    .update({ ...processedUpdates, updated_at: new Date() });

  // Re-query to get formatted date fields and computed status
  return findTripById(id);
}

/**
 * Delete a trip by ID.
 * @param {string} id
 * @returns {Promise<number>} - rows deleted
 */
export async function deleteTrip(id) {
  return db('trips').where({ id }).delete();
}
