import { useState, useEffect, useRef, useCallback } from 'react';
import DestinationChipInput from './DestinationChipInput';
import styles from './CreateTripModal.module.css';

/**
 * CreateTripModal — modal for creating a new trip.
 * Implements focus trap, Escape to close, backdrop click to close.
 * Uses DestinationChipInput for tag/chip-based destination entry (Sprint 3 T-046).
 * Returns focus to trigger element on close (Sprint 4 T-063).
 */
export default function CreateTripModal({ isOpen, onClose, onSubmit, triggerRef }) {
  const [name, setName] = useState('');
  const [destinations, setDestinations] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nameInputRef = useRef(null);
  const modalRef = useRef(null);

  /**
   * Centralized close handler — calls onClose() and returns focus to the
   * trigger element after the modal unmounts (via requestAnimationFrame
   * to avoid focus-trap race condition).
   */
  const handleClose = useCallback(() => {
    onClose();
    requestAnimationFrame(() => {
      triggerRef?.current?.focus();
    });
  }, [onClose, triggerRef]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    } else {
      // Reset form when closed
      setName('');
      setDestinations([]);
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
        handleClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

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

  function handleNameChange(e) {
    setName(e.target.value);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: '' }));
    }
  }

  function handleDestinationsChange(newDestinations) {
    setDestinations(newDestinations);
    if (errors.destinations) {
      setErrors((prev) => ({ ...prev, destinations: '' }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'trip name is required';
    }
    if (destinations.length === 0) {
      newErrors.destinations = 'at least one destination is required';
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
        name: name.trim(),
        destinations: destinations,
      });
      // onSubmit handles navigation — no need to close here (modal unmounts)
    } catch (err) {
      setApiError('could not create trip. please try again.');
      setIsLoading(false);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      handleClose();
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
            onClick={handleClose}
            aria-label="Close modal"
            type="button"
          >
            &times;
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
              value={name}
              onChange={handleNameChange}
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

          {/* Destinations — Chip Input */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              DESTINATIONS
            </label>
            <DestinationChipInput
              destinations={destinations}
              onChange={handleDestinationsChange}
              disabled={isLoading}
              error={errors.destinations || null}
              placeholder="Type a destination and press Enter"
            />
            <span id="modal-dest-hint" className={styles.fieldHint}>
              press enter or comma to add
            </span>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
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
