/**
 * Migration 006 — Create activities table
 */
export async function up(knex) {
  await knex.schema.createTable('activities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('trip_id').notNullable().references('id').inTable('trips').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('location').nullable();
    table.date('activity_date').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('trip_id', 'activities_trip_id_idx');
    table.index(['trip_id', 'activity_date'], 'activities_trip_id_date_idx');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('activities');
}
