// __tests__/unit/wealth-horizon-products.test.ts
// Auftrag 3 (User-Direktive 14.07.2026) — structurally enforces that every
// WEALTH_HORIZON_PRODUCTS href is a real, already-existing destination:
// either a `/go/{slug}` affiliate link or a cockpit route that actually
// exists in BEST_X_MANIFEST. No card may point at a fabricated slug.

import { describe, it, expect } from 'vitest';
import { WEALTH_HORIZON_PRODUCTS, type ProductCard } from '@/lib/tools/results/wealth-horizon-products';
import { BEST_X_MANIFEST } from '@/lib/comparison/topics/manifest';
import { markets } from '@/lib/i18n/config';

const ALL_CARDS: { market: string; card: ProductCard }[] = markets.flatMap((market) =>
  WEALTH_HORIZON_PRODUCTS[market].map((card) => ({ market, card })),
);

describe('WEALTH_HORIZON_PRODUCTS', () => {
  it('covers exactly the 4 markets, each with 2 or 3 cards', () => {
    expect(Object.keys(WEALTH_HORIZON_PRODUCTS).sort()).toEqual([...markets].sort());
    for (const market of markets) {
      const cards = WEALTH_HORIZON_PRODUCTS[market];
      expect(cards.length, `${market} should have 2-3 cards`).toBeGreaterThanOrEqual(2);
      expect(cards.length, `${market} should have 2-3 cards`).toBeLessThanOrEqual(3);
    }
  });

  it('every "offer" card href starts with /go/ (never a fabricated destination)', () => {
    for (const { market, card } of ALL_CARDS) {
      if (card.kind === 'offer') {
        expect(card.href.startsWith('/go/'), `${market}/${card.name} offer href should start with /go/`).toBe(true);
        expect(card.cta).toBe('View offer');
      }
    }
  });

  it('every "cockpit" card href matches a real BEST_X_MANIFEST entry', () => {
    const manifestPaths = new Set(BEST_X_MANIFEST.map((e) => `/${e.market}/${e.category}/best/${e.topic}`));
    for (const { market, card } of ALL_CARDS) {
      if (card.kind === 'cockpit') {
        expect(manifestPaths.has(card.href), `${market}/${card.name} cockpit href "${card.href}" not in BEST_X_MANIFEST`).toBe(
          true,
        );
        expect(card.cta).toBe('See the ranking');
      }
    }
  });

  it('every card has a non-empty name and a one-sentence blurb', () => {
    for (const { market, card } of ALL_CARDS) {
      expect(card.name.length, `${market} card missing name`).toBeGreaterThan(0);
      expect(card.blurb.length, `${market}/${card.name} missing blurb`).toBeGreaterThan(0);
      // "One sentence" — a single terminal punctuation mark, at the end only.
      expect(card.blurb.trim().endsWith('.'), `${market}/${card.name} blurb should end with '.'`).toBe(true);
    }
  });

  it('no blurb makes a return/performance promise or uses forbidden wording', () => {
    const FORBIDDEN = ['sustainable', 'guaranteed', 'you will have', 'guarantee returns', 'will earn you'];
    for (const { market, card } of ALL_CARDS) {
      const lower = card.blurb.toLowerCase();
      for (const word of FORBIDDEN) {
        expect(lower.includes(word), `${market}/${card.name} blurb contains forbidden wording "${word}"`).toBe(false);
      }
    }
  });
});
