import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const migrationsDir = join(__dirname, '../migrations');
const seedsDir = join(__dirname, '../seeds');

// Build a pg connection config that always disables certificate verification for
// remote hosts (e.g. AWS RDS).  We deliberately avoid passing `connectionString`
// alongside `ssl` because pg-connection-string treats `sslmode=require` (and
// `prefer`/`verify-ca`) as `verify-full`, which overrides any explicit
// `rejectUnauthorized: false` we pass.  Decomposing the URL into individual
// fields bypasses that parsing and lets our ssl option take full effect.
function buildConnectionConfig(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(u.hostname);
    if (isLocal) return url; // keep plain string for local dev
    return {
      host: u.hostname,
      port: Number(u.port) || 5432,
      database: u.pathname.replace(/^\//, ''),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      ssl: { rejectUnauthorized: false },
    };
  } catch {
    return url; // not a valid URL — fall back to raw string
  }
}

const connectionConfig = buildConnectionConfig(process.env.DATABASE_URL || '');

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
