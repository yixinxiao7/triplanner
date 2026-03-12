import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { createServer as createHttpsServer } from 'https';

// Load environment-specific .env file (T-125 — .env staging isolation).
// Staging: loads .env.staging (NODE_ENV=staging set by pm2 ecosystem.config.cjs).
// Local dev / test: falls back to .env.
// This ensures backend/.env is never overwritten by staging deploys.
//
// IMPORTANT (T-228 Fix B — ESM dotenv hoisting):
// Static ESM `import` statements are hoisted to the top of the module by the
// JavaScript engine, meaning they execute BEFORE any statement in the module
// body — including dotenv.config(). As a result, if `app.js` is imported via a
// static import, the cors() middleware reads process.env.CORS_ORIGIN while it
// is still undefined, permanently capturing the fallback 'http://localhost:5173'.
//
// Fix: call dotenv.config() first (possible because dotenv and fs are pure Node
// built-ins that do not read CORS_ORIGIN at import time), then load app.js via
// a dynamic import(). Top-level await is valid in Node.js ESM modules.
const nodeEnv = process.env.NODE_ENV;
const envSpecificFile = nodeEnv ? `.env.${nodeEnv}` : null;
if (envSpecificFile && existsSync(envSpecificFile)) {
  dotenv.config({ path: envSpecificFile });
} else {
  dotenv.config(); // default: loads .env
}

// Dynamic import: app.js is now evaluated AFTER dotenv has populated process.env,
// so cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }) will
// correctly read the configured origin (e.g. 'https://localhost:4173' on staging).
const { default: app } = await import('./app.js');

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
