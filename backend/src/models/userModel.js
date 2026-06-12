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
