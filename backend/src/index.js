import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { createServer as createHttpsServer } from 'https';
import app from './app.js';

// Load environment-specific .env file (T-125 — .env staging isolation).
// Staging: loads .env.staging (NODE_ENV=staging set by pm2 ecosystem.config.cjs).
// Local dev / test: falls back to .env.
// This ensures backend/.env is never overwritten by staging deploys.
const nodeEnv = process.env.NODE_ENV;
const envSpecificFile = nodeEnv ? `.env.${nodeEnv}` : null;
if (envSpecificFile && existsSync(envSpecificFile)) {
  dotenv.config({ path: envSpecificFile });
} else {
  dotenv.config(); // default: loads .env
}

const PORT = process.env.PORT || 3000;
const SSL_KEY = process.env.SSL_KEY_PATH;
const SSL_CERT = process.env.SSL_CERT_PATH;

if (SSL_KEY && SSL_CERT && existsSync(SSL_KEY) && existsSync(SSL_CERT)) {
  const httpsOptions = {
    key: readFileSync(SSL_KEY),
    cert: readFileSync(SSL_CERT),
  };
  createHttpsServer(httpsOptions, app).listen(PORT, () => {
    console.log(`HTTPS Server running on https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`HTTP Server running on http://localhost:${PORT}`);
  });
}
