/**
 * PrintCalendarSummary — day-by-day itinerary overview table for print.
 *
 * Visible only in @media print (hidden on screen via CSS).
 * Renders a compact chronological summary of all trip events.
 * Does NOT make its own API calls — uses data passed from TripDetailsPage.
 *
 * Sprint 41 — T-315 — Spec 33
 */
import styles from './PrintCalendarSummary.module.css';

// ── Type priority for sorting events within a single day ────────
const TYPE_PRIORITY = {
  FLT: 0,
  'FLT ARR': 1,
  LT: 2,
  'LT ARR': 3,
  'STAY IN': 4,
  'STAY OUT': 5,
  ACT: 6,
};

// ── Helper: get date range from trip or derive from data ────────
function getDateRange(trip, flights, stays, activities, landTravel) {
  // Use trip dates if available
  if (trip.start_date && trip.end_date) {
    return {
      startDate: parseLocalDate(trip.start_date),
      endDate: parseLocalDate(trip.end_date),
    };
  }

  // Derive from data
  const allDates = [];

  flights.forEach((f) => {
    if (f.departure_at) allDates.push(new Date(f.departure_at));
    if (f.arrival_at) allDates.push(new Date(f.arrival_at));
  });

  stays.forEach((s) => {
    if (s.check_in_at) allDates.push(new Date(s.check_in_at));
    if (s.check_out_at) allDates.push(new Date(s.check_out_at));
  });

  activities.forEach((a) => {
    if (a.activity_date) allDates.push(parseLocalDate(a.activity_date));
  });

  landTravel.forEach((lt) => {
    if (lt.departure_date) allDates.push(parseLocalDate(lt.departure_date));
    if (lt.arrival_date) allDates.push(parseLocalDate(lt.arrival_date));
  });

  if (allDates.length === 0) return null;

  const timestamps = allDates.map((d) => d.getTime());
  return {
    startDate: new Date(Math.min(...timestamps)),
    endDate: new Date(Math.max(...timestamps)),
  };
}

// ── Helper: parse YYYY-MM-DD as local date ──────────────────────
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ── Helper: format date as "YYYY-MM-DD" key ─────────────────────
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Helper: get date key from ISO timestamp in a timezone ────────
function isoToDateKey(isoString, ianaTimezone) {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    // Format in the target timezone to get the local date
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: ianaTimezone || 'UTC',
    }).format(date);
    return parts; // Returns YYYY-MM-DD in en-CA locale
  } catch {
    return isoString.slice(0, 10);
  }
}

// ── Helper: get time from ISO timestamp in a timezone ────────────
function isoToTime(isoString, ianaTimezone) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: ianaTimezone || 'UTC',
    });
    // Format as "11:00 AM" → convert to "11:00a"
    const timeStr = formatter.format(date);
    return timeStr
      .replace(' AM', 'a')
      .replace(' PM', 'p');
  } catch {
    return '';
  }
}

// ── Helper: get sortable time HH:MM from ISO in timezone ─────────
function isoToSortTime(isoString, ianaTimezone) {
  if (!isoString) return '00:00';
  try {
    const date = new Date(isoString);
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: ianaTimezone || 'UTC',
    }).format(date);
    return parts; // "HH:MM"
  } catch {
    return '00:00';
  }
}

// ── Helper: get timezone abbreviation ────────────────────────────
function getTzAbbr(isoString, ianaTimezone) {
  if (!isoString || !ianaTimezone) return '';
  try {
    const date = new Date(isoString);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
      timeZone: ianaTimezone,
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch {
    return '';
  }
}

// ── Helper: format time from HH:MM:SS string ────────────────────
function formatTimeShort(timeStr) {
  if (!timeStr) return '';
  try {
    const [h, min] = timeStr.split(':').map(Number);
    const suffix = h >= 12 ? 'p' : 'a';
    const hour = ((h + 11) % 12) + 1;
    return `${hour}:${String(min).padStart(2, '0')}${suffix}`;
  } catch {
    return timeStr;
  }
}

// ── Helper: generate each day in a date range ────────────────────
function eachDayOfRange(startDate, endDate) {
  const days = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  while (current <= end) {
    days.push(toDateKey(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

// ── Helper: format day label ─────────────────────────────────────
function formatDayLabel(dateKey) {
  const date = parseLocalDate(dateKey);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// ── Build day map from all event arrays ──────────────────────────
function buildDayMap(flights, stays, activities, landTravel) {
  const map = new Map();

  function addEvent(dateKey, event) {
    if (!dateKey) return;
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey).push(event);
  }

  // Flights
  flights.forEach((f) => {
    const depDateKey = isoToDateKey(f.departure_at, f.departure_tz);
    const arrDateKey = isoToDateKey(f.arrival_at, f.arrival_tz);
    const depTime = isoToTime(f.departure_at, f.departure_tz);
    const depTz = getTzAbbr(f.departure_at, f.departure_tz);
    const title = `${f.airline || ''} ${f.flight_number || ''} ${f.from_location || ''} → ${f.to_location || ''}`.trim();

    addEvent(depDateKey, {
      type: 'FLT',
      title,
      timeInfo: `dep ${depTime}${depTz ? ' ' + depTz : ''}`,
      sortTime: isoToSortTime(f.departure_at, f.departure_tz),
    });

    // Show arrival on a different day
    if (arrDateKey && arrDateKey !== depDateKey) {
      const arrTime = isoToTime(f.arrival_at, f.arrival_tz);
      const arrTz = getTzAbbr(f.arrival_at, f.arrival_tz);
      addEvent(arrDateKey, {
        type: 'FLT ARR',
        title,
        timeInfo: `arr ${arrTime}${arrTz ? ' ' + arrTz : ''}`,
        sortTime: isoToSortTime(f.arrival_at, f.arrival_tz),
      });
    }
  });

  // Stays
  stays.forEach((s) => {
    const checkInDateKey = isoToDateKey(s.check_in_at, s.check_in_tz);
    const checkOutDateKey = isoToDateKey(s.check_out_at, s.check_out_tz);
    const checkInTime = isoToTime(s.check_in_at, s.check_in_tz);
    const checkInTz = getTzAbbr(s.check_in_at, s.check_in_tz);
    const checkOutTime = isoToTime(s.check_out_at, s.check_out_tz);
    const checkOutTz = getTzAbbr(s.check_out_at, s.check_out_tz);

    addEvent(checkInDateKey, {
      type: 'STAY IN',
      title: s.name || '',
      timeInfo: `${checkInTime}${checkInTz ? ' ' + checkInTz : ''}`,
      sortTime: isoToSortTime(s.check_in_at, s.check_in_tz),
    });

    addEvent(checkOutDateKey, {
      type: 'STAY OUT',
      title: s.name || '',
      timeInfo: `${checkOutTime}${checkOutTz ? ' ' + checkOutTz : ''}`,
      sortTime: isoToSortTime(s.check_out_at, s.check_out_tz),
    });
  });

  // Activities
  activities.forEach((a) => {
    const dateKey = a.activity_date;
    if (!dateKey) return;

    const isAllDay = !a.start_time && !a.end_time;
    const startFormatted = formatTimeShort(a.start_time);
    const endFormatted = formatTimeShort(a.end_time);
    const timeInfo = isAllDay
      ? 'all day'
      : `${startFormatted} – ${endFormatted}`;

    addEvent(dateKey, {
      type: 'ACT',
      title: a.name || '',
      timeInfo,
      sortTime: a.start_time ? a.start_time.slice(0, 5) : '00:00',
    });
  });

  // Land Travel
  landTravel.forEach((lt) => {
    const depDateKey = lt.departure_date;
    const arrDateKey = lt.arrival_date;
    const modeLabel = (lt.mode || '').replace('_', ' ');
    const title = `${modeLabel} ${lt.from_location || ''} → ${lt.to_location || ''}`.trim();
    const depTime = formatTimeShort(lt.departure_time);
    const arrTime = formatTimeShort(lt.arrival_time);

    if (depDateKey) {
      addEvent(depDateKey, {
        type: 'LT',
        title,
        timeInfo: depTime ? `dep ${depTime}` : '',
        sortTime: lt.departure_time ? lt.departure_time.slice(0, 5) : '00:00',
      });
    }

    if (arrDateKey && arrDateKey !== depDateKey) {
      addEvent(arrDateKey, {
        type: 'LT ARR',
        title,
        timeInfo: arrTime ? `arr ${arrTime}` : '',
        sortTime: lt.arrival_time ? lt.arrival_time.slice(0, 5) : '00:00',
      });
    }
  });

  return map;
}

// ── Sort events within a day ─────────────────────────────────────
function sortEvents(events) {
  return [...events].sort((a, b) => {
    // Sort by time first
    if (a.sortTime < b.sortTime) return -1;
    if (a.sortTime > b.sortTime) return 1;
    // Same time: sort by type priority
    const aPri = TYPE_PRIORITY[a.type] ?? 99;
    const bPri = TYPE_PRIORITY[b.type] ?? 99;
    return aPri - bPri;
  });
}

// ── Component ────────────────────────────────────────────────────
export default function PrintCalendarSummary({ trip, flights, stays, activities, landTravel }) {
  // Guard: no data at all → render nothing
  const flightsArr = flights || [];
  const staysArr = stays || [];
  const activitiesArr = activities || [];
  const landTravelArr = landTravel || [];

  const hasAnyData =
    flightsArr.length > 0 ||
    staysArr.length > 0 ||
    activitiesArr.length > 0 ||
    landTravelArr.length > 0;

  if (!hasAnyData && !trip?.start_date && !trip?.end_date) {
    return null;
  }

  const range = getDateRange(trip, flightsArr, staysArr, activitiesArr, landTravelArr);
  if (!range) return null;

  const days = eachDayOfRange(range.startDate, range.endDate);
  const dayMap = buildDayMap(flightsArr, staysArr, activitiesArr, landTravelArr);

  return (
    <div className={styles.wrapper}>
      {/* Section header */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>itinerary overview</span>
      </div>

      {/* Day-by-day table */}
      <table className={styles.summaryTable} role="table">
        <thead className={styles.srOnly}>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Events</th>
          </tr>
        </thead>
        <tbody>
          {days.map((dateKey, dayIdx) => {
            const events = dayMap.get(dateKey);
            const sorted = events ? sortEvents(events) : null;
            const isLast = dayIdx === days.length - 1;

            return (
              <tr
                key={dateKey}
                className={`${styles.summaryDayRow}${isLast ? ` ${styles.summaryDayRowLast}` : ''}`}
              >
                <td className={styles.summaryDateCell}>
                  {formatDayLabel(dateKey)}
                </td>
                <td className={styles.summaryEventsCell}>
                  {sorted ? (
                    sorted.map((event, idx) => (
                      <div key={idx} className={styles.summaryEventLine}>
                        <span className={styles.summaryTypeLabel}>{event.type}</span>
                        {' '}
                        {event.title}
                        {event.timeInfo ? `  ${event.timeInfo}` : ''}
                      </div>
                    ))
                  ) : (
                    <span className={styles.summaryNoEvents}>&mdash;</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
