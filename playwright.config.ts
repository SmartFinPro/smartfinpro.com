// playwright.config.ts
// E2E tests for SmartFinPro.com critical user flows.
//
// Run:  npx playwright test            (headless)
//       npx playwright test --ui       (interactive)
//       npx playwright test --headed   (with browser visible)
//
// Tests assume a running Next.js server at BASE_URL (default: http://localhost:3000).
// Set BASE_URL env var to test staging: BASE_URL=https://staging.smartfinpro.com npx playwright test

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 15_000,          // 15s per test
  expect: { timeout: 5_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // No JS execution needed for redirect tests — speeds things up
    javaScriptEnabled: false,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Automatically start the dev server when running locally (not in CI)
  // CI pipelines should start the server separately before running tests.
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: true,   // use already-running dev server if available
    timeout: 60_000,
  },
});
