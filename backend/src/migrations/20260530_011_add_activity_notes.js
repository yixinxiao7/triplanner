/**
 * Migration 011 — Add `notes` field to `activities` table (T-331 / Sprint 43)
 *
 * Adds a nullable `notes TEXT` column to the `activities` table, allowing users
 * to attach freeform context to an activity — reservation numbers, confirmation
 * codes, dress codes, "bring passport", etc. (feedback item B-036). Max 2000
 * characters, enforced at the API validation layer (not the DB) for flexibility,
 * consistent with the `trips.notes` pattern (migration 010).
 *
 * This is a backward-compatible, nullable column addition. Existing activities
 * receive `notes = NULL` automatically — no existing rows or queries are impacted.
 *
 * Pre-approved by Manager Agent in Sprint 43 planning (2026-05-30).
 * See `.workflow/active-sprint.md` "Manager schema approval" and
 * `.workflow/architecture-decisions.md` ADR for activity notes.
 */

export async function up(knex) {
  await knex.schema.alterTable('activities', (table) => {
    table.text('notes').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('activities', (table) => {
    table.dropColumn('notes');
  });
}
