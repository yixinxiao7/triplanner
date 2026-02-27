/**
 * Migration 010 — Add `notes` field to `trips` table (T-103 / Sprint 7)
 *
 * Adds a nullable `notes TEXT` column to the `trips` table, allowing users
 * to store a freeform description or notes for a trip (max 2000 characters,
 * enforced at the API validation layer — not the DB — for flexibility).
 *
 * This is a backward-compatible, nullable column addition. Existing trips
 * receive `notes = NULL` automatically.
 *
 * Pre-approved by Manager Agent in Sprint 7 planning (2026-02-27).
 * See `.workflow/active-sprint.md` "Manager Pre-Approved Schema Change".
 */

export async function up(knex) {
  await knex.schema.alterTable('trips', (table) => {
    table.text('notes').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('trips', (table) => {
    table.dropColumn('notes');
  });
}
