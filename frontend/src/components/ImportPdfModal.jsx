import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ImportPdfModal.module.css';

/**
 * ImportPdfModal — modal for uploading an itinerary PDF to be parsed by Gemini.
 *
 * Mirrors CreateTripModal's structure (focus trap, Escape to close, backdrop click,
 * focus return to trigger). PDF-only, ≤10MB enforced client-side before upload.
 *
 * On submit it calls `onSubmit(file)` (which performs the parse request and navigates
 * to the review page). The parent handles navigation, so on success the modal simply
 * unmounts; on failure we surface a generic, user-safe error banner.
 */
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

export default function ImportPdfModal({ isOpen, onClose, onSubmit, triggerRef }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  const handleClose = useCallback(() => {
    onClose();
    requestAnimationFrame(() => {
      triggerRef?.current?.focus();
    });
  }, [onClose, triggerRef]);

  // Reset state whenever the modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => fileInputRef.current?.focus(), 50);
    } else {
      setFile(null);
      setError('');
      setApiError('');
      setIsLoading(false);
      setIsDragging(false);
    }
  }, [isOpen]);

  // Escape to close
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

  /**
   * Validate a selected file: must be a PDF and ≤10MB. Returns an error string
   * (or '' when valid) and, on success, stages the file.
   */
  function selectFile(picked) {
    if (!picked) return;
    setApiError('');
    const isPdf =
      picked.type === 'application/pdf' ||
      picked.name?.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFile(null);
      setError('please choose a PDF file.');
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setFile(null);
      setError('file is too large. maximum size is 10MB.');
      return;
    }
    setError('');
    setFile(picked);
  }

  function handleFileChange(e) {
    selectFile(e.target.files?.[0]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    selectFile(e.dataTransfer.files?.[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    if (!file) {
      setError('please choose a PDF file.');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(file);
      // onSubmit handles navigation — the modal unmounts on success.
    } catch {
      setApiError('could not read the itinerary. please try again.');
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
        aria-labelledby="import-modal-title"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 id="import-modal-title" className={styles.title}>
            import from PDF
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

        <p className={styles.subtitle}>
          upload an itinerary PDF and we'll pre-fill a trip for you to review.
        </p>

        {/* API Error Banner */}
        {apiError && (
          <div className={styles.errorBanner} role="alert" aria-live="polite">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldGroup}>
            <label htmlFor="import-pdf-file" className={styles.label}>
              ITINERARY PDF
            </label>

            {/* Drop zone — clicking it opens the native picker via the hidden input */}
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''} ${error ? styles.dropzoneError : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                id="import-pdf-file"
                name="file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                disabled={isLoading}
                className={styles.fileInput}
                aria-describedby={error ? 'import-file-error' : 'import-file-hint'}
              />
              {file ? (
                <span className={styles.fileName}>{file.name}</span>
              ) : (
                <span className={styles.dropzoneText}>
                  drag a PDF here, or click to browse
                </span>
              )}
            </div>

            {error ? (
              <span
                id="import-file-error"
                className={styles.fieldError}
                role="alert"
                aria-live="polite"
              >
                {error}
              </span>
            ) : (
              <span id="import-file-hint" className={styles.fieldHint}>
                PDF only · max 10MB
              </span>
            )}
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
              disabled={isLoading || !file}
              aria-disabled={isLoading || !file}
            >
              {isLoading ? (
                <span className="spinner" aria-label="Reading itinerary" />
              ) : (
                'parse itinerary'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
