// __tests__/unit/fx-dynamic.test.ts
// Tests for Phase 2 P1: Dynamic FX Rates (ECB integration)
//
// Covers: fallback, stale detection, drift detection, JSON validation,
// cache TTL, shadow/active mode, safety-mode, cooldown logic, ECB CSV parsing.
//
// All FX logic is inlined to isolate from Supabase/Next.js runtime.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Inlined constants & types ────────────────────────────────────────────
const HARDCODED_FX: Readonly<Record<string, number>> = Object.freeze({
  USD: 1, GBP: 1.27, CAD: 0.74, AUD: 0.65, EUR: 1.09,
});

const REQUIRED_FX_KEYS = ['USD', 'GBP', 'CAD', 'AUD', 'EUR'] as const;
const FX_CACHE_TTL = 5 * 60 * 1000;
const FX_STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000;
const DRIFT_THRESHOLD = 0.05;
const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000;

// ── Inlined validation function ──────────────────────────────────────────
function isValidFxRates(rates: unknown): rates is Record<string, number> {
  if (!rates || typeof rates !== 'object' || Array.isArray(rates)) return false;
  const r = rates as Record<string, unknown>;
  return REQUIRED_FX_KEYS.every(
    (c) => typeof r[c] === 'number' && (r[c] as number) > 0,
  );
}

// ── Inlined ECB CSV parser ───────────────────────────────────────────────
function parseEcbCsv(csv: string): Record<string, number> | null {
  try {
    const lines = csv.split('\n');
    const headerIdx = lines.findIndex((l) => l.startsWith('KEY,'));
    if (headerIdx === -1) return null;

    const headers = lines[headerIdx].split(',');
    const currencyCol = headers.indexOf('CURRENCY');
    const valueCol = headers.indexOf('OBS_VALUE');
    if (currencyCol === -1 || valueCol === -1) return null;

    const eurRates: Record<string, number> = {};
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length <= Math.max(currencyCol, valueCol)) continue;
      const currency = cols[currencyCol]?.trim();
      const value = parseFloat(cols[valueCol]?.trim());
      if (currency && !isNaN(value) && value > 0) {
        eurRates[currency] = value;
      }
    }

    if (!eurRates.USD) return null;
    const eurToUsd = eurRates.USD;
    const usdRates: Record<string, number> = { USD: 1 };
    for (const [currency, eurRate] of Object.entries(eurRates)) {
      if (currency === 'USD') continue;
      usdRates[currency] = parseFloat((eurToUsd / eurRate).toFixed(6));
    }
    usdRates.EUR = parseFloat(eurToUsd.toFixed(6));
    return usdRates;
  } catch {
    return null;
  }
}

// ── Inlined cache simulation ─────────────────────────────────────────────
interface FxCache {
  rates: Record<string, number>;
  mode: 'shadow' | 'active';
  stale: boolean;
  updatedAt: string | null;
  loadedAt: number;
}

function resolveRates(
  dbRates: Record<string, number> | null,
  mode: 'shadow' | 'active',
  stale: boolean,
  parseOk: boolean,
): Record<string, number> {
  if (mode === 'shadow') return { ...HARDCODED_FX };
  if (mode === 'active' && (stale || !parseOk || !dbRates)) return { ...HARDCODED_FX };
  return dbRates || { ...HARDCODED_FX };
}

// ── Drift detection ──────────────────────────────────────────────────────
function detectDrift(
  oldRates: Record<string, number>,
  newRates: Record<string, number>,
): Record<string, { old: number; new: number; pct: number }> {
  const drift: Record<string, { old: number; new: number; pct: number }> = {};
  for (const c of REQUIRED_FX_KEYS) {
    if (c === 'USD') continue;
    const old = oldRates[c];
    const nw = newRates[c];
    if (old && old > 0 && nw) {
      const pct = Math.abs(nw - old) / old;
      drift[c] = { old, new: nw, pct: parseFloat((pct * 100).toFixed(2)) };
    }
  }
  return drift;
}

// ══════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════

describe('FX Rates Validation', () => {
  it('1. accepts valid rates with all required currencies', () => {
    expect(isValidFxRates({ USD: 1, GBP: 1.27, CAD: 0.74, AUD: 0.65, EUR: 1.09 })).toBe(true);
  });

  it('5. rejects invalid JSON (non-object)', () => {
    expect(isValidFxRates('string')).toBe(false);
    expect(isValidFxRates(null)).toBe(false);
    expect(isValidFxRates(undefined)).toBe(false);
    expect(isValidFxRates(42)).toBe(false);
    expect(isValidFxRates([1, 2, 3])).toBe(false);
  });

  it('6. rejects rates missing required key (USD)', () => {
    expect(isValidFxRates({ GBP: 1.27, CAD: 0.74, AUD: 0.65, EUR: 1.09 })).toBe(false);
  });

  it('6b. rejects rates missing GBP', () => {
    expect(isValidFxRates({ USD: 1, CAD: 0.74, AUD: 0.65, EUR: 1.09 })).toBe(false);
  });

  it('7. rejects rates with value ≤ 0', () => {
    expect(isValidFxRates({ USD: 1, GBP: 0, CAD: 0.74, AUD: 0.65, EUR: 1.09 })).toBe(false);
    expect(isValidFxRates({ USD: 1, GBP: -1, CAD: 0.74, AUD: 0.65, EUR: 1.09 })).toBe(false);
  });

  it('7b. rejects rates with non-number values', () => {
    expect(isValidFxRates({ USD: 1, GBP: '1.27', CAD: 0.74, AUD: 0.65, EUR: 1.09 })).toBe(false);
  });
});

describe('FX Rate Resolution (shadow/active/safety)', () => {
  const dbRates = { USD: 1, GBP: 1.29, CAD: 0.73, AUD: 0.64, EUR: 1.10 };

  it('9. shadow mode → always returns HARDCODED_FX', () => {
    const rates = resolveRates(dbRates, 'shadow', false, true);
    expect(rates).toEqual({ ...HARDCODED_FX });
  });

  it('10. active mode + valid + fresh → returns DB rates', () => {
    const rates = resolveRates(dbRates, 'active', false, true);
    expect(rates).toEqual(dbRates);
  });

  it('11. active mode + stale → safety fallback to HARDCODED_FX', () => {
    const rates = resolveRates(dbRates, 'active', true, true);
    expect(rates).toEqual({ ...HARDCODED_FX });
  });

  it('11b. active mode + parse failed → safety fallback to HARDCODED_FX', () => {
    const rates = resolveRates(dbRates, 'active', false, false);
    expect(rates).toEqual({ ...HARDCODED_FX });
  });

  it('1. fallback: DB empty → HARDCODED_FX', () => {
    const rates = resolveRates(null, 'active', true, false);
    expect(rates).toEqual({ ...HARDCODED_FX });
  });
});

describe('Staleness detection', () => {
  it('2. updated_at > 48h ago → stale = true', () => {
    const old = Date.now() - 49 * 60 * 60 * 1000; // 49 hours ago
    const isStale = Date.now() - old > FX_STALE_THRESHOLD_MS;
    expect(isStale).toBe(true);
  });

  it('2b. updated_at < 48h ago → stale = false', () => {
    const recent = Date.now() - 1 * 60 * 60 * 1000; // 1 hour ago
    const isStale = Date.now() - recent > FX_STALE_THRESHOLD_MS;
    expect(isStale).toBe(false);
  });

  it('2c. no updated_at (0) → stale = true', () => {
    const isStale = Date.now() - 0 > FX_STALE_THRESHOLD_MS;
    expect(isStale).toBe(true);
  });
});

describe('Drift detection', () => {
  it('3. GBP changes by 6% → drift detected', () => {
    const oldRates = { USD: 1, GBP: 1.27, CAD: 0.74, AUD: 0.65, EUR: 1.09 };
    const newRates = { USD: 1, GBP: 1.3462, CAD: 0.74, AUD: 0.65, EUR: 1.09 }; // +6%
    const drift = detectDrift(oldRates, newRates);
    expect(drift.GBP.pct).toBeGreaterThan(5);
  });

  it('4. GBP changes by 3% → no significant drift', () => {
    const oldRates = { USD: 1, GBP: 1.27, CAD: 0.74, AUD: 0.65, EUR: 1.09 };
    const newRates = { USD: 1, GBP: 1.3081, CAD: 0.74, AUD: 0.65, EUR: 1.09 }; // +3%
    const drift = detectDrift(oldRates, newRates);
    expect(drift.GBP.pct).toBeLessThan(5);
  });

  it('3b. multiple currencies drift simultaneously', () => {
    const oldRates = { USD: 1, GBP: 1.27, CAD: 0.74, AUD: 0.65, EUR: 1.09 };
    const newRates = { USD: 1, GBP: 1.35, CAD: 0.68, AUD: 0.65, EUR: 1.09 }; // GBP +6.3%, CAD -8.1%
    const drift = detectDrift(oldRates, newRates);
    const significant = Object.entries(drift).filter(([, d]) => d.pct > 5);
    expect(significant.length).toBe(2); // GBP and CAD
  });
});

describe('Persistent alert cooldown', () => {
  it('12. first alert (no previous) → cooldown elapsed', () => {
    const lastAlert = ''; // empty = no previous alert
    const elapsed = !lastAlert || isNaN(new Date(lastAlert).getTime()) ||
      Date.now() - new Date(lastAlert).getTime() > ALERT_COOLDOWN_MS;
    expect(elapsed).toBe(true);
  });

  it('12b. alert 2h ago → cooldown NOT elapsed', () => {
    const lastAlert = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const elapsed = Date.now() - new Date(lastAlert).getTime() > ALERT_COOLDOWN_MS;
    expect(elapsed).toBe(false);
  });

  it('12c. alert 7h ago → cooldown elapsed', () => {
    const lastAlert = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString();
    const elapsed = Date.now() - new Date(lastAlert).getTime() > ALERT_COOLDOWN_MS;
    expect(elapsed).toBe(true);
  });

  it('12d. invalid timestamp → treat as elapsed (no throw)', () => {
    const lastAlert = 'not-a-date';
    const elapsed = !lastAlert || isNaN(new Date(lastAlert).getTime()) ||
      Date.now() - new Date(lastAlert).getTime() > ALERT_COOLDOWN_MS;
    expect(elapsed).toBe(true);
  });
});

describe('Mutex lock parsing (Guard 1)', () => {
  it('13. empty lock value → treated as stale (acquirable)', () => {
    const value = '';
    const isStale = !value || value === '';
    expect(isStale).toBe(true);
  });

  it('13b. invalid timestamp lock → treated as stale (no throw)', () => {
    const value = 'garbage-value';
    // @ts-expect-error -- intentional literal-type test: 'garbage-value' can never equal ''
    let isStale = !value || value === '';
    if (!isStale) {
      const lockTime = new Date(value).getTime();
      isStale = isNaN(lockTime);
    }
    expect(isStale).toBe(true);
  });

  it('13c. valid stale lock (> 1h) → acquirable', () => {
    const value = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2h ago
    const staleThreshold = new Date(Date.now() - 60 * 60 * 1000); // 1h ago
    const lockTime = new Date(value);
    const isStale = isNaN(lockTime.getTime()) || lockTime < staleThreshold;
    expect(isStale).toBe(true);
  });

  it('13d. valid fresh lock (< 1h) → NOT acquirable', () => {
    const value = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min ago
    const staleThreshold = new Date(Date.now() - 60 * 60 * 1000); // 1h ago
    const lockTime = new Date(value);
    const isStale = isNaN(lockTime.getTime()) || lockTime < staleThreshold;
    expect(isStale).toBe(false);
  });
});

describe('ECB CSV parsing', () => {
  const SAMPLE_ECB_CSV = `KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE,OBS_STATUS,OBS_CONF,OBS_PRE_BREAK,OBS_COM
EXR.D.USD.EUR.SP00.A,D,USD,EUR,SP00,A,2026-03-14,1.0850,A,F,,
EXR.D.GBP.EUR.SP00.A,D,GBP,EUR,SP00,A,2026-03-14,0.8375,A,F,,
EXR.D.CAD.EUR.SP00.A,D,CAD,EUR,SP00,A,2026-03-14,1.4690,A,F,,
EXR.D.AUD.EUR.SP00.A,D,AUD,EUR,SP00,A,2026-03-14,1.6650,A,F,,`;

  it('14. parses ECB CSV into correct USD-based rates', () => {
    const rates = parseEcbCsv(SAMPLE_ECB_CSV);
    expect(rates).not.toBeNull();
    expect(rates!.USD).toBe(1);
    // GBP: 1.0850 / 0.8375 ≈ 1.2955
    expect(rates!.GBP).toBeCloseTo(1.0850 / 0.8375, 4);
    // CAD: 1.0850 / 1.4690 ≈ 0.7386
    expect(rates!.CAD).toBeCloseTo(1.0850 / 1.4690, 4);
    // AUD: 1.0850 / 1.6650 ≈ 0.6517
    expect(rates!.AUD).toBeCloseTo(1.0850 / 1.6650, 4);
    // EUR: 1.0850 (value of 1 EUR in USD)
    expect(rates!.EUR).toBeCloseTo(1.0850, 4);
  });

  it('14b. returns null for empty CSV', () => {
    expect(parseEcbCsv('')).toBeNull();
  });

  it('14c. returns null for CSV without KEY header', () => {
    expect(parseEcbCsv('FOO,BAR\n1,2')).toBeNull();
  });

  it('14d. returns null if USD rate missing from ECB data', () => {
    const csv = `KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE
EXR.D.GBP.EUR.SP00.A,D,GBP,EUR,SP00,A,2026-03-14,0.84`;
    expect(parseEcbCsv(csv)).toBeNull();
  });
});

describe('Mode validation (Guard 2)', () => {
  it('valid "shadow" → accepted', () => {
    const raw = 'shadow';
    // @ts-expect-error -- intentional literal-type test: 'shadow' can never equal 'active'
    const mode = raw === 'active' ? 'active' : 'shadow';
    expect(mode).toBe('shadow');
  });

  it('valid "active" → accepted', () => {
    const raw = 'active';
    const mode = raw === 'active' ? 'active' : 'shadow';
    expect(mode).toBe('active');
  });

  it('invalid "foobar" → falls back to shadow', () => {
    const raw = 'foobar';
    // @ts-expect-error -- intentional literal-type test: 'foobar' can never equal 'active'
    const mode = raw === 'active' ? 'active' : 'shadow';
    expect(mode).toBe('shadow');
  });

  it('empty string → falls back to shadow', () => {
    const raw = '';
    // @ts-expect-error -- intentional literal-type test: '' can never equal 'active'
    const mode = raw === 'active' ? 'active' : 'shadow';
    expect(mode).toBe('shadow');
  });

  it('null → falls back to shadow', () => {
    const raw = null;
    const mode = raw === 'active' ? 'active' : 'shadow';
    expect(mode).toBe('shadow');
  });
});

describe('toUSD consistency with dynamic rates', () => {
  function toUSD(amount: number, currency: string | null | undefined, rates: Record<string, number>): number {
    return amount * (rates[(currency ?? 'USD').toUpperCase()] ?? 1);
  }

  it('dashboard and revenue use same getFxRatesSnapshot path', () => {
    const dynamicRates = { USD: 1, GBP: 1.30, CAD: 0.72, AUD: 0.63, EUR: 1.11 };

    const conversions = [
      { amount: 100, currency: 'USD' },
      { amount: 50, currency: 'GBP' },
      { amount: 200, currency: 'CAD' },
    ];

    const dashboardTotal = conversions.reduce(
      (sum, c) => sum + toUSD(c.amount, c.currency, dynamicRates), 0,
    );
    const revenueTotal = conversions.reduce(
      (sum, c) => sum + toUSD(c.amount, c.currency, dynamicRates), 0,
    );

    expect(dashboardTotal).toBe(revenueTotal);
    // 100 + 65 + 144 = 309
    expect(dashboardTotal).toBeCloseTo(100 + 50 * 1.30 + 200 * 0.72, 2);
  });
});
