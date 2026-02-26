// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for Triplanner E2E tests.
 *
 * Staging environment:
 *   - Frontend: https://localhost:4173 (Vite preview with self-signed certs)
 *   - Backend:  https://localhost:3001 (Express with self-signed certs)
 *
 * Self-signed certificates require ignoreHTTPSErrors: true.
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30000,

  use: {
    baseURL: 'https://localhost:4173',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
