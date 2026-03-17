// vitest.integration.config.ts
// Integration test runner — real DB constraints against a Supabase test instance.
//
// Run:  npm run test:integration
// Env:  SUPABASE_TEST_URL, SUPABASE_TEST_SERVICE_KEY  (in .env.test.local)
//
// Without env vars, all tests are skipped (safe for CI without a test DB).
// With env vars, a JSON report is written to ./audits/reports/ as audit evidence.

import { defineConfig } from 'vitest/config';
import path from 'path';
import { existsSync } from 'fs';
import { config as dotenvConfig } from 'dotenv';

// ── Load .env.test.local BEFORE test discovery ────────────────────────────────
// Belt-and-suspenders: try both process.cwd() and __dirname to handle ESM/CJS
// edge cases across Node versions and vitest internals.
const candidates = [
  path.resolve(process.cwd(), '.env.test.local'),
  path.resolve(__dirname, '.env.test.local'),
];
for (const envPath of candidates) {
  if (existsSync(envPath)) {
    dotenvConfig({ path: envPath, override: true });
    break;
  }
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['__tests__/integration/**/*.test.ts'],
    exclude: ['node_modules', '.next'],
    testTimeout: 15000, // DB operations may be slow
    reporters: [
      'default',
      ['json', { outputFile: './audits/reports/integration-latest.json' }],
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
