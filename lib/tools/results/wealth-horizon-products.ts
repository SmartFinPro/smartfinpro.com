// lib/tools/results/wealth-horizon-products.ts
// Static per-market product cards for Wealth Horizon's "Best matches for
// your retirement plan" section (Auftrag 3, User-Direktive 14.07.2026).
// Plain data only — no functions, no fetch — mirrors the BEST_X_MANIFEST
// pattern (lib/comparison/topics/manifest.ts) so it's cheap to import from
// the client island (wealth-horizon-live.tsx) and renders identically
// server-side (JS-off) and client-side.
//
// Every href is a REAL, already-existing destination — never a fabricated
// slug:
//   - kind 'offer'   → `/go/{slug}`, where {slug} is a row in the
//     `affiliate_links` table that was verified ACTIVE + health_status
//     "healthy" via the read-only list_affiliate_links tool on 2026-07-14
//     (see the task report for the exact rows checked: betterment,
//     wealthfront, fidelity-go [us]; hargreaves-lansdown [uk];
//     wealthsimple [ca]).
//   - kind 'cockpit' → an existing Best-X Compare cockpit route
//     (`/${market}/${category}/best/${topic}`, same pattern as
//     lib/comparison/related-comparisons.ts's buildRelatedComparisons) —
//     structurally enforced by
//     __tests__/unit/wealth-horizon-products.test.ts, which imports
//     BEST_X_MANIFEST and asserts every 'cockpit' href resolves to a real
//     manifest entry.
//
// No card here makes a return/performance promise — every blurb describes
// what the product IS, never what it will earn the user (SPEC 8.3 wording
// contract, same FORBIDDEN_WORDS list as the rest of Wealth Horizon).
//
// Market coverage note: AU and UK have no "healthy" affiliate_links row in
// personal-finance that fits a retirement-plan recommendation without
// stretching (AU: none at all; UK: only a mortgage broker) — AU relies
// entirely on its own cockpit routes (robo-advisors + super-funds, both
// directly retirement-relevant); UK pairs its one genuinely fitting offer
// (Hargreaves Lansdown, a general long-term investing platform, NOT one of
// the UK's several CFD/spread-betting affiliate rows, which would be an
// inappropriate recommendation under a "retirement plan" framing) with its
// investing-apps cockpit.

import type { Market } from '@/types';

export type ProductCardKind = 'offer' | 'cockpit';

export interface ProductCard {
  name: string;
  blurb: string;
  href: string;
  cta: 'View offer' | 'See the ranking';
  kind: ProductCardKind;
}

export const WEALTH_HORIZON_PRODUCTS: Record<Market, ProductCard[]> = {
  us: [
    {
      name: 'Betterment',
      blurb: 'Automated portfolio management with tax-loss harvesting and no account minimum.',
      href: '/go/betterment',
      cta: 'View offer',
      kind: 'offer',
    },
    {
      name: 'Wealthfront',
      blurb: 'Low-cost automated investing with a range of retirement account types.',
      href: '/go/wealthfront',
      cta: 'View offer',
      kind: 'offer',
    },
    {
      name: 'Fidelity Go',
      blurb: "Fidelity's robo-advisor, built around retirement-account investing.",
      href: '/go/fidelity-go',
      cta: 'View offer',
      kind: 'offer',
    },
  ],
  uk: [
    {
      name: 'Hargreaves Lansdown',
      blurb: "One of the UK's largest investing platforms, with Stocks & Shares ISA and SIPP accounts.",
      href: '/go/hargreaves-lansdown',
      cta: 'View offer',
      kind: 'offer',
    },
    {
      name: 'Best Investing Apps & ISAs',
      blurb: 'Compare UK investing apps and Stocks & Shares ISA platforms, ranked by fees.',
      href: '/uk/personal-finance/best/investing-apps',
      cta: 'See the ranking',
      kind: 'cockpit',
    },
  ],
  ca: [
    {
      name: 'Wealthsimple',
      blurb: 'A Canadian robo-advisor offering registered accounts, including TFSA and RRSP.',
      href: '/go/wealthsimple',
      cta: 'View offer',
      kind: 'offer',
    },
    {
      name: 'Best TFSA/RRSP Platforms',
      blurb: 'Compare self-directed TFSA and RRSP brokerage platforms by commissions and fees.',
      href: '/ca/tax-efficient-investing/best/tfsa-rrsp-platforms',
      cta: 'See the ranking',
      kind: 'cockpit',
    },
  ],
  au: [
    {
      name: 'Best Robo-Advisors & Micro-Investing',
      blurb: 'Compare Australian robo-advice and micro-investing apps, ranked by fees.',
      href: '/au/personal-finance/best/robo-advisors',
      cta: 'See the ranking',
      kind: 'cockpit',
    },
    {
      name: 'Best Super Funds',
      blurb: 'Compare APRA-regulated super funds by fees, ranked independently.',
      href: '/au/superannuation/best/super-funds',
      cta: 'See the ranking',
      kind: 'cockpit',
    },
  ],
};
