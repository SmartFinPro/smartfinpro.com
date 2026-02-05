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
