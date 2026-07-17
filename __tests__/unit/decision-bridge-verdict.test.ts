import { describe, expect, it } from 'vitest';
import { buildWeaknessClause, MEANINGFUL_WEAKNESS_GAP, WEAKNESS_LABELS } from '@/lib/comparison/verdict';

describe('buildWeaknessClause', () => {
  it('renders the clause when the weakest dimension trails the field-best by a meaningful gap (clear weakness)', () => {
    // eToro-shaped fixture: support 7.8 vs field-best support 9.6 — 1.8 point gap.
    const clause = buildWeaknessClause('support', 7.8, { fees: 9.4, ux: 9.4, support: 9.6, features: 9.6 });
    expect(clause).toBe('Consider alternatives if reliable support is a priority.');
  });

  it('omits the clause when the weakest dimension is only barely below the field-best (no real trade-off)', () => {
    // Gap of 0.3 — well under MEANINGFUL_WEAKNESS_GAP.
    const clause = buildWeaknessClause('support', 9.3, { fees: 9.4, ux: 9.4, support: 9.6, features: 9.6 });
    expect(clause).toBeNull();
  });

  it('omits the clause exactly at the threshold boundary (gap must be >= MEANINGFUL_WEAKNESS_GAP, not just close)', () => {
    const justUnder = buildWeaknessClause('fees', 8.5, { fees: 9.49 }); // gap 0.99
    expect(justUnder).toBeNull();

    const atThreshold = buildWeaknessClause('fees', 8.5, { fees: 8.5 + MEANINGFUL_WEAKNESS_GAP }); // gap exactly 1.0
    expect(atThreshold).toBe('Consider alternatives if low costs is a priority.');
  });

  it('omits the clause when the weakest key has no label mapping (unmapped dimension, e.g. mortgage-broker topics)', () => {
    const clause = buildWeaknessClause('trust', 2, { trust: 9 });
    expect(clause).toBeNull();
  });

  it('omits the clause when there is no field-best figure for that dimension to compare against', () => {
    const clause = buildWeaknessClause('support', 5, {});
    expect(clause).toBeNull();
  });

  it('covers all four canonical dimensions with the expected phrasing', () => {
    expect(WEAKNESS_LABELS.support).toBe('reliable support');
    expect(WEAKNESS_LABELS.fees).toBe('low costs');
    expect(WEAKNESS_LABELS.ux).toBe('ease of use');
    expect(WEAKNESS_LABELS.features).toBe('a broad feature set');

    for (const key of ['fees', 'ux', 'features'] as const) {
      const clause = buildWeaknessClause(key, 5, { [key]: 5 + MEANINGFUL_WEAKNESS_GAP });
      expect(clause).toBe(`Consider alternatives if ${WEAKNESS_LABELS[key]} is a priority.`);
    }
  });
});
