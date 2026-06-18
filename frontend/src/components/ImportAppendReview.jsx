import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ResourceSections,
  makeFlightRow,
  makeStayRow,
  makeActivityRow,
  makeLandTravelRow,
  buildSubResources,
  collectTempIds,
  makeUpdateRow,
  makeRemoveRow,
  markRequired,
  REQUIRED_FIELDS,
  applyServerErrors,
} from '../utils/importReview';
import reviewStyles from '../pages/ImportReviewPage.module.css';
import styles from './ImportAppendReview.module.css';

/**
 * ImportAppendReview — on-page review/accept panel for appending parsed itinerary
 * items to an EXISTING trip. Rendered as a full-screen modal so the user stays on
 * the trip page. Reuses the shared row builders / sections / payload + server-error
 * mapping from utils/importReview (same logic as ImportReviewPage), minus the trip
 * meta — we are appending, not creating.
 *
 * Props:
 *  - parsed:   the parse contract { flights, stays, activities, land_travels } (trip meta ignored)
 *  - onAccept(body): async; commits the import. Throws to surface VALIDATION_ERROR /
 *                    generic errors back here. `body` is { flights, stays, activities, land_travels }.
 *  - onCancel():     discard everything, no API call.
 */
export default function ImportAppendReview({ parsed, onAccept, onCancel }) {
  // Initialize once from the parsed payload (ignore parsed.trip — append mode).
  const [flights, setFlights] = useState(() => (parsed?.flights || []).map(makeFlightRow));
  const [stays, setStays] = useState(() => (parsed?.stays || []).map(makeStayRow));
  const [activities, setActivities] = useState(() => (parsed?.activities || []).map(makeActivityRow));
  const [landTravels, setLandTravels] = useState(() => (parsed?.land_travels || []).map(makeLandTravelRow));

  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const modalRef = useRef(null);
  const headingRef = useRef(null);

  const updateFlight = useCallback(makeUpdateRow(setFlights), []);
  const updateStay = useCallback(makeUpdateRow(setStays), []);
  const updateActivity = useCallback(makeUpdateRow(setActivities), []);
  const updateLand = useCallback(makeUpdateRow(setLandTravels), []);

  const removeFlight = useCallback(makeRemoveRow(setFlights), []);
  const removeStay = useCallback(makeRemoveRow(setStays), []);
  const removeActivity = useCallback(makeRemoveRow(setActivities), []);
  const removeLand = useCallback(makeRemoveRow(setLandTravels), []);

  // Focus the heading on mount so the panel is announced and keyboard-reachable.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Escape cancels (only when not mid-save).
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !saving) onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saving, onCancel]);

  // Focus trap within the dialog (ported from ImportPdfModal): Tab/Shift+Tab cycle
  // within the panel so focus can't escape the aria-modal dialog.
  useEffect(() => {
    if (!modalRef.current) return undefined;

    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function handleTab(e) {
      if (e.key !== 'Tab') return;
      const focusableElements = Array.from(
        modalRef.current.querySelectorAll(focusableSelectors)
      ).filter((el) => !el.disabled);

      if (focusableElements.length === 0) return;

      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  const totalItems = flights.length + stays.length + activities.length + landTravels.length;

  // Client-side validation mirroring the lightest backend rules.
  function validate() {
    let ok = true;
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

  async function handleAccept() {
    setApiError('');
    if (totalItems === 0) {
      setApiError('nothing to add. parse a PDF with at least one item.');
      return;
    }
    if (!validate()) {
      setApiError('please fix the highlighted fields before adding to the trip.');
      return;
    }

    setSaving(true);
    // Capture the ordered _tempIds in the exact order we serialize the payload,
    // so a VALIDATION_ERROR index maps back to the right row even if rows change.
    const tempIds = collectTempIds(flights, stays, activities, landTravels);
    try {
      const body = buildSubResources(flights, stays, activities, landTravels);
      await onAccept(body);
      // onAccept closes the panel on success.
    } catch (err) {
      const errBody = err?.response?.data?.error;
      if (errBody?.code === 'VALIDATION_ERROR') {
        applyServerErrors(errBody.fields, {
          flights: setFlights, stays: setStays, activities: setActivities, land_travels: setLandTravels,
        }, tempIds);
        setApiError(errBody.message || 'some fields need fixing. see the highlighted rows.');
      } else if (errBody?.code === 'EMPTY_IMPORT') {
        setApiError(errBody.message || 'nothing to add. parse a PDF with at least one item.');
      } else {
        setApiError(errBody?.message || 'could not add items to the trip. please try again.');
      }
      setSaving(false);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget && !saving) onCancel();
  }

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-append-title"
        data-testid="import-append-review"
      >
        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.eyebrow}>review imported items</span>
            <h2
              id="import-append-title"
              className={styles.title}
              ref={headingRef}
              tabIndex={-1}
            >
              add to this trip
            </h2>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={reviewStyles.secondaryBtn}
              onClick={onCancel}
              disabled={saving}
              data-testid="import-append-cancel-btn"
            >
              cancel
            </button>
            <button
              type="button"
              className={reviewStyles.primaryBtn}
              onClick={handleAccept}
              disabled={saving}
              data-testid="import-append-accept-btn"
            >
              {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'add to trip'}
            </button>
          </div>
        </div>

        <p className={styles.intro}>
          we parsed your PDF. check everything below — especially the timezone fields —
          remove anything you don't want, then add it to this trip.
        </p>

        {apiError && (
          <div
            className={reviewStyles.apiError}
            role="alert"
            aria-live="polite"
            data-testid="import-append-api-error"
          >
            {apiError}
          </div>
        )}

        {/* ── Editable sections ── */}
        <div className={styles.body}>
          <ResourceSections
            styles={reviewStyles}
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
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <button
            type="button"
            className={reviewStyles.secondaryBtn}
            onClick={onCancel}
            disabled={saving}
          >
            cancel
          </button>
          <button
            type="button"
            className={reviewStyles.primaryBtn}
            onClick={handleAccept}
            disabled={saving}
          >
            {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'add to trip'}
          </button>
        </div>
      </div>
    </div>
  );
}
