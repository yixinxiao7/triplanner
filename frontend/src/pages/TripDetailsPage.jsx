import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DestinationChipInput from '../components/DestinationChipInput';
import { useTripDetails } from '../hooks/useTripDetails';
import { formatDateTime, formatTimezoneAbbr, formatActivityDate, formatTime, formatTripDateRange } from '../utils/formatDate';
import TripCalendar from '../components/TripCalendar';
import { api } from '../utils/api';
import styles from './TripDetailsPage.module.css';

// ── Small Calendar Icon ───────────────────────────────────────
function CalendarIconSmall() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      style={{ color: 'var(--text-muted)', flexShrink: 0 }}
    >
      <rect x="1" y="2" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 5h10M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ── Section Header Component ─────────────────────────────────
function SectionHeader({ title, actionLabel, actionHref }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <hr className={styles.sectionLine} aria-hidden="true" />
      {actionHref ? (
        <Link to={actionHref} className={styles.sectionActionLink}>
          {actionLabel}
        </Link>
      ) : (
        <button
          className={styles.sectionActionBtn}
          disabled
          aria-disabled="true"
          title="Editing coming soon"
        >
          {actionLabel}
        </button>
      )}
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
        <div className={styles.flightCol}>
          <div className={styles.airportCode}>{flight.from_location}</div>
          <div className={styles.flightDateTime}>
            {depDisplay}{depTz ? ` ${depTz}` : ''}
          </div>
        </div>
        <div className={styles.flightCenter}>
          <div className={styles.airlineName}>{flight.airline}</div>
          <div className={styles.flightNumber}>{flight.flight_number}</div>
          <div className={styles.flightArrow} aria-hidden="true">&rarr;</div>
        </div>
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
    <article className={styles.stayCard} aria-label={`Stay: ${stay.name}`}>
      <div className={styles.stayTopRow}>
        <div className={styles.stayName}>{stay.name}</div>
        <span className={styles.categoryBadge}>{stay.category}</span>
      </div>
      <div className={styles.stayAddress}>
        {stay.address ? (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1a3.5 3.5 0 013.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 016 1z" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="6" cy="4.5" r="1" fill="currentColor" />
            </svg>
            {stay.address}
          </>
        ) : (
          <span style={{ color: 'rgba(252,252,252,0.3)' }}>address not provided</span>
        )}
      </div>
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

// ── Activity Entry (supports "all day" timeless activities) ──
function ActivityEntry({ activity }) {
  const isAllDay = !activity.start_time && !activity.end_time;
  const startDisplay = formatTime(activity.start_time);
  const endDisplay = formatTime(activity.end_time);

  return (
    <article
      className={styles.activityEntry}
      aria-label={isAllDay ? `${activity.name}, all day` : `${activity.name}, ${startDisplay} to ${endDisplay}`}
    >
      {/* Time column */}
      <div className={styles.activityTime}>
        {isAllDay ? (
          <span className={styles.allDayBadge}>all day</span>
        ) : (
          <>
            <div className={styles.activityStartTime}>{startDisplay}</div>
            <div className={styles.activityEndTime}>&rarr; {endDisplay}</div>
          </>
        )}
      </div>

      {/* Vertical divider */}
      <div className={styles.activityDivider} aria-hidden="true" />

      {/* Details */}
      <div className={styles.activityDetails}>
        <div className={styles.activityName}>{activity.name}</div>
        {activity.location && (
          <div className={styles.activityLocation}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M5 .833A2.917 2.917 0 017.917 3.75C7.917 6.25 5 9.167 5 9.167S2.083 6.25 2.083 3.75A2.917 2.917 0 015 .833z" stroke="currentColor" strokeWidth="1" />
              <circle cx="5" cy="3.75" r=".833" fill="currentColor" />
            </svg>
            {activity.location}
          </div>
        )}
      </div>
    </article>
  );
}

// ── Activity Day Group (timeless activities sort after timed) ─
function ActivityDayGroup({ date, activities }) {
  const dateDisplay = formatActivityDate(date);
  const sortedActivities = [...activities].sort((a, b) => {
    // Timed activities first, then timeless; within same group sort by start_time/name
    const aIsAllDay = !a.start_time && !a.end_time;
    const bIsAllDay = !b.start_time && !b.end_time;
    if (aIsAllDay && !bIsAllDay) return 1;
    if (!aIsAllDay && bIsAllDay) return -1;
    if (aIsAllDay && bIsAllDay) return a.name.localeCompare(b.name);
    // Both timed
    if ((a.start_time || '') < (b.start_time || '')) return -1;
    if ((a.start_time || '') > (b.start_time || '')) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <section className={styles.dayGroup} aria-label={`Activities for ${dateDisplay}`}>
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

  // ── Trip Date Range State ─────────────────────────────────
  const [dateMode, setDateMode] = useState('loading');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [dateError, setDateError] = useState('');
  const [dateSaving, setDateSaving] = useState(false);
  const [savedStartDate, setSavedStartDate] = useState(null);
  const [savedEndDate, setSavedEndDate] = useState(null);

  // ── Editable Destinations State (Sprint 3 T-046) ──────────
  const [destMode, setDestMode] = useState('display'); // 'display' | 'edit'
  const [editDestinations, setEditDestinations] = useState([]);
  const [destSaving, setDestSaving] = useState(false);
  const [destError, setDestError] = useState('');
  const [savedDestinations, setSavedDestinations] = useState([]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Initialize date mode from trip data
  useEffect(() => {
    if (!tripLoading && trip && dateMode === 'loading') {
      const s = trip.start_date || null;
      const e = trip.end_date || null;
      setSavedStartDate(s);
      setSavedEndDate(e);
      if (s || e) {
        setStartDateInput(s || '');
        setEndDateInput(e || '');
        setDateMode('display');
      } else {
        setDateMode('null');
      }
    }
  }, [trip, tripLoading, dateMode]);

  // Initialize destinations from trip data
  useEffect(() => {
    if (!tripLoading && trip) {
      const dests = Array.isArray(trip.destinations)
        ? trip.destinations
        : trip.destinations
          ? trip.destinations.split(',').map((d) => d.trim()).filter(Boolean)
          : [];
      setSavedDestinations(dests);
    }
  }, [trip, tripLoading]);

  // ── Date range handlers ───────────────────────────────────
  async function handleSaveDates() {
    setDateError('');
    if (!startDateInput && !endDateInput) {
      setDateError('both start and end dates are required');
      return;
    }
    if (startDateInput && !endDateInput) {
      setDateError('both start and end dates are required');
      return;
    }
    if (!startDateInput && endDateInput) {
      setDateError('start date is required when setting an end date');
      return;
    }
    if (startDateInput > endDateInput) {
      setDateError('end date must be on or after start date');
      return;
    }
    setDateSaving(true);
    try {
      await api.trips.update(tripId, { start_date: startDateInput, end_date: endDateInput });
      setSavedStartDate(startDateInput);
      setSavedEndDate(endDateInput);
      setDateMode('display');
    } catch {
      setDateError('failed to save dates. please try again.');
    } finally {
      setDateSaving(false);
    }
  }

  async function handleClearDates() {
    setDateSaving(true);
    try {
      await api.trips.update(tripId, { start_date: null, end_date: null });
      setSavedStartDate(null);
      setSavedEndDate(null);
      setStartDateInput('');
      setEndDateInput('');
      setDateMode('null');
    } catch {
      setDateError('failed to clear dates. please try again.');
    } finally {
      setDateSaving(false);
    }
  }

  // ── Destination edit handlers ─────────────────────────────
  function handleEditDestinations() {
    setEditDestinations([...savedDestinations]);
    setDestError('');
    setDestMode('edit');
  }

  function handleCancelDestEdit() {
    setDestMode('display');
    setDestError('');
  }

  async function handleSaveDestinations() {
    setDestError('');
    if (editDestinations.length === 0) {
      setDestError('at least one destination is required');
      return;
    }
    // Skip API call if nothing changed
    const unchanged = editDestinations.length === savedDestinations.length &&
      editDestinations.every((d, i) => d === savedDestinations[i]);
    if (unchanged) {
      setDestMode('display');
      return;
    }
    setDestSaving(true);
    try {
      await api.trips.update(tripId, { destinations: editDestinations });
      setSavedDestinations([...editDestinations]);
      setDestMode('display');
    } catch {
      setDestError('could not save destinations. please try again.');
    } finally {
      setDestSaving(false);
    }
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
            <Link to="/" className={styles.backLink} aria-label="Back to my trips">
              &larr; my trips
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

                {/* ── Destinations (editable chips — Sprint 3 T-046) ── */}
                {destMode === 'display' && (
                  <div className={styles.destinationsRow}>
                    {savedDestinations.map((dest, i) => (
                      <span key={`${dest}-${i}`} className={styles.destChipReadonly}>
                        {dest}
                      </span>
                    ))}
                    <button
                      className={styles.editDestLink}
                      onClick={handleEditDestinations}
                      aria-label="Edit destinations"
                    >
                      edit
                    </button>
                  </div>
                )}

                {destMode === 'edit' && (
                  <div className={styles.destEditContainer} role="region" aria-label="Edit trip destinations">
                    <label className={styles.destEditLabel}>DESTINATIONS</label>
                    <DestinationChipInput
                      destinations={editDestinations}
                      onChange={setEditDestinations}
                      disabled={destSaving}
                      error={destError || null}
                      autoFocus
                    />
                    <span className={styles.destEditHint}>
                      press enter or comma to add &middot; backspace to remove last
                    </span>
                    <div className={styles.destEditActions}>
                      <button
                        className={styles.saveDatesBtn}
                        onClick={handleSaveDestinations}
                        disabled={destSaving}
                        aria-label="Save destination changes"
                      >
                        {destSaving ? <span className="spinner" /> : 'Save'}
                      </button>
                      <button
                        className={styles.cancelDatesLink}
                        onClick={handleCancelDestEdit}
                        disabled={destSaving}
                        aria-label="Cancel destination editing"
                      >
                        Cancel
                      </button>
                    </div>
                    {destError && (
                      <span className={styles.dateError} role="alert">{destError}</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Trip Date Range Section ── */}
          {!tripLoading && dateMode !== 'loading' && (
            <div className={styles.dateRangeSection}>
              {dateMode === 'null' && (
                <div className={styles.dateRangeNull}>
                  <CalendarIconSmall />
                  <span className={styles.dateRangeNullText}>trip dates not set</span>
                  <button
                    className={styles.setDatesLink}
                    onClick={() => setDateMode('edit')}
                    aria-label="Set trip dates"
                  >
                    set dates
                  </button>
                </div>
              )}

              {dateMode === 'edit' && (
                <div className={styles.dateRangeEdit}>
                  <div className={styles.dateRangeInputRow}>
                    <div className={styles.dateInputGroup}>
                      <label htmlFor="trip-start-date" className={styles.dateInputLabel}>
                        TRIP START
                      </label>
                      <input
                        id="trip-start-date"
                        type="date"
                        value={startDateInput}
                        onChange={(e) => { setStartDateInput(e.target.value); setDateError(''); }}
                        className={`${styles.dateInput} ${dateError ? styles.dateInputError : ''}`}
                        disabled={dateSaving}
                        aria-describedby={dateError ? 'date-range-error' : undefined}
                      />
                    </div>
                    <div className={styles.dateInputGroup}>
                      <label htmlFor="trip-end-date" className={styles.dateInputLabel}>
                        TRIP END
                      </label>
                      <input
                        id="trip-end-date"
                        type="date"
                        value={endDateInput}
                        onChange={(e) => { setEndDateInput(e.target.value); setDateError(''); }}
                        className={`${styles.dateInput} ${dateError ? styles.dateInputError : ''}`}
                        disabled={dateSaving}
                        aria-describedby={dateError ? 'date-range-error' : undefined}
                      />
                    </div>
                    <div className={styles.dateRangeActions}>
                      <button className={styles.saveDatesBtn} onClick={handleSaveDates} disabled={dateSaving} aria-label="Save trip dates">
                        {dateSaving ? <span className="spinner" /> : 'Save'}
                      </button>
                      <button className={styles.clearDatesBtn} onClick={handleClearDates} disabled={dateSaving} aria-label="Clear trip dates">
                        Clear dates
                      </button>
                      <button
                        className={styles.cancelDatesLink}
                        onClick={() => {
                          setDateError('');
                          setStartDateInput(savedStartDate || '');
                          setEndDateInput(savedEndDate || '');
                          setDateMode(savedStartDate || savedEndDate ? 'display' : 'null');
                        }}
                        disabled={dateSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  {dateError && (
                    <span id="date-range-error" className={styles.dateError} role="alert">
                      {dateError}
                    </span>
                  )}
                </div>
              )}

              {dateMode === 'display' && (
                <div className={styles.dateRangeDisplay}>
                  <CalendarIconSmall />
                  <span className={styles.dateRangeText}>
                    {formatTripDateRange(savedStartDate, savedEndDate)}
                  </span>
                  <button
                    className={styles.editDatesLink}
                    onClick={() => {
                      setStartDateInput(savedStartDate || '');
                      setEndDateInput(savedEndDate || '');
                      setDateMode('edit');
                    }}
                    aria-label="Edit trip dates"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Calendar ── */}
          <div className={styles.calendarWrapper}>
            <TripCalendar
              trip={trip || {}}
              flights={flights}
              stays={stays}
              activities={activities}
              isLoading={flightsLoading || staysLoading || activitiesLoading}
            />
          </div>

          {/* ── Flights Section ── */}
          <section className={styles.section}>
            <SectionHeader title="flights" actionLabel="edit flights" actionHref={`/trips/${tripId}/edit/flights`} />
            {flightsLoading ? (
              <SkeletonBar width="100%" height="80px" />
            ) : flightsError ? (
              <SectionError resourceName="flights" onRetry={refetchFlights} />
            ) : flights.length === 0 ? (
              <EmptyState
                icon={<svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: 'var(--accent)', opacity: 0.3 }}><path d="M4 17l2-8 8 3 5-9 2 1-4 8 4 2-1 2-4-2-2 4-2-1 1-4-8-3 1-2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>}
                text="no flights added yet."
                subtext="add your flight details to see them here."
              />
            ) : (
              <div className={styles.cardList}>
                {flights.map((flight) => <FlightCard key={flight.id} flight={flight} />)}
              </div>
            )}
          </section>

          {/* ── Stays Section ── */}
          <section className={styles.section}>
            <SectionHeader title="stays" actionLabel="edit stays" actionHref={`/trips/${tripId}/edit/stays`} />
            {staysLoading ? (
              <SkeletonBar width="100%" height="80px" />
            ) : staysError ? (
              <SectionError resourceName="stays" onRetry={refetchStays} />
            ) : stays.length === 0 ? (
              <EmptyState
                icon={<svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: 'var(--accent)', opacity: 0.3 }}><rect x="2" y="12" width="24" height="14" rx="1" stroke="currentColor" strokeWidth="1.2" /><path d="M2 16h24M6 16v10M22 16v10M8 12V8a6 6 0 0112 0v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>}
                text="no stays added yet."
                subtext="add your accommodation details to see them here."
              />
            ) : (
              <div className={styles.cardList}>
                {stays.map((stay) => <StayCard key={stay.id} stay={stay} />)}
              </div>
            )}
          </section>

          {/* ── Activities Section ── */}
          <section className={`${styles.section} ${styles.sectionLast}`}>
            <SectionHeader title="activities" actionLabel="edit activities" actionHref={`/trips/${tripId}/edit/activities`} />
            {activitiesLoading ? (
              <div>
                <SkeletonBar width="150px" height="12px" />
                <div style={{ marginTop: 12 }}><SkeletonBar width="100%" height="52px" /></div>
                <div style={{ marginTop: 8 }}><SkeletonBar width="100%" height="52px" /></div>
              </div>
            ) : activitiesError ? (
              <SectionError resourceName="activities" onRetry={refetchActivities} />
            ) : activities.length === 0 ? (
              <EmptyState
                icon={<svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: 'var(--accent)', opacity: 0.3 }}><rect x="2" y="3" width="24" height="22" rx="2" stroke="currentColor" strokeWidth="1.2" /><path d="M2 9h24M8 2v4M20 2v4M7 14h6M7 19h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>}
                text="no activities planned yet."
                subtext="add your daily itinerary to see it here, grouped by day."
              />
            ) : (
              <div className={styles.activityGroups}>
                {sortedDates.map((date) => (
                  <ActivityDayGroup key={date} date={date} activities={activitiesByDate[date]} />
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </>
  );
}
