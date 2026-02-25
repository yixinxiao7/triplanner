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

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
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
