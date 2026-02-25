/**
 * rateLimitUtils.js — Shared rate limit utilities for auth pages.
 *
 * Extracted from LoginPage.jsx and RegisterPage.jsx (Sprint 4 T-060).
 */

/**
 * Parse Retry-After header and return wait time in minutes (rounded up).
 * Returns null if the header is missing, unparseable, or non-positive.
 *
 * @param {string|null|undefined} retryAfterHeader - The value of the Retry-After HTTP header (in seconds)
 * @returns {number|null} Wait time in minutes (rounded up), or null
 */
export function parseRetryAfterMinutes(retryAfterHeader) {
  if (!retryAfterHeader) return null;
  const seconds = parseInt(retryAfterHeader, 10);
  if (isNaN(seconds) || seconds <= 0) return null;
  return Math.ceil(seconds / 60);
}
