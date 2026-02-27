import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const migrationsDir = join(__dirname, '../migrations');
const seedsDir = join(__dirname, '../seeds');

export default {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: migrationsDir,
    },
    seeds: {
      directory: seedsDir,
    },
  },
  staging: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: migrationsDir,
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
    migrations: {
      directory: migrationsDir,
    },
  },
};
