/**
 * Migration 009 — Create `land_travels` table (T-086 / Sprint 6)
 *
 * Adds a new sub-resource table to track ground transportation
 * (rental cars, buses, trains, rideshares, ferries, and other modes)
 * associated with a trip. This is a net-new table with no impact on
 * existing tables or data.
 *
 * Pre-approved by Manager Agent in Sprint 6 planning (2026-02-27).
 * See `.workflow/technical-context.md` migration 009 entry.
 */

export async function up(knex) {
  await knex.schema.createTable('land_travels', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('trip_id')
      .notNullable()
      .references('id')
      .inTable('trips')
      .onDelete('CASCADE');
    table.text('mode').notNullable();
    table.text('provider').nullable();
    table.text('from_location').notNullable();
    table.text('to_location').notNullable();
    table.date('departure_date').notNullable();
    table.time('departure_time').nullable();
    table.date('arrival_date').nullable();
    table.time('arrival_time').nullable();
    table.text('confirmation_number').nullable();
    table.text('notes').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Add CHECK constraint for mode enum at the DB level (defense-in-depth)
  await knex.raw(
    `ALTER TABLE land_travels ADD CONSTRAINT land_travels_mode_check CHECK (mode IN ('RENTAL_CAR','BUS','TRAIN','RIDESHARE','FERRY','OTHER'))`,
  );

  // Index on trip_id for the common query pattern:
  //   SELECT * FROM land_travels WHERE trip_id = $1 ORDER BY departure_date ASC
  await knex.raw(`CREATE INDEX land_travels_trip_id_idx ON land_travels(trip_id)`);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('land_travels');
}
