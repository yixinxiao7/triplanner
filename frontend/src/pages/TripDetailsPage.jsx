import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useTripDetails } from '../hooks/useTripDetails';
import { formatDateTime, formatTimezoneAbbr, formatActivityDate, formatTime } from '../utils/formatDate';
import styles from './TripDetailsPage.module.css';

// ── Section Header Component ─────────────────────────────────
function SectionHeader({ title, actionLabel }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <hr className={styles.sectionLine} aria-hidden="true" />
      <button
        className={styles.sectionActionBtn}
        disabled
        aria-disabled="true"
        title="Editing coming in Sprint 2"
      >
        {actionLabel}
      </button>
    </div>
  );
}

// ── Empty State (dashed border) ──────────────────────────────
function EmptyState({ icon, text, subtext }) {
  return (
    <div className={styles.emptyState} role="status">
      <span className={styles.emptyIcon} aria-hidden="true">
        {icon}
      </span>
      <p className={styles.emptyText}>{text}</p>
      <p className={styles.emptySubtext}>{subtext}</p>
    </div>
  );
}

// ── Section Error State ──────────────────────────────────────
function SectionError({ resourceName, onRetry }) {
  return (
    <div className={styles.sectionError} role="status">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 7v6M12 16v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className={styles.sectionErrorText}>
        could not load {resourceName}.
      </span>
      <button className={styles.retryLink} onClick={onRetry}>
        try again
      </button>
    </div>
  );
}

// ── Skeleton Shimmer Bar ─────────────────────────────────────
function SkeletonBar({ width, height }) {
  return (
    <span
      className="skeleton"
      style={{ display: 'block', width, height, borderRadius: '2px' }}
    />
  );
}

// ── Flight Card ──────────────────────────────────────────────
function FlightCard({ flight }) {
  const depDisplay = formatDateTime(flight.departure_at, flight.departure_tz);
  const arrDisplay = formatDateTime(flight.arrival_at, flight.arrival_tz);
  const depTz = formatTimezoneAbbr(flight.departure_at, flight.departure_tz);
  const arrTz = formatTimezoneAbbr(flight.arrival_at, flight.arrival_tz);

  return (
    <article
      className={styles.flightCard}
      aria-label={`Flight ${flight.flight_number}: ${flight.from_location} to ${flight.to_location}`}
    >
      <div className={styles.flightColumns}>
        {/* Departure */}
        <div className={styles.flightCol}>
          <div className={styles.airportCode}>{flight.from_location}</div>
          <div className={styles.flightDateTime}>
            {depDisplay}{depTz ? ` ${depTz}` : ''}
          </div>
        </div>

        {/* Center — airline + flight number */}
        <div className={styles.flightCenter}>
          <div className={styles.airlineName}>{flight.airline}</div>
          <div className={styles.flightNumber}>{flight.flight_number}</div>
          <div className={styles.flightArrow} aria-hidden="true">→</div>
        </div>

        {/* Arrival */}
        <div className={`${styles.flightCol} ${styles.flightColRight}`}>
          <div className={styles.airportCode}>{flight.to_location}</div>
          <div className={styles.flightDateTime}>
            {arrDisplay}{arrTz ? ` ${arrTz}` : ''}
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Stay Card ────────────────────────────────────────────────
function StayCard({ stay }) {
  const checkInDisplay = formatDateTime(stay.check_in_at, stay.check_in_tz);
  const checkOutDisplay = formatDateTime(stay.check_out_at, stay.check_out_tz);

  return (
    <article
      className={styles.stayCard}
      aria-label={`Stay: ${stay.name}`}
    >
      {/* Top row: name + category badge */}
      <div className={styles.stayTopRow}>
        <div className={styles.stayName}>{stay.name}</div>
        <span className={styles.categoryBadge}>{stay.category}</span>
      </div>

      {/* Address */}
      <div className={styles.stayAddress}>
        {stay.address ? (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M6 1a3.5 3.5 0 013.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 016 1z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <circle cx="6" cy="4.5" r="1" fill="currentColor" />
            </svg>
            {stay.address}
          </>
        ) : (
          <span style={{ color: 'rgba(252,252,252,0.3)' }}>address not provided</span>
        )}
      </div>

      {/* Dates */}
      <div className={styles.stayDates}>
        <div className={styles.stayDateBlock}>
          <div className={styles.stayDateLabel}>CHECK IN</div>
          <div className={styles.stayDateValue}>{checkInDisplay}</div>
        </div>
        <div className={styles.stayDateBlock}>
          <div className={styles.stayDateLabel}>CHECK OUT</div>
          <div className={styles.stayDateValue}>{checkOutDisplay}</div>
        </div>
      </div>
    </article>
  );
}

// ── Activity Entry ───────────────────────────────────────────
function ActivityEntry({ activity }) {
  const startDisplay = formatTime(activity.start_time);
  const endDisplay = formatTime(activity.end_time);

  return (
    <article
      className={styles.activityEntry}
      aria-label={`${activity.name}, ${startDisplay} to ${endDisplay}`}
    >
      {/* Time column */}
      <div className={styles.activityTime}>
        <div className={styles.activityStartTime}>{startDisplay}</div>
        <div className={styles.activityEndTime}>→ {endDisplay}</div>
      </div>

      {/* Vertical divider */}
      <div className={styles.activityDivider} aria-hidden="true" />

      {/* Details */}
      <div className={styles.activityDetails}>
        <div className={styles.activityName}>{activity.name}</div>
        {activity.location && (
          <div className={styles.activityLocation}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M5 .833A2.917 2.917 0 017.917 3.75C7.917 6.25 5 9.167 5 9.167S2.083 6.25 2.083 3.75A2.917 2.917 0 015 .833z"
                stroke="currentColor"
                strokeWidth="1"
              />
              <circle cx="5" cy="3.75" r=".833" fill="currentColor" />
            </svg>
            {activity.location}
          </div>
        )}
      </div>
    </article>
  );
}

// ── Activity Day Group ───────────────────────────────────────
function ActivityDayGroup({ date, activities }) {
  const dateDisplay = formatActivityDate(date);
  const sortedActivities = [...activities].sort((a, b) => {
    if (a.start_time < b.start_time) return -1;
    if (a.start_time > b.start_time) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <section
      className={styles.dayGroup}
      aria-label={`Activities for ${dateDisplay}`}
    >
      <div className={styles.dayHeader}>
        <span className={styles.dayDate}>{dateDisplay.toUpperCase()}</span>
        <hr className={styles.dayLine} aria-hidden="true" />
      </div>
      <div className={styles.activityList}>
        {sortedActivities.map((activity) => (
          <ActivityEntry key={activity.id} activity={activity} />
        ))}
      </div>
    </section>
  );
}

// ── Main Page Component ──────────────────────────────────────
export default function TripDetailsPage() {
  const { id: tripId } = useParams();
  const {
    trip,
    tripLoading,
    tripError,
    flights,
    flightsLoading,
    flightsError,
    stays,
    staysLoading,
    staysError,
    activities,
    activitiesLoading,
    activitiesError,
    fetchAll,
    refetchFlights,
    refetchStays,
    refetchActivities,
  } = useTripDetails(tripId);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Format destinations for display: array → dot-separated string
  function formatDestinations(raw) {
    if (!raw) return '';
    if (Array.isArray(raw)) return raw.join(' · ');
    // Comma-separated string → dot-separated
    return raw.split(',').map((d) => d.trim()).join(' · ');
  }

  // Group activities by date
  const activitiesByDate = activities.reduce((acc, activity) => {
    const date = activity.activity_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {});
  const sortedDates = Object.keys(activitiesByDate).sort();

  // ── Trip Load Error ──────────────────────────────────────
  if (!tripLoading && tripError) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.tripErrorState}>
              <h1 className={styles.tripErrorTitle}>
                {tripError.type === 'not_found'
                  ? 'trip not found.'
                  : 'could not load trip.'}
              </h1>
              <p className={styles.tripErrorSubtext}>
                {tripError.type === 'not_found'
                  ? "this trip doesn't exist or you don't have access to it."
                  : 'check your connection and try again.'}
              </p>
              <Link to="/" className={styles.backToHomeBtn}>
                back to home
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>

          {/* ── Page Header ── */}
          <div className={styles.pageHeader}>
            <Link
              to="/"
              className={styles.backLink}
              aria-label="Back to my trips"
            >
              ← my trips
            </Link>

            {tripLoading ? (
              <>
                <SkeletonBar width="80px" height="11px" />
                <div style={{ marginBottom: 8 }}>
                  <SkeletonBar width="200px" height="28px" />
                </div>
                <SkeletonBar width="150px" height="13px" />
              </>
            ) : (
              <>
                <h1 className={styles.tripName}>{trip?.name}</h1>
                {trip?.destinations && (
                  <p className={styles.destinations}>
                    {formatDestinations(trip.destinations)}
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── Calendar Placeholder ── */}
          <div className={styles.calendarPlaceholder}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
              style={{ color: 'var(--accent)', opacity: 0.4 }}
            >
              <rect x="2" y="4" width="28" height="25" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 11h28M10 2v4M22 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="6" y="15" width="4" height="4" rx="0.5" fill="currentColor" />
              <rect x="14" y="15" width="4" height="4" rx="0.5" fill="currentColor" />
              <rect x="22" y="15" width="4" height="4" rx="0.5" fill="currentColor" />
              <rect x="6" y="23" width="4" height="4" rx="0.5" fill="currentColor" />
              <rect x="14" y="23" width="4" height="4" rx="0.5" fill="currentColor" />
            </svg>
            <p className={styles.calendarText}>calendar coming in sprint 2</p>
            <p className={styles.calendarSubtext}>
              flights, stays, and activities will appear here once the calendar is built.
            </p>
          </div>

          {/* ── Flights Section ── */}
          <section className={styles.section}>
            <SectionHeader title="flights" actionLabel="add flight" />

            {flightsLoading ? (
              <SkeletonBar width="100%" height="80px" />
            ) : flightsError ? (
              <SectionError resourceName="flights" onRetry={refetchFlights} />
            ) : flights.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: 'var(--accent)', opacity: 0.3 }}>
                    <path
                      d="M4 17l2-8 8 3 5-9 2 1-4 8 4 2-1 2-4-2-2 4-2-1 1-4-8-3 1-2z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                text="no flights added yet."
                subtext="add your flight details to see them here."
              />
            ) : (
              <div className={styles.cardList}>
                {flights.map((flight) => (
                  <FlightCard key={flight.id} flight={flight} />
                ))}
              </div>
            )}
          </section>

          {/* ── Stays Section ── */}
          <section className={styles.section}>
            <SectionHeader title="stays" actionLabel="add stay" />

            {staysLoading ? (
              <SkeletonBar width="100%" height="80px" />
            ) : staysError ? (
              <SectionError resourceName="stays" onRetry={refetchStays} />
            ) : stays.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: 'var(--accent)', opacity: 0.3 }}>
                    <rect x="2" y="12" width="24" height="14" rx="1" stroke="currentColor" strokeWidth="1.2" />
                    <path
                      d="M2 16h24M6 16v10M22 16v10M8 12V8a6 6 0 0112 0v4"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
                text="no stays added yet."
                subtext="add your accommodation details to see them here."
              />
            ) : (
              <div className={styles.cardList}>
                {stays.map((stay) => (
                  <StayCard key={stay.id} stay={stay} />
                ))}
              </div>
            )}
          </section>

          {/* ── Activities Section ── */}
          <section className={`${styles.section} ${styles.sectionLast}`}>
            <SectionHeader title="activities" actionLabel="add activities" />

            {activitiesLoading ? (
              <div>
                <SkeletonBar width="150px" height="12px" />
                <div style={{ marginTop: 12 }}>
                  <SkeletonBar width="100%" height="52px" />
                </div>
                <div style={{ marginTop: 8 }}>
                  <SkeletonBar width="100%" height="52px" />
                </div>
              </div>
            ) : activitiesError ? (
              <SectionError resourceName="activities" onRetry={refetchActivities} />
            ) : activities.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: 'var(--accent)', opacity: 0.3 }}>
                    <rect x="2" y="3" width="24" height="22" rx="2" stroke="currentColor" strokeWidth="1.2" />
                    <path
                      d="M2 9h24M8 2v4M20 2v4M7 14h6M7 19h10"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
                text="no activities planned yet."
                subtext="add your daily itinerary to see it here, grouped by day."
              />
            ) : (
              <div className={styles.activityGroups}>
                {sortedDates.map((date) => (
                  <ActivityDayGroup
                    key={date}
                    date={date}
                    activities={activitiesByDate[date]}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </>
  );
}
