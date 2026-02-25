import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../utils/api';
import { TIMEZONES } from '../utils/timezones';
import { formatDateTime, formatTimezoneAbbr } from '../utils/formatDate';
import styles from './StaysEditPage.module.css';

// ── Helpers ─────────────────────────────────────────────────

function toDatetimeLocal(isoString) {
  if (!isoString) return '';
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
function EmptyStaysList() {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyText}>no stays added yet.</p>
      <p className={styles.emptySubtext}>use the form below to add your first stay.</p>
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────
function StayCardSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <span className={`skeleton ${styles.skeletonLine}`} style={{ width: '60%', height: '16px' }} />
      <span className={`skeleton ${styles.skeletonLine}`} style={{ width: '40%', height: '13px', marginTop: '8px' }} />
    </div>
  );
}

// ── Category Badge ───────────────────────────────────────────
function CategoryBadge({ category }) {
  return (
    <span className={styles.categoryBadge}>{category}</span>
  );
}

// ── Stay List Card ───────────────────────────────────────────
function StayListCard({ stay, onEdit, onDelete, isEditing }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const checkInDisplay = formatDateTime(stay.check_in_at, stay.check_in_tz);
  const checkInTz = formatTimezoneAbbr(stay.check_in_at, stay.check_in_tz);
  const checkOutDisplay = formatDateTime(stay.check_out_at, stay.check_out_tz);
  const checkOutTz = formatTimezoneAbbr(stay.check_out_at, stay.check_out_tz);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await onDelete(stay.id);
    } catch {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div
      className={`${styles.stayCard} ${isEditing ? styles.stayCardEditing : ''} ${confirmDelete ? styles.stayCardConfirm : ''}`}
      data-testid="stay-card"
    >
      {confirmDelete ? (
        <div className={styles.deleteConfirmRow}>
          <span className={styles.deleteConfirmText}>delete this stay?</span>
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
          <div className={styles.stayInfo}>
            <div className={styles.stayTopRow}>
              <CategoryBadge category={stay.category} />
            </div>
            <div className={styles.stayName}>{stay.name}</div>
            <div className={styles.stayAddress}>
              {stay.address ? stay.address : (
                <span className={styles.addressNotProvided}>address not provided</span>
              )}
            </div>
          </div>

          <div className={styles.stayDates}>
            <div className={styles.dateBlock}>
              <span className={styles.dateLabel}>CHECK IN</span>
              <span className={styles.dateValue}>
                {checkInDisplay}{checkInTz ? ` ${checkInTz}` : ''}
              </span>
            </div>
            <div className={styles.dateBlock}>
              <span className={styles.dateLabel}>CHECK OUT</span>
              <span className={styles.dateValue}>
                {checkOutDisplay}{checkOutTz ? ` ${checkOutTz}` : ''}
              </span>
            </div>
          </div>

          <div className={styles.cardActions}>
            <button
              className={styles.iconBtn}
              onClick={() => onEdit(stay)}
              aria-label={`Edit stay ${stay.name}`}
              title="Edit stay"
            >
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
              aria-label={`Delete stay ${stay.name}`}
              title="Delete stay"
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
        </>
      )}
    </div>
  );
}

// ── Stay Form ────────────────────────────────────────────────
function StayForm({ tripId, editStay, onSaved, onCancelEdit }) {
  const isEditMode = !!editStay;
  const firstFieldRef = useRef(null);

  const CATEGORIES = ['HOTEL', 'AIRBNB', 'VRBO'];

  const emptyForm = {
    category: '',
    name: '',
    address: '',
    check_in_at: '',
    check_in_tz: '',
    check_out_at: '',
    check_out_tz: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (editStay) {
      setForm({
        category: editStay.category || '',
        name: editStay.name || '',
        address: editStay.address || '',
        check_in_at: toDatetimeLocal(editStay.check_in_at),
        check_in_tz: editStay.check_in_tz || '',
        check_out_at: toDatetimeLocal(editStay.check_out_at),
        check_out_tz: editStay.check_out_tz || '',
      });
      setErrors({});
      setApiError('');
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    } else {
      setForm(emptyForm);
      setErrors({});
      setApiError('');
    }
  }, [editStay]);

  function handleChange(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };
  }

  function validate() {
    const newErrors = {};
    if (!form.category) newErrors.category = 'please select a category';
    if (!form.name.trim()) newErrors.name = 'name is required';
    if (!form.check_in_at) newErrors.check_in_at = 'check-in date & time is required';
    if (!form.check_in_tz) newErrors.check_in_tz = 'please select a timezone';
    if (!form.check_out_at) newErrors.check_out_at = 'check-out date & time is required';
    if (!form.check_out_tz) newErrors.check_out_tz = 'please select a timezone';

    // Check-out must be after check-in
    if (form.check_in_at && form.check_out_at && form.check_out_at <= form.check_in_at) {
      newErrors.check_out_at = 'check-out must be after check-in';
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
      const payload = {
        category: form.category,
        name: form.name.trim(),
        address: form.address.trim() || null,
        check_in_at: form.check_in_at + ':00.000Z',
        check_in_tz: form.check_in_tz,
        check_out_at: form.check_out_at + ':00.000Z',
        check_out_tz: form.check_out_tz,
      };

      let savedStay;
      if (isEditMode) {
        const res = await api.stays.update(tripId, editStay.id, payload);
        savedStay = res.data.data;
      } else {
        const res = await api.stays.create(tripId, payload);
        savedStay = res.data.data;
      }

      onSaved(savedStay, isEditMode);

      if (!isEditMode) {
        setForm(emptyForm);
        firstFieldRef.current?.focus();
      }
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'could not save stay. please try again.';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.formSection}>
      <div className={styles.formSectionHeader}>
        <h2 className={styles.sectionTitle}>
          {isEditMode ? 'editing stay' : 'add a stay'}
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
        aria-label={isEditMode ? 'Edit stay form' : 'Add stay form'}
        noValidate
      >
        <div className={styles.formGrid}>
          {/* Row 1: Category | Name */}
          <div className={styles.formGroup}>
            <label htmlFor="category" className={styles.label}>CATEGORY</label>
            <select
              id="category"
              ref={firstFieldRef}
              className={`${styles.input} ${styles.select} ${errors.category ? styles.inputError : ''}`}
              value={form.category}
              onChange={handleChange('category')}
            >
              <option value="" disabled>Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && (
              <span className={styles.fieldError} role="alert">{errors.category}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="stay_name" className={styles.label}>NAME</label>
            <input
              id="stay_name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="e.g. Hyatt Regency San Francisco"
              value={form.name}
              onChange={handleChange('name')}
              maxLength={255}
              autoComplete="off"
            />
            {errors.name && (
              <span className={styles.fieldError} role="alert">{errors.name}</span>
            )}
          </div>

          {/* Row 2: Address (full width) */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label htmlFor="address" className={styles.label}>ADDRESS</label>
            <input
              id="address"
              type="text"
              className={styles.input}
              placeholder="e.g. 5 Embarcadero Center, San Francisco, CA"
              value={form.address}
              onChange={handleChange('address')}
              maxLength={500}
              autoComplete="off"
              aria-describedby="address-helper"
            />
            <span id="address-helper" className={styles.helperText}>leave blank if unknown</span>
          </div>

          {/* Row 3: Check-in datetime | Check-in timezone */}
          <div className={styles.formGroup}>
            <label htmlFor="check_in_at" className={styles.label}>CHECK-IN DATE &amp; TIME</label>
            <input
              id="check_in_at"
              type="datetime-local"
              className={`${styles.input} ${errors.check_in_at ? styles.inputError : ''}`}
              value={form.check_in_at}
              onChange={handleChange('check_in_at')}
            />
            {errors.check_in_at && (
              <span className={styles.fieldError} role="alert">{errors.check_in_at}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="check_in_tz" className={styles.label}>CHECK-IN TIMEZONE</label>
            <select
              id="check_in_tz"
              className={`${styles.input} ${styles.select} ${errors.check_in_tz ? styles.inputError : ''}`}
              value={form.check_in_tz}
              onChange={handleChange('check_in_tz')}
            >
              <option value="" disabled>Select timezone</option>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            {errors.check_in_tz && (
              <span className={styles.fieldError} role="alert">{errors.check_in_tz}</span>
            )}
          </div>

          {/* Row 4: Check-out datetime | Check-out timezone */}
          <div className={styles.formGroup}>
            <label htmlFor="check_out_at" className={styles.label}>CHECK-OUT DATE &amp; TIME</label>
            <input
              id="check_out_at"
              type="datetime-local"
              className={`${styles.input} ${errors.check_out_at ? styles.inputError : ''}`}
              value={form.check_out_at}
              onChange={handleChange('check_out_at')}
            />
            {errors.check_out_at && (
              <span className={styles.fieldError} role="alert">{errors.check_out_at}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="check_out_tz" className={styles.label}>CHECK-OUT TIMEZONE</label>
            <select
              id="check_out_tz"
              className={`${styles.input} ${styles.select} ${errors.check_out_tz ? styles.inputError : ''}`}
              value={form.check_out_tz}
              onChange={handleChange('check_out_tz')}
            >
              <option value="" disabled>Select timezone</option>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            {errors.check_out_tz && (
              <span className={styles.fieldError} role="alert">{errors.check_out_tz}</span>
            )}
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={saving}
          >
            {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : isEditMode ? 'Save changes' : 'Save stay'}
          </button>
        </div>

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
export default function StaysEditPage() {
  const { id: tripId } = useParams();
  const navigate = useNavigate();

  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editStay, setEditStay] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const [toast, setToast] = useState('');

  const fetchStays = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.stays.list(tripId);
      setStays(res.data.data || []);
    } catch {
      setLoadError('could not load stays.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchStays();
  }, [fetchStays]);

  function handleEdit(stay) {
    setEditStay(stay);
  }

  function handleCancelEdit() {
    setEditStay(null);
  }

  async function handleDelete(stayId) {
    try {
      await api.stays.delete(tripId, stayId);
      setStays((prev) => prev.filter((s) => s.id !== stayId));
      if (editStay?.id === stayId) {
        setEditStay(null);
      }
    } catch {
      setToast('could not delete stay. please try again.');
      throw new Error('delete failed');
    }
  }

  function handleSaved(savedStay, wasEdit) {
    if (wasEdit) {
      setStays((prev) =>
        prev.map((s) => (s.id === savedStay.id ? savedStay : s))
      );
      setEditStay(null);
    } else {
      setStays((prev) => [...prev, savedStay]);
    }
    setHighlightId(savedStay.id);
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
              <h1 className={styles.pageTitle}>edit stays</h1>
            </div>
            <button
              className={styles.primaryBtn}
              onClick={() => navigate(`/trips/${tripId}`)}
              aria-label="Done editing stays, return to trip details"
            >
              done editing
            </button>
          </div>

          {/* ── Existing Stays List ── */}
          <section className={styles.listSection}>
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>your stays</h2>
              <hr className={styles.sectionLine} aria-hidden="true" />
            </div>

            {loading ? (
              <>
                <StayCardSkeleton />
                <StayCardSkeleton />
              </>
            ) : loadError ? (
              <div className={styles.loadError}>
                <span>{loadError}</span>
                <button className={styles.retryLink} onClick={fetchStays}>try again</button>
              </div>
            ) : stays.length === 0 ? (
              <EmptyStaysList />
            ) : (
              <div className={styles.stayList}>
                {stays.map((stay) => (
                  <div
                    key={stay.id}
                    className={highlightId === stay.id ? styles.highlightCard : ''}
                  >
                    <StayListCard
                      stay={stay}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isEditing={editStay?.id === stay.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Add/Edit Form ── */}
          <StayForm
            tripId={tripId}
            editStay={editStay}
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

      {toast && <Toast message={toast} onDismiss={dismissToast} />}
    </>
  );
}
