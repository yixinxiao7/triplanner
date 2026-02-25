import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../utils/api';
import { TIMEZONES } from '../utils/timezones';
import { formatDateTime, formatTimezoneAbbr } from '../utils/formatDate';
import styles from './FlightsEditPage.module.css';

// ── Helpers ─────────────────────────────────────────────────

/**
 * Format an ISO UTC datetime string for a datetime-local input: "YYYY-MM-DDTHH:MM"
 * We use the stored UTC time directly (it represents local wall-clock time at the location).
 */
function toDatetimeLocal(isoString) {
  if (!isoString) return '';
  // Strip timezone info and seconds: "2026-08-07T10:00:00.000Z" → "2026-08-07T10:00"
  return isoString.replace('Z', '').replace(/\.\d{3}$/, '').slice(0, 16);
}

// ── Toast Component ─────────────────────────────────────────
function Toast({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={styles.toast} role="alert" aria-live="polite">
      {message}
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────
function EmptyFlightsList() {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyText}>no flights added yet.</p>
      <p className={styles.emptySubtext}>use the form below to add your first flight.</p>
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────
function FlightCardSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <span className={`skeleton ${styles.skeletonLine}`} style={{ width: '60%', height: '16px' }} />
      <span className={`skeleton ${styles.skeletonLine}`} style={{ width: '40%', height: '13px', marginTop: '8px' }} />
    </div>
  );
}

// ── Flight List Card ────────────────────────────────────────
function FlightListCard({ flight, onEdit, onDelete, isEditing }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const depDisplay = formatDateTime(flight.departure_at, flight.departure_tz);
  const arrDisplay = formatDateTime(flight.arrival_at, flight.arrival_tz);
  const depTz = formatTimezoneAbbr(flight.departure_at, flight.departure_tz);
  const arrTz = formatTimezoneAbbr(flight.arrival_at, flight.arrival_tz);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await onDelete(flight.id);
    } catch {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div
      className={`${styles.flightCard} ${isEditing ? styles.flightCardEditing : ''} ${confirmDelete ? styles.flightCardConfirm : ''}`}
      data-testid="flight-card"
    >
      {confirmDelete ? (
        <div className={styles.deleteConfirmRow}>
          <span className={styles.deleteConfirmText}>delete this flight?</span>
          <div className={styles.deleteConfirmActions}>
            <button
              className={styles.deleteDangerBtn}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'yes, delete'}
            </button>
            <button
              className={styles.deleteCancelBtn}
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.flightInfo}>
            <div className={styles.flightTopRow}>
              <span className={styles.airlineName}>{flight.airline}</span>
              <span className={styles.dot} aria-hidden="true">·</span>
              <span className={styles.flightNumber}>{flight.flight_number}</span>
            </div>
            <div className={styles.flightRoute}>
              <span className={styles.routeLocation}>{flight.from_location}</span>
              <span className={styles.routeArrow} aria-hidden="true">→</span>
              <span className={styles.routeLocation}>{flight.to_location}</span>
            </div>
          </div>

          <div className={styles.flightDatetimes}>
            <div className={styles.datetimeRow}>
              {depDisplay}{depTz ? ` ${depTz}` : ''}
            </div>
            <div className={styles.datetimeRow} style={{ marginTop: 4 }}>
              {arrDisplay}{arrTz ? ` ${arrTz}` : ''}
            </div>
          </div>

          <div className={styles.cardActions}>
            <button
              className={styles.iconBtn}
              onClick={() => onEdit(flight)}
              aria-label={`Edit flight ${flight.flight_number}`}
              title="Edit flight"
            >
              {/* Pencil icon */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M11.333 2a1.886 1.886 0 112.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
              onClick={() => setConfirmDelete(true)}
              aria-label={`Delete flight ${flight.flight_number}`}
              title="Delete flight"
            >
              {/* Trash icon */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
        </>
      )}
    </div>
  );
}

// ── Main Form ────────────────────────────────────────────────
function FlightForm({ tripId, editFlight, onSaved, onCancelEdit }) {
  const isEditMode = !!editFlight;
  const firstFieldRef = useRef(null);

  const emptyForm = {
    flight_number: '',
    airline: '',
    from_location: '',
    to_location: '',
    departure_at: '',
    departure_tz: '',
    arrival_at: '',
    arrival_tz: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editFlight) {
      setForm({
        flight_number: editFlight.flight_number || '',
        airline: editFlight.airline || '',
        from_location: editFlight.from_location || '',
        to_location: editFlight.to_location || '',
        departure_at: toDatetimeLocal(editFlight.departure_at),
        departure_tz: editFlight.departure_tz || '',
        arrival_at: toDatetimeLocal(editFlight.arrival_at),
        arrival_tz: editFlight.arrival_tz || '',
      });
      setErrors({});
      setApiError('');
      // Focus first field
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    } else {
      setForm(emptyForm);
      setErrors({});
      setApiError('');
    }
  }, [editFlight]);

  function handleChange(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear error on first change
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };
  }

  function validate() {
    const newErrors = {};
    if (!form.flight_number.trim()) newErrors.flight_number = 'flight number is required';
    if (!form.airline.trim()) newErrors.airline = 'airline is required';
    if (!form.from_location.trim()) newErrors.from_location = 'from location is required';
    if (!form.to_location.trim()) newErrors.to_location = 'to location is required';
    if (!form.departure_at) newErrors.departure_at = 'departure date & time is required';
    if (!form.departure_tz) newErrors.departure_tz = 'please select a timezone';
    if (!form.arrival_at) newErrors.arrival_at = 'arrival date & time is required';
    if (!form.arrival_tz) newErrors.arrival_tz = 'please select a timezone';

    // Arrival must be after departure
    if (form.departure_at && form.arrival_at && form.arrival_at <= form.departure_at) {
      newErrors.arrival_at = 'arrival must be after departure';
    }

    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      // Send datetime-local value with :00 seconds appended + Z suffix to indicate UTC/wall-clock
      const payload = {
        flight_number: form.flight_number.trim(),
        airline: form.airline.trim(),
        from_location: form.from_location.trim(),
        to_location: form.to_location.trim(),
        departure_at: form.departure_at + ':00.000Z',
        departure_tz: form.departure_tz,
        arrival_at: form.arrival_at + ':00.000Z',
        arrival_tz: form.arrival_tz,
      };

      let savedFlight;
      if (isEditMode) {
        const res = await api.flights.update(tripId, editFlight.id, payload);
        savedFlight = res.data.data;
      } else {
        const res = await api.flights.create(tripId, payload);
        savedFlight = res.data.data;
      }

      onSaved(savedFlight, isEditMode);

      if (!isEditMode) {
        setForm(emptyForm);
        firstFieldRef.current?.focus();
      }
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'could not save flight. please try again.';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.formSection}>
      {/* Section header */}
      <div className={styles.formSectionHeader}>
        <h2 className={styles.sectionTitle}>
          {isEditMode ? 'editing flight' : 'add a flight'}
        </h2>
        <hr className={styles.sectionLine} aria-hidden="true" />
        {isEditMode && (
          <button className={styles.cancelEditLink} onClick={onCancelEdit}>
            cancel edit
          </button>
        )}
      </div>

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        aria-label={isEditMode ? 'Edit flight form' : 'Add flight form'}
        noValidate
      >
        <div className={styles.formGrid}>
          {/* Row 1: Flight Number | Airline */}
          <div className={styles.formGroup}>
            <label htmlFor="flight_number" className={styles.label}>FLIGHT NUMBER</label>
            <input
              id="flight_number"
              ref={firstFieldRef}
              type="text"
              className={`${styles.input} ${errors.flight_number ? styles.inputError : ''}`}
              placeholder="e.g. DL1234"
              value={form.flight_number}
              onChange={handleChange('flight_number')}
              maxLength={20}
              autoComplete="off"
            />
            {errors.flight_number && (
              <span className={styles.fieldError} role="alert">{errors.flight_number}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="airline" className={styles.label}>AIRLINE</label>
            <input
              id="airline"
              type="text"
              className={`${styles.input} ${errors.airline ? styles.inputError : ''}`}
              placeholder="e.g. Delta Air Lines"
              value={form.airline}
              onChange={handleChange('airline')}
              maxLength={100}
              autoComplete="off"
            />
            {errors.airline && (
              <span className={styles.fieldError} role="alert">{errors.airline}</span>
            )}
          </div>

          {/* Row 2: From | To */}
          <div className={styles.formGroup}>
            <label htmlFor="from_location" className={styles.label}>FROM</label>
            <input
              id="from_location"
              type="text"
              className={`${styles.input} ${errors.from_location ? styles.inputError : ''}`}
              placeholder="e.g. New York (JFK)"
              value={form.from_location}
              onChange={handleChange('from_location')}
              maxLength={100}
              autoComplete="off"
            />
            {errors.from_location && (
              <span className={styles.fieldError} role="alert">{errors.from_location}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="to_location" className={styles.label}>TO</label>
            <input
              id="to_location"
              type="text"
              className={`${styles.input} ${errors.to_location ? styles.inputError : ''}`}
              placeholder="e.g. San Francisco (SFO)"
              value={form.to_location}
              onChange={handleChange('to_location')}
              maxLength={100}
              autoComplete="off"
            />
            {errors.to_location && (
              <span className={styles.fieldError} role="alert">{errors.to_location}</span>
            )}
          </div>

          {/* Row 3: Departure datetime | Departure timezone */}
          <div className={styles.formGroup}>
            <label htmlFor="departure_at" className={styles.label}>DEPARTURE DATE &amp; TIME</label>
            <input
              id="departure_at"
              type="datetime-local"
              className={`${styles.input} ${errors.departure_at ? styles.inputError : ''}`}
              value={form.departure_at}
              onChange={handleChange('departure_at')}
            />
            {errors.departure_at && (
              <span className={styles.fieldError} role="alert">{errors.departure_at}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="departure_tz" className={styles.label}>DEPARTURE TIMEZONE</label>
            <select
              id="departure_tz"
              className={`${styles.input} ${styles.select} ${errors.departure_tz ? styles.inputError : ''}`}
              value={form.departure_tz}
              onChange={handleChange('departure_tz')}
            >
              <option value="" disabled>Select timezone</option>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            {errors.departure_tz && (
              <span className={styles.fieldError} role="alert">{errors.departure_tz}</span>
            )}
          </div>

          {/* Row 4: Arrival datetime | Arrival timezone */}
          <div className={styles.formGroup}>
            <label htmlFor="arrival_at" className={styles.label}>ARRIVAL DATE &amp; TIME</label>
            <input
              id="arrival_at"
              type="datetime-local"
              className={`${styles.input} ${errors.arrival_at ? styles.inputError : ''}`}
              value={form.arrival_at}
              onChange={handleChange('arrival_at')}
            />
            {errors.arrival_at && (
              <span className={styles.fieldError} role="alert">{errors.arrival_at}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="arrival_tz" className={styles.label}>ARRIVAL TIMEZONE</label>
            <select
              id="arrival_tz"
              className={`${styles.input} ${styles.select} ${errors.arrival_tz ? styles.inputError : ''}`}
              value={form.arrival_tz}
              onChange={handleChange('arrival_tz')}
            >
              <option value="" disabled>Select timezone</option>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            {errors.arrival_tz && (
              <span className={styles.fieldError} role="alert">{errors.arrival_tz}</span>
            )}
          </div>
        </div>

        {/* Form actions */}
        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={saving}
          >
            {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : isEditMode ? 'Save changes' : 'Save flight'}
          </button>
        </div>

        {/* API error */}
        {apiError && (
          <div className={styles.apiError} role="alert" aria-live="polite">
            {apiError}
          </div>
        )}
      </form>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function FlightsEditPage() {
  const { id: tripId } = useParams();
  const navigate = useNavigate();

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editFlight, setEditFlight] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const [toast, setToast] = useState('');

  const fetchFlights = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.flights.list(tripId);
      setFlights(res.data.data || []);
    } catch {
      setLoadError('could not load flights.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  function handleEdit(flight) {
    setEditFlight(flight);
  }

  function handleCancelEdit() {
    setEditFlight(null);
  }

  async function handleDelete(flightId) {
    try {
      await api.flights.delete(tripId, flightId);
      setFlights((prev) => prev.filter((f) => f.id !== flightId));
      if (editFlight?.id === flightId) {
        setEditFlight(null);
      }
    } catch {
      setToast('could not delete flight. please try again.');
      throw new Error('delete failed');
    }
  }

  function handleSaved(savedFlight, wasEdit) {
    if (wasEdit) {
      setFlights((prev) =>
        prev.map((f) => (f.id === savedFlight.id ? savedFlight : f))
      );
      setEditFlight(null);
    } else {
      setFlights((prev) => [...prev, savedFlight]);
    }
    // Highlight the saved card briefly
    setHighlightId(savedFlight.id);
    setTimeout(() => setHighlightId(null), 1500);
  }

  function dismissToast() {
    setToast('');
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>

          {/* ── Page Header ── */}
          <div className={styles.pageHeader}>
            <div className={styles.pageHeaderLeft}>
              <Link
                to={`/trips/${tripId}`}
                className={styles.backLink}
                aria-label="Back to trip details"
              >
                ← back to trip
              </Link>
              <h1 className={styles.pageTitle}>edit flights</h1>
            </div>
            <button
              className={styles.primaryBtn}
              onClick={() => navigate(`/trips/${tripId}`)}
              aria-label="Done editing flights, return to trip details"
            >
              done editing
            </button>
          </div>

          {/* ── Existing Flights List ── */}
          <section className={styles.listSection}>
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>your flights</h2>
              <hr className={styles.sectionLine} aria-hidden="true" />
            </div>

            {loading ? (
              <>
                <FlightCardSkeleton />
                <FlightCardSkeleton />
              </>
            ) : loadError ? (
              <div className={styles.loadError}>
                <span>{loadError}</span>
                <button className={styles.retryLink} onClick={fetchFlights}>try again</button>
              </div>
            ) : flights.length === 0 ? (
              <EmptyFlightsList />
            ) : (
              <div className={styles.flightList}>
                {flights.map((flight) => (
                  <div
                    key={flight.id}
                    className={highlightId === flight.id ? styles.highlightCard : ''}
                  >
                    <FlightListCard
                      flight={flight}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isEditing={editFlight?.id === flight.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Add/Edit Form ── */}
          <FlightForm
            tripId={tripId}
            editFlight={editFlight}
            onSaved={handleSaved}
            onCancelEdit={handleCancelEdit}
          />

          {/* ── Page Footer ── */}
          <div className={styles.pageFooter}>
            <button
              className={styles.primaryBtn}
              onClick={() => navigate(`/trips/${tripId}`)}
            >
              done editing
            </button>
          </div>

        </div>
      </main>

      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={dismissToast} />}
    </>
  );
}
