/**
 * Migration 002 — Create refresh_tokens table
 */
export async function up(knex) {
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('token_hash').notNullable().unique();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('revoked_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('user_id', 'refresh_tokens_user_id_idx');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('refresh_tokens');
}
