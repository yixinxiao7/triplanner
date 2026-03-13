import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const migrationsDir = join(__dirname, '../migrations');
const seedsDir = join(__dirname, '../seeds');

// When DATABASE_URL points to a remote host (e.g. AWS RDS), SSL is required
// regardless of NODE_ENV.  Passing ssl: { rejectUnauthorized: false } lets
// Node.js accept the RDS self-signed certificate chain without hard-coding
// the CA bundle.  Local Postgres instances (localhost / 127.x) are exempt.
const dbUrl = process.env.DATABASE_URL || '';
const isRemoteDb = dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');
const connectionConfig = isRemoteDb
  ? { connectionString: dbUrl, ssl: { rejectUnauthorized: false } }
  : dbUrl;

export default {
  development: {
    client: 'pg',
    connection: connectionConfig,
    migrations: {
      directory: migrationsDir,
    },
    seeds: {
      directory: seedsDir,
    },
  },
  staging: {
    client: 'pg',
    connection: connectionConfig,
    migrations: {
      directory: migrationsDir,
    },
  },
  production: {
    client: 'pg',
    connection: connectionConfig,
    pool: { min: 1, max: 5 },
    migrations: {
      directory: migrationsDir,
    },
  },
};
