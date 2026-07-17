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

import { describe, it, expect } from 'vitest';
import {
  generateReviewSchema,
  generateArticleSchema,
  generatePersonSchema,
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

describe('generatePersonSchema', () => {
  it('never emits EducationalOccupationalCredential nodes, even when credentials are supplied', () => {
    const json = JSON.stringify(
      generatePersonSchema({
        name: 'Jordan Blake',
        credentials: ['CFA', 'CFP'],
      })
    );
    expect(json).not.toContain('EducationalOccupationalCredential');
    expect(json).not.toContain('hasCredential');
  });
});
