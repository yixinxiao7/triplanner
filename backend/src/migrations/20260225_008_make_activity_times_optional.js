/**
 * Migration 008 — Make start_time and end_time nullable on activities table (T-043)
 *
 * Allows "all day" / timeless activities where users don't want to specify
 * specific times (e.g., "Free Day", "Explore the city").
 *
 * Only changes nullability — no column type change, no new columns, no index changes.
 * Existing activities (all with non-null times) are completely unaffected.
 *
 * Pre-approved by Manager Agent on 2026-02-25 (see active-sprint.md and technical-context.md).
 */

export async function up(knex) {
  await knex.schema.alterTable('activities', (table) => {
    // Drop NOT NULL constraints — allow NULL for "all day" activities
    table.time('start_time').nullable().alter();
    table.time('end_time').nullable().alter();
  });
}

export async function down(knex) {
  // Set any NULL values to '00:00:00' before re-adding NOT NULL constraint.
  // This is a lossy rollback (timeless activities become midnight-to-midnight),
  // which is acceptable since rollback is a recovery scenario.
  await knex.raw("UPDATE activities SET start_time = '00:00:00' WHERE start_time IS NULL");
  await knex.raw("UPDATE activities SET end_time = '00:00:00' WHERE end_time IS NULL");

  await knex.schema.alterTable('activities', (table) => {
    table.time('start_time').notNullable().alter();
    table.time('end_time').notNullable().alter();
  });
}
