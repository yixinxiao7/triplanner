import { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DestinationChipInput from '../components/DestinationChipInput';
import { api } from '../utils/api';
import { TIMEZONES } from '../utils/timezones';
import styles from './ImportReviewPage.module.css';

// ── Constants mirroring the per-resource create forms ────────
const STAY_CATEGORIES = ['HOTEL', 'AIRBNB', 'VRBO'];
const LAND_TRAVEL_MODES = ['RENTAL_CAR', 'BUS', 'TRAIN', 'RIDESHARE', 'FERRY', 'OTHER'];

// ── Row ID counter (parsed rows have no DB id) ───────────────
let _tempIdCounter = 0;
function nextTempId() {
  return `__row__${++_tempIdCounter}`;
}

// ── Timezone helpers (ported from FlightsEditPage T-241) ─────

/**
 * Convert an ISO 8601 string (with offset) to a datetime-local input value
 * (YYYY-MM-DDTHH:MM) in the given IANA timezone, so the form shows local wall-clock time.
 */
function toDatetimeLocal(isoString, ianaTimezone) {
  if (!isoString) return '';
  if (!ianaTimezone) {
    return isoString.replace('Z', '').replace(/\.\d{3}$/, '').slice(0, 16);
  }
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString.replace('Z', '').replace(/\.\d{3}$/, '').slice(0, 16);
    }
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: ianaTimezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
    let hour = get('hour');
    if (hour === '24') hour = '00';
    return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
  } catch {
    return isoString.replace('Z', '').replace(/\.\d{3}$/, '').slice(0, 16);
  }
}

/**
 * Build an ISO 8601 datetime string with the correct UTC offset for the given
 * IANA timezone, so the validator's `isoDateWithOffset` check passes and PostgreSQL
 * stores the correct instant.
 */
function toISOWithOffset(localDatetimeStr, ianaTimezone) {
  if (!localDatetimeStr) return '';
  if (!ianaTimezone) return localDatetimeStr + ':00Z';
  try {
    const [datePart, timePart] = localDatetimeStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    const utcRef = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: ianaTimezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(utcRef);
    const get = (type) => parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);
    let localH = get('hour');
    if (localH === 24) localH = 0;

    const localAsUTC = Date.UTC(get('year'), get('month') - 1, get('day'), localH, get('minute'), 0);
    const offsetMin = Math.round((localAsUTC - utcRef.getTime()) / 60000);
    const sign = offsetMin >= 0 ? '+' : '-';
    const absMin = Math.abs(offsetMin);
    const offH = String(Math.floor(absMin / 60)).padStart(2, '0');
    const offM = String(absMin % 60).padStart(2, '0');

    return `${localDatetimeStr}:00${sign}${offH}:${offM}`;
  } catch {
    return localDatetimeStr + ':00Z';
  }
}

// ── Normalizers: contract → editable row state ───────────────

function makeTripState(trip = {}) {
  return {
    name: trip.name || '',
    destinations: Array.isArray(trip.destinations) ? trip.destinations : [],
    start_date: trip.start_date || '',
    end_date: trip.end_date || '',
    notes: trip.notes || '',
  };
}

function makeFlightRow(f = {}) {
  return {
    _tempId: nextTempId(),
    flight_number: f.flight_number || '',
    airline: f.airline || '',
    from_location: f.from_location || '',
    to_location: f.to_location || '',
    departure_at: toDatetimeLocal(f.departure_at, f.departure_tz),
    departure_tz: f.departure_tz || '',
    arrival_at: toDatetimeLocal(f.arrival_at, f.arrival_tz),
    arrival_tz: f.arrival_tz || '',
    _errors: {},
  };
}

function makeStayRow(s = {}) {
  return {
    _tempId: nextTempId(),
    category: s.category || 'HOTEL',
    name: s.name || '',
    address: s.address || '',
    check_in_at: toDatetimeLocal(s.check_in_at, s.check_in_tz),
    check_in_tz: s.check_in_tz || '',
    check_out_at: toDatetimeLocal(s.check_out_at, s.check_out_tz),
    check_out_tz: s.check_out_tz || '',
    _errors: {},
  };
}

function makeActivityRow(a = {}) {
  return {
    _tempId: nextTempId(),
    name: a.name || '',
    location: a.location || '',
    activity_date: a.activity_date || '',
    start_time: a.start_time || '',
    end_time: a.end_time || '',
    notes: a.notes || '',
    _errors: {},
  };
}

function makeLandTravelRow(l = {}) {
  return {
    _tempId: nextTempId(),
    mode: l.mode || 'RENTAL_CAR',
    provider: l.provider || '',
    from_location: l.from_location || '',
    to_location: l.to_location || '',
    departure_date: l.departure_date || '',
    departure_time: l.departure_time || '',
    arrival_date: l.arrival_date || '',
    arrival_time: l.arrival_time || '',
    confirmation_number: l.confirmation_number || '',
    notes: l.notes || '',
    _errors: {},
  };
}

// ── Build the import payload (contract shape) from row state ──

function buildPayload(trip, flights, stays, activities, landTravels) {
  const orNull = (v) => {
    const t = (v ?? '').toString().trim();
    return t === '' ? null : t;
  };
  return {
    trip: {
      name: trip.name.trim(),
      destinations: trip.destinations,
      start_date: orNull(trip.start_date),
      end_date: orNull(trip.end_date),
      notes: orNull(trip.notes),
    },
    flights: flights.map((f) => ({
      flight_number: f.flight_number.trim(),
      airline: f.airline.trim(),
      from_location: f.from_location.trim(),
      to_location: f.to_location.trim(),
      departure_at: toISOWithOffset(f.departure_at, f.departure_tz),
      departure_tz: f.departure_tz,
      arrival_at: toISOWithOffset(f.arrival_at, f.arrival_tz),
      arrival_tz: f.arrival_tz,
    })),
    stays: stays.map((s) => ({
      category: s.category,
      name: s.name.trim(),
      address: orNull(s.address),
      check_in_at: toISOWithOffset(s.check_in_at, s.check_in_tz),
      check_in_tz: s.check_in_tz,
      check_out_at: toISOWithOffset(s.check_out_at, s.check_out_tz),
      check_out_tz: s.check_out_tz,
    })),
    activities: activities.map((a) => ({
      name: a.name.trim(),
      location: orNull(a.location),
      activity_date: a.activity_date,
      start_time: orNull(a.start_time),
      end_time: orNull(a.end_time),
      notes: orNull(a.notes),
    })),
    land_travels: landTravels.map((l) => ({
      mode: l.mode,
      provider: orNull(l.provider),
      from_location: l.from_location.trim(),
      to_location: l.to_location.trim(),
      departure_date: l.departure_date,
      departure_time: orNull(l.departure_time),
      arrival_date: orNull(l.arrival_date),
      arrival_time: orNull(l.arrival_time),
      confirmation_number: orNull(l.confirmation_number),
      notes: orNull(l.notes),
    })),
  };
}

// ── Small reusable field components ──────────────────────────

/**
 * Field — labelled form-group wrapper.
 *
 * `fieldPath` is the stable server error-path for this field (e.g. "trip.name",
 * "flights[0].departure_tz"). When set it is exposed in the DOM as a
 * `data-error-field` attribute on the wrapper, and — when an error is present —
 * as the `data-testid` of the error element: `error-<fieldPath>`. This is the
 * stable hook QA/E2E selectors target; it never changes with CSS-module hashing.
 */
function Field({ label, children, error, prominent, fieldPath }) {
  return (
    <div
      className={`${styles.formGroup} ${prominent ? styles.formGroupProminent : ''}`}
      data-error-field={fieldPath || undefined}
    >
      <label className={styles.label}>{label}</label>
      {children}
      {error && (
        <span
          className={styles.fieldError}
          role="alert"
          data-testid={fieldPath ? `error-${fieldPath}` : undefined}
        >
          {error}
        </span>
      )}
    </div>
  );
}

// ── Section wrapper with add button ──────────────────────────

function Section({ title, count, onAdd, addLabel, children, emptyText }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <h2 className={styles.sectionTitle}>
          {title}{count > 0 ? ` · ${count}` : ''}
        </h2>
        <hr className={styles.sectionLine} aria-hidden="true" />
        <button type="button" className={styles.addRowBtn} onClick={onAdd}>
          + {addLabel}
        </button>
      </div>
      {count === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>{emptyText}</p>
        </div>
      ) : (
        <div className={styles.rowList}>{children}</div>
      )}
    </section>
  );
}

function RemoveRowBtn({ onClick, label }) {
  return (
    <button
      type="button"
      className={styles.removeRowBtn}
      onClick={onClick}
      aria-label={label}
      title="Remove"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M2 4h12M5.333 4V2.667A1.333 1.333 0 016.667 1.333h2.666A1.333 1.333 0 0110.667 2.667V4m2 0l-.667 9.333A1.333 1.333 0 0110.667 14.667H5.333A1.333 1.333 0 014 13.333L3.333 4"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function TzSelect({ value, onChange, error }) {
  return (
    <select
      className={`${styles.input} ${styles.select} ${error ? styles.inputError : ''}`}
      value={value}
      onChange={onChange}
    >
      <option value="" disabled>Select timezone</option>
      {TIMEZONES.map((tz) => (
        <option key={tz.value} value={tz.value}>{tz.label}</option>
      ))}
    </select>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function ImportReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const parsed = location.state?.parsed;

  // Initialize editable state once from the parsed payload (before any early return,
  // so hooks order stays stable). When `parsed` is absent we redirect below.
  const initial = useMemo(() => {
    const p = parsed || {};
    return {
      trip: makeTripState(p.trip),
      flights: (p.flights || []).map(makeFlightRow),
      stays: (p.stays || []).map(makeStayRow),
      activities: (p.activities || []).map(makeActivityRow),
      landTravels: (p.land_travels || []).map(makeLandTravelRow),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [trip, setTrip] = useState(initial.trip);
  const [flights, setFlights] = useState(initial.flights);
  const [stays, setStays] = useState(initial.stays);
  const [activities, setActivities] = useState(initial.activities);
  const [landTravels, setLandTravels] = useState(initial.landTravels);

  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [tripErrors, setTripErrors] = useState({});

  // ── Generic row updaters ──
  const updateRow = (setter) => (tempId, patch) =>
    setter((rows) =>
      rows.map((r) =>
        r._tempId === tempId
          ? { ...r, ...patch, _errors: { ...r._errors, ...zeroErrors(patch) } }
          : r
      )
    );
  // Clear the error for any field being edited
  function zeroErrors(patch) {
    const cleared = {};
    Object.keys(patch).forEach((k) => { cleared[k] = ''; });
    return cleared;
  }
  const removeRow = (setter) => (tempId) =>
    setter((rows) => rows.filter((r) => r._tempId !== tempId));

  const updateFlight = useCallback(updateRow(setFlights), []);
  const updateStay = useCallback(updateRow(setStays), []);
  const updateActivity = useCallback(updateRow(setActivities), []);
  const updateLand = useCallback(updateRow(setLandTravels), []);

  function handleTripChange(field, value) {
    setTrip((prev) => ({ ...prev, [field]: value }));
    if (tripErrors[field]) setTripErrors((p) => ({ ...p, [field]: '' }));
  }

  // ── Client-side validation (mirror the lightest backend rules) ──
  function validate() {
    let ok = true;
    const tErr = {};
    if (!trip.name.trim()) { tErr.name = 'trip name is required'; ok = false; }
    if (!trip.destinations || trip.destinations.length === 0) {
      tErr.destinations = 'at least one destination is required';
      ok = false;
    }
    setTripErrors(tErr);

    const markRows = (rows, setter, requiredFields) => {
      let changed = false;
      const next = rows.map((r) => {
        const errs = {};
        requiredFields.forEach((f) => {
          if (!(r[f] ?? '').toString().trim()) {
            errs[f] = 'required';
            ok = false;
            changed = true;
          }
        });
        return { ...r, _errors: errs };
      });
      if (changed) setter(next);
    };

    markRows(flights, setFlights,
      ['flight_number', 'airline', 'from_location', 'to_location', 'departure_at', 'departure_tz', 'arrival_at', 'arrival_tz']);
    markRows(stays, setStays,
      ['name', 'check_in_at', 'check_in_tz', 'check_out_at', 'check_out_tz']);
    markRows(activities, setActivities, ['name', 'activity_date']);
    markRows(landTravels, setLandTravels,
      ['from_location', 'to_location', 'departure_date']);

    return ok;
  }

  /**
   * Map the backend VALIDATION_ERROR `fields` object back onto the offending rows.
   * The backend keys errors by path: `trip.<field>`, `flights[2].departure_tz`,
   * `activities[0].end_time`, `land_travels[1].from_location`, etc.
   */
  function applyServerErrors(fields) {
    if (!fields || typeof fields !== 'object') return;
    const byList = { flights: setFlights, stays: setStays, activities: setActivities, land_travels: setLandTravels };

    Object.entries(fields).forEach(([path, message]) => {
      const m = path.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
      if (m) {
        const [, list, idxStr, field] = m;
        const setter = byList[list];
        if (setter) {
          const idx = Number(idxStr);
          setter((prev) =>
            prev.map((r, i) => (i === idx ? { ...r, _errors: { ...r._errors, [field]: message } } : r))
          );
        }
      } else if (path.startsWith('trip.')) {
        const field = path.slice('trip.'.length);
        setTripErrors((prev) => ({ ...prev, [field]: message }));
      }
    });
  }

  async function handleSave() {
    setApiError('');
    if (!validate()) {
      setApiError('please fix the highlighted fields before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(trip, flights, stays, activities, landTravels);
      const res = await api.trips.import(payload);
      const created = res.data?.data;
      navigate(`/trips/${created.id}`, { replace: true });
    } catch (err) {
      const errBody = err?.response?.data?.error;
      if (errBody?.code === 'VALIDATION_ERROR') {
        applyServerErrors(errBody.fields);
        setApiError(errBody.message || 'some fields need fixing. see the highlighted rows.');
      } else {
        setApiError(err?.response?.data?.error?.message || 'could not save trip. please try again.');
      }
      setSaving(false);
    }
  }

  function handleReject() {
    const confirmed = window.confirm(
      'Discard this imported itinerary? Nothing will be saved.'
    );
    if (confirmed) {
      navigate('/', { replace: true });
    }
  }

  // Guard: no parsed payload in router state → back to home.
  if (!parsed) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Navbar />
      <main className={styles.main} data-testid="import-review-page">
        <div className={styles.container}>
          {/* ── Header ── */}
          <div className={styles.pageHeader}>
            <div className={styles.pageHeaderLeft}>
              <span className={styles.backLink}>review imported itinerary</span>
              <h1 className={styles.pageTitle}>review &amp; save</h1>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleReject}
                disabled={saving}
                data-testid="import-reject-btn"
              >
                reject
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSave}
                disabled={saving}
                data-testid="import-save-btn"
              >
                {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'save trip'}
              </button>
            </div>
          </div>

          <p className={styles.intro}>
            we parsed your PDF into a trip. check everything below — especially the
            timezone fields — then save to add it to your trips.
          </p>

          {apiError && (
            <div className={styles.apiError} role="alert" aria-live="polite" data-testid="import-api-error">
              {apiError}
            </div>
          )}

          {/* ── Trip meta ── */}
          <section className={styles.section}>
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>trip</h2>
              <hr className={styles.sectionLine} aria-hidden="true" />
            </div>
            <div className={styles.card}>
              <div className={styles.formGrid}>
                <Field label="TRIP NAME" error={tripErrors.name} fieldPath="trip.name">
                  <input
                    type="text"
                    className={`${styles.input} ${tripErrors.name ? styles.inputError : ''}`}
                    placeholder="e.g. Japan 2026"
                    value={trip.name}
                    onChange={(e) => handleTripChange('name', e.target.value)}
                    maxLength={255}
                  />
                </Field>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>DESTINATIONS</label>
                  <DestinationChipInput
                    destinations={trip.destinations}
                    onChange={(d) => handleTripChange('destinations', d)}
                    error={tripErrors.destinations || null}
                    placeholder="Type a destination and press Enter"
                  />
                </div>

                <Field label="START DATE">
                  <input
                    type="date"
                    className={styles.input}
                    value={trip.start_date}
                    onChange={(e) => handleTripChange('start_date', e.target.value)}
                  />
                </Field>
                <Field label="END DATE">
                  <input
                    type="date"
                    className={styles.input}
                    value={trip.end_date}
                    onChange={(e) => handleTripChange('end_date', e.target.value)}
                  />
                </Field>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>NOTES <span className={styles.optional}>(optional)</span></label>
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    maxLength={5000}
                    placeholder="anything worth remembering about this trip…"
                    value={trip.notes}
                    onChange={(e) => handleTripChange('notes', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Flights ── */}
          <Section
            title="flights"
            count={flights.length}
            addLabel="add flight"
            onAdd={() => setFlights((p) => [...p, makeFlightRow()])}
            emptyText="no flights parsed. add one if needed."
          >
            {flights.map((f, i) => (
              <div key={f._tempId} className={styles.card} data-testid={`row-flights-${i}`}>
                <div className={styles.cardHead}>
                  <span className={styles.cardLabel}>flight</span>
                  <RemoveRowBtn onClick={() => removeRow(setFlights)(f._tempId)} label="Remove flight" />
                </div>
                <div className={styles.formGrid}>
                  <Field label="FLIGHT NUMBER" error={f._errors.flight_number} fieldPath={`flights[${i}].flight_number`}>
                    <input className={`${styles.input} ${f._errors.flight_number ? styles.inputError : ''}`}
                      value={f.flight_number} maxLength={20}
                      onChange={(e) => updateFlight(f._tempId, { flight_number: e.target.value })} />
                  </Field>
                  <Field label="AIRLINE" error={f._errors.airline} fieldPath={`flights[${i}].airline`}>
                    <input className={`${styles.input} ${f._errors.airline ? styles.inputError : ''}`}
                      value={f.airline} maxLength={100}
                      onChange={(e) => updateFlight(f._tempId, { airline: e.target.value })} />
                  </Field>
                  <Field label="FROM" error={f._errors.from_location} fieldPath={`flights[${i}].from_location`}>
                    <input className={`${styles.input} ${f._errors.from_location ? styles.inputError : ''}`}
                      value={f.from_location} maxLength={100}
                      onChange={(e) => updateFlight(f._tempId, { from_location: e.target.value })} />
                  </Field>
                  <Field label="TO" error={f._errors.to_location} fieldPath={`flights[${i}].to_location`}>
                    <input className={`${styles.input} ${f._errors.to_location ? styles.inputError : ''}`}
                      value={f.to_location} maxLength={100}
                      onChange={(e) => updateFlight(f._tempId, { to_location: e.target.value })} />
                  </Field>
                  <Field label="DEPARTURE DATE & TIME" error={f._errors.departure_at} fieldPath={`flights[${i}].departure_at`}>
                    <input type="datetime-local" className={`${styles.input} ${f._errors.departure_at ? styles.inputError : ''}`}
                      value={f.departure_at}
                      onChange={(e) => updateFlight(f._tempId, { departure_at: e.target.value })} />
                  </Field>
                  <Field label="DEPARTURE TIMEZONE" error={f._errors.departure_tz} prominent fieldPath={`flights[${i}].departure_tz`}>
                    <TzSelect value={f.departure_tz} error={f._errors.departure_tz}
                      onChange={(e) => updateFlight(f._tempId, { departure_tz: e.target.value })} />
                  </Field>
                  <Field label="ARRIVAL DATE & TIME" error={f._errors.arrival_at} fieldPath={`flights[${i}].arrival_at`}>
                    <input type="datetime-local" className={`${styles.input} ${f._errors.arrival_at ? styles.inputError : ''}`}
                      value={f.arrival_at}
                      onChange={(e) => updateFlight(f._tempId, { arrival_at: e.target.value })} />
                  </Field>
                  <Field label="ARRIVAL TIMEZONE" error={f._errors.arrival_tz} prominent fieldPath={`flights[${i}].arrival_tz`}>
                    <TzSelect value={f.arrival_tz} error={f._errors.arrival_tz}
                      onChange={(e) => updateFlight(f._tempId, { arrival_tz: e.target.value })} />
                  </Field>
                </div>
              </div>
            ))}
          </Section>

          {/* ── Stays ── */}
          <Section
            title="stays"
            count={stays.length}
            addLabel="add stay"
            onAdd={() => setStays((p) => [...p, makeStayRow()])}
            emptyText="no stays parsed. add one if needed."
          >
            {stays.map((s, i) => (
              <div key={s._tempId} className={styles.card} data-testid={`row-stays-${i}`}>
                <div className={styles.cardHead}>
                  <span className={styles.cardLabel}>stay</span>
                  <RemoveRowBtn onClick={() => removeRow(setStays)(s._tempId)} label="Remove stay" />
                </div>
                <div className={styles.formGrid}>
                  <Field label="CATEGORY" error={s._errors.category} fieldPath={`stays[${i}].category`}>
                    <select className={`${styles.input} ${styles.select}`}
                      value={s.category}
                      onChange={(e) => updateStay(s._tempId, { category: e.target.value })}>
                      {STAY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="NAME" error={s._errors.name} fieldPath={`stays[${i}].name`}>
                    <input className={`${styles.input} ${s._errors.name ? styles.inputError : ''}`}
                      value={s.name} maxLength={255}
                      onChange={(e) => updateStay(s._tempId, { name: e.target.value })} />
                  </Field>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>ADDRESS <span className={styles.optional}>(optional)</span></label>
                    <input className={styles.input}
                      value={s.address}
                      onChange={(e) => updateStay(s._tempId, { address: e.target.value })} />
                  </div>
                  <Field label="CHECK-IN DATE & TIME" error={s._errors.check_in_at} fieldPath={`stays[${i}].check_in_at`}>
                    <input type="datetime-local" className={`${styles.input} ${s._errors.check_in_at ? styles.inputError : ''}`}
                      value={s.check_in_at}
                      onChange={(e) => updateStay(s._tempId, { check_in_at: e.target.value })} />
                  </Field>
                  <Field label="CHECK-IN TIMEZONE" error={s._errors.check_in_tz} prominent fieldPath={`stays[${i}].check_in_tz`}>
                    <TzSelect value={s.check_in_tz} error={s._errors.check_in_tz}
                      onChange={(e) => updateStay(s._tempId, { check_in_tz: e.target.value })} />
                  </Field>
                  <Field label="CHECK-OUT DATE & TIME" error={s._errors.check_out_at} fieldPath={`stays[${i}].check_out_at`}>
                    <input type="datetime-local" className={`${styles.input} ${s._errors.check_out_at ? styles.inputError : ''}`}
                      value={s.check_out_at}
                      onChange={(e) => updateStay(s._tempId, { check_out_at: e.target.value })} />
                  </Field>
                  <Field label="CHECK-OUT TIMEZONE" error={s._errors.check_out_tz} prominent fieldPath={`stays[${i}].check_out_tz`}>
                    <TzSelect value={s.check_out_tz} error={s._errors.check_out_tz}
                      onChange={(e) => updateStay(s._tempId, { check_out_tz: e.target.value })} />
                  </Field>
                </div>
              </div>
            ))}
          </Section>

          {/* ── Activities ── */}
          <Section
            title="activities"
            count={activities.length}
            addLabel="add activity"
            onAdd={() => setActivities((p) => [...p, makeActivityRow()])}
            emptyText="no activities parsed. add one if needed."
          >
            {activities.map((a, i) => (
              <div key={a._tempId} className={styles.card} data-testid={`row-activities-${i}`}>
                <div className={styles.cardHead}>
                  <span className={styles.cardLabel}>activity</span>
                  <RemoveRowBtn onClick={() => removeRow(setActivities)(a._tempId)} label="Remove activity" />
                </div>
                <div className={styles.formGrid}>
                  <Field label="ACTIVITY NAME" error={a._errors.name} fieldPath={`activities[${i}].name`}>
                    <input className={`${styles.input} ${a._errors.name ? styles.inputError : ''}`}
                      value={a.name} maxLength={255}
                      onChange={(e) => updateActivity(a._tempId, { name: e.target.value })} />
                  </Field>
                  <Field label="DATE" error={a._errors.activity_date} fieldPath={`activities[${i}].activity_date`}>
                    <input type="date" className={`${styles.input} ${a._errors.activity_date ? styles.inputError : ''}`}
                      value={a.activity_date}
                      onChange={(e) => updateActivity(a._tempId, { activity_date: e.target.value })} />
                  </Field>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>LOCATION <span className={styles.optional}>(optional)</span></label>
                    <input className={styles.input}
                      value={a.location}
                      onChange={(e) => updateActivity(a._tempId, { location: e.target.value })} />
                  </div>
                  <Field label="START TIME (optional)" error={a._errors.start_time} fieldPath={`activities[${i}].start_time`}>
                    <input type="time" className={`${styles.input} ${a._errors.start_time ? styles.inputError : ''}`}
                      value={a.start_time}
                      onChange={(e) => updateActivity(a._tempId, { start_time: e.target.value })} />
                  </Field>
                  <Field label="END TIME (optional)" error={a._errors.end_time} fieldPath={`activities[${i}].end_time`}>
                    <input type="time" className={`${styles.input} ${a._errors.end_time ? styles.inputError : ''}`}
                      value={a.end_time}
                      onChange={(e) => updateActivity(a._tempId, { end_time: e.target.value })} />
                  </Field>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>NOTES <span className={styles.optional}>(optional)</span></label>
                    <textarea className={styles.textarea} rows={2} maxLength={2000}
                      value={a.notes}
                      onChange={(e) => updateActivity(a._tempId, { notes: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </Section>

          {/* ── Land travel ── */}
          <Section
            title="land travel"
            count={landTravels.length}
            addLabel="add leg"
            onAdd={() => setLandTravels((p) => [...p, makeLandTravelRow()])}
            emptyText="no ground transport parsed. add a leg if needed."
          >
            {landTravels.map((l, i) => (
              <div key={l._tempId} className={styles.card} data-testid={`row-land_travels-${i}`}>
                <div className={styles.cardHead}>
                  <span className={styles.cardLabel}>land travel</span>
                  <RemoveRowBtn onClick={() => removeRow(setLandTravels)(l._tempId)} label="Remove land travel leg" />
                </div>
                <div className={styles.formGrid}>
                  <Field label="MODE" error={l._errors.mode} fieldPath={`land_travels[${i}].mode`}>
                    <select className={`${styles.input} ${styles.select}`}
                      value={l.mode}
                      onChange={(e) => updateLand(l._tempId, { mode: e.target.value })}>
                      {LAND_TRAVEL_MODES.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                    </select>
                  </Field>
                  <Field label="PROVIDER (optional)">
                    <input className={styles.input}
                      value={l.provider}
                      onChange={(e) => updateLand(l._tempId, { provider: e.target.value })} />
                  </Field>
                  <Field label="FROM" error={l._errors.from_location} fieldPath={`land_travels[${i}].from_location`}>
                    <input className={`${styles.input} ${l._errors.from_location ? styles.inputError : ''}`}
                      value={l.from_location} maxLength={255}
                      onChange={(e) => updateLand(l._tempId, { from_location: e.target.value })} />
                  </Field>
                  <Field label="TO" error={l._errors.to_location} fieldPath={`land_travels[${i}].to_location`}>
                    <input className={`${styles.input} ${l._errors.to_location ? styles.inputError : ''}`}
                      value={l.to_location} maxLength={255}
                      onChange={(e) => updateLand(l._tempId, { to_location: e.target.value })} />
                  </Field>
                  <Field label="DEPARTURE DATE" error={l._errors.departure_date} fieldPath={`land_travels[${i}].departure_date`}>
                    <input type="date" className={`${styles.input} ${l._errors.departure_date ? styles.inputError : ''}`}
                      value={l.departure_date}
                      onChange={(e) => updateLand(l._tempId, { departure_date: e.target.value })} />
                  </Field>
                  <Field label="DEPARTURE TIME (optional)" error={l._errors.departure_time} fieldPath={`land_travels[${i}].departure_time`}>
                    <input type="time" className={`${styles.input} ${l._errors.departure_time ? styles.inputError : ''}`}
                      value={l.departure_time}
                      onChange={(e) => updateLand(l._tempId, { departure_time: e.target.value })} />
                  </Field>
                  <Field label="ARRIVAL DATE (optional)" error={l._errors.arrival_date} fieldPath={`land_travels[${i}].arrival_date`}>
                    <input type="date" className={`${styles.input} ${l._errors.arrival_date ? styles.inputError : ''}`}
                      value={l.arrival_date}
                      onChange={(e) => updateLand(l._tempId, { arrival_date: e.target.value })} />
                  </Field>
                  <Field label="ARRIVAL TIME (optional)" error={l._errors.arrival_time} fieldPath={`land_travels[${i}].arrival_time`}>
                    <input type="time" className={`${styles.input} ${l._errors.arrival_time ? styles.inputError : ''}`}
                      value={l.arrival_time}
                      onChange={(e) => updateLand(l._tempId, { arrival_time: e.target.value })} />
                  </Field>
                  <Field label="CONFIRMATION # (optional)" error={l._errors.confirmation_number} fieldPath={`land_travels[${i}].confirmation_number`}>
                    <input className={`${styles.input} ${l._errors.confirmation_number ? styles.inputError : ''}`}
                      value={l.confirmation_number}
                      onChange={(e) => updateLand(l._tempId, { confirmation_number: e.target.value })} />
                  </Field>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>NOTES <span className={styles.optional}>(optional)</span></label>
                    <textarea className={styles.textarea} rows={2} maxLength={2000}
                      value={l.notes}
                      onChange={(e) => updateLand(l._tempId, { notes: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </Section>

          {/* ── Footer actions ── */}
          <div className={styles.pageFooter}>
            <button type="button" className={styles.secondaryBtn} onClick={handleReject} disabled={saving}>
              reject
            </button>
            <button type="button" className={styles.primaryBtn} onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'save trip'}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
