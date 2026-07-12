// __tests__/unit/tool-metadata.test.ts
import { describe, it, expect } from 'vitest';
import { buildToolMetadata } from '@/lib/tools/registry/metadata';

describe('buildToolMetadata', () => {
  it('bare title (Template hängt Brand an), self-canonical, description aus Registry', () => {
    const md = buildToolMetadata('debt-payoff', 'us');
    expect(String(md.title)).not.toContain('| SmartFinPro');
    expect(md.alternates?.canonical).toBe('https://smartfinpro.com/tools/debt-payoff-calculator');
    expect(md.robots).toMatchObject({ index: false, follow: true }); // indexable:false
  });
  it('multi-variant tool bekommt vollständigen hreflang-Cluster mit x-default', () => {
    const md = buildToolMetadata('money-leak-scanner', 'uk');
    const langs = md.alternates?.languages as Record<string, string>;
    expect(langs['en-US']).toBe('https://smartfinpro.com/tools/money-leak-scanner');
    expect(langs['en-GB']).toBe('https://smartfinpro.com/uk/tools/money-leak-scanner');
    expect(langs['en-CA']).toBe('https://smartfinpro.com/ca/tools/money-leak-scanner');
    expect(langs['en-AU']).toBe('https://smartfinpro.com/au/tools/money-leak-scanner');
    expect(langs['x-default']).toBe('https://smartfinpro.com/tools/money-leak-scanner');
  });
  it('single-variant tool: canonical only, keine languages', () => {
    const md = buildToolMetadata('isa', 'uk');
    expect(md.alternates?.canonical).toBe('https://smartfinpro.com/uk/tools/isa-tax-savings-calculator');
    expect(md.alternates?.languages).toBeUndefined();
  });
});
