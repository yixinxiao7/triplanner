/**
 * googleCalendarService.js — Google Calendar export (T-343).
 *
 * Exports a trip's flights, stays, activities, and land travels into a
 * dedicated Google calendar named after the trip. Re-exports delete the
 * previously created calendar and build a fresh one (no duplicates).
 *
 * OAuth: the calendar scope is requested incrementally — only when the user
 * actually exports — via a consent URL separate from the sign-in flow. Reuses
 * the same Google OAuth client credentials, with its own callback URL
 * (GOOGLE_CALENDAR_CALLBACK_URL).
 *
 * Event timezone strategy:
 *   - Flights carry per-leg IANA timezones (departure_tz / arrival_tz) and are
 *     exported as timed events on their exact UTC instants.
 *   - Stays become all-day spanning events (check-in date through check-out
 *     date) with the exact check-in/check-out times in the description —
 *     Google's all-day end date is EXCLUSIVE, so we add one day.
 *   - Activities and land travels store naive local dates/times with no
 *     timezone, so timed events use a derived "trip timezone" (first stay's
 *     check-in tz, else first flight's arrival tz, else UTC).
 */

import { google } from 'googleapis';

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

/** Whether Google Calendar export is configured (env vars present). */
export function isGoogleCalendarConfigured() {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALENDAR_CALLBACK_URL
  );
}

/** Build an OAuth2 client bound to the calendar-consent callback URL. */
export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_CALLBACK_URL,
  );
}

/**
 * Build the Google consent URL for the calendar scope.
 * `prompt: 'consent'` + `access_type: 'offline'` guarantees a refresh token.
 * @param {string} state - signed JWT carrying { uid, trip_id }
 * @returns {string}
 */
export function buildAuthUrl(state) {
  return createOAuthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: [CALENDAR_SCOPE],
    state,
  });
}

/**
 * Exchange the OAuth authorization code for tokens.
 * @param {string} code
 * @returns {Promise<Object>} tokens — { access_token, refresh_token, expiry_date, ... }
 */
export async function exchangeCodeForTokens(code) {
  const { tokens } = await createOAuthClient().getToken(code);
  return tokens;
}

// ---------------------------------------------------------------------------
// Date/time helpers (dependency-free; duplicated from calendarModel rather
// than imported so unit tests don't transitively load config/database.js)
// ---------------------------------------------------------------------------

/** UTC timestamp → local YYYY-MM-DD in an IANA timezone. */
function toLocalDate(utcTimestamp, ianaTimezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ianaTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(utcTimestamp));
  const p = {};
  for (const { type, value } of parts) p[type] = value;
  return `${p.year}-${p.month}-${p.day}`;
}

/** UTC timestamp → local HH:MM (24h) in an IANA timezone. */
function toLocalTime(utcTimestamp, ianaTimezone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ianaTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(utcTimestamp));
  const p = {};
  for (const { type, value } of parts) p[type] = value;
  return `${p.hour}:${p.minute}`;
}

/** Normalize a PostgreSQL TIME value ("HH:MM:SS" or "HH:MM") to "HH:MM". */
function normalizeTime(timeStr) {
  if (timeStr == null) return null;
  return String(timeStr).slice(0, 5);
}

/** Add N days to a YYYY-MM-DD string (UTC arithmetic — no tz drift). */
export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/**
 * Add minutes to a naive local date + time, handling midnight rollover.
 * @returns {{ date: string, time: string }} e.g. { date: '2026-08-08', time: '00:30' }
 */
function addMinutesNaive(dateStr, timeStr, minutes) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, hh, mm + minutes));
  return {
    date: date.toISOString().slice(0, 10),
    time: date.toISOString().slice(11, 16),
  };
}

/** Naive local "YYYY-MM-DDTHH:MM:00" string for Google's dateTime + timeZone pair. */
function naiveDateTime(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00`;
}

// ---------------------------------------------------------------------------
// Event builders (exported for unit tests)
// ---------------------------------------------------------------------------

/**
 * Derive a default IANA timezone for trip items that store naive times
 * (activities, land travels): first stay's check-in tz, else first flight's
 * arrival tz, else UTC.
 */
export function deriveTripTimezone(stays = [], flights = []) {
  return stays[0]?.check_in_tz || flights[0]?.arrival_tz || 'UTC';
}

/** Flight DB row → Google Calendar event (timed, per-leg timezones). */
export function flightToGoogleEvent(flight) {
  return {
    summary: `Flight: ${flight.airline} ${flight.flight_number} — ${flight.from_location} → ${flight.to_location}`,
    start: {
      dateTime: new Date(flight.departure_at).toISOString(),
      timeZone: flight.departure_tz,
    },
    end: {
      dateTime: new Date(flight.arrival_at).toISOString(),
      timeZone: flight.arrival_tz,
    },
  };
}

/**
 * Stay DB row → Google Calendar event (all-day, spanning check-in through
 * check-out; Google's all-day `end.date` is exclusive, hence +1 day).
 */
export function stayToGoogleEvent(stay) {
  const checkInDate = toLocalDate(stay.check_in_at, stay.check_in_tz);
  const checkOutDate = toLocalDate(stay.check_out_at, stay.check_out_tz);
  const event = {
    summary: `Stay: ${stay.name}`,
    description:
      `Check-in: ${checkInDate} ${toLocalTime(stay.check_in_at, stay.check_in_tz)}\n` +
      `Check-out: ${checkOutDate} ${toLocalTime(stay.check_out_at, stay.check_out_tz)}`,
    start: { date: checkInDate },
    end: { date: addDays(checkOutDate, 1) },
  };
  if (stay.address) event.location = stay.address;
  return event;
}

/**
 * Activity DB row → Google Calendar event.
 * Timed when start_time exists (end = end_time, or start + 1h fallback —
 * also used when end_time isn't after start_time); all-day otherwise.
 */
export function activityToGoogleEvent(activity, tripTimezone) {
  const date = activity.activity_date;
  const startTime = normalizeTime(activity.start_time);
  const event = { summary: activity.name };
  if (activity.location) event.location = activity.location;
  if (activity.notes && String(activity.notes).trim()) {
    event.description = activity.notes;
  }

  if (!startTime) {
    event.start = { date };
    event.end = { date: addDays(date, 1) };
    return event;
  }

  const endTime = normalizeTime(activity.end_time);
  let end = { date, time: endTime };
  if (!endTime || endTime <= startTime) {
    end = addMinutesNaive(date, startTime, 60);
  }
  event.start = { dateTime: naiveDateTime(date, startTime), timeZone: tripTimezone };
  event.end = { dateTime: naiveDateTime(end.date, end.time), timeZone: tripTimezone };
  return event;
}

/** Land travel mode → readable label (e.g. RENTAL_CAR → "Rental car"). */
function landTravelModeLabel(mode) {
  const lower = String(mode).toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Land travel DB row → Google Calendar event.
 * Timed when departure_time exists (end = arrival date/time, or +1h fallback
 * when missing or not after the start); all-day spanning otherwise.
 */
export function landTravelToGoogleEvent(landTravel, tripTimezone) {
  const depDate = landTravel.departure_date;
  const arrDate = landTravel.arrival_date ?? depDate;
  const depTime = normalizeTime(landTravel.departure_time);
  const arrTime = normalizeTime(landTravel.arrival_time);

  const event = {
    summary: `${landTravelModeLabel(landTravel.mode)}: ${landTravel.from_location} → ${landTravel.to_location}`,
  };
  const descriptionParts = [];
  if (landTravel.provider) descriptionParts.push(`Provider: ${landTravel.provider}`);
  if (landTravel.confirmation_number) {
    descriptionParts.push(`Confirmation #: ${landTravel.confirmation_number}`);
  }
  if (landTravel.notes && String(landTravel.notes).trim()) {
    descriptionParts.push(landTravel.notes);
  }
  if (descriptionParts.length) event.description = descriptionParts.join('\n');

  if (!depTime) {
    event.start = { date: depDate };
    event.end = { date: addDays(arrDate, 1) };
    return event;
  }

  let end = { date: arrDate, time: arrTime };
  if (!arrTime || `${arrDate}T${arrTime}` <= `${depDate}T${depTime}`) {
    end = addMinutesNaive(depDate, depTime, 60);
  }
  event.start = { dateTime: naiveDateTime(depDate, depTime), timeZone: tripTimezone };
  event.end = { dateTime: naiveDateTime(end.date, end.time), timeZone: tripTimezone };
  return event;
}

/**
 * Build the full Google event list for a trip.
 * @param {Object} data - { flights, stays, activities, landTravels } raw DB rows
 * @returns {{ timezone: string, events: Array<Object> }}
 */
export function buildTripEvents({ flights = [], stays = [], activities = [], landTravels = [] }) {
  const timezone = deriveTripTimezone(stays, flights);
  const events = [
    ...flights.map(flightToGoogleEvent),
    ...stays.map(stayToGoogleEvent),
    ...activities.map((a) => activityToGoogleEvent(a, timezone)),
    ...landTravels.map((lt) => landTravelToGoogleEvent(lt, timezone)),
  ];
  return { timezone, events };
}

// ---------------------------------------------------------------------------
// Export orchestration
// ---------------------------------------------------------------------------

/** Extract an HTTP status from a googleapis error (shape varies by version). */
function googleErrorStatus(err) {
  return err?.code ?? err?.response?.status ?? null;
}

/** Whether a googleapis error means the stored grant is dead (re-consent needed). */
export function isAuthRevokedError(err) {
  const status = googleErrorStatus(err);
  return status === 401 || Boolean(err?.message?.includes('invalid_grant'));
}

/**
 * Export a trip to a dedicated Google calendar.
 *
 * Deletes the previously created calendar (if any — 404/410 ignored), creates
 * a fresh calendar named after the trip, and inserts all events sequentially
 * (Google Calendar API rate limits punish parallel bursts).
 *
 * @param {Object} params
 * @param {Object} params.tokens - stored token row from getGoogleCalendarTokens
 * @param {string|null} params.existingCalendarId - trips.google_calendar_id
 * @param {string} params.tripName - calendar summary
 * @param {Object} params.data - { flights, stays, activities, landTravels }
 * @param {Function} [params.onTokensRefreshed] - async (tokens) => void, called
 *   when google-auth-library refreshes the access token, so it can be persisted.
 * @returns {Promise<{ calendarId: string, eventsCreated: number }>}
 */
export async function exportTripToCalendar({
  tokens,
  existingCalendarId,
  tripName,
  data,
  onTokensRefreshed,
}) {
  const auth = createOAuthClient();
  auth.setCredentials({
    access_token: tokens.google_calendar_access_token || undefined,
    refresh_token: tokens.google_calendar_refresh_token,
    expiry_date: tokens.google_calendar_token_expiry
      ? new Date(tokens.google_calendar_token_expiry).getTime()
      : undefined,
  });
  if (onTokensRefreshed) {
    auth.on('tokens', (refreshed) => {
      // Fire-and-forget persistence; export must not fail on a save hiccup.
      Promise.resolve(onTokensRefreshed(refreshed)).catch(() => {});
    });
  }

  const calendar = google.calendar({ version: 'v3', auth });

  // Wipe the previous export so re-exports never duplicate events.
  if (existingCalendarId) {
    try {
      await calendar.calendars.delete({ calendarId: existingCalendarId });
    } catch (err) {
      const status = googleErrorStatus(err);
      // Already gone (deleted by the user in Google Calendar) — fine.
      if (status !== 404 && status !== 410) throw err;
    }
  }

  const { timezone, events } = buildTripEvents(data);

  const created = await calendar.calendars.insert({
    requestBody: { summary: tripName, timeZone: timezone },
  });
  const calendarId = created.data.id;

  let eventsCreated = 0;
  for (const event of events) {
    await calendar.events.insert({ calendarId, requestBody: event });
    eventsCreated += 1;
  }

  return { calendarId, eventsCreated };
}
