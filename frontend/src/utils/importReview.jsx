/**
 * Shared import-review logic and presentational components.
 *
 * Extracted from ImportReviewPage so the trip-details "import & append" flow can
 * reuse the exact same row builders, timezone helpers, payload mapping, server-error
 * mapping, and field/section/timezone-select components. Both the full-page review
 * (ImportReviewPage) and the on-page append review (ImportAppendReview) render the
 * same vocabulary, bound to ImportReviewPage.module.css.
 */
import { TIMEZONES } from './timezones';
import styles from '../pages/ImportReviewPage.module.css';

// ── Constants mirroring the per-resource create forms ────────
export const STAY_CATEGORIES = ['HOTEL', 'AIRBNB', 'VRBO'];
export const LAND_TRAVEL_MODES = ['RENTAL_CAR', 'BUS', 'TRAIN', 'RIDESHARE', 'FERRY', 'OTHER'];

// ── Row ID counter (parsed rows have no DB id) ───────────────
let _tempIdCounter = 0;
export function nextTempId() {
  return `__row__${++_tempIdCounter}`;
}

// ── Timezone helpers (ported from FlightsEditPage T-241) ─────

/**
 * Convert an ISO 8601 string (with offset) to a datetime-local input value
 * (YYYY-MM-DDTHH:MM) in the given IANA timezone, so the form shows local wall-clock time.
 */
export function toDatetimeLocal(isoString, ianaTimezone) {
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
export function toISOWithOffset(localDatetimeStr, ianaTimezone) {
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

export function makeTripState(trip = {}) {
  return {
    name: trip.name || '',
    destinations: Array.isArray(trip.destinations) ? trip.destinations : [],
    start_date: trip.start_date || '',
    end_date: trip.end_date || '',
    notes: trip.notes || '',
  };
}

export function makeFlightRow(f = {}) {
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

export function makeStayRow(s = {}) {
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

export function makeActivityRow(a = {}) {
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

export function makeLandTravelRow(l = {}) {
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

const orNull = (v) => {
  const t = (v ?? '').toString().trim();
  return t === '' ? null : t;
};

/**
 * Map editable flight/stay/activity/land-travel rows to the backend contract
 * (datetimes resolved to offset-aware ISO strings via the row's timezone).
 * Returns just the four sub-resource arrays — the trip meta is added separately
 * by callers that need it (the full-trip import).
 */
export function buildSubResources(flights, stays, activities, landTravels) {
  return {
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

/**
 * Capture the ordered `_tempId` of each row, per resource list, in the SAME order
 * the builders serialize them into the payload. The backend keys validation errors
 * by array index (`flights[2].departure_tz`); because rows can be removed/reordered
 * between submit and the error response, we translate that index back to the stable
 * `_tempId` here so the error lands on the correct row (not whatever now sits at
 * that index). Capture this at submit time and hand it to `applyServerErrors`.
 */
export function collectTempIds(flights, stays, activities, landTravels) {
  return {
    flights: flights.map((r) => r._tempId),
    stays: stays.map((r) => r._tempId),
    activities: activities.map((r) => r._tempId),
    land_travels: landTravels.map((r) => r._tempId),
  };
}

/**
 * Full-trip import payload: trip meta + sub-resources. Used by ImportReviewPage.
 */
export function buildPayload(trip, flights, stays, activities, landTravels) {
  return {
    trip: {
      name: trip.name.trim(),
      destinations: trip.destinations,
      start_date: orNull(trip.start_date),
      end_date: orNull(trip.end_date),
      notes: orNull(trip.notes),
    },
    ...buildSubResources(flights, stays, activities, landTravels),
  };
}

// ── Generic row state helpers (shared between review surfaces) ──

/** Clear the error for any field being edited. */
export function zeroErrors(patch) {
  const cleared = {};
  Object.keys(patch).forEach((k) => { cleared[k] = ''; });
  return cleared;
}

export const makeUpdateRow = (setter) => (tempId, patch) =>
  setter((rows) =>
    rows.map((r) =>
      r._tempId === tempId
        ? { ...r, ...patch, _errors: { ...r._errors, ...zeroErrors(patch) } }
        : r
    )
  );

export const makeRemoveRow = (setter) => (tempId) =>
  setter((rows) => rows.filter((r) => r._tempId !== tempId));

/**
 * Mark required-but-empty fields on a list of rows. Returns the (possibly new)
 * rows and whether all required fields were present. Callers `setter(rows)` and
 * accumulate the `ok` flag across lists.
 */
export function markRequired(rows, requiredFields) {
  let ok = true;
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
  return { next, ok, changed };
}

/** Required fields per resource, mirroring the lightest backend rules. */
export const REQUIRED_FIELDS = {
  flights: ['flight_number', 'airline', 'from_location', 'to_location', 'departure_at', 'departure_tz', 'arrival_at', 'arrival_tz'],
  stays: ['name', 'check_in_at', 'check_in_tz', 'check_out_at', 'check_out_tz'],
  activities: ['name', 'activity_date'],
  land_travels: ['from_location', 'to_location', 'departure_date'],
};

/**
 * Map the backend VALIDATION_ERROR `fields` object back onto the offending rows.
 * The backend keys errors by path: `trip.<field>`, `flights[2].departure_tz`,
 * `activities[0].end_time`, `land_travels[1].from_location`, etc.
 *
 * `setters` maps each list name to its React setter. `tempIdsByList` is the ordered
 * `_tempId` list per resource captured from `collectTempIds(...)` at submit time; the
 * backend index is translated to that `_tempId` and the row is matched by `_tempId`
 * (stable across removals/reorders), NOT by current array position. When `tempIdsByList`
 * is omitted we fall back to positional matching. `onTripError(field, message)` is
 * optional — only the full-trip review has trip-meta errors.
 */
export function applyServerErrors(fields, setters, tempIdsByList, onTripError) {
  if (!fields || typeof fields !== 'object') return;
  Object.entries(fields).forEach(([path, message]) => {
    const m = path.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
    if (m) {
      const [, list, idxStr, field] = m;
      const setter = setters[list];
      if (setter) {
        const idx = Number(idxStr);
        const targetTempId = tempIdsByList?.[list]?.[idx];
        setter((prev) =>
          prev.map((r, i) => {
            const isTarget = targetTempId != null ? r._tempId === targetTempId : i === idx;
            return isTarget ? { ...r, _errors: { ...r._errors, [field]: message } } : r;
          })
        );
      }
    } else if (path.startsWith('trip.') && onTripError) {
      onTripError(path.slice('trip.'.length), message);
    }
  });
}

// ── Small reusable presentational components ─────────────────

/**
 * Field — labelled form-group wrapper.
 *
 * `fieldPath` is the stable server error-path for this field (e.g. "trip.name",
 * "flights[0].departure_tz"). When set it is exposed in the DOM as a
 * `data-error-field` attribute on the wrapper, and — when an error is present —
 * as the `data-testid` of the error element: `error-<fieldPath>`. This is the
 * stable hook QA/E2E selectors target; it never changes with CSS-module hashing.
 */
export function Field({ label, children, error, prominent, fieldPath }) {
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

export function Section({ title, count, onAdd, addLabel, children, emptyText }) {
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

export function RemoveRowBtn({ onClick, label }) {
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

export function TzSelect({ value, onChange, error }) {
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

/**
 * Renders the editable flight/stay/activity/land-travel sections shared by both
 * review surfaces. Pure-presentational: all state lives in the parent, which
 * passes the row arrays, their update/remove/add handlers, and the CSS module
 * `styles` for the card wrappers (so each surface keeps its own card styling).
 */
export function ResourceSections({
  styles: s,
  flights, stays, activities, landTravels,
  updateFlight, updateStay, updateActivity, updateLand,
  removeFlight, removeStay, removeActivity, removeLand,
  addFlight, addStay, addActivity, addLand,
}) {
  return (
    <>
      {/* ── Flights ── */}
      <Section
        title="flights"
        count={flights.length}
        addLabel="add flight"
        onAdd={addFlight}
        emptyText="no flights parsed. add one if needed."
      >
        {flights.map((f, i) => (
          <div key={f._tempId} className={s.card} data-testid={`row-flights-${i}`}>
            <div className={s.cardHead}>
              <span className={s.cardLabel}>flight</span>
              <RemoveRowBtn onClick={() => removeFlight(f._tempId)} label="Remove flight" />
            </div>
            <div className={s.formGrid}>
              <Field label="FLIGHT NUMBER" error={f._errors.flight_number} fieldPath={`flights[${i}].flight_number`}>
                <input className={`${s.input} ${f._errors.flight_number ? s.inputError : ''}`}
                  value={f.flight_number} maxLength={20}
                  onChange={(e) => updateFlight(f._tempId, { flight_number: e.target.value })} />
              </Field>
              <Field label="AIRLINE" error={f._errors.airline} fieldPath={`flights[${i}].airline`}>
                <input className={`${s.input} ${f._errors.airline ? s.inputError : ''}`}
                  value={f.airline} maxLength={100}
                  onChange={(e) => updateFlight(f._tempId, { airline: e.target.value })} />
              </Field>
              <Field label="FROM" error={f._errors.from_location} fieldPath={`flights[${i}].from_location`}>
                <input className={`${s.input} ${f._errors.from_location ? s.inputError : ''}`}
                  value={f.from_location} maxLength={100}
                  onChange={(e) => updateFlight(f._tempId, { from_location: e.target.value })} />
              </Field>
              <Field label="TO" error={f._errors.to_location} fieldPath={`flights[${i}].to_location`}>
                <input className={`${s.input} ${f._errors.to_location ? s.inputError : ''}`}
                  value={f.to_location} maxLength={100}
                  onChange={(e) => updateFlight(f._tempId, { to_location: e.target.value })} />
              </Field>
              <Field label="DEPARTURE DATE & TIME" error={f._errors.departure_at} fieldPath={`flights[${i}].departure_at`}>
                <input type="datetime-local" className={`${s.input} ${f._errors.departure_at ? s.inputError : ''}`}
                  value={f.departure_at}
                  onChange={(e) => updateFlight(f._tempId, { departure_at: e.target.value })} />
              </Field>
              <Field label="DEPARTURE TIMEZONE" error={f._errors.departure_tz} prominent fieldPath={`flights[${i}].departure_tz`}>
                <TzSelect value={f.departure_tz} error={f._errors.departure_tz}
                  onChange={(e) => updateFlight(f._tempId, { departure_tz: e.target.value })} />
              </Field>
              <Field label="ARRIVAL DATE & TIME" error={f._errors.arrival_at} fieldPath={`flights[${i}].arrival_at`}>
                <input type="datetime-local" className={`${s.input} ${f._errors.arrival_at ? s.inputError : ''}`}
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
        onAdd={addStay}
        emptyText="no stays parsed. add one if needed."
      >
        {stays.map((s2, i) => (
          <div key={s2._tempId} className={s.card} data-testid={`row-stays-${i}`}>
            <div className={s.cardHead}>
              <span className={s.cardLabel}>stay</span>
              <RemoveRowBtn onClick={() => removeStay(s2._tempId)} label="Remove stay" />
            </div>
            <div className={s.formGrid}>
              <Field label="CATEGORY" error={s2._errors.category} fieldPath={`stays[${i}].category`}>
                <select className={`${s.input} ${s.select}`}
                  value={s2.category}
                  onChange={(e) => updateStay(s2._tempId, { category: e.target.value })}>
                  {STAY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="NAME" error={s2._errors.name} fieldPath={`stays[${i}].name`}>
                <input className={`${s.input} ${s2._errors.name ? s.inputError : ''}`}
                  value={s2.name} maxLength={255}
                  onChange={(e) => updateStay(s2._tempId, { name: e.target.value })} />
              </Field>
              <div className={`${s.formGroup} ${s.fullWidth}`}>
                <label className={s.label}>ADDRESS <span className={s.optional}>(optional)</span></label>
                <input className={s.input}
                  value={s2.address}
                  onChange={(e) => updateStay(s2._tempId, { address: e.target.value })} />
              </div>
              <Field label="CHECK-IN DATE & TIME" error={s2._errors.check_in_at} fieldPath={`stays[${i}].check_in_at`}>
                <input type="datetime-local" className={`${s.input} ${s2._errors.check_in_at ? s.inputError : ''}`}
                  value={s2.check_in_at}
                  onChange={(e) => updateStay(s2._tempId, { check_in_at: e.target.value })} />
              </Field>
              <Field label="CHECK-IN TIMEZONE" error={s2._errors.check_in_tz} prominent fieldPath={`stays[${i}].check_in_tz`}>
                <TzSelect value={s2.check_in_tz} error={s2._errors.check_in_tz}
                  onChange={(e) => updateStay(s2._tempId, { check_in_tz: e.target.value })} />
              </Field>
              <Field label="CHECK-OUT DATE & TIME" error={s2._errors.check_out_at} fieldPath={`stays[${i}].check_out_at`}>
                <input type="datetime-local" className={`${s.input} ${s2._errors.check_out_at ? s.inputError : ''}`}
                  value={s2.check_out_at}
                  onChange={(e) => updateStay(s2._tempId, { check_out_at: e.target.value })} />
              </Field>
              <Field label="CHECK-OUT TIMEZONE" error={s2._errors.check_out_tz} prominent fieldPath={`stays[${i}].check_out_tz`}>
                <TzSelect value={s2.check_out_tz} error={s2._errors.check_out_tz}
                  onChange={(e) => updateStay(s2._tempId, { check_out_tz: e.target.value })} />
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
        onAdd={addActivity}
        emptyText="no activities parsed. add one if needed."
      >
        {activities.map((a, i) => (
          <div key={a._tempId} className={s.card} data-testid={`row-activities-${i}`}>
            <div className={s.cardHead}>
              <span className={s.cardLabel}>activity</span>
              <RemoveRowBtn onClick={() => removeActivity(a._tempId)} label="Remove activity" />
            </div>
            <div className={s.formGrid}>
              <Field label="ACTIVITY NAME" error={a._errors.name} fieldPath={`activities[${i}].name`}>
                <input className={`${s.input} ${a._errors.name ? s.inputError : ''}`}
                  value={a.name} maxLength={255}
                  onChange={(e) => updateActivity(a._tempId, { name: e.target.value })} />
              </Field>
              <Field label="DATE" error={a._errors.activity_date} fieldPath={`activities[${i}].activity_date`}>
                <input type="date" className={`${s.input} ${a._errors.activity_date ? s.inputError : ''}`}
                  value={a.activity_date}
                  onChange={(e) => updateActivity(a._tempId, { activity_date: e.target.value })} />
              </Field>
              <div className={`${s.formGroup} ${s.fullWidth}`}>
                <label className={s.label}>LOCATION <span className={s.optional}>(optional)</span></label>
                <input className={s.input}
                  value={a.location}
                  onChange={(e) => updateActivity(a._tempId, { location: e.target.value })} />
              </div>
              <Field label="START TIME (optional)" error={a._errors.start_time} fieldPath={`activities[${i}].start_time`}>
                <input type="time" className={`${s.input} ${a._errors.start_time ? s.inputError : ''}`}
                  value={a.start_time}
                  onChange={(e) => updateActivity(a._tempId, { start_time: e.target.value })} />
              </Field>
              <Field label="END TIME (optional)" error={a._errors.end_time} fieldPath={`activities[${i}].end_time`}>
                <input type="time" className={`${s.input} ${a._errors.end_time ? s.inputError : ''}`}
                  value={a.end_time}
                  onChange={(e) => updateActivity(a._tempId, { end_time: e.target.value })} />
              </Field>
              <div className={`${s.formGroup} ${s.fullWidth}`}>
                <label className={s.label}>NOTES <span className={s.optional}>(optional)</span></label>
                <textarea className={s.textarea} rows={2} maxLength={2000}
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
        onAdd={addLand}
        emptyText="no ground transport parsed. add a leg if needed."
      >
        {landTravels.map((l, i) => (
          <div key={l._tempId} className={s.card} data-testid={`row-land_travels-${i}`}>
            <div className={s.cardHead}>
              <span className={s.cardLabel}>land travel</span>
              <RemoveRowBtn onClick={() => removeLand(l._tempId)} label="Remove land travel leg" />
            </div>
            <div className={s.formGrid}>
              <Field label="MODE" error={l._errors.mode} fieldPath={`land_travels[${i}].mode`}>
                <select className={`${s.input} ${s.select}`}
                  value={l.mode}
                  onChange={(e) => updateLand(l._tempId, { mode: e.target.value })}>
                  {LAND_TRAVEL_MODES.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </Field>
              <Field label="PROVIDER (optional)">
                <input className={s.input}
                  value={l.provider}
                  onChange={(e) => updateLand(l._tempId, { provider: e.target.value })} />
              </Field>
              <Field label="FROM" error={l._errors.from_location} fieldPath={`land_travels[${i}].from_location`}>
                <input className={`${s.input} ${l._errors.from_location ? s.inputError : ''}`}
                  value={l.from_location} maxLength={255}
                  onChange={(e) => updateLand(l._tempId, { from_location: e.target.value })} />
              </Field>
              <Field label="TO" error={l._errors.to_location} fieldPath={`land_travels[${i}].to_location`}>
                <input className={`${s.input} ${l._errors.to_location ? s.inputError : ''}`}
                  value={l.to_location} maxLength={255}
                  onChange={(e) => updateLand(l._tempId, { to_location: e.target.value })} />
              </Field>
              <Field label="DEPARTURE DATE" error={l._errors.departure_date} fieldPath={`land_travels[${i}].departure_date`}>
                <input type="date" className={`${s.input} ${l._errors.departure_date ? s.inputError : ''}`}
                  value={l.departure_date}
                  onChange={(e) => updateLand(l._tempId, { departure_date: e.target.value })} />
              </Field>
              <Field label="DEPARTURE TIME (optional)" error={l._errors.departure_time} fieldPath={`land_travels[${i}].departure_time`}>
                <input type="time" className={`${s.input} ${l._errors.departure_time ? s.inputError : ''}`}
                  value={l.departure_time}
                  onChange={(e) => updateLand(l._tempId, { departure_time: e.target.value })} />
              </Field>
              <Field label="ARRIVAL DATE (optional)" error={l._errors.arrival_date} fieldPath={`land_travels[${i}].arrival_date`}>
                <input type="date" className={`${s.input} ${l._errors.arrival_date ? s.inputError : ''}`}
                  value={l.arrival_date}
                  onChange={(e) => updateLand(l._tempId, { arrival_date: e.target.value })} />
              </Field>
              <Field label="ARRIVAL TIME (optional)" error={l._errors.arrival_time} fieldPath={`land_travels[${i}].arrival_time`}>
                <input type="time" className={`${s.input} ${l._errors.arrival_time ? s.inputError : ''}`}
                  value={l.arrival_time}
                  onChange={(e) => updateLand(l._tempId, { arrival_time: e.target.value })} />
              </Field>
              <Field label="CONFIRMATION # (optional)" error={l._errors.confirmation_number} fieldPath={`land_travels[${i}].confirmation_number`}>
                <input className={`${s.input} ${l._errors.confirmation_number ? s.inputError : ''}`}
                  value={l.confirmation_number}
                  onChange={(e) => updateLand(l._tempId, { confirmation_number: e.target.value })} />
              </Field>
              <div className={`${s.formGroup} ${s.fullWidth}`}>
                <label className={s.label}>NOTES <span className={s.optional}>(optional)</span></label>
                <textarea className={s.textarea} rows={2} maxLength={2000}
                  value={l.notes}
                  onChange={(e) => updateLand(l._tempId, { notes: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </Section>
    </>
  );
}
