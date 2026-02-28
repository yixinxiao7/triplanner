import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load TLS certificates if they exist (for HTTPS staging preview)
const certPath = resolve(__dirname, '../infra/certs/localhost.pem');
const keyPath = resolve(__dirname, '../infra/certs/localhost-key.pem');
const hasCerts = existsSync(certPath) && existsSync(keyPath);

const httpsConfig = hasCerts
  ? { cert: readFileSync(certPath), key: readFileSync(keyPath) }
  : undefined;

// Dev proxy configuration:
//   Local development:  BACKEND_PORT unset → port 3000 (matches backend/.env.example PORT=3000)
//   Staging dev mode:   BACKEND_PORT=3001 npm run dev (backend/.env staging uses PORT=3001 + HTTPS)
//
// When BACKEND_SSL=true (e.g. when running against the staging backend on port 3001 with TLS),
// the proxy uses https:// and skips self-signed certificate verification.
const backendPort = process.env.BACKEND_PORT || '3000';
const backendSSL = process.env.BACKEND_SSL === 'true';
const backendProtocol = backendSSL ? 'https' : 'http';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `${backendProtocol}://localhost:${backendPort}`,
        changeOrigin: true,
        // Allow self-signed certs when proxying to the local staging backend
        ...(backendSSL ? { secure: false } : {}),
      },
    },
  },
  preview: {
    port: 4173,
    https: httpsConfig,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
  },
});
