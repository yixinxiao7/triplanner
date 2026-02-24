/**
 * Migration 004 — Create flights table
 */
export async function up(knex) {
  await knex.schema.createTable('flights', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('trip_id').notNullable().references('id').inTable('trips').onDelete('CASCADE');
    table.string('flight_number', 20).notNullable();
    table.string('airline', 255).notNullable();
    table.string('from_location', 255).notNullable();
    table.string('to_location', 255).notNullable();
    table.timestamp('departure_at', { useTz: true }).notNullable();
    table.string('departure_tz', 50).notNullable();
    table.timestamp('arrival_at', { useTz: true }).notNullable();
    table.string('arrival_tz', 50).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('trip_id', 'flights_trip_id_idx');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('flights');
}
