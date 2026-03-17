'use client';
// components/providers/web-vitals-reporter.tsx
// AP-13 Phase 4 — Real User Monitoring via native PerformanceObserver
// Zero external dependencies — no dynamic imports that could trip Webpack

import { useEffect } from 'react';

function getMarket(path: string): string {
  if (path.startsWith('/uk')) return 'uk';
  if (path.startsWith('/ca')) return 'ca';
  if (path.startsWith('/au')) return 'au';
  return 'us';
}

function sendMetric(
  name: string,
  value: number,
  id: string,
  rating?: string,
  delta?: number,
) {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const payload = JSON.stringify({
    name,
    value,
    rating,
    delta,
    metric_id: id,
    page_url: path,
    market: getMarket(path),
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/web-vitals',
        new Blob([payload], { type: 'application/json' }),
      );
    } else {
      fetch('/api/web-vitals', {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => null);
    }
  } catch {
    // Silently ignore — vitals are non-critical
  }
}

function getRating(name: string, value: number): string {
  switch (name) {
    case 'LCP': return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'FCP': return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
    case 'CLS': return value <= 0.1  ? 'good' : value <= 0.25  ? 'needs-improvement' : 'poor';
    case 'INP': return value <= 200  ? 'good' : value <= 500   ? 'needs-improvement' : 'poor';
    case 'TTFB':return value <= 800  ? 'good' : value <= 1800  ? 'needs-improvement' : 'poor';
    default:    return 'good';
  }
}

export default function WebVitalsReporter() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

    const observers: PerformanceObserver[] = [];

    // ── LCP ──────────────────────────────────────────────────────
    try {
      let lcpValue = 0;
      const lcp = new PerformanceObserver((list) => {
        const entries = list.getEntries() as (PerformanceEntry & { startTime: number })[];
        if (entries.length > 0) {
          lcpValue = entries[entries.length - 1].startTime;
        }
      });
      lcp.observe({ type: 'largest-contentful-paint', buffered: true });
      observers.push(lcp);

      // LCP is finalised on page-hide / visibilitychange
      const finaliseLcp = () => {
        if (lcpValue > 0) {
          sendMetric('LCP', lcpValue, `lcp-${performance.now().toFixed(0)}`, getRating('LCP', lcpValue));
          lcpValue = 0;
        }
      };
      document.addEventListener('visibilitychange', finaliseLcp, { once: true });
      window.addEventListener('pagehide', finaliseLcp, { once: true });
    } catch { /* PerformanceObserver not supported */ }

    // ── FCP ──────────────────────────────────────────────────────
    try {
      const fcp = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            sendMetric('FCP', entry.startTime, `fcp-${entry.startTime.toFixed(0)}`, getRating('FCP', entry.startTime));
          }
        }
      });
      fcp.observe({ type: 'paint', buffered: true });
      observers.push(fcp);
    } catch { /* not supported */ }

    // ── CLS ──────────────────────────────────────────────────────
    try {
      let clsValue = 0;
      let clsSessionStart = 0;
      let clsSessionValue = 0;
      const cls = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number; startTime: number })[]) {
          if (!entry.hadRecentInput) {
            if (entry.startTime - clsSessionStart > 1000 || clsSessionStart === 0) {
              clsSessionStart = entry.startTime;
              clsSessionValue = 0;
            }
            clsSessionValue += entry.value;
            if (clsSessionValue > clsValue) clsValue = clsSessionValue;
          }
        }
      });
      cls.observe({ type: 'layout-shift', buffered: true });
      observers.push(cls);

      const finaliseCls = () => {
        if (clsValue > 0) {
          sendMetric('CLS', clsValue, `cls-${performance.now().toFixed(0)}`, getRating('CLS', clsValue));
        }
      };
      document.addEventListener('visibilitychange', finaliseCls, { once: true });
      window.addEventListener('pagehide', finaliseCls, { once: true });
    } catch { /* not supported */ }

    // ── INP ──────────────────────────────────────────────────────
    try {
      let inpValue = 0;
      const inp = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { processingStart: number; startTime: number; duration: number })[]) {
          const duration = entry.processingStart
            ? entry.processingStart - entry.startTime + (entry.duration - (entry.processingStart - entry.startTime))
            : entry.duration;
          if (duration > inpValue) inpValue = duration;
        }
      });
      inp.observe({ type: 'event', ...({ durationThreshold: 40 } as object), buffered: true } as PerformanceObserverInit);
      observers.push(inp);

      const finaliseInp = () => {
        if (inpValue > 0) {
          sendMetric('INP', inpValue, `inp-${performance.now().toFixed(0)}`, getRating('INP', inpValue));
          inpValue = 0;
        }
      };
      document.addEventListener('visibilitychange', finaliseInp, { once: true });
      window.addEventListener('pagehide', finaliseInp, { once: true });
    } catch { /* not supported */ }

    // ── TTFB ─────────────────────────────────────────────────────
    try {
      const navEntries = performance.getEntriesByType('navigation') as (PerformanceEntry & { responseStart: number })[];
      if (navEntries.length > 0) {
        const ttfb = navEntries[0].responseStart;
        if (ttfb > 0) {
          sendMetric('TTFB', ttfb, `ttfb-${ttfb.toFixed(0)}`, getRating('TTFB', ttfb));
        }
      }
    } catch { /* not supported */ }

    return () => {
      observers.forEach((o) => { try { o.disconnect(); } catch { /* ignore */ } });
    };
  }, []);

  return null;
}
