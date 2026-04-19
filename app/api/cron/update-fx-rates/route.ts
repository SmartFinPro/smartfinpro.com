import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { logger, logCron } from '@/lib/logging';
import { sendTelegramAlert } from '@/lib/alerts/telegram';
import { validateBearer } from '@/lib/security/timing-safe';

/**
 * FX Rates Update Cron Job
 *
 * Fetches daily exchange rates from ECB and stores in system_settings.
 * Supports shadow mode (log-only) and active mode (live rates).
 *
 * Schedule: Daily at 1 AM UTC (before sync-revenue at 2 AM)
 *
 * Self-hosted crontab entry:
 *   0 1 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/update-fx-rates >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */

// ── Constants ────────────────────────────────────────────────────────────────
const REQUIRED_CURRENCIES = ['USD', 'GBP', 'CAD', 'AUD', 'EUR'] as const;
const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours
const DRIFT_THRESHOLD = 0.05; // 5%
const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours
const LOCK_STALE_MS = 60 * 60 * 1000; // 1 hour

const ECB_API_URL =
  'https://data-api.ecb.europa.eu/service/data/EXR/D.USD+GBP+CAD+AUD.EUR.SP00.A?format=csvdata&lastNObservations=1';

// ── Types ────────────────────────────────────────────────────────────────────
interface DriftEntry {
  old: number;
  new: number;
  pct: number;
}

type SafetyReason = 'ecb_unreachable' | 'parse_error' | 'validation_failed' | 'stale_48h';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate FX rates JSON: all REQUIRED_CURRENCIES present and > 0
 */
function validateFxRates(rates: unknown): rates is Record<string, number> {
  if (!rates || typeof rates !== 'object' || Array.isArray(rates)) return false;
  const r = rates as Record<string, unknown>;
  return REQUIRED_CURRENCIES.every(
    (c) => typeof r[c] === 'number' && (r[c] as number) > 0,
  );
}

/**
 * Parse ECB CSV response into USD-based rates.
 * ECB provides rates vs EUR, so we convert to USD basis.
 */
function parseEcbCsv(csv: string): Record<string, number> | null {
  try {
    const lines = csv.split('\n');
    // Find header line to get column indices
    const headerIdx = lines.findIndex((l) => l.startsWith('KEY,'));
    if (headerIdx === -1) return null;

    const headers = lines[headerIdx].split(',');
    const currencyCol = headers.indexOf('CURRENCY');
    const valueCol = headers.indexOf('OBS_VALUE');
    if (currencyCol === -1 || valueCol === -1) return null;

    // Parse data rows (after header)
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

    // Must have USD rate from ECB to do conversion
    if (!eurRates.USD) return null;

    const eurToUsd = eurRates.USD; // e.g. 1.08 (1 EUR = 1.08 USD)

    // Convert all rates to USD basis
    // For GBP: ECB gives EUR/GBP (e.g. 0.84), meaning 1 EUR = 0.84 GBP
    // USD value of 1 GBP = eurToUsd / eurGbp = 1.08 / 0.84 = 1.2857
    const usdRates: Record<string, number> = { USD: 1 };
    for (const [currency, eurRate] of Object.entries(eurRates)) {
      if (currency === 'USD') continue;
      usdRates[currency] = parseFloat((eurToUsd / eurRate).toFixed(6));
    }
    // EUR rate = 1 / eurToUsd (value of 1 EUR in USD)
    usdRates.EUR = parseFloat((1 / eurToUsd).toFixed(6));
    // Wait, that's wrong. Let me reconsider.
    // ECB gives: 1 EUR = X units of currency
    // eurRates.USD = 1.08 means 1 EUR = 1.08 USD
    // eurRates.GBP = 0.84 means 1 EUR = 0.84 GBP
    //
    // We want: 1 unit of currency = ? USD
    // 1 GBP in USD: (1 EUR / 0.84 GBP) * 1.08 USD/EUR = 1.08/0.84 = 1.2857 USD ✓
    // 1 EUR in USD: 1.08 USD ✓
    // 1 CAD in USD: 1.08 / eurRates.CAD
    // 1 AUD in USD: 1.08 / eurRates.AUD
    usdRates.EUR = parseFloat(eurToUsd.toFixed(6)); // 1 EUR = eurToUsd USD

    return usdRates;
  } catch {
    return null;
  }
}

/**
 * Check if a cooldown period has elapsed (persistent, multi-instance safe)
 */
async function isCooldownElapsed(
  supabase: ReturnType<typeof createServiceClient>,
  key: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (!data?.value) return true; // No previous alert → cooldown elapsed

  const lastAlert = new Date(data.value).getTime();
  if (isNaN(lastAlert)) return true; // Invalid timestamp → treat as elapsed

  return Date.now() - lastAlert > ALERT_COOLDOWN_MS;
}

/**
 * Update cooldown timestamp
 */
async function updateCooldown(
  supabase: ReturnType<typeof createServiceClient>,
  key: string,
): Promise<void> {
  await supabase
    .from('system_settings')
    .update({ value: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('key', key);
}

/**
 * Acquire mutex lock — single SQL with INSERT ON CONFLICT
 * Guard 1: If fx_update_lock value is not a valid timestamp, treat as stale
 */
async function acquireLock(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<boolean> {
  const now = new Date().toISOString();
  const staleThreshold = new Date(Date.now() - LOCK_STALE_MS).toISOString();

  // Atomic: INSERT if not exists, or UPDATE if value is empty/invalid/stale
  const { data } = await supabase.rpc('fx_acquire_lock', {
    p_now: now,
    p_stale: staleThreshold,
  }).maybeSingle();

  // If RPC not available, fall back to app-level logic
  if (data === undefined || data === null) {
    // Fallback: try app-level atomic acquire
    return acquireLockAppLevel(supabase, now, staleThreshold);
  }
  return !!data;
}

/**
 * App-level lock acquire fallback (if RPC not deployed yet)
 */
async function acquireLockAppLevel(
  supabase: ReturnType<typeof createServiceClient>,
  now: string,
  staleThreshold: string,
): Promise<boolean> {
  // Try insert first (for fresh installs where key doesn't exist)
  const { error: insertError } = await supabase
    .from('system_settings')
    .insert({ key: 'fx_update_lock', value: now, category: 'fx' });

  if (!insertError) return true; // Fresh insert → lock acquired

  // Key exists — try to update only if lock is empty or stale
  const { data: existing } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'fx_update_lock')
    .single();

  if (!existing) return false;

  // Guard 1: If value is not a valid timestamp, treat as stale (no throw)
  let isStale = !existing.value || existing.value === '';
  if (!isStale) {
    const lockTime = new Date(existing.value).getTime();
    isStale = isNaN(lockTime) || new Date(existing.value) < new Date(staleThreshold);
  }

  if (!isStale) return false; // Lock held by another instance

  // Attempt atomic update
  const { data: updated } = await supabase
    .from('system_settings')
    .update({ value: now, updated_at: new Date().toISOString() })
    .eq('key', 'fx_update_lock')
    .select('key')
    .single();

  return !!updated;
}

/**
 * Release mutex lock
 */
async function releaseLock(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<void> {
  await supabase
    .from('system_settings')
    .update({ value: '', updated_at: new Date().toISOString() })
    .eq('key', 'fx_update_lock');
}

// ── Main Handler ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  // Verify CRON_SECRET (timing-safe)
  if (!validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    logger.warn('[update-fx-rates] Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('[update-fx-rates] Starting FX rates update');
  const startTime = Date.now();
  const supabase = createServiceClient();

  // Acquire mutex
  const lockAcquired = await acquireLock(supabase);
  if (!lockAcquired) {
    logger.warn('[update-fx-rates] Skipped — another instance holds the lock');
    logCron({ job: 'update-fx-rates', status: 'skipped', duration_ms: Date.now() - startTime });
    return NextResponse.json({ success: false, message: 'Lock held by another instance' }, { status: 409 });
  }

  try {
    // ── Step 1: Fetch ECB rates ──────────────────────────────────────────
    let ecbCsv: string;
    try {
      const response = await fetch(ECB_API_URL, {
        headers: { Accept: 'text/csv' },
        signal: AbortSignal.timeout(15_000), // 15s timeout
      });
      if (!response.ok) throw new Error(`ECB HTTP ${response.status}`);
      ecbCsv = await response.text();
    } catch (fetchError) {
      const reason: SafetyReason = 'ecb_unreachable';
      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);

      await safetyFallback(supabase, reason, `ECB fetch failed: ${errorMsg}`, startTime);
      return NextResponse.json(
        { success: false, error: 'ECB unreachable', safety_fallback: true, reason },
        { status: 502 },
      );
    }

    // ── Step 2: Parse CSV → USD-based rates ──────────────────────────────
    const newRates = parseEcbCsv(ecbCsv);
    if (!newRates) {
      const reason: SafetyReason = 'parse_error';
      await safetyFallback(supabase, reason, 'ECB CSV parse failed', startTime);
      return NextResponse.json(
        { success: false, error: 'Parse failed', safety_fallback: true, reason },
        { status: 502 },
      );
    }

    // ── Step 3: Validate rates ───────────────────────────────────────────
    if (!validateFxRates(newRates)) {
      const reason: SafetyReason = 'validation_failed';
      const missing = REQUIRED_CURRENCIES.filter(
        (c) => typeof newRates[c] !== 'number' || newRates[c] <= 0,
      );
      await safetyFallback(supabase, reason, `Missing/invalid currencies: ${missing.join(', ')}`, startTime);
      return NextResponse.json(
        { success: false, error: 'Validation failed', safety_fallback: true, reason, missing },
        { status: 502 },
      );
    }

    // ── Step 4: Load current rates from DB ───────────────────────────────
    const { data: currentSetting } = await supabase
      .from('system_settings')
      .select('value, updated_at')
      .eq('key', 'fx_rates')
      .single();

    let currentRates: Record<string, number> = {};
    try {
      currentRates = currentSetting?.value ? JSON.parse(currentSetting.value) : {};
    } catch {
      currentRates = {};
    }

    // ── Step 5: Check staleness ──────────────────────────────────────────
    const lastUpdated = currentSetting?.updated_at
      ? new Date(currentSetting.updated_at).getTime()
      : 0;
    const isStale = Date.now() - lastUpdated > STALE_THRESHOLD_MS;

    if (isStale && await isCooldownElapsed(supabase, 'fx_alert_last_stale_at')) {
      const hours = lastUpdated ? Math.round((Date.now() - lastUpdated) / 3600000) : 'N/A';
      await sendTelegramAlert(
        `<b>⚠️ FX RATES STALE</b>\n\n` +
        `Last update: ${hours}h ago\n` +
        `Threshold: 48h\n` +
        `Using: ${currentSetting?.value ? 'last known rates' : 'hardcoded defaults'}`,
      );
      await updateCooldown(supabase, 'fx_alert_last_stale_at');
    }

    // ── Step 6: Drift check per currency ─────────────────────────────────
    const drift: Record<string, DriftEntry> = {};
    const significantDrifts: string[] = [];

    for (const currency of REQUIRED_CURRENCIES) {
      if (currency === 'USD') continue; // USD is always 1
      const oldRate = currentRates[currency];
      const newRate = newRates[currency];
      if (oldRate && oldRate > 0) {
        const pct = Math.abs(newRate - oldRate) / oldRate;
        drift[currency] = {
          old: oldRate,
          new: newRate,
          pct: parseFloat((pct * 100).toFixed(2)),
        };
        if (pct > DRIFT_THRESHOLD) {
          significantDrifts.push(currency);
        }
      }
    }

    if (significantDrifts.length > 0 && await isCooldownElapsed(supabase, 'fx_alert_last_drift_at')) {
      const driftDetails = significantDrifts
        .map((c) => `  • ${c}: ${drift[c].old} → ${drift[c].new} (${drift[c].pct}%)`)
        .join('\n');

      await sendTelegramAlert(
        `<b>🔔 FX RATE DRIFT > 5%</b>\n\n` +
        `Currencies:\n${driftDetails}\n\n` +
        `Source: ECB\n` +
        `Action: Review rates before activating`,
      );
      await updateCooldown(supabase, 'fx_alert_last_drift_at');
    }

    // ── Step 7: Read mode ────────────────────────────────────────────────
    const { data: modeSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'fx_rates_mode')
      .single();

    // Guard 2: Strict mode validation — only 'shadow' | 'active'
    let mode = modeSetting?.value;
    if (mode !== 'shadow' && mode !== 'active') {
      logger.warn(`[update-fx-rates] Invalid fx_rates_mode="${mode}", falling back to shadow`);
      mode = 'shadow';
    }

    // ── Step 8: Upsert new rates ─────────────────────────────────────────
    await supabase
      .from('system_settings')
      .update({
        value: JSON.stringify(newRates),
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'fx_rates');

    // ── Step 9: Log result ───────────────────────────────────────────────
    const duration = Date.now() - startTime;

    logCron({
      job: 'update-fx-rates',
      status: 'success',
      duration_ms: duration,
      metadata: {
        mode,
        drift,
        stale: isStale,
        source: 'ecb',
        significant_drifts: significantDrifts,
        rates: newRates,
      },
    });

    return NextResponse.json({
      success: true,
      mode,
      rates: newRates,
      drift,
      stale: isStale,
      significant_drifts: significantDrifts,
      duration: `${duration}ms`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    logCron({
      job: 'update-fx-rates',
      status: 'error',
      duration_ms: duration,
      error: errorMsg,
      metadata: { safety_fallback: true, safety_fallback_reason: 'parse_error' as SafetyReason },
    });

    await sendTelegramAlert(
      `<b>🚨 FX RATES UPDATE FAILED</b>\n\n` +
      `Error: ${errorMsg}\n` +
      `Duration: ${(duration / 1000).toFixed(1)}s\n` +
      `Fallback: hardcoded rates active`,
    );

    return NextResponse.json(
      { success: false, error: errorMsg, safety_fallback: true },
      { status: 500 },
    );
  } finally {
    await releaseLock(supabase);
  }
}

/**
 * Safety fallback handler — consistent for all failure modes (Guard 3)
 */
async function safetyFallback(
  supabase: ReturnType<typeof createServiceClient>,
  reason: SafetyReason,
  errorMsg: string,
  startTime: number,
): Promise<void> {
  const duration = Date.now() - startTime;

  logCron({
    job: 'update-fx-rates',
    status: 'error',
    duration_ms: duration,
    error: errorMsg,
    metadata: {
      safety_fallback: true,
      safety_fallback_reason: reason,
    },
  });

  if (await isCooldownElapsed(supabase, 'fx_alert_last_stale_at')) {
    await sendTelegramAlert(
      `<b>🚨 FX RATES SAFETY FALLBACK</b>\n\n` +
      `Reason: ${reason}\n` +
      `Error: ${errorMsg}\n` +
      `Duration: ${(duration / 1000).toFixed(1)}s\n` +
      `Action: Using hardcoded/last-known rates`,
    );
    await updateCooldown(supabase, 'fx_alert_last_stale_at');
  }
}

// POST for manual trigger from dashboard
export async function POST(request: NextRequest) {
  return GET(request);
}
