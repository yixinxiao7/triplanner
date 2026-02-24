/**
 * Migration 003 — Create trips table
 */
export async function up(knex) {
  await knex.schema.createTable('trips', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    // destinations stored as PostgreSQL TEXT array
    table.specificType('destinations', 'TEXT[]').notNullable().defaultTo('{}');
    table.string('status', 20).notNullable().defaultTo('PLANNING');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('user_id', 'trips_user_id_idx');
  });

  // Add CHECK constraint for status values
  await knex.raw(`
    ALTER TABLE trips
    ADD CONSTRAINT trips_status_check
    CHECK (status IN ('PLANNING', 'ONGOING', 'COMPLETED'))
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('trips');
}
