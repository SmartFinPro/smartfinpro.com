import { describe, it, expect } from 'vitest';
import { dashToneIconClass, dashToneTextClass } from '@/components/dashboard/ui/tokens';

describe('dashboard tone tokens', () => {
  it('defaults to navy when no tone given', () => {
    expect(dashToneIconClass()).toBe('dash-tone-navy');
    expect(dashToneTextClass()).toBe('dash-tone-text-navy');
  });

  it('maps each valid tone to its class', () => {
    for (const tone of ['navy', 'green', 'gold', 'red', 'slate', 'blue', 'amber'] as const) {
      expect(dashToneIconClass(tone)).toBe(`dash-tone-${tone}`);
      expect(dashToneTextClass(tone)).toBe(`dash-tone-text-${tone}`);
    }
  });

  it('falls back to navy for an unknown tone', () => {
    // @ts-expect-error intentional invalid input
    expect(dashToneIconClass('violet')).toBe('dash-tone-navy');
    // @ts-expect-error intentional invalid input
    expect(dashToneTextClass('purple')).toBe('dash-tone-text-navy');
  });
});
