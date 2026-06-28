import { describe, expect, it } from 'vitest';
import { roboAttributesSchema } from '@/lib/comparison/topics/robo-advisors';

describe('roboAttributesSchema', () => {
  it('accepts a fully-specified robo attributes object', () => {
    const r = roboAttributesSchema.safeParse({
      tlh: true,
      human_advisor: false,
      account_types: ['taxable', 'ira', 'roth'],
      sipc: true,
      frac: true,
      sri: false,
      crypto: false,
    });
    expect(r.success).toBe(true);
  });

  it("rejects a typo'd boolean (schema-drift trap)", () => {
    const r = roboAttributesSchema.safeParse({
      tlh: 'yes',
      human_advisor: false,
      account_types: ['taxable'],
      sipc: true,
      frac: true,
      sri: false,
      crypto: false,
    });
    expect(r.success).toBe(false);
  });

  it('rejects a non-array account_types', () => {
    const r = roboAttributesSchema.safeParse({
      tlh: true,
      human_advisor: false,
      account_types: 'ira',
      sipc: true,
      frac: true,
      sri: false,
      crypto: false,
    });
    expect(r.success).toBe(false);
  });

  it('rejects an empty account_types array', () => {
    const r = roboAttributesSchema.safeParse({
      tlh: true,
      human_advisor: false,
      account_types: [],
      sipc: true,
      frac: true,
      sri: false,
      crypto: false,
    });
    expect(r.success).toBe(false);
  });
});
