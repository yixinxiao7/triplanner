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
