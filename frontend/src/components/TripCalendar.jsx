import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
 *
 * Sprint 7 changes (T-097, T-101):
 *   T-097: DayPopover now renders via ReactDOM.createPortal to document.body with
 *          position:fixed to prevent CSS grid layout corruption when popover opens.
 *   T-101: Added checkout time on last day of multi-day stays ("check-out Xa"),
 *          flight arrival time on arrival day when different from departure day ("arrives Xa").
 *          Land travel arrival day was already implemented in Sprint 6.
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

// ── T-128: Initial month — earliest planned event ─────────────────────────
//
// Find the earliest event date across flights, stays, activities (and land travels
// since they are already rendered on the calendar). Returns a Date set to the
// first day of that month. Falls back to the first day of the current month when
// no events exist or all date fields are null / malformed.

function getInitialMonth(flights = [], stays = [], activities = [], landTravels = []) {
  const dates = [];

  flights.forEach((f) => {
    if (f.departure_at) {
      const d = new Date(f.departure_at);
      if (!isNaN(d)) dates.push(d);
    }
  });

  stays.forEach((s) => {
    if (s.check_in_at) {
      const d = new Date(s.check_in_at);
      if (!isNaN(d)) dates.push(d);
    }
  });

  // Parse activity_date as local time to avoid UTC-midnight offset issues
  activities.forEach((a) => {
    if (a.activity_date) {
      const [year, month, day] = a.activity_date.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      if (!isNaN(d)) dates.push(d);
    }
  });

  // Include land travel departure dates if they are calendar-rendered
  landTravels.forEach((lt) => {
    if (lt.departure_date) {
      const [year, month, day] = lt.departure_date.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      if (!isNaN(d)) dates.push(d);
    }
  });

  if (dates.length === 0) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const earliest = dates.reduce((min, d) => (d < min ? d : min), dates[0]);
  return new Date(earliest.getFullYear(), earliest.getMonth(), 1);
}

// ── Build events map: date → { flights, stays, activities, landTravels } ──
// T-101: Added flight arrival day + stay checkout time on last day

function buildEventsMap(flights, stays, activities, landTravels) {
  const map = {};

  function addEvent(dateStr, type, item) {
    if (!dateStr) return;
    if (!map[dateStr]) map[dateStr] = { flights: [], stays: [], activities: [], landTravels: [] };
    map[dateStr][type].push(item);
  }

  // ── Flights ──
  // Shows departure chip on departure_date.
  // T-101: Also shows arrival chip on arrival_date when different from departure_date.
  for (const flight of flights) {
    const localDepartureDate = toLocalDate(flight.departure_at, flight.departure_tz);
    const depCalTime = formatCalendarTime(isoToLocalHHMM(flight.departure_at, flight.departure_tz));
    addEvent(localDepartureDate, 'flights', { ...flight, _calTime: depCalTime });

    // T-101 CAL-3.3: Add arrival chip on arrival_date if different from departure_date
    const localArrivalDate = toLocalDate(flight.arrival_at, flight.arrival_tz);
    if (localArrivalDate && localArrivalDate !== localDepartureDate) {
      const arrCalTime = formatCalendarTime(isoToLocalHHMM(flight.arrival_at, flight.arrival_tz));
      addEvent(localArrivalDate, 'flights', {
        ...flight,
        _calTime: arrCalTime,
        _isArrival: true,
      });
    }
  }

  // ── Stays ──
  // T-101 CAL-3.2: Added checkout time on the last day of multi-day stays.
  // Single-day stays (check_in === check_out) are both _isFirst and _isLast.
  for (const stay of stays) {
    const checkIn = toLocalDate(stay.check_in_at, stay.check_in_tz);
    const checkOut = toLocalDate(stay.check_out_at, stay.check_out_tz);
    const checkInTime = formatCalendarTime(isoToLocalHHMM(stay.check_in_at, stay.check_in_tz));
    const checkOutTime = formatCalendarTime(isoToLocalHHMM(stay.check_out_at, stay.check_out_tz));
    const dates = getDateRange(checkIn, checkOut);
    for (let i = 0; i < dates.length; i++) {
      const isFirst = i === 0;
      const isLast = i === dates.length - 1;
      addEvent(dates[i], 'stays', {
        ...stay,
        _isFirst: isFirst,
        _isLast: isLast,
        _calTime: isFirst ? checkInTime : null,
        // T-101: expose checkout time on last day cell
        _checkOutTime: isLast ? checkOutTime : null,
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
    // Also on arrival_date if different from departure_date (Sprint 6 T-088)
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
// T-097: DayPopover now accepts a `position` prop ({ top, left }) for fixed positioning
// via portal. Previously rendered inside DayCell's overflowWrapper which caused
// CSS grid layout corruption (cells expanding when popover opened).

function DayPopover({ day, events, onClose, triggerRef, position }) {
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

  // T-137: Build document-relative positioning style (position: absolute).
  // Computed once at mount time; position: absolute on a document.body child
  // means the popover scrolls with the document and stays pinned to the trigger.
  // In JSDOM tests, getBoundingClientRect/scrollX/scrollY all return zeros → top:4,left:0 (fine).
  const positionStyle = (() => {
    const scrollX = (typeof window !== 'undefined' ? (window.scrollX ?? window.pageXOffset) : 0) || 0;
    const scrollY = (typeof window !== 'undefined' ? (window.scrollY ?? window.pageYOffset) : 0) || 0;
    const viewportWidth = (typeof window !== 'undefined' ? window.innerWidth : 0) || 0;
    const viewportHeight = (typeof window !== 'undefined' ? window.innerHeight : 0) || 0;
    const popoverWidth = 240;
    const popoverEstimatedHeight = 200;

    if (!position) {
      return { position: 'absolute', top: 4, left: 0, zIndex: 1000 };
    }

    let top = (position.bottom || 0) + scrollY + 4;
    let left = (position.left || 0) + scrollX;

    // Right-edge clamping: prevent overflow off the right side of the viewport
    if (viewportWidth > 0 && left + popoverWidth > scrollX + viewportWidth - 16) {
      left = scrollX + viewportWidth - popoverWidth - 16;
    }
    left = Math.max(scrollX, left);

    // Bottom-edge: render above trigger if insufficient space below
    if (viewportHeight > 0 && (position.bottom || 0) + popoverEstimatedHeight > viewportHeight) {
      top = (position.top || 0) + scrollY - popoverEstimatedHeight;
    }

    return { position: 'absolute', top, left, zIndex: 1000 };
  })();

  // Focus the popover on open
  useEffect(() => {
    if (popoverRef.current) {
      popoverRef.current.focus();
    }
  }, []);

  // T-137: Scroll does NOT close the popover (Spec 19 reverses T-126 scroll-close behavior).
  // position: absolute keeps the popover anchored to the trigger's document position.

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
    if (type === 'flight') {
      if (!item._calTime) return null;
      return item._isArrival ? `arrives ${item._calTime}` : `dep. ${item._calTime}`;
    }
    if (type === 'stay') {
      if (!item._calTime) return null;
      if (item._isFirst) return `check-in ${item._calTime}`;
      return null;
    }
    if (type === 'activity') return item._calTime || null;
    // T-138: RENTAL_CAR land travel shows "pick-up Xp" / "drop-off Xp" labels.
    // Other modes fall through to standard arr./dep. labels.
    if (type === 'landTravel') {
      if (item.mode === 'RENTAL_CAR') {
        if (item._isArrival) {
          return item._calTime ? `drop-off ${item._calTime}` : 'drop-off';
        }
        return item._calTime ? `pick-up ${item._calTime}` : 'pick-up';
      }
      if (!item._calTime) return null;
      return item._isArrival ? `arr. ${item._calTime}` : `dep. ${item._calTime}`;
    }
    return item._calTime || null;
  }

  return (
    <div
      ref={popoverRef}
      className={styles.popover}
      style={positionStyle}
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
// T-097: No longer renders DayPopover inline. Instead calls onOpenPopover with the
//         trigger button's bounding rect so TripCalendar can portal the popover.
// T-101: Stay chips now show checkout time on last day. Flight chips show "arrives X"
//         label on arrival day.

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
            const isArrival = ev.item._isArrival;
            return (
              <div
                key={`f-${i}`}
                className={`${styles.eventChip} ${styles.eventChipFlight}`}
                aria-label={isArrival ? `Flight arrives: ${ev.item.flight_number}` : `Flight: ${ev.item.flight_number}`}
                title={`${ev.item.airline} ${ev.item.flight_number}`}
              >
                <span className={styles.eventName}>{ev.item.flight_number || ev.item.airline}</span>
                {/* T-101: show "arrives X" on arrival day, normal time on departure day */}
                {isArrival && ev.item._calTime && (
                  <span className={styles.eventTime}>arrives {ev.item._calTime}</span>
                )}
                {!isArrival && ev.item._calTime && (
                  <span className={styles.eventTime}>{ev.item._calTime}</span>
                )}
              </div>
            );
          }
          if (ev.type === 'stay') {
            const { _isFirst, _isLast, _calTime, _checkOutTime } = ev.item;
            // T-101: Determine what time text to show
            // _isFirst && _isLast (single-day): "checkInTime → check-out checkOutTime"
            // _isFirst && !_isLast: show check-in time only
            // !_isFirst && _isLast: show "check-out checkOutTime"
            // !_isFirst && !_isLast: no text (visual span bar)
            let timeText = null;
            if (_isFirst && _isLast) {
              // Single-day stay: both check-in and check-out
              // T-127: prepend "check-in " to the check-in time, matching "check-out" label format
              if (_calTime && _checkOutTime) {
                timeText = `check-in ${_calTime} → check-out ${_checkOutTime}`;
              } else if (_calTime) {
                timeText = `check-in ${_calTime}`;
              } else if (_checkOutTime) {
                timeText = `check-out ${_checkOutTime}`;
              }
            } else if (_isFirst) {
              // T-127: prepend "check-in " to first-day time chip
              timeText = _calTime ? `check-in ${_calTime}` : null;
            } else if (_isLast) {
              timeText = _checkOutTime ? `check-out ${_checkOutTime}` : null;
            }

            return (
              <div
                key={`s-${i}`}
                className={`${styles.eventChip} ${styles.eventChipStay} ${_isFirst ? styles.chipFirst : ''} ${_isLast ? styles.chipLast : ''}`}
                aria-label={`Stay: ${ev.item.name}`}
                title={ev.item.name}
              >
                {/* Show content on first day (name + time) OR last day (checkout time) */}
                {(_isFirst || _isLast) && (
                  <>
                    {_isFirst && <span className={styles.eventName}>{ev.item.name}</span>}
                    {timeText && <span className={styles.eventTime}>{timeText}</span>}
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
            // T-138: RENTAL_CAR shows "pick-up Xp" on pick-up day and "drop-off Xp" on drop-off day.
            // All other modes show the plain departure/arrival time (existing behavior).
            let timeLabel = null;
            if (ev.item.mode === 'RENTAL_CAR') {
              if (ev.item._isArrival) {
                timeLabel = ev.item._calTime ? `drop-off ${ev.item._calTime}` : 'drop-off';
              } else {
                timeLabel = ev.item._calTime ? `pick-up ${ev.item._calTime}` : 'pick-up';
              }
            } else {
              timeLabel = ev.item._calTime || null;
            }
            return (
              <div
                key={`lt-${i}`}
                className={`${styles.eventChip} ${styles.eventChipLandTravel}`}
                aria-label={`Land travel: ${chipLabel}`}
                title={chipLabel}
              >
                <span className={styles.eventName}>{chipLabel}</span>
                {timeLabel && <span className={styles.eventTime}>{timeLabel}</span>}
              </div>
            );
          }
          return null;
        })}

        {/* T-097: overflow button now only calls onOpenPopover with trigger ref + rect.
             DayPopover is NO LONGER rendered inside DayCell — it's portaled in TripCalendar. */}
        {overflow > 0 && (
          <div className={styles.overflowWrapper}>
            <button
              ref={overflowBtnRef}
              className={styles.overflowBtn}
              onClick={(e) => {
                e.stopPropagation();
                // T-097: pass bounding rect so TripCalendar can position the portal popover
                const rect = overflowBtnRef.current?.getBoundingClientRect() || null;
                onOpenPopover(day, overflowBtnRef, rect);
              }}
              aria-haspopup="dialog"
              aria-expanded={isPopoverOpen}
              aria-label={`${overflow + visible.length} events on this day. Show all`}
            >
              +{overflow} more
            </button>
            {/* DayPopover is NO LONGER here — moved to TripCalendar portal */}
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
  // T-128: Determine initial month from earliest planned event across all event types.
  // Falls back to current month when no events exist.
  // Lazy initializer ensures this only runs once at mount (no flash from wrong month).
  const [viewYear, setViewYear] = useState(() =>
    getInitialMonth(flights, stays, activities, landTravels).getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() =>
    getInitialMonth(flights, stays, activities, landTravels).getMonth()
  );

  // T-097: Popover state now includes bounding rect for portal positioning.
  // Shape: { day: "YYYY-MM-DD", triggerRef: React.RefObject, rect: DOMRect | null } | null
  const [openPopover, setOpenPopover] = useState(null);

  const handleOpenPopover = useCallback((day, triggerRef, rect) => {
    if (!day) {
      setOpenPopover(null);
    } else {
      setOpenPopover({ day, triggerRef, rect });
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

      {/* T-097: DayPopover rendered via portal to document.body.
           This prevents the popover from being constrained by the CSS grid layout,
           fixing the visual corruption where day cells would expand when popover opened. */}
      {openPopover && createPortal(
        <DayPopover
          day={openPopover.day}
          events={eventsMap[openPopover.day]}
          onClose={() => handleOpenPopover(null, null, null)}
          triggerRef={openPopover.triggerRef}
          position={openPopover.rect}
        />,
        document.body
      )}
    </div>
  );
}
