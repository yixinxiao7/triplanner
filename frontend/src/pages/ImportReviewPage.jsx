import { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DestinationChipInput from '../components/DestinationChipInput';
import { api } from '../utils/api';
import {
  Field,
  ResourceSections,
  makeTripState,
  makeFlightRow,
  makeStayRow,
  makeActivityRow,
  makeLandTravelRow,
  buildPayload,
  collectTempIds,
  makeUpdateRow,
  makeRemoveRow,
  markRequired,
  REQUIRED_FIELDS,
  applyServerErrors,
} from '../utils/importReview';
import styles from './ImportReviewPage.module.css';

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
  const updateFlight = useCallback(makeUpdateRow(setFlights), []);
  const updateStay = useCallback(makeUpdateRow(setStays), []);
  const updateActivity = useCallback(makeUpdateRow(setActivities), []);
  const updateLand = useCallback(makeUpdateRow(setLandTravels), []);

  const removeFlight = useCallback(makeRemoveRow(setFlights), []);
  const removeStay = useCallback(makeRemoveRow(setStays), []);
  const removeActivity = useCallback(makeRemoveRow(setActivities), []);
  const removeLand = useCallback(makeRemoveRow(setLandTravels), []);

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

    const markList = (rows, setter, fields) => {
      const { next, ok: listOk, changed } = markRequired(rows, fields);
      if (!listOk) ok = false;
      if (changed) setter(next);
    };

    markList(flights, setFlights, REQUIRED_FIELDS.flights);
    markList(stays, setStays, REQUIRED_FIELDS.stays);
    markList(activities, setActivities, REQUIRED_FIELDS.activities);
    markList(landTravels, setLandTravels, REQUIRED_FIELDS.land_travels);

    return ok;
  }

  async function handleSave() {
    setApiError('');
    if (!validate()) {
      setApiError('please fix the highlighted fields before saving.');
      return;
    }

    setSaving(true);
    // Capture the ordered _tempIds in the exact order we serialize the payload,
    // so a VALIDATION_ERROR index maps back to the right row even if rows change.
    const tempIds = collectTempIds(flights, stays, activities, landTravels);
    try {
      const payload = buildPayload(trip, flights, stays, activities, landTravels);
      const res = await api.trips.import(payload);
      const created = res.data?.data;
      navigate(`/trips/${created.id}`, { replace: true });
    } catch (err) {
      const errBody = err?.response?.data?.error;
      if (errBody?.code === 'VALIDATION_ERROR') {
        applyServerErrors(
          errBody.fields,
          { flights: setFlights, stays: setStays, activities: setActivities, land_travels: setLandTravels },
          tempIds,
          (field, message) => setTripErrors((prev) => ({ ...prev, [field]: message }))
        );
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

          {/* ── Flights / Stays / Activities / Land travel ── */}
          <ResourceSections
            styles={styles}
            flights={flights}
            stays={stays}
            activities={activities}
            landTravels={landTravels}
            updateFlight={updateFlight}
            updateStay={updateStay}
            updateActivity={updateActivity}
            updateLand={updateLand}
            removeFlight={removeFlight}
            removeStay={removeStay}
            removeActivity={removeActivity}
            removeLand={removeLand}
            addFlight={() => setFlights((p) => [...p, makeFlightRow()])}
            addStay={() => setStays((p) => [...p, makeStayRow()])}
            addActivity={() => setActivities((p) => [...p, makeActivityRow()])}
            addLand={() => setLandTravels((p) => [...p, makeLandTravelRow()])}
          />

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
