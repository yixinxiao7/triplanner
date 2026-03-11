/**
 * Seed: test_user
 *
 * Creates a persistent test user for Monitor Agent health checks.
 * Uses POST /api/v1/auth/login instead of /register so that health checks
 * do not consume rate-limit quota on the registration endpoint.
 *
 * Credentials:
 *   email:    test@triplanner.local
 *   password: TestPass123!
 *
 * Idempotent: uses ON CONFLICT (email) DO NOTHING — safe to re-run at any time.
 * The existing password_hash is preserved if the user already exists.
 *
 * Usage (via Knex CLI):
 *   NODE_ENV=staging knex --knexfile src/config/knexfile.js seed:run --specific test_user.js
 */

import bcrypt from 'bcryptjs';

const TEST_NAME = 'Test User';
const TEST_EMAIL = 'test@triplanner.local';
const TEST_PASSWORD = 'TestPass123!';
const BCRYPT_ROUNDS = 12;

export async function seed(knex) {
  const password_hash = await bcrypt.hash(TEST_PASSWORD, BCRYPT_ROUNDS);

  await knex('users')
    .insert({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password_hash,
    })
    .onConflict('email')
    .ignore(); // Idempotent — skip if test user already exists
}
