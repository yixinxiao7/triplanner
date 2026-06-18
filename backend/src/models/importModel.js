import db from '../config/database.js';
import { deduplicateDestinations, findTripById } from './tripModel.js';
import { findFlightById } from './flightModel.js';
import { findStayById } from './stayModel.js';
import { findActivityById } from './activityModel.js';
import { findLandTravelById } from './landTravelModel.js';

/**
 * importModel.js — atomic PDF-import commit (T-332).
 *
 * importTrip(userId, payload) inserts a trip plus all of its sub-resources
 * (flights, stays, activities, land_travels) inside a single db.transaction.
 * If ANY insert fails the whole thing rolls back, so a partial failure never
 * leaves an orphan trip behind.
 *
 * Insert column shapes mirror the per-resource create models
 * (flightModel.createFlight / stayModel.createStay / activityModel.createActivity /
 * landTravelModel.createLandTravel) so the data lands identically to the
 * single-resource POST endpoints.
 */

/**
 * @param {string} userId
 * @param {Object} payload - the validated import contract
 *   { trip, flights[], stays[], activities[], land_travels[] }
 * @returns {Promise<Object>} the created trip (via findTripById — consistent
 *   date/status formatting), or undefined if the trip vanished (should not happen).
 */
export async function importTrip(userId, payload) {
  const { trip, flights = [], stays = [], activities = [], land_travels = [] } = payload;

  const tripId = await db.transaction(async (trx) => {
    // ---- Trip ----
    const tripInsert = {
      user_id: userId,
      name: trip.name,
      destinations: deduplicateDestinations(trip.destinations),
    };
    if (trip.start_date !== undefined) tripInsert.start_date = trip.start_date ?? null;
    if (trip.end_date !== undefined) tripInsert.end_date = trip.end_date ?? null;
    if (trip.notes !== undefined) tripInsert.notes = trip.notes ?? null;

    const [{ id }] = await trx('trips').insert(tripInsert).returning('id');

    // ---- Flights ----
    if (flights.length > 0) {
      await trx('flights').insert(
        flights.map((f) => ({
          trip_id: id,
          flight_number: f.flight_number,
          airline: f.airline,
          from_location: f.from_location,
          to_location: f.to_location,
          departure_at: f.departure_at,
          departure_tz: f.departure_tz,
          arrival_at: f.arrival_at,
          arrival_tz: f.arrival_tz,
        })),
      );
    }

    // ---- Stays ----
    if (stays.length > 0) {
      await trx('stays').insert(
        stays.map((s) => ({
          trip_id: id,
          category: s.category,
          name: s.name,
          address: s.address ?? null,
          check_in_at: s.check_in_at,
          check_in_tz: s.check_in_tz,
          check_out_at: s.check_out_at,
          check_out_tz: s.check_out_tz,
        })),
      );
    }

    // ---- Activities ----
    if (activities.length > 0) {
      await trx('activities').insert(
        activities.map((a) => ({
          trip_id: id,
          name: a.name,
          location: a.location ?? null,
          activity_date: a.activity_date,
          start_time: a.start_time ?? null,
          end_time: a.end_time ?? null,
          notes: a.notes ?? null,
        })),
      );
    }

    // ---- Land travels ----
    if (land_travels.length > 0) {
      await trx('land_travels').insert(
        land_travels.map((l) => ({
          trip_id: id,
          mode: l.mode,
          provider: l.provider ?? null,
          from_location: l.from_location,
          to_location: l.to_location,
          departure_date: l.departure_date,
          departure_time: l.departure_time ?? null,
          arrival_date: l.arrival_date ?? null,
          arrival_time: l.arrival_time ?? null,
          confirmation_number: l.confirmation_number ?? null,
          notes: l.notes ?? null,
        })),
      );
    }

    return id;
  });

  // Re-query outside the transaction for consistent date/status formatting (TO_CHAR).
  return findTripById(tripId);
}

/**
 * appendImportToTrip(tripId, payload) inserts parsed itinerary sub-resources
 * (flights, stays, activities, land_travels) onto an EXISTING trip inside a
 * single db.transaction (T-XXX — "import PDF into existing trip"). The trip row
 * itself is never touched. If ANY child insert fails the whole thing rolls back,
 * so a partial import never leaves stray children behind.
 *
 * Insert column shapes mirror importTrip / the per-resource create models so the
 * data lands identically to the single-resource POST endpoints. Only the newly
 * created rows are returned (re-queried via the per-resource find helpers for the
 * same TO_CHAR date/time formatting the read endpoints produce).
 *
 * @param {string} tripId - an existing, already-ownership-verified trip id
 * @param {Object} payload - { flights[], stays[], activities[], land_travels[] }
 * @returns {Promise<{flights: Array, stays: Array, activities: Array, land_travels: Array}>}
 */
export async function appendImportToTrip(tripId, payload) {
  const { flights = [], stays = [], activities = [], land_travels = [] } = payload;

  const ids = await db.transaction(async (trx) => {
    const created = { flights: [], stays: [], activities: [], land_travels: [] };

    // ---- Flights ----
    if (flights.length > 0) {
      const rows = await trx('flights')
        .insert(
          flights.map((f) => ({
            trip_id: tripId,
            flight_number: f.flight_number,
            airline: f.airline,
            from_location: f.from_location,
            to_location: f.to_location,
            departure_at: f.departure_at,
            departure_tz: f.departure_tz,
            arrival_at: f.arrival_at,
            arrival_tz: f.arrival_tz,
          })),
        )
        .returning('id');
      created.flights = rows.map((r) => r.id);
    }

    // ---- Stays ----
    if (stays.length > 0) {
      const rows = await trx('stays')
        .insert(
          stays.map((s) => ({
            trip_id: tripId,
            category: s.category,
            name: s.name,
            address: s.address ?? null,
            check_in_at: s.check_in_at,
            check_in_tz: s.check_in_tz,
            check_out_at: s.check_out_at,
            check_out_tz: s.check_out_tz,
          })),
        )
        .returning('id');
      created.stays = rows.map((r) => r.id);
    }

    // ---- Activities ----
    if (activities.length > 0) {
      const rows = await trx('activities')
        .insert(
          activities.map((a) => ({
            trip_id: tripId,
            name: a.name,
            location: a.location ?? null,
            activity_date: a.activity_date,
            start_time: a.start_time ?? null,
            end_time: a.end_time ?? null,
            notes: a.notes ?? null,
          })),
        )
        .returning('id');
      created.activities = rows.map((r) => r.id);
    }

    // ---- Land travels ----
    if (land_travels.length > 0) {
      const rows = await trx('land_travels')
        .insert(
          land_travels.map((l) => ({
            trip_id: tripId,
            mode: l.mode,
            provider: l.provider ?? null,
            from_location: l.from_location,
            to_location: l.to_location,
            departure_date: l.departure_date,
            departure_time: l.departure_time ?? null,
            arrival_date: l.arrival_date ?? null,
            arrival_time: l.arrival_time ?? null,
            confirmation_number: l.confirmation_number ?? null,
            notes: l.notes ?? null,
          })),
        )
        .returning('id');
      created.land_travels = rows.map((r) => r.id);
    }

    return created;
  });

  // Re-query the newly created rows OUTSIDE the transaction for consistent
  // date/time formatting (TO_CHAR), matching the read/create endpoints exactly.
  const [flightRows, stayRows, activityRows, landTravelRows] = await Promise.all([
    Promise.all(ids.flights.map((id) => findFlightById(id, tripId))),
    Promise.all(ids.stays.map((id) => findStayById(id, tripId))),
    Promise.all(ids.activities.map((id) => findActivityById(id, tripId))),
    Promise.all(ids.land_travels.map((id) => findLandTravelById(id, tripId))),
  ]);

  return {
    flights: flightRows,
    stays: stayRows,
    activities: activityRows,
    land_travels: landTravelRows,
  };
}
