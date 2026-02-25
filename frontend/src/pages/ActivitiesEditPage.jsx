import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../utils/api';
import styles from './ActivitiesEditPage.module.css';

// ── Row ID counter (for new rows that have no API id) ────────
let _tempIdCounter = 0;
function nextTempId() {
  return `__new__${++_tempIdCounter}`;
}

// ── Column Headers ───────────────────────────────────────────
function ColumnHeaders() {
  return (
    <div className={styles.columnHeaders} aria-hidden="true">
      <div className={styles.colDate}>DATE</div>
      <div className={styles.colName}>ACTIVITY NAME</div>
      <div className={styles.colLocation}>LOCATION</div>
      <div className={styles.colAllDay}>ALL DAY</div>
      <div className={styles.colStart}>START</div>
      <div className={styles.colEnd}>END</div>
      <div className={styles.colDelete} />
    </div>
  );
}

// ── Activity Row ─────────────────────────────────────────────
function ActivityRow({ row, onChange, onDelete, rowIndex, showErrors }) {
  const isNew = row._tempId && !row.id;
  const dateRef = useRef(null);
  const startTimeRef = useRef(null);

  const isAllDay = Boolean(row._allDay);

  // Expose focus method for new rows
  useEffect(() => {
    if (row._focusOnMount && dateRef.current) {
      dateRef.current.focus();
      // Clear the focus flag
      onChange(row._tempId || row.id, { _focusOnMount: false });
    }
  }, [row._focusOnMount]);

  function handleFieldChange(field) {
    return (e) => {
      onChange(row._tempId || row.id, { [field]: e.target.value });
    };
  }

  function handleAllDayToggle() {
    const key = row._tempId || row.id;
    if (!isAllDay) {
      // Turning ON all-day: clear times
      onChange(key, { _allDay: true, start_time: '', end_time: '' });
    } else {
      // Turning OFF all-day: restore empty time inputs, focus start_time
      onChange(key, { _allDay: false });
      // Focus the start_time input after state update
      setTimeout(() => {
        if (startTimeRef.current) startTimeRef.current.focus();
      }, 0);
    }
  }

  const key = row._tempId || row.id;
  const hasNameError = showErrors && !row.name.trim();
  const hasDateError = showErrors && !row.activity_date;
  // Time validation: if one time is set but not the other (and not all-day)
  const hasTimeError = showErrors && !isAllDay && (
    (row.start_time && !row.end_time) || (!row.start_time && row.end_time)
  );
  // End time must be >= start time
  const hasTimeOrderError = showErrors && !isAllDay && row.start_time && row.end_time && row.end_time < row.start_time;

  return (
    <div
      className={`${styles.activityRow} ${isNew ? styles.activityRowNew : ''} ${(hasNameError || hasDateError || hasTimeError || hasTimeOrderError) ? styles.activityRowError : ''}`}
      role="group"
      aria-label={row.name ? `Activity: ${row.name}` : `Activity row ${rowIndex + 1}`}
    >
      {/* Date */}
      <div className={styles.colDate}>
        <input
          ref={dateRef}
          type="date"
          className={`${styles.rowInput} ${hasDateError ? styles.rowInputError : ''}`}
          value={row.activity_date}
          onChange={handleFieldChange('activity_date')}
          aria-label="Activity date"
        />
      </div>

      {/* Name */}
      <div className={styles.colName}>
        <input
          type="text"
          className={`${styles.rowInput} ${hasNameError ? styles.rowInputError : ''}`}
          placeholder="Activity name"
          value={row.name}
          onChange={handleFieldChange('name')}
          aria-label="Activity name"
          autoComplete="off"
        />
      </div>

      {/* Location */}
      <div className={styles.colLocation}>
        <input
          type="text"
          className={styles.rowInput}
          placeholder="Location (optional)"
          value={row.location}
          onChange={handleFieldChange('location')}
          aria-label="Activity location"
          autoComplete="off"
        />
      </div>

      {/* All Day checkbox */}
      <div className={styles.colAllDay}>
        <label className={styles.allDayCheckboxLabel}>
          <input
            type="checkbox"
            className={styles.allDayCheckboxInput}
            checked={isAllDay}
            onChange={handleAllDayToggle}
            aria-label="All day activity"
          />
          <span className={styles.allDayCheckbox} aria-hidden="true">
            {isAllDay && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </label>
      </div>

      {/* Start time */}
      <div className={styles.colStart}>
        {isAllDay ? (
          <span className={styles.allDayTimePlaceholder}>all day</span>
        ) : (
          <input
            ref={startTimeRef}
            type="time"
            className={`${styles.rowInput} ${(hasTimeError || hasTimeOrderError) ? styles.rowInputError : ''}`}
            value={row.start_time}
            onChange={handleFieldChange('start_time')}
            aria-label="Start time"
          />
        )}
      </div>

      {/* End time */}
      <div className={styles.colEnd}>
        {isAllDay ? (
          <span className={styles.allDayTimePlaceholder}>all day</span>
        ) : (
          <input
            type="time"
            className={`${styles.rowInput} ${(hasTimeError || hasTimeOrderError) ? styles.rowInputError : ''}`}
            placeholder="Optional"
            value={row.end_time}
            onChange={handleFieldChange('end_time')}
            aria-label="End time"
          />
        )}
      </div>

      {/* Delete */}
      <div className={styles.colDelete}>
        <button
          type="button"
          className={styles.deleteRowBtn}
          onClick={() => onDelete(key)}
          aria-label={row.name ? `Remove activity ${row.name}` : 'Remove empty activity row'}
          title="Remove row"
        >
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
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function ActivitiesEditPage() {
  const { id: tripId } = useParams();
  const navigate = useNavigate();

  // rows: array of { id?, _tempId, activity_date, name, location, start_time, end_time }
  const [rows, setRows] = useState([]);
  // IDs of existing activities that were removed (to DELETE on save)
  const [deletedIds, setDeletedIds] = useState([]);
  // Original fetched activities (for detecting edits)
  const [originalActivities, setOriginalActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.activities.list(tripId);
      const activities = res.data.data || [];
      // Sort: by activity_date asc then start_time asc
      const sorted = [...activities].sort((a, b) => {
        if (a.activity_date < b.activity_date) return -1;
        if (a.activity_date > b.activity_date) return 1;
        if ((a.start_time || '') < (b.start_time || '')) return -1;
        if ((a.start_time || '') > (b.start_time || '')) return 1;
        return 0;
      });
      setOriginalActivities(sorted);
      setRows(sorted.map((a) => ({
        id: a.id,
        _tempId: null,
        activity_date: a.activity_date || '',
        name: a.name || '',
        location: a.location || '',
        start_time: a.start_time || '',
        end_time: a.end_time || '',
        _allDay: !a.start_time && !a.end_time,
      })));
    } catch {
      setLoadError('could not load activities.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  function handleRowChange(key, updates) {
    setRows((prev) =>
      prev.map((row) => {
        const rowKey = row._tempId || row.id;
        return rowKey === key ? { ...row, ...updates } : row;
      })
    );
  }

  function handleDeleteRow(key) {
    setRows((prev) => {
      const row = prev.find((r) => (r._tempId || r.id) === key);
      // If it's an existing activity (has API id), track for deletion
      if (row?.id) {
        setDeletedIds((ids) => [...ids, row.id]);
      }
      return prev.filter((r) => (r._tempId || r.id) !== key);
    });
  }

  function handleAddRow() {
    const tempId = nextTempId();
    setRows((prev) => [
      ...prev,
      {
        id: null,
        _tempId: tempId,
        activity_date: '',
        name: '',
        location: '',
        start_time: '',
        end_time: '',
        _allDay: false,
        _focusOnMount: true,
      },
    ]);
  }

  function validate() {
    return rows.every((row) => {
      if (!row.name.trim() || !row.activity_date) return false;
      if (row._allDay) return true; // all-day activities need no time validation
      // If one time is set, both must be set
      if ((row.start_time && !row.end_time) || (!row.start_time && row.end_time)) return false;
      // end_time must be >= start_time if both set
      if (row.start_time && row.end_time && row.end_time < row.start_time) return false;
      return true;
    });
  }

  async function handleSaveAll() {
    setShowErrors(false);

    if (!validate()) {
      setShowErrors(true);
      // Provide a specific error message for time issues
      const hasTimeMismatch = rows.some((r) => !r._allDay && ((r.start_time && !r.end_time) || (!r.start_time && r.end_time)));
      const hasTimeOrder = rows.some((r) => !r._allDay && r.start_time && r.end_time && r.end_time < r.start_time);
      if (hasTimeMismatch) {
        setSaveError('both start and end times are required, or check "all day".');
      } else if (hasTimeOrder) {
        setSaveError('end time must be after start time.');
      } else {
        setSaveError('please fix the errors above before saving.');
      }
      return;
    }

    setSaving(true);
    setSaveError('');

    // Build API call lists
    const originalMap = Object.fromEntries(originalActivities.map((a) => [a.id, a]));

    const toPost = rows.filter((r) => !r.id); // new rows
    const toPatch = rows.filter((r) => {
      if (!r.id) return false;
      const orig = originalMap[r.id];
      if (!orig) return false;
      // Compare fields
      return (
        r.activity_date !== (orig.activity_date || '') ||
        r.name !== (orig.name || '') ||
        r.location !== (orig.location || '') ||
        r.start_time !== (orig.start_time || '') ||
        r.end_time !== (orig.end_time || '')
      );
    });
    const toDelete = deletedIds;

    const buildPayload = (row) => ({
      name: row.name.trim(),
      activity_date: row.activity_date,
      location: row.location.trim() || null,
      start_time: row._allDay ? null : (row.start_time || null),
      end_time: row._allDay ? null : (row.end_time || null),
    });

    const promises = [
      ...toPost.map((row) => api.activities.create(tripId, buildPayload(row))),
      ...toPatch.map((row) => api.activities.update(tripId, row.id, buildPayload(row))),
      ...toDelete.map((id) => api.activities.delete(tripId, id)),
    ];

    try {
      const results = await Promise.allSettled(promises);
      const anyFailed = results.some((r) => r.status === 'rejected');

      if (anyFailed) {
        setSaveError('some activities could not be saved. please review and try again.');
        setSaving(false);
        return;
      }

      // All succeeded — navigate back
      navigate(`/trips/${tripId}`);
    } catch {
      setSaveError('could not save activities. please try again.');
      setSaving(false);
    }
  }

  function handleCancel() {
    navigate(`/trips/${tripId}`);
  }

  // ── Skeleton rows
  if (loading) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.pageHeader}>
              <div className={styles.pageHeaderLeft}>
                <Link to={`/trips/${tripId}`} className={styles.backLink}>← back to trip</Link>
                <h1 className={styles.pageTitle}>edit activities</h1>
              </div>
            </div>
            <ColumnHeaders />
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonRow}>
                <span className="skeleton" style={{ display: 'block', height: '100%', borderRadius: 2 }} />
              </div>
            ))}
          </div>
        </main>
      </>
    );
  }

  // ── Load error
  if (loadError) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.pageHeader}>
              <div className={styles.pageHeaderLeft}>
                <Link to={`/trips/${tripId}`} className={styles.backLink}>← back to trip</Link>
                <h1 className={styles.pageTitle}>edit activities</h1>
              </div>
            </div>
            <div className={styles.loadError}>
              <span>{loadError}</span>
              <button className={styles.retryLink} onClick={fetchActivities}>try again</button>
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
            <div className={styles.pageHeaderLeft}>
              <Link
                to={`/trips/${tripId}`}
                className={styles.backLink}
                aria-label="Back to trip details"
              >
                ← back to trip
              </Link>
              <h1 className={styles.pageTitle}>edit activities</h1>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleCancel}
                disabled={saving}
                aria-label="Cancel and return to trip without saving"
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSaveAll}
                disabled={saving}
                aria-label="Save all activity changes and return to trip"
                aria-disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                    Saving...
                  </>
                ) : (
                  'Save all'
                )}
              </button>
            </div>
          </div>

          {/* Save error banner */}
          {saveError && (
            <div className={styles.saveBanner} role="alert" aria-live="polite">
              {saveError}
            </div>
          )}

          {saving && (
            <p className={styles.savingMsg} aria-live="polite">saving activities...</p>
          )}

          {/* ── Column Headers ── */}
          <ColumnHeaders />

          {/* ── Activity Rows ── */}
          {rows.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>no activities planned yet.</p>
              <p className={styles.emptySubtext}>
                click &apos;+ add activity&apos; below to start planning your itinerary.
              </p>
            </div>
          ) : (
            <div className={styles.rowContainer}>
              {rows.map((row, i) => (
                <ActivityRow
                  key={row._tempId || row.id}
                  row={row}
                  onChange={handleRowChange}
                  onDelete={handleDeleteRow}
                  rowIndex={i}
                  showErrors={showErrors}
                />
              ))}
            </div>
          )}

          {/* ── Add Row Button ── */}
          <button
            type="button"
            className={styles.addRowBtn}
            onClick={handleAddRow}
            disabled={saving}
          >
            + add activity
          </button>

          {/* ── Page Footer ── */}
          <div className={styles.pageFooter}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleSaveAll}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Saving...
                </>
              ) : (
                'Save all'
              )}
            </button>
          </div>

        </div>
      </main>
    </>
  );
}
