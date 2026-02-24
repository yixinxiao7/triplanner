/**
 * Migration 005 — Create stays table
 */
export async function up(knex) {
  await knex.schema.createTable('stays', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('trip_id').notNullable().references('id').inTable('trips').onDelete('CASCADE');
    table.string('category', 20).notNullable();
    table.string('name', 255).notNullable();
    table.text('address').nullable();
    table.timestamp('check_in_at', { useTz: true }).notNullable();
    table.string('check_in_tz', 50).notNullable();
    table.timestamp('check_out_at', { useTz: true }).notNullable();
    table.string('check_out_tz', 50).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('trip_id', 'stays_trip_id_idx');
  });

  // Add CHECK constraint for category values
  await knex.raw(`
    ALTER TABLE stays
    ADD CONSTRAINT stays_category_check
    CHECK (category IN ('HOTEL', 'AIRBNB', 'VRBO'))
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('stays');
}
