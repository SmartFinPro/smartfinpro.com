'use client';

// components/marketing/cockpit-impression.tsx
// Layout-neutral impression wrapper: a plain block <div> observed by one
// IntersectionObserver that fires onImpress exactly once per mount, then
// disconnects. Session-level dedup lives in the tracking layer (the caller's
// viewOnce/productImpressionOnce), NOT here. SSR-safe: children render
// identically on the server; the observer only exists inside useEffect.

import { useEffect, useRef, type ReactNode } from 'react';

export interface CockpitImpressionProps {
  onImpress: () => void;
  /** 0 for containers taller than the viewport (fractional thresholds would
   *  never fire there); 0.35 for cards / verdict picks. */
  threshold?: number;
  children: ReactNode;
}

export function CockpitImpression({ onImpress, threshold = 0.35, children }: CockpitImpressionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  const onImpressRef = useRef(onImpress);
  onImpressRef.current = onImpress;

  useEffect(() => {
    const el = ref.current;
    if (!el || fired.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true;
            try {
              onImpressRef.current();
            } catch {
              // Tracking must never break the page.
            }
            observer.disconnect();
          }
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return <div ref={ref}>{children}</div>;
}
