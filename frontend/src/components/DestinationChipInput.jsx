import { useState, useRef } from 'react';
import styles from './DestinationChipInput.module.css';

/**
 * DestinationChipInput — reusable tag/chip-based input for destinations.
 * Used by CreateTripModal and TripDetailsPage header.
 *
 * Props:
 *  - destinations: string[]
 *  - onChange: (newDestinations: string[]) => void
 *  - disabled: boolean
 *  - error: string | null
 *  - placeholder: string
 *  - autoFocus: boolean
 */
export default function DestinationChipInput({
  destinations = [],
  onChange,
  disabled = false,
  error = null,
  placeholder = 'Add a destination...',
  autoFocus = false,
}) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const announcerRef = useRef(null);

  function announce(message) {
    if (announcerRef.current) {
      announcerRef.current.textContent = message;
    }
  }

  function addDestination(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    // Case-insensitive duplicate check
    const isDuplicate = destinations.some(
      (d) => d.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) return;
    onChange([...destinations, trimmed]);
    setInputValue('');
    announce(`${trimmed} added`);
  }

  function removeDestination(index) {
    const removed = destinations[index];
    const updated = destinations.filter((_, i) => i !== index);
    onChange(updated);
    announce(`${removed} removed`);
    // Focus input after removal
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (disabled) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      addDestination(inputValue);
    } else if (e.key === ',') {
      e.preventDefault();
      addDestination(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && destinations.length > 0) {
      removeDestination(destinations.length - 1);
    } else if (e.key === 'Escape') {
      setInputValue('');
    }
  }

  function handleChange(e) {
    // Don't allow comma to be typed (it's used as a delimiter)
    const val = e.target.value;
    if (val.includes(',')) {
      // In case comma is pasted, split and add
      const parts = val.split(',');
      parts.forEach((part) => {
        const trimmed = part.trim();
        if (trimmed) addDestination(trimmed);
      });
      setInputValue('');
      return;
    }
    setInputValue(val);
  }

  function handleContainerClick() {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }

  const hasError = !!error;

  return (
    <div>
      <div
        className={`${styles.container} ${hasError ? styles.containerError : ''} ${disabled ? styles.containerDisabled : ''}`}
        onClick={handleContainerClick}
        role="group"
        aria-label="Destinations"
      >
        {/* Chips */}
        {destinations.map((dest, index) => (
          <span key={`${dest}-${index}`} className={styles.chip} role="option">
            <span className={styles.chipText} title={dest}>
              {dest}
            </span>
            {!disabled && (
              <button
                type="button"
                className={styles.chipRemove}
                onClick={(e) => {
                  e.stopPropagation();
                  removeDestination(index);
                }}
                aria-label={`Remove ${dest}`}
                tabIndex={0}
              >
                &times;
              </button>
            )}
          </span>
        ))}

        {/* Inline text input */}
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={destinations.length === 0 ? placeholder : ''}
          disabled={disabled}
          aria-label="Add destination"
          aria-describedby={hasError ? 'dest-chip-error' : 'dest-chip-hint'}
          autoFocus={autoFocus}
          autoComplete="off"
        />
      </div>

      {/* Screen reader announcements */}
      <div
        ref={announcerRef}
        className={styles.srOnly}
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Error message */}
      {hasError && (
        <span
          id="dest-chip-error"
          className={styles.errorText}
          role="alert"
          aria-live="polite"
        >
          {error}
        </span>
      )}
    </div>
  );
}
