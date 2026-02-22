'use server';

import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import {
  sendTelegramAlert,
  formatSpikeAlert,
  formatAutoPilotAlert,
  formatCooldownSkip,
  formatCtrBelowThreshold,
  formatHighPriorityBoost,
} from '@/lib/alerts/telegram';
import { getSlugCtr } from '@/lib/actions/cta-analytics';
import { estimateSpikeRevenue } from '@/lib/actions/revenue-forecast';
import {
  triggerFreshnessBoost,
  triggerDeployHook,
} from '@/lib/actions/content-overrides';
import type { Market } from '@/lib/supabase/types';

// ============================================================
// Spike Monitor — Detects abnormal CTA click traffic
// Compares last 60 min vs 7-day rolling average per slug
// ============================================================

/** Spike threshold: clicks must exceed avg × this multiplier */
const SPIKE_MULTIPLIER = 3.0;

/** Minimum absolute clicks in last hour to trigger (prevents noise) */
const MIN_CLICKS_THRESHOLD = 5;

/** Cooldown: same slug won't trigger auto-pilot more than once per 24h */
const COOLDOWN_HOURS = 24;

/** Dashboard heatmap URL */
const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';
const HEATMAP_URL = `${DASHBOARD_URL}/dashboard/analytics/heatmap`;

// ============================================================
// Types
// ============================================================

export interface SpikeAlert {
  slug: string;
  market: Market;
  clicksLastHour: number;
  avgHourly: number;
  spikeMultiplier: number;
  topProvider: string | null;
}

export interface AutoPilotAction {
  slug: string;
  market: Market;
  boostSuccess: boolean;
  deploySuccess: boolean;
  cooldownSkipped: boolean;
  /** CTR at time of decision (0-100%) */
  ctr: number;
  /** Page views used for CTR calc */
  pageViews: number;
  /** Whether CTR was below threshold (alert-only, no rebuild) */
  ctrBelowThreshold: boolean;
  /** high | normal | low */
  priority: 'high' | 'normal' | 'low';
}

export interface SpikeMonitorResult {
  scanned: number;
  spikesDetected: number;
  alertsSent: number;
  autoPilotRuns: number;
  cooldownSkips: number;
  ctrGateBlocks: number;
  highPriorityRuns: number;
  alerts: SpikeAlert[];
  autoPilotActions: AutoPilotAction[];
  errors: string[];
}

// ============================================================
// Main: Run spike detection + auto-pilot
// ============================================================

export async function runSpikeMonitor(): Promise<SpikeMonitorResult> {
  const supabase = createServiceClient();
  const errors: string[] = [];

  // 1. Check which markets have alerts enabled
  const enabledMarkets = await getEnabledMarkets(supabase);

  if (enabledMarkets.length === 0) {
    return {
      scanned: 0,
      spikesDetected: 0,
      alertsSent: 0,
      autoPilotRuns: 0,
      cooldownSkips: 0,
      ctrGateBlocks: 0,
      highPriorityRuns: 0,
      alerts: [],
      autoPilotActions: [],
      errors: ['No markets have Telegram alerts enabled'],
    };
  }

  // Load CTR thresholds per market
  const ctrThresholds = await getCtrThresholds(supabase);

  // 2. Get clicks from last 60 minutes
  const oneHourAgo = new Date();
  oneHourAgo.setMinutes(oneHourAgo.getMinutes() - 60);

  const { data: recentClicks, error: recentError } = await supabase
    .from('cta_analytics')
    .select('slug, market, variant, provider')
    .gte('clicked_at', oneHourAgo.toISOString())
    .in('market', enabledMarkets);

  if (recentError) {
    return {
      scanned: 0,
      spikesDetected: 0,
      alertsSent: 0,
      autoPilotRuns: 0,
      cooldownSkips: 0,
      ctrGateBlocks: 0,
      highPriorityRuns: 0,
      alerts: [],
      autoPilotActions: [],
      errors: [`Query error (recent): ${recentError.message}`],
    };
  }

  // 3. Get clicks from last 7 days for rolling average
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: weekClicks, error: weekError } = await supabase
    .from('cta_analytics')
    .select('slug, market, clicked_at')
    .gte('clicked_at', sevenDaysAgo.toISOString())
    .in('market', enabledMarkets);

  if (weekError) {
    return {
      scanned: 0,
      spikesDetected: 0,
      alertsSent: 0,
      autoPilotRuns: 0,
      cooldownSkips: 0,
      ctrGateBlocks: 0,
      highPriorityRuns: 0,
      alerts: [],
      autoPilotActions: [],
      errors: [`Query error (week): ${weekError.message}`],
    };
  }

  // 4. Compute 7-day hourly average per slug+market
  const weeklyMap = new Map<string, number>();
  for (const row of weekClicks || []) {
    const key = `${row.slug}|${row.market}`;
    weeklyMap.set(key, (weeklyMap.get(key) || 0) + 1);
  }

  const HOURS_IN_WEEK = 168;

  // 5. Aggregate recent clicks per slug+market
  const recentMap = new Map<
    string,
    {
      slug: string;
      market: Market;
      count: number;
      providers: Map<string, number>;
    }
  >();

  for (const row of recentClicks || []) {
    const key = `${row.slug}|${row.market}`;
    let entry = recentMap.get(key);
    if (!entry) {
      entry = {
        slug: row.slug,
        market: row.market as Market,
        count: 0,
        providers: new Map(),
      };
      recentMap.set(key, entry);
    }
    entry.count++;
    entry.providers.set(row.provider, (entry.providers.get(row.provider) || 0) + 1);
  }

  // 6. Detect spikes
  const spikes: SpikeAlert[] = [];

  for (const [key, recent] of recentMap) {
    const weeklyTotal = weeklyMap.get(key) || 0;
    const avgHourly = weeklyTotal / HOURS_IN_WEEK;

    if (recent.count < MIN_CLICKS_THRESHOLD) continue;

    const safeAvg = Math.max(avgHourly, 0.5);
    const multiplier = recent.count / safeAvg;

    if (multiplier >= SPIKE_MULTIPLIER) {
      let topProvider: string | null = null;
      let topCount = 0;
      for (const [provider, count] of recent.providers) {
        if (count > topCount) {
          topProvider = provider;
          topCount = count;
        }
      }

      spikes.push({
        slug: recent.slug,
        market: recent.market,
        clicksLastHour: recent.count,
        avgHourly,
        spikeMultiplier: multiplier,
        topProvider,
      });
    }
  }

  spikes.sort((a, b) => b.spikeMultiplier - a.spikeMultiplier);

  // 7. Send Telegram alerts (max 5 per run)
  let alertsSent = 0;
  const maxAlerts = 5;

  for (const spike of spikes.slice(0, maxAlerts)) {
    // Estimate potential revenue for this spike
    let potentialRevenue: number | undefined;
    let cpaValue: number | undefined;
    try {
      const revenueEst = await estimateSpikeRevenue(
        spike.slug,
        spike.market,
        spike.clicksLastHour,
        spike.topProvider
      );
      if (revenueEst.hasRate && revenueEst.potentialRevenue > 0) {
        potentialRevenue = revenueEst.potentialRevenue;
        cpaValue = revenueEst.cpaValue;
      }
    } catch {
      // Revenue estimation is best-effort, don't block alerts
    }

    const message = formatSpikeAlert({
      slug: spike.slug,
      market: spike.market,
      clicksLastHour: spike.clicksLastHour,
      avgHourly: spike.avgHourly,
      spikeMultiplier: spike.spikeMultiplier,
      topProvider: spike.topProvider,
      dashboardUrl: HEATMAP_URL,
      potentialRevenue,
      cpaValue,
    });

    const result = await sendTelegramAlert(message);
    if (result.success) alertsSent++;
    else errors.push(`Telegram send failed for ${spike.slug}: ${result.error}`);

    await new Promise((r) => setTimeout(r, 50));
  }

  // ────────────────────────────────────────────────────────
  // 8. AUTO-PILOT: CTR-gated freshness boost + Deploy
  //    CTR > threshold → auto-pilot fires
  //    CTR > 10% → HIGH PRIORITY (immediate)
  //    CTR < threshold → Telegram alert only (no rebuild)
  // ────────────────────────────────────────────────────────
  const autoPilotActions: AutoPilotAction[] = [];
  let autoPilotRuns = 0;
  let cooldownSkips = 0;
  let ctrGateBlocks = 0;
  let highPriorityRuns = 0;

  /** High-priority threshold (hardcoded, above this = immediate rebuild) */
  const HIGH_PRIORITY_CTR = 10.0;

  for (const spike of spikes.slice(0, maxAlerts)) {
    // 8a. Calculate CTR for this slug (last 24h window)
    const ctrData = await getSlugCtr(spike.slug, 24);
    const marketThreshold = ctrThresholds.get(spike.market) ?? 5.0;
    const priority: 'high' | 'normal' | 'low' =
      ctrData.ctr >= HIGH_PRIORITY_CTR ? 'high' :
      ctrData.ctr >= marketThreshold ? 'normal' : 'low';

    // 8b. CTR below threshold → Telegram alert only, skip auto-pilot
    if (priority === 'low') {
      ctrGateBlocks++;
      autoPilotActions.push({
        slug: spike.slug,
        market: spike.market,
        boostSuccess: false,
        deploySuccess: false,
        cooldownSkipped: false,
        ctr: ctrData.ctr,
        pageViews: ctrData.pageViews,
        ctrBelowThreshold: true,
        priority,
      });

      // Informational Telegram: spike detected but CTR too low
      const belowMsg = formatCtrBelowThreshold({
        slug: spike.slug,
        market: spike.market,
        clicksLastHour: spike.clicksLastHour,
        spikeMultiplier: spike.spikeMultiplier,
        ctr: ctrData.ctr,
        threshold: marketThreshold,
        pageViews: ctrData.pageViews,
      });
      await sendTelegramAlert(belowMsg).catch(() => {});

      continue;
    }

    // 8c. Check 24h cooldown
    const cooldownResult = await checkCooldown(supabase, spike.slug);

    if (cooldownResult.onCooldown) {
      cooldownSkips++;
      autoPilotActions.push({
        slug: spike.slug,
        market: spike.market,
        boostSuccess: false,
        deploySuccess: false,
        cooldownSkipped: true,
        ctr: ctrData.ctr,
        pageViews: ctrData.pageViews,
        ctrBelowThreshold: false,
        priority,
      });

      // Informational Telegram message (fire-and-forget)
      if (cooldownResult.lastTriggeredAt) {
        const skipMsg = formatCooldownSkip({
          slug: spike.slug,
          lastTriggeredAt: cooldownResult.lastTriggeredAt,
        });
        await sendTelegramAlert(skipMsg).catch(() => {});
      }

      continue;
    }

    // 8d. Trigger freshness boost (update content_overrides.boost_date)
    const reason = priority === 'high'
      ? `HIGH-PRIORITY Auto-Pilot: ${spike.spikeMultiplier.toFixed(1)}x spike, CTR ${ctrData.ctr.toFixed(1)}% (${spike.clicksLastHour} clicks/hr)`
      : `Auto-Pilot: ${spike.spikeMultiplier.toFixed(1)}x spike, CTR ${ctrData.ctr.toFixed(1)}% (${spike.clicksLastHour} clicks/hr)`;

    const boostResult = await triggerFreshnessBoost(spike.slug, reason);

    // 8e. Trigger deployment webhook
    const deployResult = await triggerDeployHook();

    // 8f. Record cooldown timestamp
    await recordCooldown(
      supabase,
      spike.slug,
      spike.market,
      spike.spikeMultiplier,
      spike.clicksLastHour
    );

    autoPilotRuns++;
    if (priority === 'high') highPriorityRuns++;

    autoPilotActions.push({
      slug: spike.slug,
      market: spike.market,
      boostSuccess: boostResult.success,
      deploySuccess: deployResult.success,
      cooldownSkipped: false,
      ctr: ctrData.ctr,
      pageViews: ctrData.pageViews,
      ctrBelowThreshold: false,
      priority,
    });

    // 8g. Send auto-pilot Telegram notification (different for high-priority)
    const autoPilotMsg = priority === 'high'
      ? formatHighPriorityBoost({
          slug: spike.slug,
          market: spike.market,
          clicksLastHour: spike.clicksLastHour,
          spikeMultiplier: spike.spikeMultiplier,
          ctr: ctrData.ctr,
          pageViews: ctrData.pageViews,
          boostSuccess: boostResult.success,
          deploySuccess: deployResult.success,
          dashboardUrl: HEATMAP_URL,
        })
      : formatAutoPilotAlert({
          slug: spike.slug,
          market: spike.market,
          clicksLastHour: spike.clicksLastHour,
          spikeMultiplier: spike.spikeMultiplier,
          boostSuccess: boostResult.success,
          deploySuccess: deployResult.success,
          dashboardUrl: HEATMAP_URL,
        });

    const tgResult = await sendTelegramAlert(autoPilotMsg);
    if (!tgResult.success) {
      errors.push(`Auto-Pilot Telegram failed for ${spike.slug}: ${tgResult.error}`);
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  return {
    scanned: recentMap.size,
    spikesDetected: spikes.length,
    alertsSent,
    autoPilotRuns,
    cooldownSkips,
    ctrGateBlocks,
    highPriorityRuns,
    alerts: spikes,
    autoPilotActions,
    errors,
  };
}

// ============================================================
// Cooldown: 24h per-slug build-loop prevention
// ============================================================

interface CooldownCheck {
  onCooldown: boolean;
  lastTriggeredAt: string | null;
}

async function checkCooldown(
  supabase: ReturnType<typeof createServiceClient>,
  slug: string
): Promise<CooldownCheck> {
  const { data, error } = await supabase
    .from('autopilot_cooldowns')
    .select('last_triggered_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    // Table may not exist yet or no record → not on cooldown
    return { onCooldown: false, lastTriggeredAt: null };
  }

  const lastTriggered = new Date(data.last_triggered_at);
  const hoursSince = (Date.now() - lastTriggered.getTime()) / (1000 * 60 * 60);

  return {
    onCooldown: hoursSince < COOLDOWN_HOURS,
    lastTriggeredAt: data.last_triggered_at,
  };
}

async function recordCooldown(
  supabase: ReturnType<typeof createServiceClient>,
  slug: string,
  market: Market,
  spikeMultiplier: number,
  clicksAtTrigger: number
): Promise<void> {
  await supabase
    .from('autopilot_cooldowns')
    .upsert(
      {
        slug,
        last_triggered_at: new Date().toISOString(),
        spike_multiplier: spikeMultiplier,
        clicks_at_trigger: clicksAtTrigger,
        market,
      },
      { onConflict: 'slug' }
    )
    .then(({ error }) => {
      if (error) console.error('[Auto-Pilot] Cooldown record failed:', error.message);
    });
}

// ============================================================
// Alert Settings — per-market toggle
// ============================================================

export interface AlertSettings {
  market: Market;
  telegramEnabled: boolean;
  /** CTR threshold (0-100%) — auto-pilot only fires above this */
  ctrThreshold: number;
}

export async function getAlertSettings(): Promise<AlertSettings[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('spike_alert_settings')
    .select('market, telegram_enabled, ctr_threshold')
    .order('market');

  if (error) {
    return [
      { market: 'us', telegramEnabled: false, ctrThreshold: 5.0 },
      { market: 'uk', telegramEnabled: false, ctrThreshold: 5.0 },
      { market: 'ca', telegramEnabled: false, ctrThreshold: 5.0 },
      { market: 'au', telegramEnabled: false, ctrThreshold: 5.0 },
    ];
  }

  const markets: Market[] = ['us', 'uk', 'ca', 'au'];
  const existing = new Map(
    (data || []).map((r) => [r.market, { enabled: r.telegram_enabled, ctr: r.ctr_threshold }])
  );

  return markets.map((m) => ({
    market: m,
    telegramEnabled: existing.get(m)?.enabled ?? false,
    ctrThreshold: existing.get(m)?.ctr ?? 5.0,
  }));
}

export async function toggleMarketAlert(
  market: Market,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('spike_alert_settings')
    .upsert(
      { market, telegram_enabled: enabled, updated_at: new Date().toISOString() },
      { onConflict: 'market' }
    );

  if (error) {
    console.error('[Spike Monitor] Toggle error:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateCtrThreshold(
  market: Market,
  threshold: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  // Clamp threshold to 0-100 range
  const clamped = Math.max(0, Math.min(100, threshold));

  const { error } = await supabase
    .from('spike_alert_settings')
    .upsert(
      { market, ctr_threshold: clamped, updated_at: new Date().toISOString() },
      { onConflict: 'market' }
    );

  if (error) {
    console.error('[Spike Monitor] CTR threshold update error:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================
// Helper: Get CTR thresholds per market (for spike monitor)
// ============================================================

async function getCtrThresholds(
  supabase: ReturnType<typeof createServiceClient>
): Promise<Map<Market, number>> {
  const { data, error } = await supabase
    .from('spike_alert_settings')
    .select('market, ctr_threshold');

  const thresholds = new Map<Market, number>();
  if (error || !data) return thresholds;

  for (const row of data) {
    thresholds.set(row.market as Market, row.ctr_threshold ?? 5.0);
  }
  return thresholds;
}

// ============================================================
// Helper: Get markets with Telegram alerts enabled
// ============================================================

async function getEnabledMarkets(
  supabase: ReturnType<typeof createServiceClient>
): Promise<Market[]> {
  const { data, error } = await supabase
    .from('spike_alert_settings')
    .select('market')
    .eq('telegram_enabled', true);

  if (error || !data) return [];
  return data.map((r) => r.market as Market);
}
