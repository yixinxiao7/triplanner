import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TripCard, { TripCardSkeleton } from '../components/TripCard';
import CreateTripModal from '../components/CreateTripModal';
import FilterToolbar from '../components/FilterToolbar';
import EmptySearchResults from '../components/EmptySearchResults';
import Toast from '../components/Toast';
import { useTrips } from '../hooks/useTrips';
import styles from './HomePage.module.css';

/** Default sort value — matches Sprint 1–4 behavior (newest first). */
const DEFAULT_SORT = 'created_at:desc';

/** Valid status values for the status filter. */
const VALID_STATUSES = ['PLANNING', 'ONGOING', 'COMPLETED'];

/** Valid sort values for the sort selector. */
const VALID_SORTS = [
  'created_at:desc', 'created_at:asc',
  'name:asc', 'name:desc',
  'start_date:asc', 'start_date:desc',
];

/**
 * Parse and validate URL search params into filter state.
 * Invalid values are silently replaced with defaults.
 */
function parseUrlParams(searchParams) {
  const search = searchParams.get('search') || '';
  const statusParam = searchParams.get('status') || '';
  const status = VALID_STATUSES.includes(statusParam) ? statusParam : '';
  const sortParam = searchParams.get('sort') || '';
  const sort = VALID_SORTS.includes(sortParam) ? sortParam : DEFAULT_SORT;
  return { search, status, sort };
}

/**
 * Split a combined sort value ("field:direction") into API params.
 */
function splitSort(sortValue) {
  const [sort_by, sort_order] = sortValue.split(':');
  return { sort_by, sort_order };
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { trips, isLoading, error, totalCount, fetchTrips, createTrip, deleteTrip } = useTrips();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const createTripBtnRef = useRef(null);

  // Track whether the initial load has completed (to know if we have any trips at all)
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  // Track whether we ever had trips (distinguishes "no trips in DB" from "no search results")
  const [hasTripsBefore, setHasTripsBefore] = useState(false);

  // Initialize filter state from URL params
  const initialFilters = useMemo(() => parseUrlParams(searchParams), []);
  const [search, setSearch] = useState(initialFilters.search);
  const [status, setStatus] = useState(initialFilters.status);
  const [sort, setSort] = useState(initialFilters.sort);

  // Determine if any filter is non-default
  const hasActiveFilters = search !== '' || status !== '' || sort !== DEFAULT_SORT;

  // Build API params from current filter state
  const buildApiParams = useCallback(() => {
    const { sort_by, sort_order } = splitSort(sort);
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (sort_by !== 'created_at' || sort_order !== 'desc') {
      params.sort_by = sort_by;
      params.sort_order = sort_order;
    }
    return params;
  }, [search, status, sort]);

  // Sync URL params whenever filters change (use replaceState, not pushState)
  useEffect(() => {
    const newParams = {};
    if (search) newParams.search = search;
    if (status) newParams.status = status;
    if (sort !== DEFAULT_SORT) newParams.sort = sort;

    setSearchParams(newParams, { replace: true });
  }, [search, status, sort, setSearchParams]);

  // Fetch trips whenever filter state changes
  useEffect(() => {
    const params = buildApiParams();
    fetchTrips(params).then(() => {
      if (!initialLoadDone) {
        setInitialLoadDone(true);
      }
    });
  }, [search, status, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track if user ever had trips (to distinguish empty DB vs empty search results)
  useEffect(() => {
    if (trips.length > 0) {
      setHasTripsBefore(true);
    }
  }, [trips]);

  // Also detect from totalCount on unfiltered load
  useEffect(() => {
    if (!hasActiveFilters && totalCount > 0) {
      setHasTripsBefore(true);
    }
  }, [totalCount, hasActiveFilters]);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
  }, []);

  const handleStatusChange = useCallback((value) => {
    setStatus(value);
  }, []);

  const handleSortChange = useCallback((value) => {
    setSort(value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setStatus('');
    setSort(DEFAULT_SORT);
  }, []);

  function openModal() {
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  async function handleCreateTrip(formData) {
    const newTrip = await createTrip(formData);
    // Navigate directly to the new trip's detail page
    navigate(`/trips/${newTrip.id}`);
  }

  async function handleDeleteTrip(tripId) {
    try {
      await deleteTrip(tripId);
    } catch {
      setToast('could not delete trip. please try again.');
      throw new Error('delete failed'); // Re-throw so TripCard can restore itself
    }
  }

  const handleRetry = useCallback(() => {
    const params = buildApiParams();
    fetchTrips(params);
  }, [buildApiParams, fetchTrips]);

  // Determine which content to render
  const showToolbar = initialLoadDone && !isLoading && (hasTripsBefore || trips.length > 0);
  const isEmptyDatabase = initialLoadDone && !isLoading && !error && trips.length === 0 && !hasActiveFilters && !hasTripsBefore;
  const isEmptySearchResults = initialLoadDone && !isLoading && !error && trips.length === 0 && (hasActiveFilters || hasTripsBefore);

  // Determine "showing X trips" text
  const showResultCount = !isLoading && !error && trips.length > 0 && (search !== '' || status !== '');
  const resultCountText = totalCount === 1 ? 'showing 1 trip' : `showing ${totalCount} trips`;

  return (
    <>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>my trips</h1>
            <button
              ref={createTripBtnRef}
              className={styles.newTripBtn}
              onClick={openModal}
            >
              + new trip
            </button>
          </div>

          {/* Filter Toolbar — shown when user has ≥1 trip */}
          {showToolbar && (
            <FilterToolbar
              search={search}
              status={status}
              sort={sort}
              onSearchChange={handleSearchChange}
              onStatusChange={handleStatusChange}
              onSortChange={handleSortChange}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          )}

          {/* Result Count — shown when search or status filter is active */}
          {showResultCount && (
            <p
              className={styles.resultCount}
              aria-live="polite"
              role="status"
            >
              {resultCountText}
            </p>
          )}

          {/* Content Area */}
          {isLoading && !initialLoadDone ? (
            /* Initial loading — skeleton cards (no toolbar shown yet) */
            <div className={styles.grid}>
              <TripCardSkeleton />
              <TripCardSkeleton />
              <TripCardSkeleton />
            </div>
          ) : error ? (
            /* Error state */
            <div className={styles.errorState} role="status">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M16 9v8M16 21v1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <p className={styles.errorTitle}>could not load trips.</p>
              <p className={styles.errorSubtext}>check your connection and try again.</p>
              <button
                className={styles.retryBtn}
                onClick={handleRetry}
              >
                try again
              </button>
            </div>
          ) : isEmptyDatabase ? (
            /* Empty state — no trips in database */
            <div className={styles.emptyState}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
                style={{ color: 'var(--accent)', opacity: 0.4 }}
              >
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M24 12v12M24 30l4-4M24 30l-4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="24" cy="24" r="3" fill="currentColor" />
              </svg>
              <h2 className={styles.emptyTitle}>no trips yet</h2>
              <p className={styles.emptySubtext}>start planning your first adventure.</p>
              <button
                ref={createTripBtnRef}
                className={styles.newTripBtn}
                onClick={openModal}
              >
                + plan your first trip
              </button>
            </div>
          ) : isEmptySearchResults ? (
            /* Empty search results — trips exist but none match filters */
            <EmptySearchResults
              search={search}
              status={status}
              onClearFilters={handleClearFilters}
            />
          ) : (
            /* Trip grid — with loading opacity when refetching */
            <div
              className={styles.grid}
              style={isLoading ? { opacity: 0.5, transition: 'opacity 200ms ease' } : { transition: 'opacity 200ms ease' }}
            >
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onDelete={handleDeleteTrip}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleCreateTrip}
        triggerRef={createTripBtnRef}
      />

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}
