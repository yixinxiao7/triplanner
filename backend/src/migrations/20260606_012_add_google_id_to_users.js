/**
 * Migration 012 — Add `google_id` to `users` and make `password_hash` nullable
 *
 * Enables Google Sign-In (OAuth 2.0 authorization-code flow). Google-only users
 * have no password, so `password_hash` becomes nullable. `google_id` stores the
 * Google account's stable subject identifier (`profile.id`).
 *
 * The unique index on `google_id` is PARTIAL (`WHERE google_id IS NOT NULL`) so
 * that many password-only users can coexist with NULL google_id while still
 * guaranteeing each Google account links to at most one row.
 *
 * Account-linking: if a Google email matches an existing password account, the
 * row is updated in place (google_id set) rather than creating a duplicate.
 */

export async function up(knex) {
  // 1. Make password_hash nullable (Google-only users have no password).
  await knex.schema.alterTable('users', (table) => {
    table.text('password_hash').nullable().alter();
  });

  // 2. Add nullable google_id column.
  await knex.schema.alterTable('users', (table) => {
    table.string('google_id', 255).nullable();
  });

  // 3. Partial unique index — unique google_id, but allow many NULLs.
  await knex.schema.raw(
    'CREATE UNIQUE INDEX users_google_id_unique ON users (google_id) WHERE google_id IS NOT NULL',
  );
}

export async function down(knex) {
  // Drop the partial unique index.
  await knex.schema.raw('DROP INDEX IF EXISTS users_google_id_unique');

  // DESTRUCTIVE: Google-only users have NULL password_hash and cannot satisfy a
  // restored NOT NULL constraint. Delete them so the rollback is deterministic
  // in dev. (Acceptable for a reversible dev migration; never run blindly in prod
  // with real Google-only accounts.)
  await knex('users').whereNull('password_hash').del();

  // Drop google_id column.
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('google_id');
  });

  // Restore NOT NULL on password_hash.
  await knex.schema.alterTable('users', (table) => {
    table.text('password_hash').notNullable().alter();
  });
}
