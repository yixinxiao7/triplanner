import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './FilterToolbar.module.css';

/**
 * SORT_OPTIONS — combined sort_by + sort_order options for the sort dropdown.
 * Values use "field:direction" format; split client-side before sending to API.
 */
const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'newest first' },
  { value: 'created_at:asc', label: 'oldest first' },
  { value: 'name:asc', label: 'name A \u2014 Z' },
  { value: 'name:desc', label: 'name Z \u2014 A' },
  { value: 'start_date:asc', label: 'soonest trip first' },
  { value: 'start_date:desc', label: 'latest trip first' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'all statuses' },
  { value: 'PLANNING', label: 'planning' },
  { value: 'ONGOING', label: 'ongoing' },
  { value: 'COMPLETED', label: 'completed' },
];

const DEFAULT_SORT = 'created_at:desc';

/**
 * FilterToolbar — search, status filter, sort selector, and clear filters.
 *
 * @param {Object} props
 * @param {string} props.search - Current search text
 * @param {string} props.status - Current status filter value
 * @param {string} props.sort - Current sort value ("field:direction")
 * @param {Function} props.onSearchChange - Called with new search string (debounced internally)
 * @param {Function} props.onStatusChange - Called with new status value
 * @param {Function} props.onSortChange - Called with new sort value
 * @param {Function} props.onClearFilters - Called to reset all filters
 * @param {boolean} props.hasActiveFilters - Whether any filter is non-default
 */
export default function FilterToolbar({
  search,
  status,
  sort,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
}) {
  const [inputValue, setInputValue] = useState(search);
  const debounceRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync inputValue with external search prop (e.g., when filters are cleared)
  useEffect(() => {
    setInputValue(search);
  }, [search]);

  const handleSearchInput = useCallback((e) => {
    const value = e.target.value;
    setInputValue(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = value.trim();
    if (trimmed === '') {
      // Immediate clear — no debounce
      onSearchChange('');
    } else {
      debounceRef.current = setTimeout(() => {
        onSearchChange(trimmed);
      }, 300);
    }
  }, [onSearchChange]);

  const handleClearSearch = useCallback(() => {
    setInputValue('');
    onSearchChange('');
    searchInputRef.current?.focus();
  }, [onSearchChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClearSearch();
    }
  }, [handleClearSearch]);

  const handleStatusSelect = useCallback((e) => {
    onStatusChange(e.target.value);
  }, [onStatusChange]);

  const handleSortSelect = useCallback((e) => {
    onSortChange(e.target.value);
  }, [onSortChange]);

  const handleClearAll = useCallback(() => {
    onClearFilters();
    searchInputRef.current?.focus();
  }, [onClearFilters]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div role="search" aria-label="Filter trips" className={styles.toolbar}>
      {/* Search Input */}
      <div className={styles.searchContainer}>
        {/* Magnifying glass icon */}
        <svg
          className={styles.searchIcon}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <input
          ref={searchInputRef}
          type="search"
          className={styles.searchInput}
          placeholder="search trips..."
          value={inputValue}
          onChange={handleSearchInput}
          onKeyDown={handleKeyDown}
          aria-label="Search trips by name or destination"
          aria-describedby="search-hint"
          autoComplete="off"
        />

        {/* Clear button — visible only when input has text */}
        {inputValue && (
          <button
            type="button"
            className={styles.clearSearchBtn}
            onClick={handleClearSearch}
            aria-label="Clear search"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <span id="search-hint" className={styles.srOnly}>results update as you type</span>
      </div>

      {/* Status Filter */}
      <select
        className={styles.statusFilter}
        value={status}
        onChange={handleStatusSelect}
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Sort Selector */}
      <select
        className={styles.sortSelector}
        value={sort}
        onChange={handleSortSelect}
        aria-label="Sort trips"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          type="button"
          className={styles.clearFiltersBtn}
          onClick={handleClearAll}
          aria-label="Clear all filters and sorting"
        >
          clear filters
        </button>
      )}
    </div>
  );
}
