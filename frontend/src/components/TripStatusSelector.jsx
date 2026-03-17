import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import styles from './TripStatusSelector.module.css';

// ── Constants ────────────────────────────────────────────────

const VALID_STATUSES = ['PLANNING', 'ONGOING', 'COMPLETED'];

/**
 * Color configuration for each status value.
 * Matches Design System §20.4 and StatusBadge.module.css exactly.
 */
const STATUS_CONFIG = {
  PLANNING: {
    bg: 'rgba(93, 115, 126, 0.2)',
    hoverBg: 'rgba(93, 115, 126, 0.3)',
    text: '#5D737E',
  },
  ONGOING: {
    bg: 'rgba(100, 180, 100, 0.15)',
    hoverBg: 'rgba(100, 180, 100, 0.25)',
    text: 'rgba(100, 200, 100, 0.9)',
  },
  COMPLETED: {
    bg: 'rgba(252, 252, 252, 0.1)',
    hoverBg: 'rgba(252, 252, 252, 0.18)',
    text: 'rgba(252, 252, 252, 0.5)',
  },
};

// Fallback for unknown status values — use COMPLETED style (muted/faded)
function getConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.COMPLETED;
}

// ── TripStatusSelector ────────────────────────────────────────

/**
 * TripStatusSelector — interactive inline status badge for TripDetailsPage.
 *
 * In view mode renders a clickable pill badge (identical to read-only StatusBadge)
 * with a chevron affordance. Clicking opens a dropdown listbox to change the trip
 * status. Fires PATCH /api/v1/trips/:id and calls onStatusChange on success.
 *
 * Props:
 *   tripId         — UUID of the trip (used in the PATCH call)
 *   initialStatus  — Current trip status; synced via useEffect when prop changes
 *   onStatusChange — Callback (newStatus: string) invoked after a successful PATCH
 *
 * States: view (idle) → dropdown open → loading (optimistic) → error (toast + revert)
 */
export default function TripStatusSelector({ tripId, initialStatus, onStatusChange }) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const containerRef = useRef(null);
  const badgeRef = useRef(null);
  const optionRefs = useRef([]);

  // ── Sync initialStatus prop → internal state (parent re-fetch) ──
  // Per spec §20.14: only re-sync when not currently saving (loading).
  useEffect(() => {
    if (!isLoading) {
      setCurrentStatus(initialStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatus]);

  // ── Auto-dismiss error toast after 4 seconds ─────────────────
  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  // ── Outside-click dismissal (mousedown on document) ──────────
  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  // ── Focus first/selected option when dropdown opens ──────────
  useEffect(() => {
    if (!isOpen) return;
    const selectedIdx = VALID_STATUSES.indexOf(currentStatus);
    const focusIdx = selectedIdx >= 0 ? selectedIdx : 0;
    const timer = setTimeout(() => {
      optionRefs.current[focusIdx]?.focus();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Handlers ─────────────────────────────────────────────────

  function openDropdown() {
    if (isLoading) return;
    setIsOpen(true);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function handleSelect(newStatus) {
    closeDropdown();

    // No-op: same status selected (spec §20.14)
    if (newStatus === currentStatus) return;

    const previousStatus = currentStatus;

    // Optimistic update — show new status immediately
    setCurrentStatus(newStatus);
    setIsLoading(true);

    try {
      // T-239: read the API response and use the confirmed status value.
      // After the T-238 backend fix, the response status always matches what
      // was sent — but reading it explicitly ensures the UI reflects the
      // backend's authoritative value.
      const res = await api.trips.update(tripId, { status: newStatus });
      const confirmedStatus = res?.data?.data?.status ?? newStatus;
      setCurrentStatus(confirmedStatus);
      onStatusChange(confirmedStatus);
    } catch {
      // Revert on failure and show error toast
      setCurrentStatus(previousStatus);
      setErrorMsg('Failed to update trip status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Keyboard: badge button ────────────────────────────────────
  function handleBadgeKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ' ') && !isOpen) {
      e.preventDefault();
      openDropdown();
    }
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeDropdown();
      badgeRef.current?.focus();
    }
  }

  // ── Keyboard: dropdown option ─────────────────────────────────
  function handleOptionKeyDown(e, status, index) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(status);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
      badgeRef.current?.focus();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = Math.min(index + 1, VALID_STATUSES.length - 1);
      optionRefs.current[nextIdx]?.focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = Math.max(index - 1, 0);
      optionRefs.current[prevIdx]?.focus();
    }
  }

  // ── Derived values ────────────────────────────────────────────
  const config = getConfig(currentStatus);
  const ariaLabel = isLoading
    ? `Trip status: ${currentStatus} (saving…)`
    : `Trip status: ${currentStatus}`;

  return (
    <>
      {/* Selector wrapper — position: relative anchor for dropdown */}
      <div ref={containerRef} className={styles.container} role="none">

        {/* Badge button — view mode and loading mode */}
        <button
          ref={badgeRef}
          className={styles.badge}
          style={{
            background: config.bg,
            color: config.text,
            opacity: isLoading ? 0.7 : 1,
            pointerEvents: isLoading ? 'none' : 'auto',
          }}
          onClick={openDropdown}
          onKeyDown={handleBadgeKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel}
          aria-busy={isLoading || undefined}
          type="button"
        >
          {/* Indicator dot — inherits color via currentColor */}
          <span className={styles.dot} aria-hidden="true" />

          {/* Status label */}
          <span className={styles.statusText}>{currentStatus}</span>

          {/* Chevron (idle) or spinner (loading) */}
          {isLoading ? (
            <span className={styles.spinner} aria-hidden="true" />
          ) : (
            <span className={styles.chevron} aria-hidden="true">▾</span>
          )}
        </button>

        {/* Dropdown listbox */}
        {isOpen && (
          <ul
            className={styles.dropdown}
            role="listbox"
            aria-label="Trip status"
          >
            {VALID_STATUSES.map((status, index) => {
              const optConfig = getConfig(status);
              const isSelected = status === currentStatus;
              return (
                <li
                  key={status}
                  ref={(el) => { optionRefs.current[index] = el; }}
                  className={styles.option}
                  style={{
                    color: optConfig.text,
                    cursor: isSelected ? 'default' : 'pointer',
                  }}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onClick={() => handleSelect(status)}
                  onKeyDown={(e) => handleOptionKeyDown(e, status, index)}
                >
                  {/* Option indicator dot */}
                  <span className={styles.optionDot} aria-hidden="true" />
                  <span className={styles.optionText}>{status}</span>
                  {/* Checkmark for currently selected option */}
                  {isSelected && (
                    <span className={styles.checkmark} aria-hidden="true">✓</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Error toast — bottom-right, role="alert" for screen readers, 4s auto-dismiss */}
      {errorMsg && (
        <div className={styles.toastContainer}>
          <div className={styles.toast} role="alert">
            {errorMsg}
          </div>
        </div>
      )}
    </>
  );
}
