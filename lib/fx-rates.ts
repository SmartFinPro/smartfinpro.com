// lib/fx-rates.ts
// FX rate utilities — extracted from revenue.ts to avoid 'use server' async requirement.
// This file is a plain module (no 'use server') so sync exports are allowed.

import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';

// ── Currency normalisation ─────────────────────────────────────────────────
// HARDCODED_FX — immutable fallback rates. Never overwritten at runtime.
// Used when system_settings is unavailable, invalid, or stale.
export const HARDCODED_FX: Readonly<Record<string, number>> = Object.freeze({
  USD: 1, GBP: 1.27, CAD: 0.74, AUD: 0.65, EUR: 1.09,
});

const REQUIRED_FX_KEYS = ['USD', 'GBP', 'CAD', 'AUD', 'EUR'] as const;
const FX_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const FX_STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours

// ── In-memory cache (per PM2 instance, refreshed every 5 min) ────────────
export interface FxCache {
  rates: Record<string, number>;
  mode: 'shadow' | 'active';
  stale: boolean;
  updatedAt: string | null;
  loadedAt: number;
}

let _fxCache: FxCache | null = null;

/**
 * Validate FX rates object: all required currencies present and > 0
 */
function isValidFxRates(rates: unknown): rates is Record<string, number> {
  if (!rates || typeof rates !== 'object' || Array.isArray(rates)) return false;
  const r = rates as Record<string, unknown>;
  return REQUIRED_FX_KEYS.every(
    (c) => typeof r[c] === 'number' && (r[c] as number) > 0,
  );
}

/**
 * Load FX rates from system_settings with 5-minute in-memory cache.
 * Returns rates, mode, and staleness info.
 * Falls back to HARDCODED_FX on any error.
 */
export async function loadFxRates(): Promise<FxCache> {
  // Return cached if still fresh
  if (_fxCache && Date.now() - _fxCache.loadedAt < FX_CACHE_TTL) {
    return _fxCache;
  }

  try {
    const supabase = createServiceClient();

    // Read fx_rates and fx_rates_mode in parallel
    const [ratesResult, modeResult] = await Promise.all([
      supabase.from('system_settings').select('value, updated_at').eq('key', 'fx_rates').single(),
      supabase.from('system_settings').select('value').eq('key', 'fx_rates_mode').single(),
    ]);

    // Parse rates
    let rates: Record<string, number> = { ...HARDCODED_FX };
    let parseOk = false;
    if (ratesResult.data?.value) {
      try {
        const parsed = JSON.parse(ratesResult.data.value);
        if (isValidFxRates(parsed)) {
          rates = parsed;
          parseOk = true;
        } else {
          logger.warn('[fx] Invalid rates in system_settings — using HARDCODED_FX');
        }
      } catch {
        logger.warn('[fx] JSON parse error for fx_rates — using HARDCODED_FX');
      }
    }

    // Validate mode — Guard 2: only 'shadow' | 'active', else fallback + warn
    let mode: 'shadow' | 'active' = 'shadow';
    const rawMode = modeResult.data?.value;
    if (rawMode === 'active') {
      mode = 'active';
    } else if (rawMode && rawMode !== 'shadow') {
      logger.warn(`[fx] Invalid fx_rates_mode="${rawMode}", falling back to shadow`);
    }

    // Check staleness — derive from system_settings.updated_at of fx_rates key
    const updatedAt = ratesResult.data?.updated_at || null;
    const lastUpdated = updatedAt ? new Date(updatedAt).getTime() : 0;
    const stale = !lastUpdated || Date.now() - lastUpdated > FX_STALE_THRESHOLD_MS;

    // Safety-Mode (Anpassung 4): stale/invalid in active mode → use HARDCODED_FX
    let effectiveRates = rates;
    if (mode === 'shadow') {
      effectiveRates = { ...HARDCODED_FX };
    } else if (mode === 'active' && (stale || !parseOk)) {
      effectiveRates = { ...HARDCODED_FX };
      logger.warn(`[fx] Safety-Mode: active but ${stale ? 'stale' : 'invalid'} — using HARDCODED_FX`);
    }

    _fxCache = { rates: effectiveRates, mode, stale, updatedAt, loadedAt: Date.now() };
    return _fxCache;
  } catch (error) {
    logger.warn(`[fx] Failed to load rates from DB: ${error} — using HARDCODED_FX`);
    _fxCache = {
      rates: { ...HARDCODED_FX },
      mode: 'shadow',
      stale: true,
      updatedAt: null,
      loadedAt: Date.now(),
    };
    return _fxCache;
  }
}

/**
 * Sync snapshot of current FX rates.
 * Returns cached rates or HARDCODED_FX if cache not yet loaded.
 */
export function getFxRatesSnapshot(): Record<string, number> {
  return _fxCache?.rates ?? { ...HARDCODED_FX };
}

/**
 * Convert an amount to USD using current FX rates.
 * Sync — uses cached rates (call loadFxRates() first in async contexts).
 */
export function toUSD(amount: number, currency?: string | null): number {
  const rates = getFxRatesSnapshot();
  return amount * (rates[(currency ?? 'USD').toUpperCase()] ?? 1);
}

/**
 * @deprecated Use getFxRatesSnapshot() for dynamic rates or HARDCODED_FX for fallback.
 * Kept for backward compatibility with test files that import FX_TO_USD.
 */
export const FX_TO_USD: Record<string, number> = new Proxy(HARDCODED_FX as Record<string, number>, {
  get(target, prop) {
    const snapshot = getFxRatesSnapshot();
    if (typeof prop === 'string' && prop in snapshot) return snapshot[prop];
    return Reflect.get(target, prop);
  },
});

// ── Reset cache (for testing) ────────────────────────────────────────────
export function _resetFxCache(): void {
  _fxCache = null;
}

export function _setFxCache(cache: FxCache): void {
  _fxCache = cache;
}
