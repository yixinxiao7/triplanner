import styles from './EmptySearchResults.module.css';

/**
 * EmptySearchResults — shown when API returns 0 results for active filter combination.
 * Distinct from the "no trips yet" empty state (Spec 2.4) which appears when user has zero trips.
 *
 * @param {Object} props
 * @param {string} props.search - Current search text
 * @param {string} props.status - Current status filter value
 * @param {Function} props.onClearFilters - Called to reset all filters
 */
export default function EmptySearchResults({ search, status, onClearFilters }) {
  // Build dynamic subtext based on active filters
  let subtext = 'no trips found';
  const statusLabel = status ? status.toLowerCase() : '';
  const truncatedSearch = search && search.length > 30
    ? search.substring(0, 30) + '\u2026'
    : search;

  if (search && status) {
    subtext = `no ${statusLabel} trips match \u201c${truncatedSearch}\u201d`;
  } else if (search) {
    subtext = `no trips match \u201c${truncatedSearch}\u201d`;
  } else if (status) {
    subtext = `no ${statusLabel} trips`;
  }

  return (
    <div className={styles.container}>
      {/* Search icon with question mark */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className={styles.icon}
      >
        <circle cx="17" cy="17" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M24 24L34 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14.5 14C15 12.5 16.5 11.5 18 12C19.5 12.5 20 14 19.5 15.5C19 16.5 17.5 17 17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="17" cy="21" r="0.75" fill="currentColor" />
      </svg>

      <h2 className={styles.heading}>no trips found</h2>
      <p className={styles.subtext}>{subtext}</p>

      <button
        type="button"
        className={styles.clearBtn}
        onClick={onClearFilters}
        aria-label="Clear all filters"
      >
        clear filters
      </button>
    </div>
  );
}
