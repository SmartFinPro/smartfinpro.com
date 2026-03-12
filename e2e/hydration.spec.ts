// e2e/hydration.spec.ts
// Guardrail: Fail if any critical page emits a React hydration mismatch error.
//
// Checks the browser console for "hydrated" + "didn't match" patterns that
// React 19 emits when SSR HTML diverges from client render output.
//
// Run:  npx playwright test e2e/hydration.spec.ts
//       BASE_URL=http://localhost:3002 npx playwright test e2e/hydration.spec.ts

import { test, expect } from '@playwright/test';

// Critical pages to check — add more as needed
const CRITICAL_PAGES = [
  '/',                              // US homepage
  '/us/ai-tools/jasper-ai-review',  // Review page (sticky nav + exit intent)
  '/uk',                            // UK market homepage
  '/us/trading',                    // Category pillar page
];

test.describe('Hydration integrity', () => {
  // This test suite needs JS enabled (overrides the global javaScriptEnabled: false)
  test.use({ javaScriptEnabled: true });

  for (const path of CRITICAL_PAGES) {
    test(`no hydration mismatch on ${path}`, async ({ page }) => {
      const errors: string[] = [];
      const HYDRATION_PATTERNS = [
        /hydration failed/i,
        /didn['’]t match/i,
        /server rendered html/i,
        /hydration[- ]mismatch/i,
        /this tree will be regenerated on the client/i,
      ];

      const isHydrationError = (text: string) =>
        HYDRATION_PATTERNS.some((re) => re.test(text));

      // Collect console errors that match React hydration patterns
      page.on('console', (msg) => {
        if (msg.type() !== 'error' && msg.type() !== 'warning') return;
        const text = msg.text();
        if (isHydrationError(text)) {
          errors.push(text.slice(0, 300));
        }
      });

      page.on('pageerror', (err) => {
        const text = String(err?.message || '');
        if (isHydrationError(text)) {
          errors.push(text.slice(0, 300));
        }
      });

      await page.goto(path, { waitUntil: 'networkidle' });

      // Give React a moment to finish hydration
      await page.waitForTimeout(2000);

      expect(
        errors,
        `Hydration mismatch detected on ${path}:\n${errors.join('\n')}`,
      ).toHaveLength(0);
    });
  }
});
