import { useState, useEffect } from 'react';

/**
 * Toast — bottom-right auto-dismissing notification.
 * Usage: <Toast message="..." onDismiss={() => ...} />
 */
export default function Toast({ message, onDismiss, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className="toast">{message}</div>
    </div>
  );
}
