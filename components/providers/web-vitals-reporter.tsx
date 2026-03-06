'use client';
// components/providers/web-vitals-reporter.tsx
// AP-13 Phase 4 — Real User Monitoring
// Sends LCP, INP, CLS, FCP, TTFB to /api/web-vitals (non-blocking, fire-and-forget)

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function inferMarket(pathname: string): string {
  if (pathname.startsWith('/uk')) return 'uk';
  if (pathname.startsWith('/ca')) return 'ca';
  if (pathname.startsWith('/au')) return 'au';
  return 'us';
}

interface VitalMetric {
  name: string;
  value: number;
  rating?: string;
  delta?: number;
  id: string;
  navigationType?: string;
}

interface WebVitalsModule {
  onLCP?: (fn: (m: VitalMetric) => void) => void;
  onINP?: (fn: (m: VitalMetric) => void) => void;
  onCLS?: (fn: (m: VitalMetric) => void) => void;
  onFCP?: (fn: (m: VitalMetric) => void) => void;
  onTTFB?: (fn: (m: VitalMetric) => void) => void;
  onFID?: (fn: (m: VitalMetric) => void) => void;
}

export function WebVitalsReporter() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    const send = (metric: VitalMetric) => {
      if (!['LCP', 'INP', 'CLS', 'FCP', 'TTFB', 'FID'].includes(metric.name)) return;
      const currentPath = pathnameRef.current || '/';
      const market = inferMarket(currentPath);

      const payload = JSON.stringify({
        name:           metric.name,
        value:          metric.value,
        rating:         metric.rating,
        delta:          metric.delta,
        metric_id:      metric.id,
        page_url:       currentPath,
        market,
        navigationType: metric.navigationType,
      });

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/web-vitals',
          new Blob([payload], { type: 'application/json' }),
        );
      } else {
        fetch('/api/web-vitals', {
          method:    'POST',
          body:      payload,
          headers:   { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => null);
      }
    };

    import('next/dist/compiled/web-vitals')
      .then((wv) => {
        if (cancelled) return;
        const mod = (wv as unknown as { default?: WebVitalsModule }).default ?? (wv as unknown as WebVitalsModule);

        mod.onLCP?.(send);
        mod.onINP?.(send);
        mod.onCLS?.(send);
        mod.onFCP?.(send);
        mod.onTTFB?.(send);
        mod.onFID?.(send);
      })
      .catch(() => null);

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
