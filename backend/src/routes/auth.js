import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { parse as parseCookies } from 'cookie';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  findUserByEmail,
  findUserById,
  createUser,
} from '../models/userModel.js';
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

// ---- Rate limiters (T-028 / B-011) ----

/**
 * Shared rate limit handler — returns a structured JSON 429 matching the API error contract.
 */
function rateLimitHandler(req, res) {
  res.status(429).json({
    error: {
      message: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  });
}

/** Strict limiter for login — 10 requests per 15 minutes per IP (brute-force protection) */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,   // Send standard RateLimit-* headers (includes Retry-After)
  legacyHeaders: false,    // Do NOT send legacy X-RateLimit-* headers
  handler: rateLimitHandler,
});

/** Looser limiter for register — 20 requests per 15 minutes per IP */
const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/** General limiter for refresh and logout — 30 requests per 15 minutes per IP */
const generalAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ---- Helpers ----

function setRefreshCookie(res, token) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: REFRESH_TOKEN_SECONDS * 1000, // ms
  });
}

function clearRefreshCookie(res) {
  res.cookie('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
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
  registerRateLimiter,
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
  loginRateLimiter,
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
router.post('/refresh', generalAuthRateLimiter, async (req, res, next) => {
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
router.post('/logout', generalAuthRateLimiter, authenticate, async (req, res, next) => {
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

export default router;
