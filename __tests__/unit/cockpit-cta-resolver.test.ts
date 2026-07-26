// __tests__/unit/cockpit-cta-resolver.test.ts
// REGRESSION GUARD: resolveCockpitCta must be byte-identical to the four
// inline CTA ladders it replaced (cockpit-card / cockpit-table /
// cockpit-compare / page.tsx buildVerdictPicks). Also covers the rendered
// ctaMode/destinationType derivation — including the discrepancy case where
// product.ctaMode='review' but the UI renders the externalUrl 'visit' CTA.

import { describe, it, expect } from 'vitest';
import { resolveCockpitCta, resolveReviewCta, reviewHrefFor } from '@/lib/comparison/cta';
import type { ProductForComparison } from '@/lib/comparison/types';

function makeProduct(over: Partial<ProductForComparison>): ProductForComparison {
  return {
    slug: 'acme',
    displayName: 'Acme',
    market: 'au',
    category: 'personal-finance',
    ctaMode: 'visit',
    reviewSlug: null,
    externalUrl: null,
    ...over,
  } as ProductForComparison;
}

describe('resolveCockpitCta() — ladder parity', () => {
  it('offer → tracked /go (destinationType affiliate)', () => {
    const cta = resolveCockpitCta(makeProduct({ ctaMode: 'offer', externalUrl: 'https://acme.com' }));
    expect(cta).toEqual({
      label: 'View offer',
      href: '/go/acme',
      external: false,
      tracked: true,
      ctaMode: 'offer',
      destinationType: 'affiliate',
    });
  });

  it('externalUrl → untracked outbound visit', () => {
    const cta = resolveCockpitCta(makeProduct({ externalUrl: 'https://acme.com/au' }));
    expect(cta).toEqual({
      label: 'Visit site',
      href: 'https://acme.com/au',
      external: true,
      tracked: false,
      ctaMode: 'visit',
      destinationType: 'outbound',
    });
  });

  it('reviewSlug only → internal review link', () => {
    const cta = resolveCockpitCta(makeProduct({ ctaMode: 'review', reviewSlug: 'acme-review' }));
    expect(cta).toEqual({
      label: 'Read review',
      href: '/au/personal-finance/acme-review',
      external: false,
      tracked: false,
      ctaMode: 'review',
      destinationType: 'internal_review',
    });
  });

  it('nothing → "#" unavailable (still labelled Visit site, external)', () => {
    const cta = resolveCockpitCta(makeProduct({}));
    expect(cta).toEqual({
      label: 'Visit site',
      href: '#',
      external: true,
      tracked: false,
      ctaMode: 'unavailable',
      destinationType: 'unavailable',
    });
  });

  it('DISCREPANCY CASE: product.ctaMode=review + externalUrl → rendered PRIMARY is visit/outbound', () => {
    const p = makeProduct({ ctaMode: 'review', reviewSlug: 'acme-review', externalUrl: 'https://acme.com' });
    const primary = resolveCockpitCta(p);
    expect(primary.ctaMode).toBe('visit'); // ladder checks externalUrl before reviewSlug
    expect(primary.destinationType).toBe('outbound');
    expect(primary.href).toBe('https://acme.com');
    // …while the title / secondary "Read review" link stays review/internal_review:
    const review = resolveReviewCta(p);
    expect(review).toEqual({
      href: '/au/personal-finance/acme-review',
      ctaMode: 'review',
      destinationType: 'internal_review',
    });
  });
});

describe('resolveReviewCta() / reviewHrefFor()', () => {
  it('null without a reviewSlug', () => {
    expect(resolveReviewCta(makeProduct({}))).toBeNull();
    expect(reviewHrefFor(makeProduct({}))).toBeNull();
  });

  it('builds the market/category-scoped review href', () => {
    const p = makeProduct({ market: 'uk', category: 'trading', reviewSlug: 'acme-review' } as Partial<ProductForComparison>);
    expect(reviewHrefFor(p)).toBe('/uk/trading/acme-review');
  });
});
