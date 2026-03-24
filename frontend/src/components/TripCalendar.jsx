import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiClient } from '../utils/api';
import styles from './TripCalendar.module.css';

/**
 * TripCalendar — Sprint 25 (T-213)
 * Self-contained calendar component. Fetches from GET /api/v1/trips/:id/calendar.
 * Renders a monthly grid with events color-coded by type (FLIGHT / STAY / ACTIVITY).
 * Props:
 *   tripId (string, required) — the trip UUID
 */

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Helpers ──────────────────────────────────────────────────

/** Format "HH:MM" or "HH:MM:SS" → compact 12h: "9a", "2:30p" */
function formatTime(timeStr) {
  if (!timeStr) return null;
  try {
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    const suffix = h >= 12 ? 'p' : 'a';
    const hour = ((h + 11) % 12) + 1;
    const minute = m > 0 ? `:${String(m).padStart(2, '0')}` : '';
    return `${hour}${minute}${suffix}`;
  } catch {
    return null;
  }
}

/** Get today as YYYY-MM-DD */
function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Determine initial displayed month from events array (first event's start_date) */
function getInitialMonth(events) {
  if (!events || events.length === 0) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }
  const first = events[0]; // already ordered ASC by start_date
  const [y, m] = first.start_date.split('-').map(Number);
  return { year: y, month: m - 1 }; // month is 0-indexed
}

/** Enumerate dates from start to end (inclusive), returning YYYY-MM-DD strings */
function enumerateDates(start, end) {
  const dates = [];
  const cur = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  while (cur <= endDate) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** Build a map: dateStr → array of event objects (with _dayType metadata for multi-day events) */
function buildEventsMap(events) {
  const map = {};
  for (const event of events) {
    // T-264: FLIGHT and LAND_TRAVEL now support multi-day spanning (same as STAY)
    if (event.type === 'FLIGHT' || event.type === 'LAND_TRAVEL') {
      const start = event.start_date;
      const end = event.end_date || event.start_date;
      if (start === end) {
        // Single-day: same as previous behavior
        if (!map[start]) map[start] = [];
        map[start].push({ ...event, _dayType: 'single', _isFirst: true, _isLast: true });
      } else {
        // Multi-day: enumerate dates
        const dates = enumerateDates(start, end);
        for (let i = 0; i < dates.length; i++) {
          const d = dates[i];
          if (!map[d]) map[d] = [];
          const isFirst = i === 0;
          const isLast = i === dates.length - 1;
          map[d].push({
            ...event,
            _dayType: isFirst ? 'start' : isLast ? 'end' : 'middle',
            _isFirst: isFirst,
            _isLast: isLast,
          });
        }
      }
    } else if (event.type === 'ACTIVITY') {
      const d = event.start_date;
      if (!map[d]) map[d] = [];
      map[d].push({ ...event, _dayType: 'single', _isFirst: true, _isLast: true });
    } else if (event.type === 'STAY') {
      const start = event.start_date;
      const end = event.end_date || event.start_date;
      const dates = enumerateDates(start, end);
      for (let i = 0; i < dates.length; i++) {
        const d = dates[i];
        if (!map[d]) map[d] = [];
        const isFirst = i === 0;
        const isLast = i === dates.length - 1;
        map[d].push({
          ...event,
          _dayType: dates.length === 1 ? 'single' : isFirst ? 'start' : isLast ? 'end' : 'middle',
          _isFirst: isFirst,
          _isLast: isLast,
        });
      }
    }
  }
  return map;
}

/** Scroll to section with 80px offset for sticky navbar */
function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: 'smooth' });
}

function getSectionId(type) {
  if (type === 'FLIGHT') return 'flights-section';
  if (type === 'STAY') return 'stays-section';
  if (type === 'ACTIVITY') return 'activities-section';
  if (type === 'LAND_TRAVEL') return 'land-travels-section';
  return null;
}

/**
 * T-243: Convert a raw LAND_TRAVEL mode enum to a display label.
 * "RENTAL_CAR" → "Rental Car", "BUS" → "Bus", "TRAIN" → "Train"
 */
function formatLandTravelMode(rawMode) {
  if (!rawMode) return '';
  return rawMode
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * T-243: Build the pill label text for a LAND_TRAVEL event.
 *   - title format: "{MODE} — {from} → {to}"
 *   - pill format:  "{Mode} {dep_time}–{arr_time}" or "{Mode} {dep_time}" or "{Mode}"
 */
function buildLandTravelPillText(event) {
  // Extract raw mode from title (first segment before " — ")
  const rawMode = event.title ? event.title.split(' \u2014 ')[0] : '';
  const mode = formatLandTravelMode(rawMode) || 'Land Travel';

  const depTime = formatTime(event.start_time);
  const arrTime = formatTime(event.end_time);

  if (!depTime) return mode;
  if (!arrTime || event.start_time === event.end_time) return `${mode} ${depTime}`;
  return `${mode} ${depTime}\u2013${arrTime}`;
}

// ── Mobile Day List ───────────────────────────────────────────

function MobileDayList({ events, displayedMonth }) {
  const { year, month } = displayedMonth;
  // Filter events that have at least one day in the displayed month
  const daysWithEvents = useMemo(() => {
    const dayMap = {};
    for (const event of events) {
      // T-264: FLIGHT and LAND_TRAVEL now enumerate multi-day spans (same as STAY)
      if (event.type === 'ACTIVITY') {
        const [ey, em] = event.start_date.split('-').map(Number);
        if (ey === year && em - 1 === month) {
          if (!dayMap[event.start_date]) dayMap[event.start_date] = [];
          dayMap[event.start_date].push({ ...event, _mobileDayType: 'single' });
        }
      } else if (event.type === 'STAY' || event.type === 'FLIGHT' || event.type === 'LAND_TRAVEL') {
        const start = event.start_date;
        const end = event.end_date || event.start_date;
        const cur = new Date(start + 'T00:00:00');
        const endDate = new Date(end + 'T00:00:00');
        const dates = [];
        while (cur <= endDate) {
          dates.push(cur.toISOString().slice(0, 10));
          cur.setDate(cur.getDate() + 1);
        }
        for (let i = 0; i < dates.length; i++) {
          const d = dates[i];
          const [ey, em] = d.split('-').map(Number);
          if (ey === year && em - 1 === month) {
            if (!dayMap[d]) dayMap[d] = [];
            const isFirst = i === 0;
            const isLast = i === dates.length - 1;
            const mobileDayType = dates.length === 1 ? 'single' : isFirst ? 'start' : isLast ? 'end' : 'middle';
            dayMap[d].push({ ...event, _mobileDayType: mobileDayType });
          }
        }
      }
    }
    return Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b));
  }, [events, year, month]);

  if (daysWithEvents.length === 0) {
    return (
      <p className={styles.mobileNoEvents}>No events this month.</p>
    );
  }

  return (
    <div className={styles.mobileList}>
      {daysWithEvents.map(([dateStr, dayEvents]) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
        return (
          <div key={dateStr} className={styles.mobileDayEntry}>
            <div className={styles.mobileDayLabel}>{dayLabel}</div>
            <hr className={styles.mobileDaySep} aria-hidden="true" />
            {dayEvents.map((ev, i) => {
              const icon = ev.type === 'FLIGHT' ? '✈'
                : ev.type === 'STAY' ? '⌂'
                : ev.type === 'LAND_TRAVEL' ? '→'
                : '●';
              const sectionId = getSectionId(ev.type);
              const typeClass = ev.type === 'FLIGHT' ? styles.mobileEventFlight
                : ev.type === 'STAY' ? styles.mobileEventStay
                : ev.type === 'LAND_TRAVEL' ? styles.mobileEventLandTravel
                : styles.mobileEventActivity;

              // T-264: Build mobile display title and time based on day type
              const mdt = ev._mobileDayType || 'single';
              let timeStr;
              let displayTitle;
              let rowStyle = {};

              if (ev.type === 'LAND_TRAVEL') {
                const rawMode = ev.title ? ev.title.split(' \u2014 ')[0] : '';
                const mode = formatLandTravelMode(rawMode) || 'Land Travel';
                const isRentalCar = rawMode.toUpperCase() === 'RENTAL_CAR';
                if (mdt === 'start') {
                  timeStr = formatTime(ev.start_time);
                  displayTitle = mode;
                } else if (mdt === 'middle') {
                  timeStr = null;
                  displayTitle = `${mode} (cont.)`;
                  rowStyle = { opacity: 0.6 };
                } else if (mdt === 'end') {
                  const arrTime = formatTime(ev.end_time);
                  const prefix = isRentalCar ? 'Drop-off' : 'Arrives';
                  timeStr = null;
                  displayTitle = arrTime ? `${mode} — ${prefix} ${arrTime}` : `${mode} — ${prefix}`;
                } else {
                  // single
                  timeStr = formatTime(ev.start_time);
                  displayTitle = buildLandTravelPillText(ev);
                }
              } else if (ev.type === 'FLIGHT') {
                if (mdt === 'start') {
                  timeStr = formatTime(ev.start_time);
                  displayTitle = ev.title;
                } else if (mdt === 'middle') {
                  timeStr = null;
                  displayTitle = `${ev.title} (cont.)`;
                  rowStyle = { opacity: 0.6 };
                } else if (mdt === 'end') {
                  const arrTime = formatTime(ev.end_time);
                  timeStr = null;
                  displayTitle = arrTime ? `${ev.title} — Arrives ${arrTime}` : `${ev.title} — Arrives`;
                } else {
                  timeStr = formatTime(ev.start_time);
                  displayTitle = ev.title;
                }
              } else {
                timeStr = formatTime(ev.start_time);
                displayTitle = ev.title;
              }

              const ariaLabel = ev.type === 'LAND_TRAVEL'
                ? `Land travel: ${ev.title} — scroll to land travel section`
                : `${ev.type.charAt(0) + ev.type.slice(1).toLowerCase()}: ${ev.title}`;

              return (
                <button
                  key={i}
                  type="button"
                  className={`${styles.mobileEventRow} ${typeClass}`}
                  style={rowStyle}
                  aria-label={ariaLabel}
                  onClick={() => sectionId && scrollToSection(sectionId)}
                >
                  <span className={styles.mobileEventIcon}>{icon}</span>
                  {timeStr && <span className={styles.mobileEventTime}>{timeStr}</span>}
                  <span className={styles.mobileEventTitle}>{displayTitle}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function TripCalendar({ tripId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // T-273: Expanded day popover state
  const [expandedDay, setExpandedDay] = useState(null);
  const popoverRef = useRef(null);
  const triggerRefs = useRef({});
  const calendarPanelRef = useRef(null);

  const hasSetInitialMonth = useRef(false);
  const abortControllerRef = useRef(null);
  // Grid keyboard navigation: focused cell index
  const [focusedCellIndex, setFocusedCellIndex] = useState(null);
  const cellRefs = useRef([]);

  const fetchCalendar = useCallback(async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/trips/${tripId}/calendar`, {
        signal: controller.signal,
      });
      const calEvents = response.data?.data?.events || [];
      setEvents(calEvents);
      // Set initial month to first event's month (only once)
      if (!hasSetInitialMonth.current) {
        hasSetInitialMonth.current = true;
        setDisplayedMonth(getInitialMonth(calEvents));
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return; // ignore abort
      }
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchCalendar();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCalendar]);

  // Build events map
  const eventsMap = useMemo(() => buildEventsMap(events), [events]);

  // Build calendar grid for current month
  const { year, month } = displayedMonth;
  const calendarDays = useMemo(() => {
    const today = todayDateStr();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;
    const days = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(year, month, 1 - startPad + i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        dateStr,
        isOutsideMonth: d.getMonth() !== month,
        isToday: dateStr === today,
        dayOfMonth: d.getDate(),
      });
    }
    return days;
  }, [year, month]);

  // Reset cell refs array length
  useEffect(() => {
    cellRefs.current = cellRefs.current.slice(0, calendarDays.length);
  }, [calendarDays.length]);

  function prevMonth() {
    setDisplayedMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
    setFocusedCellIndex(null);
    setExpandedDay(null); // T-273: close popover on month nav
  }

  function nextMonth() {
    setDisplayedMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
    setFocusedCellIndex(null);
    setExpandedDay(null); // T-273: close popover on month nav
  }

  // Grid keyboard navigation handler
  function handleGridKeyDown(e, cellIndex) {
    const totalCells = calendarDays.length;
    let newIndex = null;
    if (e.key === 'ArrowLeft') {
      newIndex = Math.max(0, cellIndex - 1);
    } else if (e.key === 'ArrowRight') {
      newIndex = Math.min(totalCells - 1, cellIndex + 1);
    } else if (e.key === 'ArrowUp') {
      newIndex = Math.max(0, cellIndex - 7);
    } else if (e.key === 'ArrowDown') {
      newIndex = Math.min(totalCells - 1, cellIndex + 7);
    }
    if (newIndex !== null) {
      e.preventDefault();
      setFocusedCellIndex(newIndex);
      cellRefs.current[newIndex]?.focus();
    }
  }

  // T-273: Close popover on click-outside, Escape, and window resize
  useEffect(() => {
    if (!expandedDay) return;

    function handleMouseDown(e) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        triggerRefs.current[expandedDay] && !triggerRefs.current[expandedDay].contains(e.target)
      ) {
        setExpandedDay(null);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setExpandedDay(null);
        // Return focus to the trigger button
        triggerRefs.current[expandedDay]?.focus();
      }
    }

    function handleResize() {
      setExpandedDay(null);
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [expandedDay]);

  // T-273: Focus first pill inside popover when it opens
  useEffect(() => {
    if (expandedDay && popoverRef.current) {
      const firstPill = popoverRef.current.querySelector('button');
      if (firstPill) firstPill.focus();
    }
  }, [expandedDay]);

  // T-273: Compute popover position for expanded day
  function getPopoverPosition(dateStr, cellIndex) {
    const cellEl = cellRefs.current[cellIndex];
    const panelEl = calendarPanelRef.current;
    if (!cellEl || !panelEl) return { top: 0, left: 0, above: false };

    const cellRect = cellEl.getBoundingClientRect();
    const panelRect = panelEl.getBoundingClientRect();
    const totalCells = calendarDays.length;
    const isBottomRows = cellIndex >= totalCells - 14;

    // Position relative to the panel
    const left = cellRect.left - panelRect.left + cellRect.width / 2;
    let top;
    let above = false;
    if (isBottomRows) {
      // Anchor above the cell
      top = cellRect.top - panelRect.top;
      above = true;
    } else {
      // Anchor below the cell
      top = cellRect.bottom - panelRect.top;
      above = false;
    }
    return { top, left, above };
  }

  // T-273: Handle overflow trigger click
  function handleOverflowClick(dateStr, cellIndex) {
    if (expandedDay === dateStr) {
      setExpandedDay(null);
    } else {
      setExpandedDay(dateStr);
    }
  }

  // T-273: Render the overflow popover
  function renderOverflowPopover(dateStr, cellIndex) {
    if (expandedDay !== dateStr) return null;
    const allEvents = eventsMap[dateStr] || [];
    const { top, left, above } = getPopoverPosition(dateStr, cellIndex);

    const [dy, dm, dd] = dateStr.split('-').map(Number);
    const date = new Date(dy, dm - 1, dd);
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const shortLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

    const popoverStyle = {
      position: 'absolute',
      left: `${left}px`,
      zIndex: 10,
    };
    if (above) {
      popoverStyle.top = `${top}px`;
      popoverStyle.transform = 'translateX(-50%) translateY(-100%)';
    } else {
      popoverStyle.top = `${top}px`;
      popoverStyle.transform = 'translateX(-50%)';
    }

    return (
      <div
        ref={popoverRef}
        role="dialog"
        aria-label={`All events for ${dayLabel}`}
        aria-modal="false"
        className={`${styles.overflowPopover} ${above ? styles.overflowPopoverAbove : ''}`}
        style={popoverStyle}
      >
        <div className={styles.overflowPopoverHeader}>{shortLabel}</div>
        <hr className={styles.overflowPopoverSep} aria-hidden="true" />
        <div className={styles.overflowPopoverCount}>{allEvents.length} events</div>
        <div className={styles.overflowPopoverList}>
          {allEvents.map((ev, idx) => renderPopoverPill(ev, idx))}
        </div>
      </div>
    );
  }

  // T-273: Render event pill inside the popover (full border-radius, no clipping)
  function renderPopoverPill(event, idx) {
    const sectionId = getSectionId(event.type);
    const timeStr = formatTime(event.start_time);

    let pillClass = styles.eventPill;
    if (event.type === 'FLIGHT') pillClass += ` ${styles.eventPillFlight}`;
    else if (event.type === 'STAY') pillClass += ` ${styles.eventPillStay}`;
    else if (event.type === 'ACTIVITY') pillClass += ` ${styles.eventPillActivity}`;
    else if (event.type === 'LAND_TRAVEL') pillClass += ` ${styles.eventPillLandTravel}`;

    let displayText;
    if (event.type === 'LAND_TRAVEL') {
      displayText = buildLandTravelPillText(event);
    } else {
      displayText = timeStr ? `${timeStr} ${event.title}` : event.title;
    }

    const ariaLabel = event.type === 'LAND_TRAVEL'
      ? `Land travel: ${event.title}`
      : `${event.type.charAt(0) + event.type.slice(1).toLowerCase()}: ${event.title}`;

    return (
      <button
        key={idx}
        type="button"
        className={pillClass}
        style={{ borderRadius: 'var(--radius-sm)' }}
        aria-label={ariaLabel}
        onClick={() => sectionId && scrollToSection(sectionId)}
      >
        {displayText && <span className={styles.eventPillText}>{displayText}</span>}
      </button>
    );
  }

  // Render an event pill
  function renderEventPill(event, idx) {
    const sectionId = getSectionId(event.type);
    const timeStr = formatTime(event.start_time);
    const endTimeStr = formatTime(event.end_time);

    let pillClass = styles.eventPill;
    if (event.type === 'FLIGHT') pillClass += ` ${styles.eventPillFlight}`;
    else if (event.type === 'STAY') pillClass += ` ${styles.eventPillStay}`;
    else if (event.type === 'ACTIVITY') pillClass += ` ${styles.eventPillActivity}`;
    else if (event.type === 'LAND_TRAVEL') pillClass += ` ${styles.eventPillLandTravel}`;

    // T-264: Multi-day spanning pill styles for STAY, FLIGHT, and LAND_TRAVEL
    let pillStyle = {};
    const isSpannable = event.type === 'STAY' || event.type === 'FLIGHT' || event.type === 'LAND_TRAVEL';
    if (isSpannable) {
      if (event._dayType === 'start') {
        pillStyle = { borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)' };
      } else if (event._dayType === 'end') {
        pillStyle = { borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', borderLeft: 'none' };
      } else if (event._dayType === 'middle') {
        pillStyle = { borderRadius: 0, borderLeft: 'none', opacity: 0.8 };
      }
    }

    // T-264: Build arrival label for last day of multi-day FLIGHT or LAND_TRAVEL
    function buildArrivalLabel(ev) {
      const arrTime = formatTime(ev.end_time);
      if (ev.type === 'FLIGHT') {
        return arrTime ? `Arrives ${arrTime}` : 'Arrives';
      }
      if (ev.type === 'LAND_TRAVEL') {
        // Extract raw mode from title (first segment before " — ")
        const rawMode = ev.title ? ev.title.split(' \u2014 ')[0] : '';
        const isRentalCar = rawMode.toUpperCase() === 'RENTAL_CAR';
        const prefix = isRentalCar ? 'Drop-off' : 'Arrives';
        return arrTime ? `${prefix} ${arrTime}` : prefix;
      }
      return '';
    }

    // T-264: LAND_TRAVEL pills — handle multi-day and single-day
    if (event.type === 'LAND_TRAVEL') {
      let pillText;
      let ariaLabel;
      if (event._dayType === 'single') {
        pillText = buildLandTravelPillText(event);
        ariaLabel = `Land travel: ${event.title} — scroll to land travel section`;
      } else if (event._dayType === 'start') {
        const rawMode = event.title ? event.title.split(' \u2014 ')[0] : '';
        const mode = formatLandTravelMode(rawMode) || 'Land Travel';
        const depTime = formatTime(event.start_time);
        pillText = depTime ? `${mode} ${depTime}` : mode;
        ariaLabel = `Land travel: ${event.title}`;
      } else if (event._dayType === 'end') {
        pillText = buildArrivalLabel(event);
        ariaLabel = `Land travel: ${event.title}, ${pillText.toLowerCase()}`;
      } else {
        // middle — no text
        pillText = null;
        // Count total days for accessibility
        ariaLabel = `Land travel: ${event.title} (cont.)`;
      }
      return (
        <button
          key={idx}
          type="button"
          className={pillClass}
          style={pillStyle}
          aria-label={ariaLabel}
          role="button"
          tabIndex={0}
          onClick={() => document.getElementById('land-travels-section')?.scrollIntoView({ behavior: 'smooth' })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              document.getElementById('land-travels-section')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          {pillText && <span className={styles.eventPillText}>{pillText}</span>}
        </button>
      );
    }

    // T-264: FLIGHT pills — handle multi-day arrival label
    let displayText;
    let ariaLabel;
    if (event.type === 'FLIGHT' && event._dayType === 'end') {
      displayText = buildArrivalLabel(event);
      ariaLabel = `Flight: ${event.title}, ${displayText.toLowerCase()}`;
    } else if (event.type === 'FLIGHT' && event._dayType === 'middle') {
      displayText = null;
      ariaLabel = `Flight: ${event.title} (cont.)`;
    } else {
      // For STAY: only show text on first/single day
      const showText = event.type !== 'STAY' || event._isFirst || event._dayType === 'single';
      displayText = showText ? (timeStr ? `${timeStr} ${event.title}` : event.title) : null;
      ariaLabel = `${event.type.charAt(0) + event.type.slice(1).toLowerCase()}: ${event.title}${timeStr ? `, ${timeStr}${endTimeStr ? `–${endTimeStr}` : ''}` : ''}`;
    }

    return (
      <button
        key={idx}
        type="button"
        className={pillClass}
        style={pillStyle}
        aria-label={ariaLabel}
        onClick={() => sectionId && scrollToSection(sectionId)}
      >
        {displayText && (
          <span className={styles.eventPillText}>{displayText}</span>
        )}
      </button>
    );
  }

  return (
    <div
      ref={calendarPanelRef}
      className={styles.calendarPanel}
      role="region"
      aria-label="Trip calendar"
      aria-busy={loading ? 'true' : undefined}
      style={{ position: 'relative' }}
    >
      {/* Panel header: "CALENDAR" label + legend */}
      <div className={styles.panelHeader}>
        <span className={styles.panelLabel}>CALENDAR</span>
        <div className={styles.legend} role="group" aria-label="Calendar legend">
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotFlight}`} aria-hidden="true" />
            <span className={styles.legendText}>Flight</span>
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotStay}`} aria-hidden="true" />
            <span className={styles.legendText}>Stay</span>
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotActivity}`} aria-hidden="true" />
            <span className={styles.legendText}>Activity</span>
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotLandTravel}`} aria-hidden="true" />
            <span className={styles.legendText}>Land Travel</span>
          </span>
        </div>
      </div>
      <hr className={styles.panelDivider} aria-hidden="true" />

      {/* ── Loading State ── */}
      {loading && (
        <div className={styles.loadingArea} aria-label="Loading calendar…">
          <div className={styles.monthNav}>
            <button className={styles.navArrow} disabled aria-label="Previous month">←</button>
            <span className={styles.monthTitle}>— —</span>
            <button className={styles.navArrow} disabled aria-label="Next month">→</button>
          </div>
          <div className={styles.dowHeader}>
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className={styles.dowCell}>{d}</div>
            ))}
          </div>
          <div className={styles.grid} aria-hidden="true">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className={`${styles.dayCell} ${styles.dayCellSkeleton}`} />
            ))}
          </div>
        </div>
      )}

      {/* ── Error State ── */}
      {!loading && error && (
        <div className={styles.errorArea} role="alert">
          <span className={styles.errorTitle}>calendar unavailable</span>
          <p className={styles.errorMsg}>Could not load calendar data.</p>
          <button className={styles.retryBtn} onClick={fetchCalendar}>
            Try again
          </button>
        </div>
      )}

      {/* ── Success / Empty State ── */}
      {!loading && !error && (
        <>
          {/* Month navigation */}
          <div className={styles.monthNav}>
            <button className={styles.navArrow} onClick={prevMonth} aria-label="Previous month">
              ←
            </button>
            <span className={styles.monthTitle} aria-live="polite">
              {MONTHS[month].toUpperCase()} {year}
            </span>
            <button className={styles.navArrow} onClick={nextMonth} aria-label="Next month">
              →
            </button>
          </div>

          {/* Desktop grid (hidden on mobile via CSS) */}
          <div className={styles.desktopGrid}>
            {/* Day of week header */}
            <div className={styles.dowHeader} role="row">
              {DAYS_OF_WEEK.map((d) => (
                <div key={d} className={styles.dowCell} role="columnheader">
                  {d}
                </div>
              ))}
            </div>

            {/* Empty state overlay (when no events at all) */}
            {events.length === 0 && (
              <div
                className={styles.emptyMsg}
                aria-label="No events. Add flights, stays, or activities to populate the calendar."
              >
                Add flights, stays, or activities
                <br />
                to see them here.
              </div>
            )}

            {/* Calendar grid */}
            <div className={styles.grid} role="grid" aria-label={`${MONTHS[month]} ${year}`}>
              {calendarDays.map(({ dateStr, isOutsideMonth, isToday, dayOfMonth }, cellIndex) => {
                const dayEvents = eventsMap[dateStr] || [];
                const visible = isOutsideMonth ? [] : dayEvents.slice(0, 3);
                const overflow = isOutsideMonth ? 0 : dayEvents.length - 3;
                const [dy, dm, dd] = dateStr.split('-').map(Number);
                const dayName = new Date(dy, dm - 1, dd).toLocaleDateString('en-US', { weekday: 'long' });
                const fullDayLabel = `${dayName}, ${MONTHS[dm - 1]} ${dd}, ${dy}`;
                const isFocused = focusedCellIndex === cellIndex;

                return (
                  <div
                    key={dateStr}
                    ref={(el) => { cellRefs.current[cellIndex] = el; }}
                    role="gridcell"
                    tabIndex={isFocused ? 0 : -1}
                    className={`${styles.dayCell} ${isOutsideMonth ? styles.dayCellOutside : ''}`}
                    aria-label={fullDayLabel}
                    aria-current={isToday ? 'date' : undefined}
                    onFocus={() => setFocusedCellIndex(cellIndex)}
                    onKeyDown={(e) => handleGridKeyDown(e, cellIndex)}
                  >
                    <div className={`${styles.dayNumber} ${isToday ? styles.dayNumberToday : ''} ${isOutsideMonth ? styles.dayNumberOutside : ''}`}>
                      {dayOfMonth}
                    </div>
                    <div className={styles.eventsArea}>
                      {visible.map((ev, idx) => renderEventPill(ev, idx))}
                      {overflow > 0 && (
                        <button
                          type="button"
                          ref={(el) => { triggerRefs.current[dateStr] = el; }}
                          className={styles.overflowTrigger}
                          aria-expanded={expandedDay === dateStr ? 'true' : 'false'}
                          aria-haspopup="dialog"
                          aria-label={`Show all ${dayEvents.length} events for ${fullDayLabel}`}
                          onClick={() => handleOverflowClick(dateStr, cellIndex)}
                        >
                          +{overflow} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* T-273: Overflow popover — rendered outside the grid to avoid overflow:hidden clipping */}
          {expandedDay && (() => {
            const cellIndex = calendarDays.findIndex(d => d.dateStr === expandedDay);
            if (cellIndex < 0) return null;
            return renderOverflowPopover(expandedDay, cellIndex);
          })()}

          {/* Mobile day list (hidden on desktop via CSS) */}
          <div className={styles.mobileView}>
            <MobileDayList events={events} displayedMonth={displayedMonth} />
          </div>
        </>
      )}
    </div>
  );
}
