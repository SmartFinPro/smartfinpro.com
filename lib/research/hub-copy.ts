// lib/research/hub-copy.ts
// Per-market copy + metadata for the four universal Research hub routes
// (unified-research-discovery-pr2-hubs plan, Task 2; spec §7.2). Four
// literal per-market values only — title, h1, description, eyebrow,
// areaServed — never derived or interpolated from one another, so each
// market's rendered <title> (with the root layout's `title.template`
// `" | SmartFinPro"` suffix, app/layout.tsx) and description length can be
// independently asserted against the 45-60 / 140-160 char SERP targets
// (__tests__/unit/research-hub-copy.test.ts).
//
// Keyword ownership (spec §1 positioning, carried over from the former
// US-only pilot comment in app/(marketing)/research/page.tsx): the Research
// hubs own research/verified-data/sources search intent. This copy must
// never reach for "best X" or "comparison" (the Cockpit's keywords) or
// "[Brand] review" (the MDX reviews' keywords) — the hub links OUT to both,
// it does not compete with them.
//
// IMPORTANT — do NOT build the languages map with generateAlternates()
// (lib/seo/hreflang.ts). Its marketPathUrl() only special-cases the bare '/'
// path for the US market, so generateAlternates('/research') would emit
// '/us/research' for the US hreflang entry — wrong, because the US hub lives
// at the unprefixed '/research' (US never gets a market-prefixed path here,
// unlike every other silo page). researchBaseForMarket() (already exported
// and 4x4-tested in lib/research/catalog-shell-logic.ts) is the single
// source of truth for that mapping, so the languages map below is built
// directly from it instead.

import type { Metadata } from 'next';
import type { Market } from '@/lib/i18n/config';
import { marketConfig, markets } from '@/lib/i18n/config';
import { researchBaseForMarket } from '@/lib/research/catalog-shell-logic';

export interface ResearchHubCopy {
  metadataTitle: string;
  h1: string;
  description: string;
  eyebrow: string;
  areaServed: string[];
}

const HUB_COPY: Record<Market, ResearchHubCopy> = {
  us: {
    metadataTitle: 'US Financial Product Research Library',
    h1: 'US Financial Product Research',
    description:
      'Explore independent US financial product reviews and verified research dossiers, with transparent ratings, dated evidence and direct comparison paths.',
    eyebrow: 'SmartFinPro Research · United States',
    areaServed: ['US'],
  },
  uk: {
    metadataTitle: 'UK Financial Product Research Library',
    h1: 'UK Financial Product Research',
    description:
      'Explore independent UK financial product reviews and verified research dossiers, with transparent ratings, dated evidence and direct comparison paths.',
    eyebrow: 'SmartFinPro Research · United Kingdom',
    areaServed: ['GB'],
  },
  ca: {
    metadataTitle: 'Canada Financial Product Research Library',
    h1: 'Canadian Financial Product Research',
    description:
      'Explore independent Canadian financial product reviews and verified research dossiers, with transparent ratings, dated evidence and comparison paths.',
    eyebrow: 'SmartFinPro Research · Canada',
    areaServed: ['CA'],
  },
  au: {
    metadataTitle: 'Australia Financial Product Research Library',
    h1: 'Australian Financial Product Research',
    description:
      'Explore independent Australian financial product reviews and verified research dossiers, with transparent ratings, dated evidence and comparison paths.',
    eyebrow: 'SmartFinPro Research · Australia',
    areaServed: ['AU'],
  },
};

export const getResearchHubCopy = (market: Market): ResearchHubCopy =>
  HUB_COPY[market];

/** researchBaseForMarket()-keyed languages map (spec §7.2) — see file header
 *  for why this is not generateAlternates(). x-default always points at the
 *  unprefixed US hub, matching every other x-default in the site. */
const languages: Record<string, string> = Object.fromEntries(
  markets.map((market) => [
    marketConfig[market].hreflang,
    researchBaseForMarket(market),
  ]),
);
languages['x-default'] = '/research';

export function metadataForResearchMarket(market: Market): Metadata {
  const copy = getResearchHubCopy(market);
  const canonical = researchBaseForMarket(market);
  return {
    title: copy.metadataTitle,
    description: copy.description,
    alternates: { canonical, languages },
    openGraph: {
      title: copy.metadataTitle,
      description: copy.description,
      type: 'website',
      url: canonical,
    },
  };
}
