/**
 * Migration 013 — Google Calendar export (T-343)
 *
 * users: stores the OAuth tokens obtained when the user grants the
 * `https://www.googleapis.com/auth/calendar` scope (incremental consent,
 * requested only when the user clicks "Export to Google Calendar" — separate
 * from the sign-in flow, which only asks for profile/email).
 *
 * trips: `google_calendar_id` tracks the dedicated Google calendar created for
 * the trip, so a re-export can delete and recreate it instead of duplicating
 * events in the user's primary calendar.
 */

export async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.text('google_calendar_access_token').nullable();
    table.text('google_calendar_refresh_token').nullable();
    table.timestamp('google_calendar_token_expiry', { useTz: true }).nullable();
  });

  await knex.schema.alterTable('trips', (table) => {
    table.string('google_calendar_id', 255).nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('trips', (table) => {
    table.dropColumn('google_calendar_id');
  });

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('google_calendar_access_token');
    table.dropColumn('google_calendar_refresh_token');
    table.dropColumn('google_calendar_token_expiry');
  });
}
