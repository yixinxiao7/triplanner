import db from '../config/database.js';

/**
 * Find a user by email address (case-insensitive).
 * @param {string} email
 * @returns {Promise<Object|undefined>}
 */
export async function findUserByEmail(email) {
  return db('users').where(db.raw('LOWER(email)'), email.toLowerCase()).first();
}

/**
 * Find a user by ID.
 * @param {string} id - UUID
 * @returns {Promise<Object|undefined>}
 */
export async function findUserById(id) {
  return db('users').where({ id }).first();
}

/**
 * Create a new user.
 * @param {Object} data - { name, email, password_hash }
 * @returns {Promise<Object>} - The created user (without password_hash)
 */
export async function createUser(data) {
  const [user] = await db('users')
    .insert({
      name: data.name,
      email: data.email.toLowerCase(),
      password_hash: data.password_hash,
    })
    .returning(['id', 'name', 'email', 'created_at']);
  return user;
}

/**
 * Find a user by their Google account ID (`profile.id`).
 * @param {string} googleId
 * @returns {Promise<Object|undefined>}
 */
export async function findUserByGoogleId(googleId) {
  return db('users').where({ google_id: googleId }).first();
}

/**
 * Create a new Google-only user (no password).
 * @param {Object} data - { name, email, google_id }
 * @returns {Promise<Object>} - The created user (without password_hash)
 */
export async function createGoogleUser(data) {
  const [user] = await db('users')
    .insert({
      name: data.name,
      email: data.email.toLowerCase(),
      google_id: data.google_id,
      password_hash: null,
    })
    .returning(['id', 'name', 'email', 'created_at']);
  return user;
}

/**
 * Link a Google account ID to an existing user (account-linking).
 * @param {string} userId - UUID
 * @param {string} googleId
 * @returns {Promise<number>} - number of rows affected
 */
export async function linkGoogleId(userId, googleId) {
  return db('users')
    .where({ id: userId })
    .update({ google_id: googleId, updated_at: db.fn.now() });
}

/**
 * Save the user's Google Calendar OAuth tokens (T-343).
 *
 * The refresh token is only overwritten when Google returns one — token
 * refreshes return a new access token without a refresh token, and clobbering
 * the stored refresh token with NULL would force re-consent.
 *
 * @param {string} userId - UUID
 * @param {Object} tokens - { access_token, refresh_token?, expiry_date? } as
 *   returned by google-auth-library (expiry_date is epoch ms).
 * @returns {Promise<number>} - number of rows affected
 */
export async function saveGoogleCalendarTokens(userId, tokens) {
  const updates = {
    google_calendar_access_token: tokens.access_token ?? null,
    google_calendar_token_expiry: tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : null,
    updated_at: db.fn.now(),
  };
  if (tokens.refresh_token) {
    updates.google_calendar_refresh_token = tokens.refresh_token;
  }
  return db('users').where({ id: userId }).update(updates);
}

/**
 * Fetch the user's stored Google Calendar OAuth tokens (T-343).
 * @param {string} userId - UUID
 * @returns {Promise<Object|undefined>} - { google_calendar_access_token,
 *   google_calendar_refresh_token, google_calendar_token_expiry }
 */
export async function getGoogleCalendarTokens(userId) {
  return db('users')
    .where({ id: userId })
    .select(
      'google_calendar_access_token',
      'google_calendar_refresh_token',
      'google_calendar_token_expiry',
    )
    .first();
}

/**
 * Clear the user's Google Calendar OAuth tokens (T-343) — used when Google
 * reports the grant was revoked (invalid_grant), so the next export restarts
 * the consent flow cleanly.
 * @param {string} userId - UUID
 * @returns {Promise<number>} - number of rows affected
 */
export async function clearGoogleCalendarTokens(userId) {
  return db('users').where({ id: userId }).update({
    google_calendar_access_token: null,
    google_calendar_refresh_token: null,
    google_calendar_token_expiry: null,
    updated_at: db.fn.now(),
  });
}
