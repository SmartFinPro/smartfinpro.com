// lib/seo/schema.test.ts
// Editorial-integrity remediation — Task 3: JSON-LD must never fabricate people.
//
// Regression coverage for the incident: schema.ts emitted `Person` nodes for
// `author`/`reviewedBy` and `EducationalOccupationalCredential` nodes for
// professional titles (CFA, CFP, ...) nobody actually holds. Verified live on
// /au/superannuation/best-super-funds-australia and other pages.
//
// Contract: no function in this file may ever emit `"@type":"Person"` or
// `EducationalOccupationalCredential`. `author` must be an Organization.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateReviewSchema,
  generateArticleSchema,
  generateBestXReviewSchema,
} from './schema';
import type { ReviewData } from '@/types';

const baseReview: ReviewData = {
  title: 'Example Review',
  description: 'An example review for schema testing.',
  productName: 'Example Product',
  category: 'trading',
  market: 'us',
  rating: 4.5,
  reviewCount: 120,
  affiliateUrl: 'https://example.com/go',
  pros: ['Fast execution', 'Low fees'],
  cons: ['Limited markets'],
  bestFor: 'Active traders',
  pricing: '$0/mo',
  publishDate: '2026-01-01',
  modifiedDate: '2026-01-02',
  author: 'SmartFinPro Editorial Team',
  // Historically fed a fabricated reviewer persona into a Person node.
  reviewedBy: 'Jordan Blake, CFA',
  faqs: [],
  sections: [],
  testimonials: [],
  competitors: [],
  content: '',
};

describe('generateReviewSchema', () => {
  it('emits neither Person nor EducationalOccupationalCredential nodes', () => {
    const json = JSON.stringify(generateReviewSchema(baseReview));
    expect(json).not.toContain('EducationalOccupationalCredential');
    expect(json).not.toContain('"@type":"Person"');
  });

  it('emits author as an Organization, not a fabricated Person', () => {
    const schema = generateReviewSchema(baseReview) as { author: { '@type': string; name: string; url: string } };
    expect(schema.author).toEqual({
      '@type': 'Organization',
      name: 'SmartFinPro',
      url: 'https://smartfinpro.com',
    });
  });

  it('does not emit a reviewedBy node even when reviewedBy is supplied', () => {
    const schema = generateReviewSchema(baseReview) as Record<string, unknown>;
    expect(schema.reviewedBy).toBeUndefined();
  });
});

describe('generateArticleSchema', () => {
  const baseArticle = {
    title: 'Example Guide',
    description: 'An example guide for schema testing.',
    publishDate: '2026-01-01',
    modifiedDate: '2026-01-02',
    author: 'SmartFinPro Editorial Team',
    // Historically fed a fabricated reviewer persona into a Person node.
    reviewedBy: 'Jordan Blake, CFA',
    reviewedByUrl: 'https://linkedin.com/in/jordan-blake',
    url: 'https://smartfinpro.com/us/trading/example-guide',
  };

  it('emits neither Person nor EducationalOccupationalCredential nodes', () => {
    const json = JSON.stringify(generateArticleSchema(baseArticle));
    expect(json).not.toContain('EducationalOccupationalCredential');
    expect(json).not.toContain('"@type":"Person"');
  });

  it('emits author as an Organization, not a fabricated Person', () => {
    const schema = generateArticleSchema(baseArticle) as { author: { '@type': string; name: string; url: string } };
    expect(schema.author).toEqual({
      '@type': 'Organization',
      name: 'SmartFinPro',
      url: 'https://smartfinpro.com',
    });
  });

  it('does not emit a reviewedBy node even when reviewedBy is supplied', () => {
    const schema = generateArticleSchema(baseArticle) as Record<string, unknown>;
    expect(schema.reviewedBy).toBeUndefined();
  });
});

// T6 (2026-07-18 review-redesign V2 foundation): generateReviewSchema (V1)
// must stay byte-for-byte identical after generateBestXReviewSchema is
// added below it — this is a SEPARATE, additive function for the BEST-X
// 0-10 score model, not a modification of the V1 4.7/5-style function.
// getNextYearDate() (used by V1's itemReviewed.offers.priceValidUntil) is
// wall-clock-dependent, so system time is frozen for a deterministic
// full-object comparison.
describe('generateReviewSchema — V1 output is unchanged (Rev. 2.1 regression guard)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-18T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('produces the exact same JSON-LD object as before generateBestXReviewSchema existed', () => {
    expect(generateReviewSchema(baseReview)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Review',
      itemReviewed: {
        '@type': 'SoftwareApplication',
        name: 'Example Product',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          priceValidUntil: '2027-07-18',
          availability: 'https://schema.org/InStock',
        },
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: 4.5,
        bestRating: 5,
        worstRating: 1,
      },
      author: {
        '@type': 'Organization',
        name: 'SmartFinPro',
        url: 'https://smartfinpro.com',
      },
      publisher: {
        '@type': 'Organization',
        name: 'SmartFinPro',
        logo: {
          '@type': 'ImageObject',
          url: 'https://smartfinpro.com/icon.png',
        },
      },
      datePublished: '2026-01-01',
      dateModified: '2026-01-02',
      reviewBody: 'An example review for schema testing.',
      positiveNotes: {
        '@type': 'ItemList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Fast execution' },
          { '@type': 'ListItem', position: 2, name: 'Low fees' },
        ],
      },
      negativeNotes: {
        '@type': 'ItemList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Limited markets' },
        ],
      },
    });
  });
});

describe('generateBestXReviewSchema', () => {
  const baseInput = {
    title: 'eToro Review 2026',
    url: 'https://smartfinpro.com/us/trading/etoro-review',
    verdictSummary: 'eToro is a strong fit for beginners who want stocks, crypto, and social copy-trading in one app.',
    score: 8.3,
    topStrengths: ['No commission or broker-imposed per-contract fee on US options', 'Wide asset range in one account'],
    mainLimitation: 'Customer support response times can be slow during peak hours.',
    market: 'us',
    datePublished: '2026-07-01',
    dateModified: '2026-07-18',
  };

  it('emits reviewRating with bestRating 10 and the given BEST-X score as ratingValue — no 4.7-style 5-point scale', () => {
    const schema = generateBestXReviewSchema(baseInput) as Record<string, unknown>;
    expect(schema.reviewRating).toEqual({
      '@type': 'Rating',
      ratingValue: 8.3,
      bestRating: 10,
      worstRating: 0,
    });
    const json = JSON.stringify(schema);
    expect(json).not.toContain('"bestRating":5');
    expect(json).not.toContain('4.7');
  });

  it('never emits a Person or EducationalOccupationalCredential node', () => {
    const json = JSON.stringify(generateBestXReviewSchema(baseInput));
    expect(json).not.toContain('"@type":"Person"');
    expect(json).not.toContain('EducationalOccupationalCredential');
  });

  it('emits author and publisher as the SmartFinPro Organization, never a Person', () => {
    const schema = generateBestXReviewSchema(baseInput) as {
      author: { '@type': string; name: string; url: string };
      publisher: { '@type': string; name: string };
    };
    expect(schema.author).toEqual({
      '@type': 'Organization',
      name: 'SmartFinPro',
      url: 'https://smartfinpro.com',
    });
    expect(schema.publisher['@type']).toBe('Organization');
    expect(schema.publisher.name).toBe('SmartFinPro');
  });

  it('uses verdictSummary as reviewBody', () => {
    const schema = generateBestXReviewSchema(baseInput) as { reviewBody: string };
    expect(schema.reviewBody).toBe(baseInput.verdictSummary);
  });

  it('emits positiveNotes from topStrengths and negativeNotes from [mainLimitation] as ItemLists', () => {
    const schema = generateBestXReviewSchema(baseInput) as {
      positiveNotes: { itemListElement: { name: string }[] };
      negativeNotes: { itemListElement: { name: string }[] };
    };
    expect(schema.positiveNotes.itemListElement.map((i) => i.name)).toEqual(baseInput.topStrengths);
    expect(schema.negativeNotes.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: baseInput.mainLimitation },
    ]);
  });

  it('omits the reviewRating key entirely when score is null (does not just set it to undefined)', () => {
    const schema = generateBestXReviewSchema({ ...baseInput, score: null });
    expect(Object.prototype.hasOwnProperty.call(schema, 'reviewRating')).toBe(false);
    expect(JSON.stringify(schema)).not.toContain('reviewRating');
  });

  it('still emits reviewBody/positiveNotes/negativeNotes/author when score is null', () => {
    const schema = generateBestXReviewSchema({ ...baseInput, score: null }) as {
      reviewBody: string;
      positiveNotes: unknown;
      negativeNotes: unknown;
    };
    expect(schema.reviewBody).toBe(baseInput.verdictSummary);
    expect(schema.positiveNotes).toBeDefined();
    expect(schema.negativeNotes).toBeDefined();
  });

  it('does not modify generateReviewSchema (V1) — both are independently callable with their own inputs', () => {
    expect(() => generateReviewSchema(baseReview)).not.toThrow();
    expect(() => generateBestXReviewSchema(baseInput)).not.toThrow();
    expect(JSON.stringify(generateReviewSchema(baseReview))).not.toEqual(JSON.stringify(generateBestXReviewSchema(baseInput)));
  });
});
