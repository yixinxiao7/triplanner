import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import styles from './TripCalendar.module.css';

/**
 * TripCalendar — monthly calendar grid showing flights, stays, activities, and land travel.
 * Custom implementation (no external library) using CSS Grid.
 *
 * Props:
 *   trip         — trip object { start_date, end_date }
 *   flights      — array of flight objects
 *   stays        — array of stay objects
 *   activities   — array of activity objects
 *   landTravels  — array of land travel objects (T-088)
 *   isLoading    — true while sub-resources are loading
 */

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const LAND_TRAVEL_MODE_LABELS = {
  RENTAL_CAR: 'rental car',
  BUS: 'bus',
  TRAIN: 'train',
  RIDESHARE: 'rideshare',
  FERRY: 'ferry',
  OTHER: 'other',
};

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
    return isoString.slice(0, 10);
  }
}

/** Convert a UTC ISO string to local "HH:MM" in a given IANA timezone */
function isoToLocalHHMM(isoString, timezone) {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(date); // "HH:MM"
  } catch {
    return null;
  }
}

/** Format "HH:MM" or "HH:MM:SS" into compact 12h string: "9a", "2:30p", "12p" */
function formatCalendarTime(timeStr) {
  if (!timeStr) return null;
  try {
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    if (isNaN(h) || isNaN(m)) return null;
    const suffix = h >= 12 ? 'p' : 'a';
    const hour = ((h + 11) % 12) + 1;
    const minute = m > 0 ? `:${String(m).padStart(2, '0')}` : '';
    return `${hour}${minute}${suffix}`;
  } catch {
    return null;
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

// ── Build events map: date → { flights, stays, activities, landTravels } ──

function buildEventsMap(flights, stays, activities, landTravels) {
  const map = {};

  function addEvent(dateStr, type, item) {
    if (!dateStr) return;
    if (!map[dateStr]) map[dateStr] = { flights: [], stays: [], activities: [], landTravels: [] };
    map[dateStr][type].push(item);
  }

  for (const flight of flights) {
    const localDate = toLocalDate(flight.departure_at, flight.departure_tz);
    const calTime = formatCalendarTime(isoToLocalHHMM(flight.departure_at, flight.departure_tz));
    addEvent(localDate, 'flights', { ...flight, _calTime: calTime });
  }

  for (const stay of stays) {
    const checkIn = toLocalDate(stay.check_in_at, stay.check_in_tz);
    const checkOut = toLocalDate(stay.check_out_at, stay.check_out_tz);
    const checkInTime = formatCalendarTime(isoToLocalHHMM(stay.check_in_at, stay.check_in_tz));
    const dates = getDateRange(checkIn, checkOut);
    for (let i = 0; i < dates.length; i++) {
      addEvent(dates[i], 'stays', {
        ...stay,
        _isFirst: i === 0,
        _isLast: i === dates.length - 1,
        _calTime: i === 0 ? checkInTime : null, // only show check-in time on first day
      });
    }
  }

  for (const activity of activities) {
    const calTime = activity.start_time ? formatCalendarTime(activity.start_time) : null;
    addEvent(activity.activity_date, 'activities', { ...activity, _calTime: calTime });
  }

  for (const lt of landTravels) {
    // Land travel appears on departure_date
    const calTime = lt.departure_time ? formatCalendarTime(lt.departure_time) : null;
    const modeLabel = LAND_TRAVEL_MODE_LABELS[lt.mode] || lt.mode.toLowerCase();
    addEvent(lt.departure_date, 'landTravels', { ...lt, _calTime: calTime, _modeLabel: modeLabel });
    // Also on arrival_date if different from departure_date
    if (lt.arrival_date && lt.arrival_date !== lt.departure_date) {
      const arrCalTime = lt.arrival_time ? formatCalendarTime(lt.arrival_time) : null;
      addEvent(lt.arrival_date, 'landTravels', {
        ...lt,
        _calTime: arrCalTime,
        _modeLabel: modeLabel,
        _isArrival: true,
      });
    }
  }

  return map;
}

// ── Day Popover ───────────────────────────────────────────────

function DayPopover({ day, events, onClose, triggerRef }) {
  const popoverRef = useRef(null);
  const allEvents = [
    ...(events?.flights || []).map((f) => ({ type: 'flight', item: f })),
    ...(events?.stays || []).map((s) => ({ type: 'stay', item: s })),
    ...(events?.activities || []).map((a) => ({ type: 'activity', item: a })),
    ...(events?.landTravels || []).map((lt) => ({ type: 'landTravel', item: lt })),
  ];

  const parsed = parseDateStr(day);
  const dateLabel = parsed
    ? `${DAYS_OF_WEEK[(new Date(`${day}T00:00:00`)).getDay()]}, ${MONTHS[parsed.month]} ${parsed.day}`
    : day;

  // Focus the popover on open
  useEffect(() => {
    if (popoverRef.current) {
      popoverRef.current.focus();
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
        triggerRef?.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, triggerRef]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        // Don't close if clicking the trigger button itself (it handles toggle)
        if (triggerRef?.current && triggerRef.current.contains(e.target)) return;
        onClose();
      }
    }
    // Use mousedown so it fires before click handlers
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  function getEventDot(type) {
    const dotStyles = {
      width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 2,
    };
    if (type === 'flight') return <span style={{ ...dotStyles, background: 'var(--color-flight, #5D737E)' }} aria-hidden="true" />;
    if (type === 'stay') return <span style={{ ...dotStyles, background: 'var(--color-stay, #3D8F82)' }} aria-hidden="true" />;
    if (type === 'activity') return <span style={{ ...dotStyles, background: 'var(--color-activity, #C47A2E)' }} aria-hidden="true" />;
    if (type === 'landTravel') return <span style={{ ...dotStyles, background: 'var(--color-land-travel, #7B6B8E)' }} aria-hidden="true" />;
    return null;
  }

  function getEventLabel(type, item) {
    if (type === 'flight') return item.flight_number || item.airline || 'flight';
    if (type === 'stay') return item.name || 'stay';
    if (type === 'activity') return item.name || 'activity';
    if (type === 'landTravel') {
      const prefix = item._isArrival ? 'arr.' : 'dep.';
      return `${item._modeLabel} ${prefix} ${item.to_location || ''}`.trim();
    }
    return 'event';
  }

  function getEventTime(type, item) {
    if (!item._calTime) return null;
    if (type === 'flight') return `dep. ${item._calTime}`;
    if (type === 'stay') {
      if (item._isFirst) return `check-in ${item._calTime}`;
      return null;
    }
    if (type === 'activity') return item._calTime;
    if (type === 'landTravel') {
      return item._isArrival ? `arr. ${item._calTime}` : `dep. ${item._calTime}`;
    }
    return item._calTime;
  }

  return (
    <div
      ref={popoverRef}
      className={styles.popover}
      role="dialog"
      aria-modal="true"
      aria-label={`Events for ${dateLabel}`}
      tabIndex={-1}
    >
      <div className={styles.popoverHeader}>
        <span className={styles.popoverDate}>{dateLabel}</span>
        <button
          className={styles.popoverCloseBtn}
          onClick={() => { onClose(); triggerRef?.current?.focus(); }}
          aria-label="Close events popover"
        >
          ×
        </button>
      </div>
      <div className={styles.popoverList}>
        {allEvents.map((ev, i) => {
          const label = getEventLabel(ev.type, ev.item);
          const time = getEventTime(ev.type, ev.item);
          return (
            <div key={i} className={styles.popoverItem}>
              {getEventDot(ev.type)}
              <div className={styles.popoverItemContent}>
                <span className={styles.popoverItemName}>{label}</span>
                {time && <span className={styles.popoverItemTime}>{time}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Day Cell ─────────────────────────────────────────────────

function DayCell({ day, isOutsideMonth, isToday, events, openPopoverDay, onOpenPopover }) {
  const parsed = parseDateStr(day);
  const dateLabel = `${DAYS_OF_WEEK[(new Date(`${day}T00:00:00`)).getDay()]}, ${
    MONTHS[parsed.month]
  } ${parsed.day}`;

  const overflowBtnRef = useRef(null);
  const isPopoverOpen = openPopoverDay === day;

  const allEvents = [
    ...(events?.flights || []).map((f) => ({ type: 'flight', item: f })),
    ...(events?.stays || []).map((s) => ({ type: 'stay', item: s })),
    ...(events?.activities || []).map((a) => ({ type: 'activity', item: a })),
    ...(events?.landTravels || []).map((lt) => ({ type: 'landTravel', item: lt })),
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
        {parsed.day}
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
                <span className={styles.eventName}>{ev.item.flight_number || ev.item.airline}</span>
                {ev.item._calTime && <span className={styles.eventTime}>{ev.item._calTime}</span>}
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
                {ev.item._isFirst && (
                  <>
                    <span className={styles.eventName}>{ev.item.name}</span>
                    {ev.item._calTime && <span className={styles.eventTime}>{ev.item._calTime}</span>}
                  </>
                )}
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
                <span className={styles.eventName}>{ev.item.name}</span>
                {ev.item._calTime && <span className={styles.eventTime}>{ev.item._calTime}</span>}
              </div>
            );
          }
          if (ev.type === 'landTravel') {
            const chipLabel = `${ev.item._modeLabel} → ${ev.item.to_location}`;
            return (
              <div
                key={`lt-${i}`}
                className={`${styles.eventChip} ${styles.eventChipLandTravel}`}
                aria-label={`Land travel: ${chipLabel}`}
                title={chipLabel}
              >
                <span className={styles.eventName}>{chipLabel}</span>
                {ev.item._calTime && <span className={styles.eventTime}>{ev.item._calTime}</span>}
              </div>
            );
          }
          return null;
        })}

        {overflow > 0 && (
          <div className={styles.overflowWrapper}>
            <button
              ref={overflowBtnRef}
              className={styles.overflowBtn}
              onClick={(e) => {
                e.stopPropagation();
                onOpenPopover(day, overflowBtnRef);
              }}
              aria-haspopup="dialog"
              aria-expanded={isPopoverOpen}
              aria-label={`${overflow + visible.length} events on this day. Show all`}
            >
              +{overflow} more
            </button>
            {isPopoverOpen && (
              <DayPopover
                day={day}
                events={events}
                onClose={() => onOpenPopover(null, null)}
                triggerRef={overflowBtnRef}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Calendar Component ──────────────────────────────────

export default function TripCalendar({
  trip,
  flights = [],
  stays = [],
  activities = [],
  landTravels = [],
  isLoading = false,
}) {
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

  // Popover state: { day: "YYYY-MM-DD", triggerRef: React.RefObject } | null
  const [openPopover, setOpenPopover] = useState(null);

  const handleOpenPopover = useCallback((day, triggerRef) => {
    if (!day) {
      setOpenPopover(null);
    } else {
      setOpenPopover({ day, triggerRef });
    }
  }, []);

  // Build events map from all sub-resources
  const eventsMap = useMemo(
    () => buildEventsMap(flights, stays, activities, landTravels),
    [flights, stays, activities, landTravels]
  );

  const hasAnyEvents =
    flights.length > 0 || stays.length > 0 || activities.length > 0 || landTravels.length > 0;

  // Build calendar grid for the current view month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstDay.getDay();
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
    setOpenPopover(null);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    setOpenPopover(null);
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
              openPopoverDay={openPopover?.day || null}
              onOpenPopover={handleOpenPopover}
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
