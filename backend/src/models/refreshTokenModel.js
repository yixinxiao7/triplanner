import crypto from 'crypto';
import db from '../config/database.js';

/**
 * Hash a raw opaque token using SHA-256.
 * @param {string} rawToken
 * @returns {string}
 */
export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generate a cryptographically random opaque refresh token.
 * @returns {string}
 */
export function generateRawToken() {
  return crypto.randomBytes(40).toString('hex');
}

/**
 * Store a new refresh token in the database.
 * @param {string} userId
 * @param {string} tokenHash - SHA-256 hash of the raw token
 * @param {Date} expiresAt
 * @returns {Promise<Object>}
 */
export async function createRefreshToken(userId, tokenHash, expiresAt) {
  const [token] = await db('refresh_tokens')
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .returning(['id', 'user_id', 'expires_at', 'created_at']);
  return token;
}

/**
 * Find a valid (non-revoked, non-expired) refresh token by its hash.
 * @param {string} tokenHash
 * @returns {Promise<Object|undefined>}
 */
export async function findValidRefreshToken(tokenHash) {
  return db('refresh_tokens')
    .where({ token_hash: tokenHash, revoked_at: null })
    .where('expires_at', '>', new Date())
    .first();
}

/**
 * Revoke a refresh token by setting revoked_at = now().
 * @param {string} tokenHash
 * @returns {Promise<number>} - number of rows affected
 */
export async function revokeRefreshToken(tokenHash) {
  return db('refresh_tokens')
    .where({ token_hash: tokenHash })
    .update({ revoked_at: new Date() });
}
