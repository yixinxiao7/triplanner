import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../utils/api';
import styles from './TripNotesSection.module.css';

const NOTES_MAX = 5000;
const NOTES_WARN = 4500;

// ── Pencil Icon ────────────────────────────────────────────────
function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path
        d="M9.667 1.667a1.571 1.571 0 012.222 2.222L4.333 11.333 1.333 12l.667-3L9.667 1.667z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Skeleton Bar ───────────────────────────────────────────────
function SkeletonBar({ width, height }) {
  return (
    <span
      className="skeleton"
      style={{ display: 'block', width, height, borderRadius: '2px' }}
    />
  );
}

/**
 * TripNotesSection — inline edit-in-place notes field for TripDetailsPage.
 *
 * Props:
 *   tripId        {string}        — trip UUID, used in PATCH call
 *   initialNotes  {string|null}   — trip.notes value from parent (null when unset)
 *   onSaveSuccess {() => void}    — callback to reload trip data after a successful save
 *   isLoading     {boolean}       — true while parent is loading the trip (shows skeleton)
 */
export default function TripNotesSection({ tripId, initialNotes, onSaveSuccess, isLoading }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const pencilBtnRef = useRef(null);
  const textareaRef = useRef(null);

  // When entering edit mode, pre-fill textarea and focus it
  const enterEdit = useCallback(() => {
    setEditNotes(initialNotes || '');
    setSaveError(null);
    setIsEditing(true);
  }, [initialNotes]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  function handleCancel() {
    setIsEditing(false);
    setSaveError(null);
    // Return focus to pencil button
    setTimeout(() => pencilBtnRef.current?.focus(), 0);
  }

  async function handleSave() {
    setSaveError(null);
    const trimmed = editNotes.trim();
    const payload = trimmed || null;

    // Skip API call if nothing changed
    const current = initialNotes || null;
    if (payload === current) {
      setIsEditing(false);
      setTimeout(() => pencilBtnRef.current?.focus(), 0);
      return;
    }

    setIsSaving(true);
    try {
      await api.trips.update(tripId, { notes: payload });
      setIsEditing(false);
      setSaveError(null);
      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 1500);
      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => pencilBtnRef.current?.focus(), 0);
    } catch {
      setSaveError('Failed to save notes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  // Keyboard handler for textarea
  function handleTextareaKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSaving) handleSave();
    }
  }

  // Char count color
  function charCountColor(len) {
    if (len >= NOTES_MAX) return 'var(--color-danger)';
    if (len >= NOTES_WARN) return 'var(--color-warning)';
    return undefined; // use CSS default
  }

  // ── Loading skeleton ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.separator} aria-hidden="true" />
        <div className={styles.header}>
          <span className={styles.headerLabel}>NOTES</span>
          <hr className={styles.headerLine} aria-hidden="true" />
        </div>
        <div className={styles.skeletonContent}>
          <SkeletonBar width="80%" height="14px" />
          <div style={{ marginTop: 8 }}>
            <SkeletonBar width="55%" height="14px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.separator} aria-hidden="true" />

      {/* ── Section Header ── */}
      <div className={styles.header}>
        <span className={styles.headerLabel}>
          {showSavedFeedback ? 'NOTES — SAVED' : 'NOTES'}
        </span>
        <hr className={styles.headerLine} aria-hidden="true" />
        <button
          ref={pencilBtnRef}
          className={`${styles.pencilBtn} ${isEditing ? styles.pencilBtnActive : ''}`}
          onClick={isEditing ? undefined : enterEdit}
          aria-label="Edit trip notes"
          title="Edit trip notes"
          type="button"
          aria-disabled={isEditing ? 'true' : undefined}
        >
          <PencilIcon />
        </button>
      </div>

      {/* ── View Mode ── */}
      {!isEditing && (
        <div className={styles.viewContent}>
          {initialNotes ? (
            <button
              type="button"
              className={styles.notesText}
              onClick={enterEdit}
              aria-label="Edit trip notes"
            >
              {initialNotes}
            </button>
          ) : (
            <button
              type="button"
              className={styles.placeholder}
              onClick={enterEdit}
              aria-label="Add notes about this trip"
            >
              Add notes about this trip…
            </button>
          )}
        </div>
      )}

      {/* ── Edit Mode ── */}
      {isEditing && (
        <div className={styles.editContent}>
          <textarea
            ref={textareaRef}
            id="trip-notes-textarea"
            className={styles.textarea}
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            maxLength={NOTES_MAX}
            disabled={isSaving}
            aria-label="Trip notes"
            aria-describedby="trip-notes-char-count"
            placeholder="Add notes about this trip…"
            rows={5}
          />

          <div
            id="trip-notes-char-count"
            className={styles.charCount}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={charCountColor(editNotes.length) ? { color: charCountColor(editNotes.length) } : undefined}
          >
            {editNotes.length.toLocaleString()} / {NOTES_MAX.toLocaleString()}
          </div>

          <div className={styles.buttonRow}>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={isSaving}
              aria-disabled={isSaving ? 'true' : undefined}
              type="button"
            >
              {isSaving ? <span className="spinner" /> : 'Save'}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={handleCancel}
              disabled={isSaving}
              aria-disabled={isSaving ? 'true' : undefined}
              type="button"
            >
              Cancel
            </button>
          </div>

          {saveError && (
            <span className={styles.errorMsg} role="alert">
              {saveError}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
