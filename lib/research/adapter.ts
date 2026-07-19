// lib/research/adapter.ts
// Research Library adapter — PURE. Turns Cockpit product rows into the
// Discovery "research view": each product paired with its derived ResearchScore
// (via deriveResearchScore, the single sanctioned constructor) and a
// status-aware rank. No DB / no server imports, so it is fully fixture-testable;
// the server fetch wrapper lives in lib/research/data.ts.
//
// Status-aware ordering (plan §7), fully deterministic:
//   1. audited     — first, by BEST-X score desc, then editorial top-pick, then
//                    slug; assigned a 1-based rank.
//   2. provisional — next, NO rank, slug order (no score-implied ranking).
//   3. unavailable — last, NO rank, slug order.
// Only `audited` products expose a score (`displayScore`) and a `rank`; a
// provisional/unavailable number is never surfaced as if it were precise.

import type { ProductForComparison } from '@/lib/comparison/types';
import { reviewHrefFor } from '@/lib/comparison/cta';
import { deriveResearchScore, type ResearchScore } from './types';

export interface ResearchProduct {
  product: ProductForComparison;
  research: ResearchScore;
  /** 1-based rank among AUDITED products only; null for provisional/unavailable. */
  rank: number | null;
  /** Score to display — the audited BEST-X score, or null for ANY non-audited
   *  status (never surface a provisional/unavailable number as if precise). */
  displayScore: number | null;
  /** Internal review link, or null when the product has no review (e.g. Merrill
   *  Edge) — never a dead link (E5). Drives the card's primary-CTA fallback. */
  reviewHref: string | null;
}

/** Extract the raw research provenance a ProductForComparison carries. */
function inputFor(p: ProductForComparison) {
  return {
    researchStatus: p.researchStatus ?? null,
    score: p.score,
    subScores: p.subScores,
    methodologyVersion: p.methodologyVersion ?? null,
    dataVerifiedAt: p.dataVerifiedAt,
    confidence: p.confidence,
    confidenceReason: p.confidenceReason ?? null,
    fieldSources: p.fieldSources ?? null,
  };
}

const bySlug = (a: ResearchProduct, b: ResearchProduct): number =>
  a.product.slug < b.product.slug ? -1 : a.product.slug > b.product.slug ? 1 : 0;

/**
 * Build the deterministic research view. Every input product appears in the
 * output exactly once (no product is ever dropped); ordering + rank follow the
 * status tiers above.
 *
 * @param requiredFieldKeys TopicConfig specColumn keys — the visible Tier-1
 *   facts that must each carry a field-source for `audited`.
 */
export function buildResearchView(
  products: readonly ProductForComparison[],
  requiredFieldKeys: readonly string[],
): ResearchProduct[] {
  const scored: ResearchProduct[] = products.map((product) => {
    const research = deriveResearchScore(inputFor(product), requiredFieldKeys);
    return {
      product,
      research,
      rank: null,
      displayScore: research.status === 'audited' ? research.score : null,
      reviewHref: reviewHrefFor(product),
    };
  });

  const audited = scored
    .filter((r) => r.research.status === 'audited')
    .sort((a, b) => {
      // Both are audited → displayScore is a number. Transparent BEST-X order
      // (matches the number the user sees), deterministic ties: top-pick, slug.
      const byScore = (b.displayScore ?? 0) - (a.displayScore ?? 0);
      if (byScore !== 0) return byScore;
      const byTopPick = Number(b.product.isTopPick) - Number(a.product.isTopPick);
      if (byTopPick !== 0) return byTopPick;
      return bySlug(a, b);
    })
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const provisional = scored.filter((r) => r.research.status === 'provisional').sort(bySlug);
  const unavailable = scored.filter((r) => r.research.status === 'unavailable').sort(bySlug);

  return [...audited, ...provisional, ...unavailable];
}
