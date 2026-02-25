/**
 * Date / Time formatting utilities.
 *
 * Per the API contract and UI spec:
 * - Flights and stays: display local time + timezone abbreviation from the stored *_tz IANA string.
 *   We do NOT do timezone conversion — we display the stored local time and label it with the tz.
 * - Activities: activity_date is YYYY-MM-DD, start_time/end_time are HH:MM:SS (24-hour).
 * - Trip cards: derive date range from flight dates.
 */

/**
 * Format an ISO 8601 UTC timestamp for display in a given timezone.
 * Example output: "Aug 7, 2026 · 6:00 AM"
 *
 * @param {string} isoString - UTC ISO 8601 datetime (e.g. "2026-08-07T10:00:00.000Z")
 * @param {string} ianaTimezone - IANA timezone string (e.g. "America/New_York")
 * @returns {string}
 */
export function formatDateTime(isoString, ianaTimezone) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const dateStr = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: ianaTimezone,
    }).format(date);

    const timeStr = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: ianaTimezone,
    }).format(date);

    return `${dateStr} · ${timeStr}`;
  } catch {
    return isoString;
  }
}

/**
 * Format an ISO 8601 UTC timestamp as just the date portion.
 * Example output: "Aug 7, 2026"
 *
 * @param {string} isoString
 * @param {string} [ianaTimezone]
 * @returns {string}
 */
export function formatDate(isoString, ianaTimezone) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: ianaTimezone || 'UTC',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Get a short timezone abbreviation from an IANA string.
 * Uses Intl.DateTimeFormat to get the short timezone name.
 * Example: "America/New_York" → "ET" or "EST" or "EDT"
 *
 * @param {string} isoString
 * @param {string} ianaTimezone
 * @returns {string}
 */
export function formatTimezoneAbbr(isoString, ianaTimezone) {
  if (!isoString || !ianaTimezone) return '';
  try {
    const date = new Date(isoString);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
      timeZone: ianaTimezone,
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : ianaTimezone;
  } catch {
    return ianaTimezone;
  }
}

/**
 * Format an activity date string (YYYY-MM-DD) for display.
 * Example output: "Friday, Aug 8, 2026"
 *
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string}
 */
export function formatActivityDate(dateStr) {
  if (!dateStr) return '';
  try {
    // Parse as local date (not UTC) since activities have no timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Format a time string (HH:MM:SS or HH:MM) to 12-hour display.
 * Example: "09:00:00" → "9:00 AM"
 *
 * @param {string} timeStr - HH:MM:SS or HH:MM
 * @returns {string}
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return timeStr;
  }
}

/**
 * Format a trip card date range from departure/arrival ISO strings.
 * Example output: "Aug 7, 2026 — Aug 14, 2026"
 *
 * @param {string} startIso
 * @param {string} endIso
 * @returns {string}
 */
export function formatDateRange(startIso, endIso) {
  if (!startIso && !endIso) return null;
  const start = startIso ? formatDate(startIso) : '?';
  const end = endIso ? formatDate(endIso) : '?';
  return `${start} — ${end}`;
}

/**
 * Format a trip date range from start_date / end_date (YYYY-MM-DD) fields.
 * Returns formatted string or null if no dates set.
 *
 * Examples:
 *   ("2026-08-07", "2026-08-14") → "Aug 7 – Aug 14, 2026"
 *   ("2025-12-28", "2026-01-04") → "Dec 28, 2025 – Jan 4, 2026"
 *   ("2026-08-07", null) → "From Aug 7, 2026"
 *   (null, null) → null
 *
 * @param {string|null} startDate - YYYY-MM-DD
 * @param {string|null} endDate - YYYY-MM-DD
 * @returns {string|null}
 */
export function formatTripDateRange(startDate, endDate) {
  if (!startDate && !endDate) return null;

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function parseDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return { year: y, month: m - 1, day: d };
  }

  if (startDate && endDate) {
    const s = parseDate(startDate);
    const e = parseDate(endDate);
    if (s.year === e.year) {
      return `${MONTHS[s.month]} ${s.day} \u2013 ${MONTHS[e.month]} ${e.day}, ${s.year}`;
    }
    return `${MONTHS[s.month]} ${s.day}, ${s.year} \u2013 ${MONTHS[e.month]} ${e.day}, ${e.year}`;
  }

  if (startDate && !endDate) {
    const s = parseDate(startDate);
    return `From ${MONTHS[s.month]} ${s.day}, ${s.year}`;
  }

  return null;
}
