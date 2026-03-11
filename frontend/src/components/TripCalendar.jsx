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

/** Build a map: dateStr → array of event objects (with _dayType metadata for STAY) */
function buildEventsMap(events) {
  const map = {};
  for (const event of events) {
    if (event.type === 'FLIGHT' || event.type === 'ACTIVITY') {
      const d = event.start_date;
      if (!map[d]) map[d] = [];
      map[d].push({ ...event, _dayType: 'single' });
    } else if (event.type === 'STAY') {
      const start = event.start_date;
      const end = event.end_date || event.start_date;
      // Enumerate all dates in the stay range
      const dates = [];
      const cur = new Date(start + 'T00:00:00');
      const endDate = new Date(end + 'T00:00:00');
      while (cur <= endDate) {
        dates.push(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 1);
      }
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
  return null;
}

// ── Mobile Day List ───────────────────────────────────────────

function MobileDayList({ events, displayedMonth }) {
  const { year, month } = displayedMonth;
  // Filter events that have at least one day in the displayed month
  const daysWithEvents = useMemo(() => {
    const dayMap = {};
    for (const event of events) {
      if (event.type === 'FLIGHT' || event.type === 'ACTIVITY') {
        const [ey, em] = event.start_date.split('-').map(Number);
        if (ey === year && em - 1 === month) {
          if (!dayMap[event.start_date]) dayMap[event.start_date] = [];
          dayMap[event.start_date].push(event);
        }
      } else if (event.type === 'STAY') {
        // Add stay to each day in this month it spans
        const start = event.start_date;
        const end = event.end_date || event.start_date;
        const cur = new Date(start + 'T00:00:00');
        const endDate = new Date(end + 'T00:00:00');
        while (cur <= endDate) {
          const [ey, em] = cur.toISOString().slice(0, 10).split('-').map(Number);
          if (ey === year && em - 1 === month) {
            const d = cur.toISOString().slice(0, 10);
            if (!dayMap[d]) dayMap[d] = [];
            dayMap[d].push(event);
          }
          cur.setDate(cur.getDate() + 1);
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
              const icon = ev.type === 'FLIGHT' ? '✈' : ev.type === 'STAY' ? '⌂' : '●';
              const timeStr = formatTime(ev.start_time);
              const sectionId = getSectionId(ev.type);
              const typeClass = ev.type === 'FLIGHT' ? styles.mobileEventFlight
                : ev.type === 'STAY' ? styles.mobileEventStay
                : styles.mobileEventActivity;
              return (
                <div
                  key={i}
                  className={`${styles.mobileEventRow} ${typeClass}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${ev.type.charAt(0) + ev.type.slice(1).toLowerCase()}: ${ev.title}`}
                  onClick={() => sectionId && scrollToSection(sectionId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      sectionId && scrollToSection(sectionId);
                    }
                  }}
                >
                  <span className={styles.mobileEventIcon}>{icon}</span>
                  {timeStr && <span className={styles.mobileEventTime}>{timeStr}</span>}
                  <span className={styles.mobileEventTitle}>{ev.title}</span>
                </div>
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
  }

  function nextMonth() {
    setDisplayedMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
    setFocusedCellIndex(null);
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

  // Render an event pill
  function renderEventPill(event, idx) {
    const sectionId = getSectionId(event.type);
    const timeStr = formatTime(event.start_time);
    const endTimeStr = formatTime(event.end_time);

    let pillClass = styles.eventPill;
    if (event.type === 'FLIGHT') pillClass += ` ${styles.eventPillFlight}`;
    else if (event.type === 'STAY') pillClass += ` ${styles.eventPillStay}`;
    else if (event.type === 'ACTIVITY') pillClass += ` ${styles.eventPillActivity}`;

    // Stay pill border-radius based on position
    let pillStyle = {};
    if (event.type === 'STAY') {
      if (event._dayType === 'start') {
        pillStyle = { borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)' };
      } else if (event._dayType === 'end') {
        pillStyle = { borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', borderLeft: 'none' };
      } else if (event._dayType === 'middle') {
        pillStyle = { borderRadius: 0, borderLeft: 'none' };
      }
    }

    const ariaLabel = `${event.type.charAt(0) + event.type.slice(1).toLowerCase()}: ${event.title}${timeStr ? `, ${timeStr}${endTimeStr ? `–${endTimeStr}` : ''}` : ''}`;
    // For STAY: only show text on first/single day
    const showText = event.type !== 'STAY' || event._isFirst || event._dayType === 'single';
    const displayText = showText ? (timeStr ? `${timeStr} ${event.title}` : event.title) : null;

    return (
      <div
        key={idx}
        className={pillClass}
        style={pillStyle}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={() => sectionId && scrollToSection(sectionId)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            sectionId && scrollToSection(sectionId);
          }
        }}
      >
        {displayText && (
          <span className={styles.eventPillText}>{displayText}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={styles.calendarPanel}
      role="region"
      aria-label="Trip calendar"
      aria-busy={loading ? 'true' : undefined}
    >
      {/* Panel header: "CALENDAR" label + legend */}
      <div className={styles.panelHeader}>
        <span className={styles.panelLabel}>CALENDAR</span>
        <div className={styles.legend} aria-hidden="true">
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotFlight}`} />
            <span className={styles.legendText}>Flight</span>
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotStay}`} />
            <span className={styles.legendText}>Stay</span>
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotActivity}`} />
            <span className={styles.legendText}>Activity</span>
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
                const cellLabel = `${dayName}, ${MONTHS[dm - 1]} ${dd}, ${dy}`;
                const isFocused = focusedCellIndex === cellIndex;

                return (
                  <div
                    key={dateStr}
                    ref={(el) => { cellRefs.current[cellIndex] = el; }}
                    role="gridcell"
                    tabIndex={isFocused ? 0 : -1}
                    className={`${styles.dayCell} ${isOutsideMonth ? styles.dayCellOutside : ''}`}
                    aria-label={cellLabel}
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
                        <span className={styles.overflowLabel}>+{overflow} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile day list (hidden on desktop via CSS) */}
          <div className={styles.mobileView}>
            <MobileDayList events={events} displayedMonth={displayedMonth} />
          </div>
        </>
      )}
    </div>
  );
}
