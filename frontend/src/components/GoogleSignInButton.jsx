import styles from '../pages/AuthPage.module.css';

/**
 * GoogleSignInButton — initiates the server-side Google OAuth flow.
 *
 * On click it performs a full-page navigation to the backend's
 * `/auth/google` route (works in dev via the Vite proxy, in prod via
 * VITE_API_URL). The backend handles the OAuth handshake, sets the
 * refresh-token cookie, and redirects back to the frontend.
 *
 * Props:
 *   disabled?: boolean — disable the button (e.g. while a form submits)
 *   loading?: boolean  — show a spinner and disable the button
 */
export default function GoogleSignInButton({ disabled = false, loading = false }) {
  const isDisabled = disabled || loading;

  function handleClick() {
    const base = import.meta.env.VITE_API_URL || '/api/v1';
    window.location.href = `${base}/auth/google`;
  }

  return (
    <button
      type="button"
      className={styles.googleBtn}
      onClick={isDisabled ? undefined : handleClick}
      disabled={isDisabled}
      aria-label={loading ? 'signing in with google…' : undefined}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span className="spinner" aria-label="Signing in with Google" />
      ) : (
        <>
          {/* Official multi-color Google "G" logo — the one permitted spot of color */}
          <svg
            className={styles.googleIcon}
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>continue with google</span>
        </>
      )}
    </button>
  );
}
