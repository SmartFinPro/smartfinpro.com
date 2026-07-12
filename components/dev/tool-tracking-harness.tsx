'use client';

// components/dev/tool-tracking-harness.tsx
// QA-only test entry point for e2e/tool-tracking.spec.ts (PR 1.2).
//
// PR 1.2 builds the tool_v1 client binding (lib/analytics/tool-tracking.ts)
// before any real tool is instrumented (that happens in PR 1.3). The brief
// requires a JS-on Playwright spec against `createToolTracker` WITHOUT
// modifying a public tool route — this component mounts a tracker and
// exposes it on `window.__toolTrackerHarness` so the test can call its
// methods directly via page.evaluate.
//
// Not linked from anywhere in the site; served under /private/ which
// robots.ts already disallows for all crawlers, and `metadata.robots` on
// the page additionally sets noindex as defense in depth. Never used by
// production instrumentation.

import { useEffect } from 'react';
import { createToolTracker, type ToolTracker } from '@/lib/analytics/tool-tracking';
import type { ToolContext } from '@/lib/analytics/tool-events';

const HARNESS_CTX: ToolContext = {
  toolId: 'money-leak-scanner',
  market: 'us',
  variantPath: '/private/qa-tool-tracking-harness',
  shellMode: 'live-canvas',
};

declare global {
  interface Window {
    __toolTrackerHarness?: ToolTracker;
  }
}

export function ToolTrackingHarness() {
  useEffect(() => {
    const tracker = createToolTracker(HARNESS_CTX);
    window.__toolTrackerHarness = tracker;
    return () => {
      delete window.__toolTrackerHarness;
    };
  }, []);

  return <div data-testid="tool-tracking-harness-ready">QA harness: window.__toolTrackerHarness is bound.</div>;
}
