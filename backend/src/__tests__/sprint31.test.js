/**
 * Sprint 31 Tests — T-250
 *
 * T-250: knexfile.js staging seeds configuration
 * ─────────────────────────────────────────────────
 *   Verifies that the staging Knex config block includes a `seeds.directory`
 *   value equal to `seedsDir` (the same path used by the development block).
 *
 *   Bug: The staging block was missing `seeds: { directory: seedsDir }`,
 *   which meant `knex seed:run --env staging` would fall back to Knex's
 *   default directory (`./seeds`) instead of `backend/src/seeds/`.
 *
 *   Fix: Add `seeds: { directory: seedsDir }` to the staging block,
 *   matching the development block pattern.
 */

import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ============================================================================
// T-250 — knexfile.js staging seeds configuration
// ============================================================================

describe('T-250 — knexfile.js staging seeds configuration', () => {
  it('staging block has seeds.directory equal to seedsDir', async () => {
    const { default: knexConfig } = await import('../config/knexfile.js');

    // Derive the expected seedsDir using the same logic as knexfile.js itself.
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // knexfile.js lives in backend/src/config/ → seedsDir = backend/src/seeds/
    const configDir = join(__dirname, '../config');
    const expectedSeedsDir = join(configDir, '../seeds');

    expect(knexConfig.staging).toBeDefined();
    expect(knexConfig.staging.seeds).toBeDefined();
    expect(knexConfig.staging.seeds.directory).toBe(expectedSeedsDir);
  });

  it('staging seeds.directory matches development seeds.directory', async () => {
    const { default: knexConfig } = await import('../config/knexfile.js');

    expect(knexConfig.staging.seeds.directory).toBe(
      knexConfig.development.seeds.directory,
    );
  });

  it('staging migrations.directory is unchanged', async () => {
    const { default: knexConfig } = await import('../config/knexfile.js');

    expect(knexConfig.staging.migrations.directory).toBe(
      knexConfig.development.migrations.directory,
    );
  });

  it('production block does NOT gain a seeds block (no regression)', async () => {
    const { default: knexConfig } = await import('../config/knexfile.js');

    // Production seeds should not be present — production seeding is
    // intentionally manual to avoid accidental data injection.
    expect(knexConfig.production.seeds).toBeUndefined();
  });
});
