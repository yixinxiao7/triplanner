import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../utils/api';
import styles from './LandTravelEditPage.module.css';

// ── Temp ID counter (for new rows with no API id) ─────────────
let _tempIdCounter = 0;
function nextTempId() {
  return `__new__${++_tempIdCounter}`;
}

// ── Mode options ──────────────────────────────────────────────
const LAND_TRAVEL_MODES = [
  { value: 'RENTAL_CAR', label: 'Rental Car' },
  { value: 'BUS', label: 'Bus' },
  { value: 'TRAIN', label: 'Train' },
  { value: 'RIDESHARE', label: 'Rideshare' },
  { value: 'FERRY', label: 'Ferry' },
  { value: 'OTHER', label: 'Other' },
];

const MODE_DISPLAY_LABELS = {
  RENTAL_CAR: 'rental car',
  BUS: 'bus',
  TRAIN: 'train',
  RIDESHARE: 'rideshare',
  FERRY: 'ferry',
  OTHER: 'other',
};

function blankRow(overrides = {}) {
  return {
    _tempId: nextTempId(),
    _focusOnMount: false,
    id: null,
    mode: 'RENTAL_CAR',
    provider: '',
    from_location: '',
    to_location: '',
    departure_date: '',
    departure_time: '',
    arrival_date: '',
    arrival_time: '',
    confirmation_number: '',
    notes: '',
    ...overrides,
  };
}

function fromApiEntry(entry) {
  return {
    _tempId: null,
    _focusOnMount: false,
    id: entry.id,
    mode: entry.mode,
    provider: entry.provider || '',
    from_location: entry.from_location,
    to_location: entry.to_location,
    departure_date: entry.departure_date || '',
    departure_time: entry.departure_time || '',
    arrival_date: entry.arrival_date || '',
    arrival_time: entry.arrival_time || '',
    confirmation_number: entry.confirmation_number || '',
    notes: entry.notes || '',
  };
}

// ── Row validation ────────────────────────────────────────────
function validateRow(row) {
  const errors = {};
  if (!row.from_location.trim()) errors.from_location = 'required';
  if (!row.to_location.trim()) errors.to_location = 'required';
  if (!row.departure_date) errors.departure_date = 'required';
  // If arrival_time is set, arrival_date must be set
  if (row.arrival_time && !row.arrival_date) {
    errors.arrival_date = 'required when arrival time is set';
  }
  // If arrival_date is set, must be >= departure_date
  if (row.arrival_date && row.departure_date && row.arrival_date < row.departure_date) {
    errors.arrival_date = 'must be on or after departure date';
  }
  // If same day and both times set, arrival_time must be > departure_time
  if (
    row.arrival_date &&
    row.departure_date &&
    row.arrival_date === row.departure_date &&
    row.arrival_time &&
    row.departure_time &&
    row.arrival_time <= row.departure_time
  ) {
    errors.arrival_time = 'must be after departure time';
  }
  return errors;
}

// ── Single Entry Card ─────────────────────────────────────────
function EntryCard({ row, index, onChange, onDelete, showErrors, originalIds }) {
  const isExisting = Boolean(row.id);
  const fromRef = useRef(null);

  useEffect(() => {
    if (row._focusOnMount && fromRef.current) {
      fromRef.current.focus();
      onChange(row._tempId || row.id, { _focusOnMount: false });
    }
  }, [row._focusOnMount]);

  const key = row._tempId || row.id;
  const errors = showErrors ? validateRow(row) : {};
  const hasErrors = Object.keys(errors).length > 0;

  function handleChange(field) {
    return (e) => onChange(key, { [field]: e.target.value });
  }

  return (
    <div
      className={`${styles.entryCard} ${isExisting ? '' : styles.entryCardNew} ${hasErrors ? styles.entryCardError : ''}`}
      role="group"
      aria-label={
        row.from_location && row.to_location
          ? `${MODE_DISPLAY_LABELS[row.mode] || row.mode} from ${row.from_location} to ${row.to_location}`
          : `Land travel entry ${index + 1}`
      }
    >
      <div className={styles.cardHeader}>
        <span className={styles.cardIndex}>entry {index + 1}</span>
        <button
          type="button"
          className={styles.deleteCardBtn}
          onClick={() => onDelete(key)}
          aria-label={`Delete entry ${index + 1}`}
        >
          × remove
        </button>
      </div>

      <div className={styles.cardGrid}>
        {/* Mode */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor={`mode-${key}`}>MODE</label>
          <select
            id={`mode-${key}`}
            className={styles.fieldSelect}
            value={row.mode}
            onChange={handleChange('mode')}
          >
            {LAND_TRAVEL_MODES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Provider */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor={`provider-${key}`}>PROVIDER <span className={styles.optional}>(optional)</span></label>
          <input
            id={`provider-${key}`}
            type="text"
            className={styles.fieldInput}
            value={row.provider}
            onChange={handleChange('provider')}
            placeholder="e.g. Enterprise, Greyhound"
          />
        </div>

        {/* From Location */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor={`from-${key}`}>FROM</label>
          <input
            id={`from-${key}`}
            ref={fromRef}
            type="text"
            className={`${styles.fieldInput} ${errors.from_location ? styles.fieldInputError : ''}`}
            value={row.from_location}
            onChange={handleChange('from_location')}
            placeholder="Departure city or address"
            aria-describedby={errors.from_location ? `from-err-${key}` : undefined}
          />
          {errors.from_location && (
            <span id={`from-err-${key}`} className={styles.fieldError} role="alert">{errors.from_location}</span>
          )}
        </div>

        {/* To Location */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor={`to-${key}`}>TO</label>
          <input
            id={`to-${key}`}
            type="text"
            className={`${styles.fieldInput} ${errors.to_location ? styles.fieldInputError : ''}`}
            value={row.to_location}
            onChange={handleChange('to_location')}
            placeholder="Arrival city or address"
            aria-describedby={errors.to_location ? `to-err-${key}` : undefined}
          />
          {errors.to_location && (
            <span id={`to-err-${key}`} className={styles.fieldError} role="alert">{errors.to_location}</span>
          )}
        </div>

        {/* Departure Date */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor={`dep-date-${key}`}>DEPARTURE DATE</label>
          <input
            id={`dep-date-${key}`}
            type="date"
            className={`${styles.fieldInput} ${errors.departure_date ? styles.fieldInputError : ''}`}
            value={row.departure_date}
            onChange={handleChange('departure_date')}
            aria-describedby={errors.departure_date ? `dep-date-err-${key}` : undefined}
            style={{ colorScheme: 'dark' }}
          />
          {errors.departure_date && (
            <span id={`dep-date-err-${key}`} className={styles.fieldError} role="alert">{errors.departure_date}</span>
          )}
        </div>

        {/* Departure Time */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor={`dep-time-${key}`}>DEPARTURE TIME <span className={styles.optional}>(optional)</span></label>
          <input
            id={`dep-time-${key}`}
            type="time"
            className={styles.fieldInput}
            value={row.departure_time}
            onChange={handleChange('departure_time')}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Arrival Date */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor={`arr-date-${key}`}>ARRIVAL DATE <span className={styles.optional}>(optional)</span></label>
          <input
            id={`arr-date-${key}`}
            type="date"
            className={`${styles.fieldInput} ${errors.arrival_date ? styles.fieldInputError : ''}`}
            value={row.arrival_date}
            onChange={handleChange('arrival_date')}
            aria-describedby={errors.arrival_date ? `arr-date-err-${key}` : undefined}
            style={{ colorScheme: 'dark' }}
          />
          {errors.arrival_date && (
            <span id={`arr-date-err-${key}`} className={styles.fieldError} role="alert">{errors.arrival_date}</span>
          )}
        </div>

        {/* Arrival Time */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor={`arr-time-${key}`}>ARRIVAL TIME <span className={styles.optional}>(optional)</span></label>
          <input
            id={`arr-time-${key}`}
            type="time"
            className={`${styles.fieldInput} ${errors.arrival_time ? styles.fieldInputError : ''}`}
            value={row.arrival_time}
            onChange={handleChange('arrival_time')}
            aria-describedby={errors.arrival_time ? `arr-time-err-${key}` : undefined}
            style={{ colorScheme: 'dark' }}
          />
          {errors.arrival_time && (
            <span id={`arr-time-err-${key}`} className={styles.fieldError} role="alert">{errors.arrival_time}</span>
          )}
        </div>

        {/* Confirmation Number */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor={`conf-${key}`}>CONFIRMATION # <span className={styles.optional}>(optional)</span></label>
          <input
            id={`conf-${key}`}
            type="text"
            className={styles.fieldInput}
            value={row.confirmation_number}
            onChange={handleChange('confirmation_number')}
            placeholder="e.g. ABC123"
          />
        </div>

        {/* Notes */}
        <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
          <label className={styles.fieldLabel} htmlFor={`notes-${key}`}>NOTES <span className={styles.optional}>(optional)</span></label>
          <textarea
            id={`notes-${key}`}
            className={`${styles.fieldInput} ${styles.fieldTextarea}`}
            value={row.notes}
            onChange={handleChange('notes')}
            placeholder="Any additional details…"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function LandTravelEditPage() {
  const { id: tripId } = useParams();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [removedIds, setRemovedIds] = useState([]); // IDs of existing entries that were deleted

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  // Fetch existing land travel entries
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.land_travel.list(tripId);
      const entries = (res.data.data || []).map(fromApiEntry);
      setRows(entries);
      setOriginalRows(entries.map((e) => ({ ...e })));
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setLoadError('trip not found.');
      } else {
        setLoadError('could not load land travel entries. please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function handleChange(key, updates) {
    setRows((prev) =>
      prev.map((r) => {
        const rowKey = r._tempId || r.id;
        if (rowKey === key) return { ...r, ...updates };
        return r;
      })
    );
  }

  function handleAddRow() {
    const newRow = blankRow({ _focusOnMount: true });
    setRows((prev) => [...prev, newRow]);
  }

  function handleDeleteRow(key) {
    setRows((prev) => {
      const row = prev.find((r) => (r._tempId || r.id) === key);
      if (row && row.id) {
        // Mark existing entry for deletion
        setRemovedIds((ids) => [...ids, row.id]);
      }
      return prev.filter((r) => (r._tempId || r.id) !== key);
    });
  }

  async function handleSave() {
    // Validate all rows
    const hasValidationErrors = rows.some((row) => Object.keys(validateRow(row)).length > 0);
    if (hasValidationErrors) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setIsSaving(true);
    setSaveError(null);

    // Determine new, modified, and deleted
    const originalMap = new Map(originalRows.filter((r) => r.id).map((r) => [r.id, r]));

    const toCreate = rows.filter((r) => !r.id); // new rows
    const toUpdate = rows.filter((r) => r.id).filter((r) => {
      const orig = originalMap.get(r.id);
      if (!orig) return false;
      return (
        r.mode !== orig.mode ||
        r.provider !== orig.provider ||
        r.from_location !== orig.from_location ||
        r.to_location !== orig.to_location ||
        r.departure_date !== orig.departure_date ||
        r.departure_time !== orig.departure_time ||
        r.arrival_date !== orig.arrival_date ||
        r.arrival_time !== orig.arrival_time ||
        r.confirmation_number !== orig.confirmation_number ||
        r.notes !== orig.notes
      );
    });
    const toDelete = removedIds;

    // Build API payload builder
    function buildPayload(row) {
      return {
        mode: row.mode,
        provider: row.provider.trim() || null,
        from_location: row.from_location.trim(),
        to_location: row.to_location.trim(),
        departure_date: row.departure_date,
        departure_time: row.departure_time || null,
        arrival_date: row.arrival_date || null,
        arrival_time: row.arrival_time || null,
        confirmation_number: row.confirmation_number.trim() || null,
        notes: row.notes.trim() || null,
      };
    }

    const ops = [
      ...toCreate.map((r) => () => api.land_travel.create(tripId, buildPayload(r))),
      ...toUpdate.map((r) => () => api.land_travel.update(tripId, r.id, buildPayload(r))),
      ...toDelete.map((id) => () => api.land_travel.delete(tripId, id)),
    ];

    const results = await Promise.allSettled(ops.map((op) => op()));
    const failed = results.filter((r) => r.status === 'rejected');

    setIsSaving(false);

    if (failed.length > 0) {
      const errMsg =
        failed[0].reason?.response?.data?.error?.message ||
        'some changes could not be saved. please try again.';
      setSaveError(errMsg);
      return;
    }

    // Navigate back to trip details on success
    navigate(`/trips/${tripId}`);
  }

  function handleCancel() {
    navigate(`/trips/${tripId}`);
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div className={styles.pageHeaderLeft}>
              <Link to={`/trips/${tripId}`} className={styles.backLink}>
                ← back to trip
              </Link>
              <h1 className={styles.pageTitle}>edit land travel</h1>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.secondaryBtn}
                onClick={handleCancel}
                disabled={isSaving}
              >
                cancel
              </button>
              <button
                className={styles.primaryBtn}
                onClick={handleSave}
                disabled={isSaving || isLoading}
                aria-busy={isSaving}
              >
                {isSaving ? <span className="spinner" aria-label="Saving" /> : 'save all'}
              </button>
            </div>
          </div>

          {/* Save Error Banner */}
          {saveError && (
            <div className={styles.saveBanner} role="alert">
              {saveError}
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className={styles.skeletonList}>
              <div className={styles.skeletonCard} />
              <div className={styles.skeletonCard} />
            </div>
          ) : loadError ? (
            <div className={styles.loadError}>
              <span>{loadError}</span>
              <button className={styles.retryLink} onClick={fetchEntries}>
                try again
              </button>
            </div>
          ) : (
            <>
              {rows.length === 0 && (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>no land travel entries yet.</p>
                  <p className={styles.emptySubtext}>
                    use the button below to add a rental car, train, bus, or other ground transport.
                  </p>
                </div>
              )}

              <div className={styles.entryList}>
                {rows.map((row, index) => (
                  <EntryCard
                    key={row._tempId || row.id}
                    row={row}
                    index={index}
                    onChange={handleChange}
                    onDelete={handleDeleteRow}
                    showErrors={showErrors}
                    originalIds={originalRows.map((r) => r.id)}
                  />
                ))}
              </div>

              <button
                className={styles.addEntryBtn}
                onClick={handleAddRow}
                disabled={isSaving}
                aria-label="Add a new land travel entry"
              >
                + add entry
              </button>
            </>
          )}

          {/* Page Footer */}
          {!isLoading && !loadError && (
            <div className={styles.pageFooter}>
              <button
                className={styles.secondaryBtn}
                onClick={handleCancel}
                disabled={isSaving}
              >
                cancel
              </button>
              <button
                className={styles.primaryBtn}
                onClick={handleSave}
                disabled={isSaving || rows.length === 0}
                aria-busy={isSaving}
              >
                {isSaving ? <span className="spinner" aria-label="Saving" /> : 'save all'}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
