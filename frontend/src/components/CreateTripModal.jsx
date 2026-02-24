import { useState, useEffect, useRef } from 'react';
import styles from './CreateTripModal.module.css';

/**
 * CreateTripModal — modal for creating a new trip.
 * Implements focus trap, Escape to close, backdrop click to close.
 */
export default function CreateTripModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', destinations: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nameInputRef = useRef(null);
  const modalRef = useRef(null);
  const triggerRef = useRef(null);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    } else {
      // Reset form when closed
      setForm({ name: '', destinations: '' });
      setErrors({});
      setApiError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

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
  }, [isOpen]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = 'trip name is required';
    }
    if (!form.destinations.trim()) {
      newErrors.destinations = 'please enter at least one destination';
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

    setIsLoading(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        destinations: form.destinations,
      });
      // onSubmit handles navigation — no need to close here (modal unmounts)
    } catch (err) {
      setApiError('could not create trip. please try again.');
      setIsLoading(false);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={handleBackdropClick}
      aria-hidden={!isOpen}
    >
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            new trip
          </h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>

        {/* API Error Banner */}
        {apiError && (
          <div className={styles.errorBanner} role="alert" aria-live="polite">
            {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Trip Name */}
          <div className={styles.fieldGroup}>
            <label htmlFor="modal-trip-name" className={styles.label}>
              TRIP NAME
            </label>
            <input
              ref={nameInputRef}
              id="modal-trip-name"
              name="name"
              type="text"
              placeholder="e.g. California road trip"
              value={form.name}
              onChange={handleChange}
              disabled={isLoading}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              aria-describedby={errors.name ? 'modal-name-error' : undefined}
            />
            {errors.name && (
              <span
                id="modal-name-error"
                className={styles.fieldError}
                role="alert"
                aria-live="polite"
              >
                {errors.name}
              </span>
            )}
          </div>

          {/* Destinations */}
          <div className={styles.fieldGroup}>
            <label htmlFor="modal-destinations" className={styles.label}>
              DESTINATIONS
            </label>
            <input
              id="modal-destinations"
              name="destinations"
              type="text"
              placeholder="e.g. San Francisco, Los Angeles"
              value={form.destinations}
              onChange={handleChange}
              disabled={isLoading}
              className={`${styles.input} ${errors.destinations ? styles.inputError : ''}`}
              aria-describedby={
                errors.destinations
                  ? 'modal-dest-error'
                  : 'modal-dest-hint'
              }
            />
            <span id="modal-dest-hint" className={styles.fieldHint}>
              separate multiple destinations with commas
            </span>
            {errors.destinations && (
              <span
                id="modal-dest-error"
                className={styles.fieldError}
                role="alert"
                aria-live="polite"
              >
                {errors.destinations}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isLoading}
            >
              cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
              aria-disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner" aria-label="Creating trip" />
              ) : (
                'create trip'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
