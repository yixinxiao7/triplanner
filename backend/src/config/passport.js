/**
 * Passport.js Google OAuth 2.0 Strategy Configuration
 *
 * Configures passport-google-oauth20. Gracefully degrades when GOOGLE_CLIENT_ID
 * or GOOGLE_CLIENT_SECRET are not set — the strategy is simply not registered,
 * and the route handlers check isGoogleOAuthConfigured() and degrade gracefully.
 *
 * We use stateless auth (`session: false`), so no serializeUser/deserializeUser
 * is needed. Importing this module registers the strategy as a side effect.
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {
  findUserByGoogleId,
  findUserByEmail,
  createGoogleUser,
  linkGoogleId,
  findUserById,
} from '../models/userModel.js';

/**
 * Whether Google OAuth is configured (both env vars present).
 * @returns {boolean}
 */
export function isGoogleOAuthConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Passport verify callback for the Google strategy. Exported for unit testing
 * without a live Google round-trip.
 *
 * 3-tier lookup:
 *   1. findUserByGoogleId   → returning Google user.
 *   2. findUserByEmail      → existing password account; auto-link ONLY if the
 *                             Google email is verified (blocks takeover via an
 *                             unverified email). If matched but unverified,
 *                             reject — creating a fresh row would collide with
 *                             the unique email constraint anyway.
 *   3. createGoogleUser     → brand-new Google user.
 */
export async function verifyGoogleProfile(accessToken, refreshToken, profile, done) {
  try {
    const email = profile?.emails?.[0]?.value;
    if (!email) {
      return done(new Error('No email from Google'));
    }

    const emailVerified =
      profile?.emails?.[0]?.verified === true ||
      profile?._json?.email_verified === true;

    // 1. Returning Google user.
    const byGoogleId = await findUserByGoogleId(profile.id);
    if (byGoogleId) {
      return done(null, byGoogleId);
    }

    // 2. Existing account with this email.
    const byEmail = await findUserByEmail(email);
    if (byEmail) {
      if (!emailVerified) {
        // Unverified Google email matching an existing account: refuse to link
        // (account-takeover vector) and refuse to create (email is unique).
        return done(new Error('Google email not verified; cannot link account'));
      }
      await linkGoogleId(byEmail.id, profile.id);
      const linked = await findUserById(byEmail.id);
      return done(null, { ...linked, _linked: true });
    }

    // 3. New Google-only user.
    const name = profile.displayName || (email ? email.split('@')[0] : 'User');
    const created = await createGoogleUser({ name, email, google_id: profile.id });
    return done(null, created);
  } catch (err) {
    return done(err);
  }
}

// Register the strategy only when configured.
if (isGoogleOAuthConfigured()) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      verifyGoogleProfile,
    ),
  );
}

export default passport;
