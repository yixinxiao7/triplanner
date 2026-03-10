import { useRef, useCallback } from 'react';
import styles from './StatusFilterTabs.module.css';

/**
 * Filter pill definitions — label displayed in UI, value passed to onFilterChange.
 * Order matches Spec 21: All, Planning, Ongoing, Completed.
 */
const FILTERS = [
  { value: 'ALL',       label: 'All'       },
  { value: 'PLANNING',  label: 'Planning'  },
  { value: 'ONGOING',   label: 'Ongoing'   },
  { value: 'COMPLETED', label: 'Completed' },
];

/**
 * StatusFilterTabs — row of filter pills for client-side trip status filtering.
 *
 * Implements Spec 21 (Sprint 24):
 * - Four pills: All / Planning / Ongoing / Completed
 * - Active pill is visually distinct (filled accent bg, full-opacity border, bright text)
 * - Inactive pills are transparent with subtle border and muted text
 * - Roving tabIndex: only the active pill has tabIndex=0; others have tabIndex=-1
 * - ArrowLeft / ArrowRight move focus between pills (wrapping)
 * - Space / Enter activate the focused pill (native button behavior)
 * - role="group" + aria-label on container; aria-pressed on each pill
 * - Mobile: horizontal scroll, no wrap
 *
 * @param {Object}   props
 * @param {string}   props.activeFilter   — currently active filter value ("ALL" | "PLANNING" | "ONGOING" | "COMPLETED")
 * @param {Function} props.onFilterChange — callback: (filterValue: string) => void
 */
export default function StatusFilterTabs({ activeFilter, onFilterChange }) {
  /** Refs array so arrow-key focus movement can call .focus() programmatically. */
  const pillRefs = useRef([]);

  /**
   * Arrow key handler — implements roving tabIndex keyboard navigation.
   * ArrowRight: move focus to next pill (wraps last → first).
   * ArrowLeft:  move focus to previous pill (wraps first → last).
   */
  const handleKeyDown = useCallback((e, index) => {
    const count = FILTERS.length;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % count;
      pillRefs.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + count) % count;
      pillRefs.current[prevIndex]?.focus();
    }
    // Space / Enter: native <button> click event handles activation — no extra handler needed.
  }, []);

  return (
    <div
      role="group"
      aria-label="Filter trips by status"
      className={styles.container}
    >
      {FILTERS.map((filter, index) => {
        const isActive = activeFilter === filter.value;
        return (
          <button
            key={filter.value}
            ref={(el) => { pillRefs.current[index] = el; }}
            type="button"
            className={`${styles.pill} ${isActive ? styles.pillActive : styles.pillInactive}`}
            aria-pressed={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onFilterChange(filter.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
