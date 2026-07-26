import { describe, it, expect } from 'vitest';
import { generateWebApplicationSchema } from '@/lib/seo/schema';

describe('generateWebApplicationSchema', () => {
  it('emits valid WebApplication JSON-LD without fabricated ratings', () => {
    const s = generateWebApplicationSchema({
      name: 'Debt Payoff Calculator',
      url: 'https://smartfinpro.com/tools/debt-payoff-calculator',
      description: 'x',
      applicationCategory: 'FinanceApplication',
    });
    expect(s['@type']).toBe('WebApplication');
    expect(s.offers).toMatchObject({ '@type': 'Offer', price: '0' });
    expect('aggregateRating' in s).toBe(false);
  });

  it('passes through name/url/description and sets operatingSystem to Web', () => {
    const s = generateWebApplicationSchema({
      name: 'Gold ROI Calculator',
      url: 'https://smartfinpro.com/tools/gold-roi-calculator',
      description: 'Project your gold investment returns.',
      applicationCategory: 'FinanceApplication',
    });
    expect(s.name).toBe('Gold ROI Calculator');
    expect(s.url).toBe('https://smartfinpro.com/tools/gold-roi-calculator');
    expect(s.description).toBe('Project your gold investment returns.');
    expect(s.operatingSystem).toBe('Web');
    expect(s['@context']).toBe('https://schema.org');
  });

  it('sets publisher to SmartPro Organization', () => {
    const s = generateWebApplicationSchema({
      name: 'Loan Calculator',
      url: 'https://smartfinpro.com/tools/loan-calculator',
      description: 'x',
      applicationCategory: 'FinanceApplication',
    });
    expect(s.publisher).toMatchObject({ '@type': 'Organization', name: 'SmartFinPro' });
  });
});
