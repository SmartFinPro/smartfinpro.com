'use client';
// components/reviews/review-section-nav.tsx — V2 sticky section nav (T10)
// ============================================================
// Client Component — the ONE 'use client' component this plan step allows
// ("Server Components außer SectionNav"), legitimate here because scroll-spy
// needs a live IntersectionObserver, which cannot run in a Server Component.
//
// Renders EXACTLY the 7 REVIEW_V2_ANCHORS entries (imported from
// lib/reviews/section-anchors.ts — never hand-typed; T0a/T10) as a single
// narrow row meant to sit directly under ReviewHeader. Desktop: one
// horizontal row, no wrap. Mobile: the ONE explicitly-allowed
// horizontal-scroll exception in the whole review redesign (plan Regel) —
// no drawer, ever.
//
// Sticky mechanic: CSS `position: sticky` rather than the fixed+translateY
// visibility toggle components/marketing/sticky-review-nav.tsx uses. That
// component is an overlay hidden by default (translate-y-full) that only
// slides into view once its hero sentinel exits — it needs JS to decide
// *whether to be visible at all*. SectionNav is part of normal document flow
// from first paint and only needs to *pin* once scrolled to, which
// `position: sticky` handles natively with no JS and no layout-shift.
// `topOffset` mirrors the already-proven `top-[64px]` convention from
// components/marketing/sticky-toc.tsx (a closer functional precedent for
// "narrow sub-nav pinned under the site's fixed global header" than
// sticky-review-nav.tsx, which is a promotional CTA bar).
//
// Scroll-spy reuses the IntersectionObserver *technique* referenced from
// both sticky-review-nav.tsx (Sentinel-Muster) and sticky-toc.tsx: every
// anchor id's DOM node is observed, and the topmost currently-intersecting
// one is marked active.
//
// Integration note for T13 (ReviewLayoutV2 mounts this component): the two
// layout-owned anchors ('verdict', 'alternatives') need a DOM element with
// `id="verdict"` / `id="alternatives"` (e.g. a wrapper around VerdictCard /
// AlternativesSection) for scroll-spy to find them — the 5 mdx-owned ids
// already get their `id` from the article's own H2 headings.
//
// Height budget: ≤48px total (plan Pflicht) — single row, fixed line-height,
// compact padding. No CTA, no rating — those belong to VerdictCard /
// DecisionBridge, never duplicated here (T0a: one verdict, one visual
// hierarchy).
// ============================================================

import { useEffect, useState } from 'react';
import { REVIEW_V2_ANCHORS } from '@/lib/reviews/section-anchors';

/** Total nav row height in px — plan Pflicht: ≤48px. */
const NAV_HEIGHT = 44;

export interface ReviewSectionNavProps {
  /** Pixel offset from the top of the viewport once pinned — matches the site's fixed global header height (sticky-toc.tsx convention: 64). */
  topOffset?: number;
}

export function ReviewSectionNav({ topOffset = 64 }: ReviewSectionNavProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const targets = REVIEW_V2_ANCHORS.map((anchor) => document.getElementById(anchor.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: `-${topOffset + 8}px 0px -70% 0px`, threshold: 0 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [topOffset]);

  return (
    <nav
      aria-label="Review sections"
      className="not-prose"
      style={{
        position: 'sticky',
        top: `${topOffset}px`,
        zIndex: 30,
        display: 'flex',
        alignItems: 'stretch',
        overflowX: 'auto',
        height: `${NAV_HEIGHT}px`,
        maxHeight: '48px',
        background: '#fff',
        borderBottom: '1px solid var(--sfp-hairline)',
        fontFamily: 'var(--font-primary)',
        whiteSpace: 'nowrap',
      }}
    >
      {REVIEW_V2_ANCHORS.map((anchor) => {
        const isActive = activeId === anchor.id;
        return (
          <a
            key={anchor.id}
            href={`#${anchor.id}`}
            aria-current={isActive ? 'true' : undefined}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--sfp-navy)' : 'var(--sfp-slate)',
              textDecoration: 'none',
              borderBottom: isActive ? '2px solid var(--sfp-navy)' : '2px solid transparent',
            }}
          >
            {anchor.title}
          </a>
        );
      })}
    </nav>
  );
}
