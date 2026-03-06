// vitest.config.ts
// Unit test runner for SmartFinPro.com
// Tests pure business logic: Zod schemas, Z-test stats, FX normalisation, spike detection
//
// Run:  npx vitest run            (CI/CD)
//       npx vitest               (watch mode)
//       npx vitest --reporter=verbose

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['lib/validation/**', 'lib/actions/revenue.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
