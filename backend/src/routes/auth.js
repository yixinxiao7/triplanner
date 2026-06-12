import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { parse as parseCookies } from 'cookie';
import { isGoogleOAuthConfigured } from '../config/passport.js';
import { validate } from '../middleware/validate.js';
import { sanitizeFields } from '../middleware/sanitize.js';
import { authenticate } from '../middleware/auth.js';
import {
  loginLimiter,
  registerLimiter,
  generalAuthLimiter,
} from '../middleware/rateLimiter.js';
import {
  findUserByEmail,
  findUserById,
  createUser,
  saveGoogleCalendarTokens,
} from '../models/userModel.js';
import {
  isGoogleCalendarConfigured,
  buildAuthUrl as buildGoogleCalendarAuthUrl,
  exchangeCodeForTokens,
} from '../services/googleCalendarService.js';
import {
  generateRawToken,
  hashToken,
  createRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
} from '../models/refreshTokenModel.js';

const router = Router();

// Dummy bcrypt hash for timing-safe comparison when user is not found
const DUMMY_HASH = '$2a$12$KIXRypNYJWQXQVVjbmLiOuHm1Wm5H8F4c2G.x3kPZ9RZ1O8qb5Xm';

/** 7 days in seconds */
const REFRESH_TOKEN_SECONDS = 7 * 24 * 60 * 60;

// Redirect target after the Google OAuth callback. Explicit fallback chain so it
// never resolves to `undefined`. In prod, FRONTEND_URL must share an origin with
// CORS_ORIGIN.
const FRONTEND_URL =
  process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';

// ---- Helpers ----

function isSecureCookie() {
  return process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
}

function getSameSite() {
  // Production (Render cross-origin): SameSite=None required for cross-domain cookies.
  // Dev/staging: SameSite=Strict is sufficient and more secure.
  return process.env.NODE_ENV === 'production' ? 'none' : 'strict';
}

function setRefreshCookie(res, token) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: getSameSite(),
    path: '/api/v1/auth',
    maxAge: REFRESH_TOKEN_SECONDS * 1000, // ms
  });
}

function clearRefreshCookie(res) {
  res.cookie('refresh_token', '', {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: getSameSite(),
    path: '/api/v1/auth',
    maxAge: 0,
    expires: new Date(0),
  });
}

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
  );
}

// ---- POST /api/v1/auth/register ----
router.post(
  '/register',
  registerLimiter,
  sanitizeFields({ name: 'string' }),
  validate({
    name: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 255,
      messages: { required: 'Name is required' },
    },
    email: {
      required: true,
      type: 'email',
      maxLength: 255,
      messages: {
        required: 'Email is required',
        type: 'A valid email address is required',
      },
    },
    password: {
      required: true,
      type: 'string',
      minLength: 8,
      maxLength: 128,
      messages: {
        required: 'Password is required',
        minLength: 'Password must be at least 8 characters',
      },
    },
  }),
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      // Check for duplicate email
      const existing = await findUserByEmail(email);
      if (existing) {
        return res.status(409).json({
          error: {
            message: 'An account with this email already exists',
            code: 'EMAIL_TAKEN',
          },
        });
      }

      // Hash password (min 12 rounds)
      const password_hash = await bcrypt.hash(password, 12);

      // Create user
      const user = await createUser({ name, email, password_hash });

      // Issue tokens
      const accessToken = signAccessToken(user);
      const rawRefreshToken = generateRawToken();
      const tokenHash = hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_SECONDS * 1000);
      await createRefreshToken(user.id, tokenHash, expiresAt);

      setRefreshCookie(res, rawRefreshToken);

      return res.status(201).json({
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
          },
          access_token: accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---- POST /api/v1/auth/login ----
router.post(
  '/login',
  loginLimiter,
  validate({
    email: {
      required: true,
      type: 'string',
      messages: { required: 'Email is required' },
    },
    password: {
      required: true,
      type: 'string',
      messages: { required: 'Password is required' },
    },
  }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await findUserByEmail(email);

      // Timing-safe: always run bcrypt compare (use dummy hash if user not found)
      const hashToCompare = user ? user.password_hash : DUMMY_HASH;
      const passwordMatch = await bcrypt.compare(password, hashToCompare);

      if (!user || !passwordMatch) {
        return res.status(401).json({
          error: {
            message: 'Incorrect email or password',
            code: 'INVALID_CREDENTIALS',
          },
        });
      }

      // Issue tokens
      const accessToken = signAccessToken(user);
      const rawRefreshToken = generateRawToken();
      const tokenHash = hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_SECONDS * 1000);
      await createRefreshToken(user.id, tokenHash, expiresAt);

      setRefreshCookie(res, rawRefreshToken);

      return res.status(200).json({
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
          },
          access_token: accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---- POST /api/v1/auth/refresh ----
router.post('/refresh', generalAuthLimiter, async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const rawToken = cookies.refresh_token;

    if (!rawToken) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN',
        },
      });
    }

    const tokenHash = hashToken(rawToken);
    const tokenRecord = await findValidRefreshToken(tokenHash);

    if (!tokenRecord) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN',
        },
      });
    }

    // Rotate: revoke old token, issue new one
    await revokeRefreshToken(tokenHash);

    const newRawToken = generateRawToken();
    const newTokenHash = hashToken(newRawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_SECONDS * 1000);
    await createRefreshToken(tokenRecord.user_id, newTokenHash, expiresAt);

    // Generate new access token — need user data
    const user = await findUserById(tokenRecord.user_id);

    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN',
        },
      });
    }

    const accessToken = signAccessToken(user);
    setRefreshCookie(res, newRawToken);

    return res.status(200).json({
      data: {
        access_token: accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/v1/auth/logout ----
router.post('/logout', generalAuthLimiter, authenticate, async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const rawToken = cookies.refresh_token;

    // Best-effort revocation — idempotent
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await revokeRefreshToken(tokenHash);
    }

    clearRefreshCookie(res);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/v1/auth/google ----
// Initiates the Google OAuth redirect. Graceful degradation when unconfigured.
router.get('/google', generalAuthLimiter, (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    return res.redirect(`${FRONTEND_URL}/login?error=oauth_unavailable`);
  }
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
  })(req, res, next);
});

// ---- GET /api/v1/auth/google/callback ----
// Handles the OAuth callback. Issues a refresh-token cookie (no access token in
// the URL) and redirects the browser back to the frontend, where the existing
// silent-refresh picks up the session. Maps Google/passport failures to error
// redirects on /login.
router.get('/google/callback', generalAuthLimiter, (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    return res.redirect(`${FRONTEND_URL}/login?error=oauth_unavailable`);
  }

  // User cancelled on Google's consent screen.
  if (req.query.error === 'access_denied') {
    return res.redirect(`${FRONTEND_URL}/login?error=access_denied`);
  }

  passport.authenticate('google', { session: false }, async (err, user) => {
    try {
      if (err || !user) {
        return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
      }

      // Issue a refresh token (mirrors the password login/register flow).
      const rawRefreshToken = generateRawToken();
      const tokenHash = hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_SECONDS * 1000);
      await createRefreshToken(user.id, tokenHash, expiresAt);

      setRefreshCookie(res, rawRefreshToken);

      return res.redirect(FRONTEND_URL + (user._linked ? '/?linked=true' : '/'));
    } catch (e) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  })(req, res, next);
});

// ---- Google Calendar incremental consent (T-343) ----
//
// Separate from sign-in: the calendar scope is requested only when the user
// clicks "Export to Google Calendar". The initiation endpoint is an
// authenticated XHR returning the consent URL (browser redirects can't carry
// the Bearer token), with a short-lived signed JWT as the OAuth `state` so the
// callback can identify the user without a session.

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Frontend redirect target after the calendar consent callback. */
function calendarRedirect(tripId, result) {
  const path = tripId ? `/trips/${tripId}` : '/';
  return `${FRONTEND_URL}${path}?gcal=${result}`;
}

// ---- GET /api/v1/auth/google/calendar/url ----
// Returns the Google consent URL for the calendar scope. `trip_id` (optional)
// is round-tripped through the OAuth state so the callback can land the user
// back on the trip they were exporting.
router.get('/google/calendar/url', generalAuthLimiter, authenticate, (req, res) => {
  if (!isGoogleCalendarConfigured()) {
    return res.status(503).json({
      error: {
        message: 'Google Calendar export is not available.',
        code: 'GOOGLE_CALENDAR_UNAVAILABLE',
      },
    });
  }

  const tripId =
    typeof req.query.trip_id === 'string' && UUID_V4_RE.test(req.query.trip_id)
      ? req.query.trip_id
      : null;

  const state = jwt.sign(
    { uid: req.user.id, trip_id: tripId, purpose: 'gcal_connect' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' },
  );

  return res.status(200).json({ data: { url: buildGoogleCalendarAuthUrl(state) } });
});

// ---- GET /api/v1/auth/google/calendar/callback ----
// Google redirects here after consent. Verifies the signed state, exchanges
// the code for tokens, persists them, and bounces the browser back to the
// trip page (?gcal=connected|denied|error).
router.get('/google/calendar/callback', generalAuthLimiter, async (req, res) => {
  if (!isGoogleCalendarConfigured()) {
    return res.redirect(calendarRedirect(null, 'error'));
  }

  // Verify state FIRST — it identifies the user and the return trip.
  let state;
  try {
    state = jwt.verify(String(req.query.state || ''), process.env.JWT_SECRET);
    if (state.purpose !== 'gcal_connect') throw new Error('wrong purpose');
  } catch {
    return res.redirect(calendarRedirect(null, 'error'));
  }

  // tripId comes from a JWT we signed — safe to embed in the redirect path.
  const tripId = state.trip_id || null;

  // User cancelled on Google's consent screen.
  if (req.query.error === 'access_denied') {
    return res.redirect(calendarRedirect(tripId, 'denied'));
  }

  try {
    const tokens = await exchangeCodeForTokens(String(req.query.code || ''));
    await saveGoogleCalendarTokens(state.uid, tokens);
    return res.redirect(calendarRedirect(tripId, 'connected'));
  } catch {
    return res.redirect(calendarRedirect(tripId, 'error'));
  }
});

export default router;
