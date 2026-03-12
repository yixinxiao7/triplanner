import db from '../config/database.js';

// ---------------------------------------------------------------------------
// Timezone helpers
// ---------------------------------------------------------------------------

/**
 * Convert a UTC timestamp to a local date string (YYYY-MM-DD) in the given
 * IANA timezone using the Intl API (no external dependencies).
 *
 * @param {string|Date} utcTimestamp
 * @param {string} ianaTimezone
 * @returns {string} e.g. "2026-08-07"
 */
function toLocalDate(utcTimestamp, ianaTimezone) {
  const date = new Date(utcTimestamp);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ianaTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const p = {};
  for (const { type, value } of parts) p[type] = value;
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Convert a UTC timestamp to a local time string (HH:MM, 24-hour) in the
 * given IANA timezone using the Intl API.
 *
 * @param {string|Date} utcTimestamp
 * @param {string} ianaTimezone
 * @returns {string} e.g. "14:35"
 */
function toLocalTime(utcTimestamp, ianaTimezone) {
  const date = new Date(utcTimestamp);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ianaTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const p = {};
  for (const { type, value } of parts) p[type] = value;
  return `${p.hour}:${p.minute}`;
}

/**
 * Normalize a PostgreSQL TIME value ("HH:MM:SS" or "HH:MM") to "HH:MM".
 * Returns null if the input is null or undefined.
 *
 * @param {string|null|undefined} timeStr
 * @returns {string|null}
 */
function normalizeTime(timeStr) {
  if (timeStr == null) return null;
  // Slice to first 5 characters: "HH:MM"
  return String(timeStr).slice(0, 5);
}

// ---------------------------------------------------------------------------
// Event transformers
// ---------------------------------------------------------------------------

/**
 * Transform a raw flight DB row into a calendar event object.
 *
 * @param {Object} flight
 * @returns {Object}
 */
function flightToEvent(flight) {
  return {
    id: `flight-${flight.id}`,
    type: 'FLIGHT',
    title: `${flight.airline} ${flight.flight_number} — ${flight.from_location} → ${flight.to_location}`,
    start_date: toLocalDate(flight.departure_at, flight.departure_tz),
    end_date: toLocalDate(flight.arrival_at, flight.arrival_tz),
    start_time: toLocalTime(flight.departure_at, flight.departure_tz),
    end_time: toLocalTime(flight.arrival_at, flight.arrival_tz),
    timezone: flight.departure_tz,
    source_id: flight.id,
  };
}

/**
 * Transform a raw stay DB row into a calendar event object.
 *
 * @param {Object} stay
 * @returns {Object}
 */
function stayToEvent(stay) {
  return {
    id: `stay-${stay.id}`,
    type: 'STAY',
    title: stay.name,
    start_date: toLocalDate(stay.check_in_at, stay.check_in_tz),
    end_date: toLocalDate(stay.check_out_at, stay.check_out_tz),
    start_time: toLocalTime(stay.check_in_at, stay.check_in_tz),
    end_time: toLocalTime(stay.check_out_at, stay.check_out_tz),
    timezone: stay.check_in_tz,
    source_id: stay.id,
  };
}

/**
 * Transform a raw activity DB row into a calendar event object.
 * Activities are always single-day and have no timezone.
 *
 * @param {Object} activity
 * @returns {Object}
 */
function activityToEvent(activity) {
  return {
    id: `activity-${activity.id}`,
    type: 'ACTIVITY',
    title: activity.name,
    // activity_date is already YYYY-MM-DD (via TO_CHAR in activityModel.js or direct DB value)
    start_date: activity.activity_date,
    end_date: activity.activity_date,
    start_time: normalizeTime(activity.start_time),
    end_time: normalizeTime(activity.end_time),
    timezone: null,
    source_id: activity.id,
  };
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

/**
 * Compare two calendar events for sort order:
 *   1. start_date ASC
 *   2. start_time ASC, NULLS LAST (all-day events after timed events)
 *   3. type ASC (alphabetical tiebreaker: ACTIVITY < FLIGHT < STAY)
 *
 * @param {Object} a
 * @param {Object} b
 * @returns {number}
 */
function compareEvents(a, b) {
  // 1. start_date ASC
  if (a.start_date < b.start_date) return -1;
  if (a.start_date > b.start_date) return 1;

  // 2. start_time ASC, NULLS LAST
  const aTime = a.start_time;
  const bTime = b.start_time;
  if (aTime !== bTime) {
    if (aTime === null) return 1;  // null goes last
    if (bTime === null) return -1;
    if (aTime < bTime) return -1;
    if (aTime > bTime) return 1;
  }

  // 3. type ASC (alphabetical)
  if (a.type < b.type) return -1;
  if (a.type > b.type) return 1;

  return 0;
}

// ---------------------------------------------------------------------------
// Main aggregation function
// ---------------------------------------------------------------------------

/**
 * Fetch and aggregate all calendar events for a trip, merging flights, stays,
 * and activities into a unified, chronologically ordered list.
 *
 * Queries all three sub-resource tables in parallel for performance. Transformation
 * and sorting happen in JavaScript to keep the DB layer thin.
 *
 * @param {string} tripId - UUID of the trip
 * @returns {Promise<Array>} Sorted array of calendar event objects
 */
export async function getCalendarEvents(tripId) {
  const [flights, stays, activities] = await Promise.all([
    db('flights')
      .where({ trip_id: tripId })
      .select('id', 'airline', 'flight_number', 'from_location', 'to_location',
        'departure_at', 'departure_tz', 'arrival_at', 'arrival_tz'),

    db('stays')
      .where({ trip_id: tripId })
      .select('id', 'name', 'check_in_at', 'check_in_tz', 'check_out_at', 'check_out_tz'),

    db('activities')
      .where({ trip_id: tripId })
      .select(
        'id',
        'name',
        db.raw("TO_CHAR(activity_date, 'YYYY-MM-DD') AS activity_date"),
        'start_time',
        'end_time',
      ),
  ]);

  const events = [
    ...flights.map(flightToEvent),
    ...stays.map(stayToEvent),
    ...activities.map(activityToEvent),
  ];

  events.sort(compareEvents);

  return events;
}
