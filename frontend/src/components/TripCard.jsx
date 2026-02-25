import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import styles from './TripCard.module.css';

/**
 * Format trip date range from start_date / end_date (Sprint 2 T-029 + T-034).
 * Returns formatted string or null if no dates.
 */
function formatTripDateRange(startDate, endDate) {
  if (!startDate && !endDate) return null;

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function parseDate(dateStr) {
    // Parse YYYY-MM-DD as local date (not UTC)
    const [y, m, d] = dateStr.split('-').map(Number);
    return { year: y, month: m - 1, day: d };
  }

  if (startDate && endDate) {
    const s = parseDate(startDate);
    const e = parseDate(endDate);
    if (s.year === e.year) {
      // Same year: "Aug 7 – Aug 14, 2026"
      return `${MONTHS[s.month]} ${s.day} – ${MONTHS[e.month]} ${e.day}, ${s.year}`;
    } else {
      // Different years
      return `${MONTHS[s.month]} ${s.day}, ${s.year} – ${MONTHS[e.month]} ${e.day}, ${e.year}`;
    }
  }

  if (startDate && !endDate) {
    const s = parseDate(startDate);
    return `From ${MONTHS[s.month]} ${s.day}, ${s.year}`;
  }

  return null;
}

/**
 * TripCard — displays a single trip as a clickable card.
 * Includes inline delete confirmation flow.
 */
export default function TripCard({ trip, onDelete }) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Format destinations for display
  const destinationsDisplay = Array.isArray(trip.destinations)
    ? trip.destinations.join(', ')
    : trip.destinations || '';

  // Format date range from trip.start_date / trip.end_date (Sprint 2 T-029)
  const dateRange = formatTripDateRange(trip.start_date, trip.end_date);

  function handleCardClick(e) {
    if (confirmDelete) return; // Don't navigate if in confirmation state
    navigate(`/trips/${trip.id}`);
  }

  function handleDeleteClick(e) {
    e.stopPropagation(); // Prevent card navigation
    setConfirmDelete(true);
  }

  function handleCancelDelete(e) {
    e.stopPropagation();
    setConfirmDelete(false);
  }

  async function handleConfirmDelete(e) {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(trip.id);
      // Animate fade out
      setIsFading(true);
    } catch {
      // Restore card on error — parent handles the toast
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div
      className={`${styles.card} ${isFading ? styles.cardFading : ''}`}
      onClick={handleCardClick}
      role="article"
      aria-label={`Trip: ${trip.name}`}
      tabIndex={confirmDelete ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !confirmDelete) handleCardClick(e);
      }}
    >
      {confirmDelete ? (
        /* ── Inline Delete Confirmation ── */
        <div className={styles.deleteConfirm} onClick={(e) => e.stopPropagation()}>
          <p className={styles.deleteText}>delete this trip?</p>
          <div className={styles.deleteActions}>
            <button
              className={styles.deleteDangerBtn}
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <span className="spinner" /> : 'yes, delete'}
            </button>
            <button
              className={styles.deleteCancelBtn}
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        /* ── Normal Card Content ── */
        <>
          {/* Top row: badge + delete button */}
          <div className={styles.topRow}>
            <StatusBadge status={trip.status} />
            <button
              className={styles.deleteBtn}
              onClick={handleDeleteClick}
              aria-label={`Delete trip: ${trip.name}`}
              title="Delete trip"
            >
              {/* Trash icon SVG */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 4h12M5.333 4V2.667A1.333 1.333 0 016.667 1.333h2.666A1.333 1.333 0 0110.667 2.667V4m2 0l-.667 9.333A1.333 1.333 0 0110.667 14.667H5.333A1.333 1.333 0 014 13.333L3.333 4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Trip name */}
          <h2 className={styles.tripName}>{trip.name}</h2>

          {/* Destinations */}
          {destinationsDisplay && (
            <p className={styles.destinations}>
              <span aria-hidden="true">🗺 </span>
              {destinationsDisplay}
            </p>
          )}

          {/* Divider */}
          <hr className={styles.divider} />

          {/* Timeline row */}
          <div className={styles.timeline}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="1"
                y="2"
                width="10"
                height="9"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M1 5h10M4 1v2M8 1v2"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            {dateRange ? (
              <span>{dateRange}</span>
            ) : (
              <span className={styles.datesNotSet}>dates not set</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * TripCard skeleton for loading state.
 */
export function TripCardSkeleton() {
  return (
    <div className={`${styles.card} ${styles.cardSkeleton}`}>
      <div className={styles.topRow}>
        <span className={`skeleton ${styles.skeletonBadge}`} />
      </div>
      <span className={`skeleton ${styles.skeletonName}`} />
      <span className={`skeleton ${styles.skeletonDestinations}`} />
      <hr className={styles.divider} />
      <span className={`skeleton ${styles.skeletonTimeline}`} />
    </div>
  );
}
