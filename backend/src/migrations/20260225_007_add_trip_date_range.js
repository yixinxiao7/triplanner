/**
 * Migration 007 — Add start_date and end_date columns to trips table (T-029)
 *
 * Adds nullable DATE columns so users can set a trip date range.
 * Both columns are DATE (calendar-level, no timezone) and default to NULL.
 * Existing trips are unaffected — they will have NULL for both fields.
 *
 * Pre-approved by Manager Agent on 2026-02-25 (see active-sprint.md and technical-context.md).
 */

export async function up(knex) {
  await knex.schema.alterTable('trips', (table) => {
    // DATE type (no timezone) — trip start/end are calendar dates, not precise timestamps
    table.date('start_date').nullable();
    table.date('end_date').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('trips', (table) => {
    table.dropColumn('start_date');
    table.dropColumn('end_date');
  });
}
