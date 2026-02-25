import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import styles from './AuthPage.module.css';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Parse Retry-After header and return wait time in minutes (rounded up).
 * Falls back to null if unparseable.
 */
function parseRetryAfterMinutes(retryAfterHeader) {
  if (!retryAfterHeader) return null;
  const seconds = parseInt(retryAfterHeader, 10);
  if (isNaN(seconds) || seconds <= 0) return null;
  return Math.ceil(seconds / 60);
}

export default function LoginPage() {
  const { isAuthenticated, handleAuthSuccess } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Rate limit state
  const [rateLimitMinutes, setRateLimitMinutes] = useState(null);
  const countdownRef = useRef(null);

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = useCallback((minutes) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setRateLimitMinutes(minutes);

    countdownRef.current = setInterval(() => {
      setRateLimitMinutes((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          // Auto-dismiss after reaching 0
          setTimeout(() => setRateLimitMinutes(null), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 60000);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on first keystroke
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function handleEmailBlur() {
    if (!form.email) return; // only validate if field has been touched with a value
    if (!isValidEmail(form.email)) {
      setErrors((prev) => ({ ...prev, email: 'please enter a valid email' }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.email.trim()) {
      newErrors.email = 'email is required';
    } else if (!isValidEmail(form.email)) {
      newErrors.email = 'please enter a valid email';
    }
    if (!form.password) {
      newErrors.password = 'password is required';
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
      const response = await api.auth.login({
        email: form.email,
        password: form.password,
      });
      const { user, access_token } = response.data.data;
      // Clear rate limit on success
      setRateLimitMinutes(null);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      handleAuthSuccess(user, access_token);
      navigate('/', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        const retryAfter = err.response?.headers?.['retry-after'];
        const minutes = parseRetryAfterMinutes(retryAfter);
        startCountdown(minutes || 15); // default to 15 min if no header
      } else if (status === 401) {
        setApiError('incorrect email or password.');
      } else {
        setApiError('something went wrong. please try again.');
        // Auto-dismiss network/500 errors after 5s
        setTimeout(() => setApiError(''), 5000);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Build rate limit message
  const rateLimitMessage = rateLimitMinutes !== null
    ? rateLimitMinutes === 0
      ? 'you can try again now.'
      : `too many login attempts. please try again in ${rateLimitMinutes} minute${rateLimitMinutes !== 1 ? 's' : ''}.`
    : null;

  return (
    <div className={styles.authPageWrapper}>
      <div className={styles.authCard}>
        {/* Brand */}
        <div className={styles.brand}>TRIPLANNER</div>

        {/* Title */}
        <h1 className={styles.pageTitle}>sign in</h1>

        {/* Subtitle / link */}
        <p className={styles.subtitle}>
          don&apos;t have an account?{' '}
          <Link to="/register" className={styles.subtitleLink}>
            register &rarr;
          </Link>
        </p>

        {/* Rate Limit Banner (429) */}
        {rateLimitMessage && (
          <div
            className={styles.rateLimitBanner}
            role="alert"
            aria-live="polite"
          >
            <svg
              className={styles.clockIcon}
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 4v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{rateLimitMessage}</span>
          </div>
        )}

        {/* API Error Banner */}
        {apiError && (
          <div
            className={styles.errorBanner}
            role="alert"
            aria-live="polite"
          >
            {apiError}
          </div>
        )}

        {/* Form */}
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          aria-label="Sign in form"
          noValidate
        >
          {/* Email field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              EMAIL
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              disabled={isLoading}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <span
                id="email-error"
                className={styles.fieldError}
                role="alert"
                aria-live="polite"
              >
                {errors.email}
              </span>
            )}
          </div>

          {/* Password field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>
              PASSWORD
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="•••••••••••"
              value={form.password}
              onChange={handleChange}
              disabled={isLoading}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <span
                id="password-error"
                className={styles.fieldError}
                role="alert"
                aria-live="polite"
              >
                {errors.password}
              </span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
            aria-disabled={isLoading}
          >
            {isLoading ? <span className="spinner" aria-label="Signing in" /> : 'sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
