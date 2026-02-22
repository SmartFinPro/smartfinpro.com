'use client';

import { Suspense, useState, useEffect } from 'react';
import { useAnalytics } from '@/lib/hooks/use-analytics';
import { getCookieConsent, type CookieConsentValue } from '@/components/marketing/cookie-consent';

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

  // Track cookie consent state — only enable analytics when user accepts all cookies
  const [consent, setConsent] = useState<CookieConsentValue>(null);

  useEffect(() => {
    // Check consent on mount
    setConsent(getCookieConsent());

    // Listen for consent changes when user interacts with the banner
    function handleConsentUpdate() {
      setConsent(getCookieConsent());
    }

    window.addEventListener('cookie-consent-updated', handleConsentUpdate);
    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentUpdate);
    };
  }, []);

  const analyticsAllowed = isEnabled && consent === 'all';

  return (
    <>
      {analyticsAllowed && (
        <Suspense fallback={null}>
          <AnalyticsTrackerInner />
        </Suspense>
      )}
      {children}
    </>
  );
}

export default AnalyticsProvider;
