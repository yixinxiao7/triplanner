import { useState, useMemo } from 'react';
import styles from './TripCalendar.module.css';

/**
 * TripCalendar — monthly calendar grid showing flights, stays, and activities.
 * Custom implementation (no external library) using CSS Grid.
 *
 * Props:
 *   trip         — trip object { start_date, end_date }
 *   flights      — array of flight objects
 *   stays        — array of stay objects
 *   activities   — array of activity objects
 *   isLoading    — true while sub-resources are loading
 */

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// ── Date helpers ─────────────────────────────────────────────

/** Format YYYY-MM-DD string as { year, month (0-indexed), day } */
function parseDateStr(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

/** Convert a UTC ISO string to local YYYY-MM-DD in a given IANA timezone (best-effort) */
function toLocalDate(isoString, timezone) {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // "YYYY-MM-DD"
  } catch {
    // Fallback: use UTC date
    return isoString.slice(0, 10);
  }
}

/** Get all dates between start and end (inclusive), as YYYY-MM-DD strings */
function getDateRange(startStr, endStr) {
  const dates = [];
  if (!startStr || !endStr) return dates;
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** Get today as YYYY-MM-DD */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Build events map: date → { flights, stays, activities } ─

function buildEventsMap(flights, stays, activities) {
  const map = {};

  function addEvent(dateStr, type, item) {
    if (!dateStr) return;
    if (!map[dateStr]) map[dateStr] = { flights: [], stays: [], activities: [] };
    map[dateStr][type].push(item);
  }

  for (const flight of flights) {
    const localDate = toLocalDate(flight.departure_at, flight.departure_tz);
    addEvent(localDate, 'flights', flight);
  }

  for (const stay of stays) {
    const checkIn = toLocalDate(stay.check_in_at, stay.check_in_tz);
    const checkOut = toLocalDate(stay.check_out_at, stay.check_out_tz);
    const dates = getDateRange(checkIn, checkOut);
    for (let i = 0; i < dates.length; i++) {
      addEvent(dates[i], 'stays', { ...stay, _isFirst: i === 0, _isLast: i === dates.length - 1 });
    }
  }

  for (const activity of activities) {
    addEvent(activity.activity_date, 'activities', activity);
  }

  return map;
}

// ── Day Cell ─────────────────────────────────────────────────

function DayCell({ day, isOutsideMonth, isToday, events }) {
  const dateLabel = `${DAYS_OF_WEEK[(new Date(`${day}T00:00:00`)).getDay()]}, ${
    MONTHS[parseDateStr(day).month]
  } ${parseDateStr(day).day}`;

  const allEvents = [
    ...(events?.flights || []).map((f) => ({ type: 'flight', item: f })),
    ...(events?.stays || []).map((s) => ({ type: 'stay', item: s })),
    ...(events?.activities || []).map((a) => ({ type: 'activity', item: a })),
  ];

  const visible = allEvents.slice(0, 3);
  const overflow = allEvents.length - 3;

  return (
    <div
      className={`${styles.dayCell} ${isOutsideMonth ? styles.dayCellOutside : ''}`}
      aria-label={dateLabel}
      aria-current={isToday ? 'date' : undefined}
      aria-disabled={isOutsideMonth ? 'true' : undefined}
    >
      {/* Date number */}
      <div className={`${styles.dayNumber} ${isToday ? styles.dayNumberToday : ''} ${isOutsideMonth ? styles.dayNumberOutside : ''}`}>
        {parseDateStr(day).day}
      </div>

      {/* Events */}
      <div className={styles.eventsArea}>
        {visible.map((ev, i) => {
          if (ev.type === 'flight') {
            return (
              <div
                key={`f-${i}`}
                className={`${styles.eventChip} ${styles.eventChipFlight}`}
                aria-label={`Flight: ${ev.item.flight_number}`}
                title={`${ev.item.airline} ${ev.item.flight_number}`}
              >
                {ev.item.flight_number || ev.item.airline}
              </div>
            );
          }
          if (ev.type === 'stay') {
            return (
              <div
                key={`s-${i}`}
                className={`${styles.eventChip} ${styles.eventChipStay} ${ev.item._isFirst ? styles.chipFirst : ''} ${ev.item._isLast ? styles.chipLast : ''}`}
                aria-label={`Stay: ${ev.item.name}`}
                title={ev.item.name}
              >
                {ev.item._isFirst ? ev.item.name : ''}
              </div>
            );
          }
          if (ev.type === 'activity') {
            return (
              <div
                key={`a-${i}`}
                className={`${styles.eventChip} ${styles.eventChipActivity}`}
                aria-label={`Activity: ${ev.item.name}`}
                title={ev.item.name}
              >
                {ev.item.name}
              </div>
            );
          }
          return null;
        })}

        {overflow > 0 && (
          <div className={styles.overflowIndicator}>+{overflow} more</div>
        )}
      </div>
    </div>
  );
}

// ── Main Calendar Component ──────────────────────────────────

export default function TripCalendar({ trip, flights = [], stays = [], activities = [], isLoading = false }) {
  // Determine initial month
  const initialDate = useMemo(() => {
    if (trip?.start_date) {
      const parsed = parseDateStr(trip.start_date);
      if (parsed) return { year: parsed.year, month: parsed.month };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  }, [trip?.start_date]);

  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth, setViewMonth] = useState(initialDate.month);

  // Build events map from flights/stays/activities
  const eventsMap = useMemo(
    () => buildEventsMap(flights, stays, activities),
    [flights, stays, activities]
  );

  const hasAnyEvents = flights.length > 0 || stays.length > 0 || activities.length > 0;

  // Build calendar grid for the current view month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstDay.getDay(); // Day of week for first day (0=Sun)
    const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;

    const days = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(viewYear, viewMonth, 1 - startPad + i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        dateStr,
        isOutsideMonth: d.getMonth() !== viewMonth,
        isToday: dateStr === todayStr(),
      });
    }
    return days;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <div className={styles.calendar} role="application" aria-label="Trip calendar">
      {/* Calendar Header */}
      <div className={styles.calendarHeader}>
        <button
          className={styles.navBtn}
          onClick={prevMonth}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className={styles.monthLabel} aria-live="polite">
          {MONTHS[viewMonth].toUpperCase()} {viewYear}
        </div>
        <button
          className={styles.navBtn}
          onClick={nextMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Day of week header */}
      <div className={styles.dowHeader}>
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className={styles.dowCell}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSkeleton} />
        </div>
      ) : (
        <div className={styles.grid}>
          {calendarDays.map(({ dateStr, isOutsideMonth, isToday }) => (
            <DayCell
              key={dateStr}
              day={dateStr}
              isOutsideMonth={isOutsideMonth}
              isToday={isToday}
              events={eventsMap[dateStr]}
            />
          ))}
        </div>
      )}

      {/* Empty state message */}
      {!isLoading && !hasAnyEvents && (
        <div className={styles.emptyMessage}>no events this month</div>
      )}
    </div>
  );
}
