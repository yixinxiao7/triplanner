import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import styles from './AuthPage.module.css';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
      handleAuthSuccess(user, access_token);
      navigate('/', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
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
            register →
          </Link>
        </p>

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
