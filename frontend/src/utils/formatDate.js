/**
 * Date / Time formatting utilities.
 *
 * Per the API contract and UI spec:
 * - Flights and stays: display local time + timezone abbreviation from the stored *_tz IANA string.
 *   We do NOT do timezone conversion — we display the stored local time and label it with the tz.
 * - Activities: activity_date is YYYY-MM-DD, start_time/end_time are HH:MM:SS (24-hour).
 * - Trip cards: derive date range from the earliest and latest dates across all event types (flights, stays, activities, land travels).
 */

/**
 * Format a destinations array for compact display on trip cards.
 * Shows up to 3 destinations joined by ", "; overflows with "+N more".
 *
 * Per Spec 18.4.1:
 *   1 dest  → "Paris"
 *   2 dests → "Paris, Rome"
 *   3 dests → "Paris, Rome, Athens"
 *   4 dests → "Paris, Rome, Athens, +1 more"
 *   N > 3   → "[d1], [d2], [d3], +[N-3] more"
 *   0 dests → "—"
 *
 * @param {string[]} destinations
 * @returns {string}
 */
export function formatDestinations(destinations) {
  if (!destinations || destinations.length === 0) return '\u2014';
  if (destinations.length <= 3) return destinations.join(', ');
  const visible = destinations.slice(0, 3).join(', ');
  const overflow = destinations.length - 3;
  return `${visible}, +${overflow} more`;
}

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
 * Parse a location string, detecting HTTP/HTTPS URLs and splitting the text
 * into typed segments: 'text' (plain) or 'link' (URL).
 *
 * Only http:// and https:// schemes create links. All other content,
 * including javascript:, data:, and vbscript: URIs, is returned as 'text'.
 * No dangerouslySetInnerHTML — returns an array of typed segments for React rendering.
 *
 * @param {string|null|undefined} text - The location string to parse
 * @returns {Array<{type: 'text'|'link', content: string}>}
 */
export function parseLocationWithLinks(text) {
  if (!text) return [];
  const URL_REGEX = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(URL_REGEX);
  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      type: /^https?:\/\//.test(part) ? 'link' : 'text',
      content: part,
    }));
}

/**
 * Format a trip date range from YYYY-MM-DD start_date and end_date fields.
 * Returns a formatted string or null if no dates are set.
 *
 * Parsing rule: Parse each date string by splitting on '-' and using
 * new Date(year, month - 1, day) — local date, no UTC offset.
 *
 * Output rules:
 *   (null, null)           → null
 *   ("YYYY-MM-DD", null)   → "From May 1, 2026"
 *   same year + same month → "May 1 – 15, 2026"      (no repeated month)
 *   same year, diff month  → "Aug 7 – Sep 2, 2026"
 *   different years        → "Dec 28, 2025 – Jan 3, 2026"
 *
 * Separator: en-dash with spaces (U+2013).
 *
 * @param {string|null} startDate - YYYY-MM-DD
 * @param {string|null} endDate   - YYYY-MM-DD
 * @returns {string|null}
 */
export function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return null;

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function parseYMD(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return { year: y, month: m - 1, day: d }; // month is 0-indexed
  }

  if (startDate && endDate) {
    const s = parseYMD(startDate);
    const e = parseYMD(endDate);
    if (s.year === e.year) {
      if (s.month === e.month) {
        // Same month: "May 1 – 15, 2026"
        return `${MONTHS[s.month]} ${s.day} \u2013 ${e.day}, ${s.year}`;
      }
      // Same year, different months: "Aug 7 – Sep 2, 2026"
      return `${MONTHS[s.month]} ${s.day} \u2013 ${MONTHS[e.month]} ${e.day}, ${s.year}`;
    }
    // Different years: "Dec 28, 2025 – Jan 3, 2026"
    return `${MONTHS[s.month]} ${s.day}, ${s.year} \u2013 ${MONTHS[e.month]} ${e.day}, ${e.year}`;
  }

  if (startDate && !endDate) {
    const s = parseYMD(startDate);
    return `From ${MONTHS[s.month]} ${s.day}, ${s.year}`;
  }

  return null;
}

