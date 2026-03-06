'use client';
// components/providers/web-vitals-reporter.tsx
// AP-13 Phase 4 — Real User Monitoring via useReportWebVitals
// Sends LCP, INP, CLS, FCP, TTFB to /api/web-vitals (non-blocking, fire-and-forget)

import { useReportWebVitals } from 'next/web-vitals';
import { usePathname } from 'next/navigation';

function inferMarket(pathname: string): string {
  if (pathname.startsWith('/uk')) return 'uk';
  if (pathname.startsWith('/ca')) return 'ca';
  if (pathname.startsWith('/au')) return 'au';
  return 'us';
}

export function WebVitalsReporter() {
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    // Only track meaningful metrics
    if (!['LCP', 'INP', 'CLS', 'FCP', 'TTFB', 'FID'].includes(metric.name)) return;

    // Fire-and-forget — never block the main thread
    const payload = {
      name:            metric.name,
      value:           metric.value,
      rating:          metric.rating,
      delta:           metric.delta,
      metric_id:       metric.id,
      page_url:        pathname,
      market:          inferMarket(pathname),
      navigationType:  (metric as { navigationType?: string }).navigationType,
    };

    // Use sendBeacon when available (more reliable on page unload)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/web-vitals',
        new Blob([JSON.stringify(payload)], { type: 'application/json' }),
      );
    } else {
      fetch('/api/web-vitals', {
        method:     'POST',
        body:       JSON.stringify(payload),
        headers:    { 'Content-Type': 'application/json' },
        keepalive:  true,
      }).catch(() => null);
    }
  });

  return null; // renders nothing
}
