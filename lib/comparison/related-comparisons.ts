// lib/comparison/related-comparisons.ts
// Pure, testable extraction of the cockpit route's cross-cockpit link
// builder — previously an inline, unexported function in page.tsx, which
// meant it could only be exercised via a full Next.js render and had no
// regression test. Moved here (mirrors the money.ts / getTopicConfig
// pattern: shared cockpit logic lives in lib/comparison/, not the route
// file) so __tests__/unit/cockpit-multi-market.test.ts can assert the
// SEO addendum §7/8 "≥8 in-content internal links" gate directly, for
// every live cockpit — not just the 26 AU/CA/UK ones.
//
// CAP=8 (not 6): the 12 pre-existing US TopicConfigs set no `relatedLinks`
// at all (0, not just "fewer than the 26 new ones' 2-3") — a cap of 6 met
// the ≥8 target for AU/CA/UK (which do set 2-3 relatedLinks each) but left
// US pages at exactly 6, short of the gate. Raising the shared cap to 8
// covers every market without editing 12 individual US configs: US has 11
// other live topics to draw from (cap 8 → exactly 8, meeting the gate on
// cross-links alone); AU/UK have 8 available (capped to 8); CA has 7
// available (all 7 render, plus its own 2-3 relatedLinks comfortably clears
// 8 too).

import { getTopicConfig } from './topics/index';
import { BEST_X_MANIFEST } from './topics/manifest';
import { categoryConfig, type Category } from '@/lib/i18n/config';

export interface RelatedComparisonItem {
  href: string;
  label: string;
  categoryLabel: string;
}

export const RELATED_COMPARISONS_CAP = 8;

/** Cross-links to other live Best-X cockpits in the same market — same
 *  category first, capped at RELATED_COMPARISONS_CAP. Keeps link equity
 *  circulating inside the Best-X silo instead of every cockpit linking
 *  only back to the homepage hub. */
export function buildRelatedComparisons(market: string, category: string, topic: string): RelatedComparisonItem[] {
  // Unlike top-level marketing pages, the Best-X cockpit route always requires the
  // literal market segment — even for 'us' (see getCanonicalUrl, which never special-
  // cases 'us' to empty). A bare '/personal-finance/best/...' 301s through the proxy.
  return BEST_X_MANIFEST.filter(
    (e) => e.market === market && !e.legacy && !(e.category === category && e.topic === topic) && getTopicConfig(e.category, e.topic, e.market),
  )
    .sort((a, b) => (a.category === category ? 0 : 1) - (b.category === category ? 0 : 1))
    .slice(0, RELATED_COMPARISONS_CAP)
    .map((e) => ({
      href: `/${e.market}/${e.category}/best/${e.topic}`,
      label: e.label,
      categoryLabel: categoryConfig[e.category as Category].name,
    }));
}
