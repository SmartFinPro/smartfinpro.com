// app/private/qa-tool-tracking-harness/page.tsx
// Dev/CI-only route for e2e/tool-tracking.spec.ts (PR 1.2). Not linked from
// anywhere on the site, not part of app/sitemap.ts (manually curated), and
// under /private/ — already disallowed for every crawler in app/robots.ts.
// See components/dev/tool-tracking-harness.tsx for why this exists instead
// of instrumenting a real tool page (that happens in PR 1.3).

import type { Metadata } from 'next';
import { ToolTrackingHarness } from '@/components/dev/tool-tracking-harness';

export const metadata: Metadata = {
  title: 'QA Harness — tool_v1 tracking',
  robots: { index: false, follow: false },
};

export default function QAToolTrackingHarnessPage() {
  return <ToolTrackingHarness />;
}
