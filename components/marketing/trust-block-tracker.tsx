'use client';

import { useEffect, useRef } from 'react';

/**
 * Invisible tracking pixel that fires an analytics event when a trust
 * block scrolls into view. Uses Intersection Observer (fires once).
 *
 * Usage in Server Component:
 *   <TrustBlockTracker block="editorial-transparency" slug="/us/..." />
 *
 * Events land in analytics_events via POST /api/track with:
 *   eventName: 'trust_block_view'
 *   eventCategory: 'eeat'
 *   eventLabel: block name (e.g. 'not-for-you', 'editorial-transparency')
 */
export function TrustBlockTracker({
  block,
  slug,
  market,
}: {
  block: string;
  slug: string;
  market?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Fire-and-forget analytics event
          fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'event',
              sessionId: getSessionId(),
              data: {
                eventName: 'trust_block_view',
                eventCategory: 'eeat',
                eventAction: 'view',
                eventLabel: block,
                pagePath: slug,
                properties: { block, market: market || 'us' },
              },
            }),
          }).catch(() => {});

          // Only fire once per page load
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [block, slug, market]);

  // Invisible 1px element — zero layout impact
  return <div ref={ref} aria-hidden="true" className="h-px w-px" />;
}

/** Stable per-session ID (survives SPA navigations, resets on tab close) */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = sessionStorage.getItem('sfp_sid');
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; // safe — sessionStorage branch, client-only
    sessionStorage.setItem('sfp_sid', id);
  }
  return id;
}
