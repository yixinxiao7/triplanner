import 'dotenv/config';

export default {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: '../migrations',
    },
    seeds: {
      directory: '../seeds',
    },
  },
  staging: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: '../migrations',
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
    migrations: {
      directory: '../migrations',
    },
  },
};
