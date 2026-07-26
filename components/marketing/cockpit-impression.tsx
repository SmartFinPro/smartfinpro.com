'use client';

// components/marketing/cockpit-impression.tsx
// Layout-neutral impression wrapper: a plain block <div> observed by an
// IntersectionObserver that fires onImpress once per `resetKey` value, then
// disconnects. Session-level dedup lives in the tracking layer (the caller's
// viewOnce/productImpressionOnce), NOT here. SSR-safe: children render
// identically on the server; the observer only exists inside useEffect.
//
// `resetKey` re-arms the observer when it changes (e.g. a product's rank
// after a re-sort). If the wrapped element is STILL intersecting when the
// new observer attaches, IntersectionObserver's initial callback fires
// immediately with the current state — so a product that never left the
// viewport still gets a fresh impression at its new rank. Omit resetKey for
// classic fire-once-per-mount semantics (root/surface-level impressions).

import { useEffect, useRef, type ReactNode } from 'react';

export interface CockpitImpressionProps {
  onImpress: () => void;
  /** 0 for containers taller than the viewport (fractional thresholds would
   *  never fire there); 0.35 for cards / verdict picks. */
  threshold?: number;
  /** When provided, allows a fresh impression whenever this value changes
   *  (e.g. `rank`) — keeps impression rank in sync with click rank after a
   *  re-sort/re-filter instead of freezing at the first-seen position. */
  resetKey?: string | number;
  children: ReactNode;
}

export function CockpitImpression({ onImpress, threshold = 0.35, resetKey, children }: CockpitImpressionProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Tracks the resetKey value we last fired for. `hasFired: false` covers the
  // pre-first-fire state so it's never confused with "already fired for
  // resetKey===undefined" (the no-resetKey / fire-once-ever case).
  const firedFor = useRef<{ hasFired: boolean; key: string | number | undefined }>({
    hasFired: false,
    key: undefined,
  });
  const onImpressRef = useRef(onImpress);
  onImpressRef.current = onImpress;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (firedFor.current.hasFired && firedFor.current.key === resetKey) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (firedFor.current.hasFired && firedFor.current.key === resetKey) continue;
          firedFor.current = { hasFired: true, key: resetKey };
          try {
            onImpressRef.current();
          } catch {
            // Tracking must never break the page.
          }
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, resetKey]);

  return <div ref={ref}>{children}</div>;
}
