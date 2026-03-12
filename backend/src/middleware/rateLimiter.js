/**
 * rateLimiter.js — Auth endpoint rate limiters (T-178 / B-020)
 *
 * Protects POST /api/v1/auth/login and POST /api/v1/auth/register against
 * brute-force and account-enumeration attacks.
 *
 * Configuration:
 *   - loginLimiter:    10 attempts per 15-minute window per IP
 *   - registerLimiter:  5 attempts per 60-minute window per IP
 *
 * Both limiters use:
 *   - standardHeaders: true  → sends RateLimit-* headers (RFC 6585 draft 7)
 *   - legacyHeaders: false   → omits deprecated X-RateLimit-* headers
 *   - In-memory MemoryStore  → resets on process restart (acceptable for staging/prod
 *                              with a single backend process; upgrade to Redis store
 *                              if horizontal scaling is needed in the future)
 *
 * 429 response shape (matches API error contract):
 *   { "error": { "code": "RATE_LIMITED", "message": "..." } }
 */

import rateLimit from 'express-rate-limit';

/**
 * Creates a rate-limit response handler that returns a structured 429 JSON
 * response matching the API error contract.
 *
 * @param {string} message  Human-readable message shown to the caller.
 * @returns {function} Express middleware handler invoked on rate-limit breach.
 */
function makeHandler(message) {
  return (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message,
      },
    });
  };
}

/**
 * loginLimiter — 10 requests per 15-minute window per IP.
 *
 * Applied to POST /api/v1/auth/login.
 * Limits brute-force password guessing attempts.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Too many login attempts, please try again later.'),
});

/**
 * registerLimiter — 5 requests per 60-minute window per IP.
 *
 * Applied to POST /api/v1/auth/register.
 * Limits account enumeration and registration spam.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Too many registration attempts, please try again later.'),
});

/**
 * generalAuthLimiter — 30 requests per 15-minute window per IP.
 *
 * Applied to POST /api/v1/auth/refresh and POST /api/v1/auth/logout.
 * Provides a loose guard against token-hammering on less sensitive endpoints.
 */
export const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Too many requests, please try again later.'),
});
