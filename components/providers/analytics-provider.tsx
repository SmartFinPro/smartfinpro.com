'use client';

import { Suspense } from 'react';
import { useAnalytics } from '@/lib/hooks/use-analytics';

// ============================================================
// Analytics Provider Inner Component
// ============================================================

function AnalyticsTrackerInner() {
  // Initialize analytics with all tracking enabled
  useAnalytics({
    trackPageViews: true,
    trackScrollDepth: true,
    trackTimeOnPage: true,
  });

  return null;
}

// ============================================================
// Analytics Provider
// ============================================================
// Privacy-safe first-party analytics — no cookies, no PII, hashed IPs,
// sessionStorage only. Runs without cookie consent (same model as
// Plausible/Fathom). Justified under GDPR Art. 6(1)(f) legitimate interest.

interface AnalyticsProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export function AnalyticsProvider({ children, enabled = true }: AnalyticsProviderProps) {
  // Check feature flag
  const isEnabled =
    enabled && process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false';

  return (
    <>
      {isEnabled && (
        <Suspense fallback={null}>
          <AnalyticsTrackerInner />
        </Suspense>
      )}
      {children}
    </>
  );
}

export default AnalyticsProvider;
