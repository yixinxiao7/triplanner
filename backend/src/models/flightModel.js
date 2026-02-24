import db from '../config/database.js';

const FLIGHT_COLUMNS = [
  'id', 'trip_id', 'flight_number', 'airline', 'from_location', 'to_location',
  'departure_at', 'departure_tz', 'arrival_at', 'arrival_tz', 'created_at', 'updated_at',
];

/**
 * List all flights for a trip, ordered by departure_at ASC.
 * @param {string} tripId
 * @returns {Promise<Array>}
 */
export async function listFlightsByTrip(tripId) {
  return db('flights')
    .where({ trip_id: tripId })
    .orderBy('departure_at', 'asc')
    .select(FLIGHT_COLUMNS);
}

/**
 * Find a flight by ID, scoped to a trip.
 * @param {string} id
 * @param {string} tripId
 * @returns {Promise<Object|undefined>}
 */
export async function findFlightById(id, tripId) {
  return db('flights').where({ id, trip_id: tripId }).select(FLIGHT_COLUMNS).first();
}

/**
 * Create a new flight.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function createFlight(data) {
  const [flight] = await db('flights')
    .insert({
      trip_id: data.trip_id,
      flight_number: data.flight_number,
      airline: data.airline,
      from_location: data.from_location,
      to_location: data.to_location,
      departure_at: data.departure_at,
      departure_tz: data.departure_tz,
      arrival_at: data.arrival_at,
      arrival_tz: data.arrival_tz,
    })
    .returning(FLIGHT_COLUMNS);
  return flight;
}

/**
 * Update a flight by ID.
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateFlight(id, updates) {
  const [flight] = await db('flights')
    .where({ id })
    .update({ ...updates, updated_at: new Date() })
    .returning(FLIGHT_COLUMNS);
  return flight;
}

/**
 * Delete a flight by ID.
 * @param {string} id
 * @returns {Promise<number>}
 */
export async function deleteFlight(id) {
  return db('flights').where({ id }).delete();
}
