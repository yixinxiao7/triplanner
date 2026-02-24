import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import styles from './AuthPage.module.css';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterPage() {
  const { isAuthenticated, handleAuthSuccess } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on first keystroke after error was shown
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    switch (name) {
      case 'name':
        if (!value.trim()) {
          setErrors((prev) => ({ ...prev, name: 'name is required' }));
        }
        break;
      case 'email':
        if (!value.trim()) {
          setErrors((prev) => ({ ...prev, email: 'email is required' }));
        } else if (!isValidEmail(value)) {
          setErrors((prev) => ({ ...prev, email: 'please enter a valid email address' }));
        }
        break;
      case 'password':
        if (value && value.length < 8) {
          setErrors((prev) => ({
            ...prev,
            password: 'password must be at least 8 characters',
          }));
        }
        break;
      default:
        break;
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = 'name is required';
    }
    if (!form.email.trim()) {
      newErrors.email = 'email is required';
    } else if (!isValidEmail(form.email)) {
      newErrors.email = 'please enter a valid email address';
    }
    if (!form.password) {
      newErrors.password = 'password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'password must be at least 8 characters';
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
      const response = await api.auth.register({
        name: form.name.trim(),
        email: form.email,
        password: form.password,
      });
      const { user, access_token } = response.data.data;
      handleAuthSuccess(user, access_token);
      navigate('/', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.error?.code;

      if (status === 409 || code === 'EMAIL_TAKEN') {
        setErrors((prev) => ({
          ...prev,
          email: 'an account with this email already exists.',
        }));
      } else if (status === 400) {
        // Map server validation errors back to fields
        const fields = err.response?.data?.error?.fields || {};
        const fieldErrors = {};
        if (fields.name) fieldErrors.name = fields.name.toLowerCase();
        if (fields.email) fieldErrors.email = fields.email.toLowerCase();
        if (fields.password) fieldErrors.password = fields.password.toLowerCase();
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      } else {
        setApiError('something went wrong. please try again.');
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
        <h1 className={styles.pageTitle}>create account</h1>

        {/* Subtitle / link */}
        <p className={styles.subtitle}>
          already have an account?{' '}
          <Link to="/login" className={styles.subtitleLink}>
            sign in →
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
          aria-label="Create account form"
          noValidate
        >
          {/* Name field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="name" className={styles.label}>
              NAME
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="your name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <span
                id="name-error"
                className={styles.fieldError}
                role="alert"
                aria-live="polite"
              >
                {errors.name}
              </span>
            )}
          </div>

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
              onBlur={handleBlur}
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
              <span className={styles.fieldHint}>8 characters minimum</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="•••••••••••"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              aria-describedby={
                errors.password
                  ? 'password-error'
                  : 'password-hint'
              }
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
            {isLoading ? (
              <span className="spinner" aria-label="Creating account" />
            ) : (
              'create account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
