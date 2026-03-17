'use server';

import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logging';

import { createServiceClient } from '@/lib/supabase/server';
import { sendTelegramAlert } from '@/lib/alerts/telegram';

// ════════════════════════════════════════════════════════════════
// SIMULATION MODE — Generates realistic test data for demo/QA
//
// triggerFullSimulation()  — Fake CTA clicks + spike + downstream
// clearSimulationData()    — Removes all sim-tagged rows
// getSimulationStatus()    — Returns counts of active sim data
// ════════════════════════════════════════════════════════════════

// ── Config ───────────────────────────────────────────────────

const SIMULATION_SLUGS = [
  {
    slug: 'personal-finance/best-robo-advisors',
    market: 'us',
    category: 'personal-finance',
    providers: ['Wealthfront', 'Betterment', 'Schwab Intelligent'],
  },
  {
    slug: 'trading/etoro-review',
    market: 'us',
    category: 'trading',
    providers: ['eToro'],
  },
  {
    slug: 'trading/interactive-brokers-review',
    market: 'us',
    category: 'trading',
    providers: ['Interactive Brokers'],
  },
  {
    slug: 'ai-tools/jasper-ai-review',
    market: 'us',
    category: 'ai-tools',
    providers: ['Jasper'],
  },
  {
    slug: 'trading/hargreaves-lansdown-review',
    market: 'uk',
    category: 'trading',
    providers: ['Hargreaves Lansdown'],
  },
  {
    slug: 'personal-finance/chase-sapphire-preferred-review',
    market: 'us',
    category: 'personal-finance',
    providers: ['Chase'],
  },
] as const;

/** The slug that will receive the artificial spike */
const SPIKE_SLUG = SIMULATION_SLUGS[0];

// ── Types ────────────────────────────────────────────────────

export interface SimulationResult {
  success: boolean;
  clicksInserted: number;
  spikeClicksInserted: number;
  planningItemsInserted: number;
  spikeMonitorResult?: { spikesDetected: number; alertsSent: number };
  optimizationResult?: { tasksCreated: number };
  error?: string;
}

export interface ClearResult {
  success: boolean;
  deleted: {
    ctaAnalytics: number;
    planningQueue: number;
    optimizationTasks: number;
    autopilotCooldowns: number;
  };
  error?: string;
}

export interface SimulationStatus {
  active: boolean;
  clickCount: number;
  planningCount: number;
  optimizationCount: number;
}

// ── Helpers ──────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a random timestamp within the last N days,
 * biased toward business hours (9-18 UTC).
 */
function randomClickedAt(daysBack: number): string {
  const now = Date.now();
  const msBack = daysBack * 24 * 60 * 60 * 1000;
  const timestamp = now - Math.random() * msBack;

  const date = new Date(timestamp);

  // Bias toward business hours: 70% chance of 9-18 UTC
  if (Math.random() < 0.7) {
    date.setUTCHours(randomInt(9, 17), randomInt(0, 59), randomInt(0, 59));
  }

  return date.toISOString();
}

// ── Main: Trigger Full Simulation ────────────────────────────

export async function triggerFullSimulation(): Promise<SimulationResult> {
  const supabase = createServiceClient();
  const simTimestamp = Date.now();
  const sessionPrefix = `sim_${simTimestamp}`;

  let clicksInserted = 0;
  let spikeClicksInserted = 0;
  let planningItemsInserted = 0;

  try {
    // ─── Step A: Base Traffic (500-800 Clicks) ─────────────
    const baseCount = randomInt(500, 800);
    const baseRows: Array<Record<string, unknown>> = [];

    for (let i = 0; i < baseCount; i++) {
      const slugConfig = randomElement(SIMULATION_SLUGS);
      const provider = randomElement(slugConfig.providers);

      baseRows.push({
        slug: slugConfig.slug,
        market: slugConfig.market,
        provider,
        variant: Math.random() < 0.65 ? 'emerald-shimmer' : 'violet-pill',
        device_type: Math.random() < 0.55 ? 'desktop' : Math.random() < 0.78 ? 'mobile' : 'tablet',
        ip_hash: randomHex(16),
        session_id: `${sessionPrefix}_${i}`,
        clicked_at: randomClickedAt(7),
      });
    }

    // Insert in chunks of 100
    const CHUNK_SIZE = 100;
    for (let i = 0; i < baseRows.length; i += CHUNK_SIZE) {
      const chunk = baseRows.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from('cta_analytics').insert(chunk);
      if (error) {
        logger.error(`[simulator] Chunk insert error at ${i}:`, error.message);
      } else {
        clicksInserted += chunk.length;
      }
    }

    // ─── Step B: Spike (40-60 Clicks in Last Hour) ─────────
    const spikeCount = randomInt(40, 60);
    const spikeRows: Array<Record<string, unknown>> = [];
    const now = Date.now();

    for (let i = 0; i < spikeCount; i++) {
      const provider = randomElement(SPIKE_SLUG.providers);
      // All within last 55 minutes
      const clickedAt = new Date(now - Math.random() * 55 * 60 * 1000).toISOString();

      spikeRows.push({
        slug: SPIKE_SLUG.slug,
        market: SPIKE_SLUG.market,
        provider,
        variant: Math.random() < 0.65 ? 'emerald-shimmer' : 'violet-pill',
        device_type: Math.random() < 0.55 ? 'desktop' : Math.random() < 0.78 ? 'mobile' : 'tablet',
        ip_hash: randomHex(16),
        session_id: `${sessionPrefix}_spike_${i}`,
        clicked_at: clickedAt,
      });
    }

    const { error: spikeError } = await supabase.from('cta_analytics').insert(spikeRows);
    if (spikeError) {
      logger.error('[simulator] Spike insert error:', spikeError.message);
    } else {
      spikeClicksInserted = spikeRows.length;
    }

    // ─── Step C: Insert Planning Queue Items ───────────────
    const planningItems = [
      {
        keyword: 'best robo advisors for beginners 2025',
        market: 'us',
        category: 'personal-finance',
        predicted_cpa: 125,
        reason: '[SIM] High-traffic category "personal-finance" with strong CPA rates. Predicted revenue: $125/mo via Wealthfront. Source: spike on best-robo-advisors.',
        opportunity_score: 82,
        source_slug: 'personal-finance/best-robo-advisors',
        status: 'planned',
        digest_date: new Date().toISOString().split('T')[0],
      },
      {
        keyword: 'etoro vs interactive brokers fees comparison',
        market: 'us',
        category: 'trading',
        predicted_cpa: 180,
        reason: '[SIM] Comparison keyword with high buyer intent. Predicted revenue: $180/mo via eToro + IBKR affiliate rates. Source: CTA spike analysis.',
        opportunity_score: 75,
        source_slug: 'trading/etoro-review',
        status: 'planned',
        digest_date: new Date().toISOString().split('T')[0],
      },
      {
        keyword: 'hargreaves lansdown ISA review 2025',
        market: 'uk',
        category: 'trading',
        predicted_cpa: 95,
        reason: '[SIM] UK market gap — ISA product reviews underrepresented. Predicted revenue: $95/mo via Hargreaves Lansdown. Source: market expansion analysis.',
        opportunity_score: 68,
        source_slug: 'trading/hargreaves-lansdown-review',
        status: 'planned',
        digest_date: new Date().toISOString().split('T')[0],
      },
    ];

    for (const item of planningItems) {
      const { error } = await supabase.from('planning_queue').insert(item);
      if (!error) planningItemsInserted++;
    }

    // ─── Step D: Trigger Downstream Logic ──────────────────
    let spikeMonitorResult: SimulationResult['spikeMonitorResult'];
    let optimizationResult: SimulationResult['optimizationResult'];

    // D1: Run Spike Monitor → detects spike, sends Telegram, triggers auto-pilot
    try {
      const { runSpikeMonitor } = await import('@/lib/actions/spike-monitor');
      const spikeResult = await runSpikeMonitor();
      spikeMonitorResult = {
        spikesDetected: spikeResult.spikesDetected,
        alertsSent: spikeResult.alertsSent,
      };
    } catch (err) {
      Sentry.captureException(err);
      logger.error('[simulator] runSpikeMonitor failed:', err);
    }

    // D2: Run Optimization Analysis → analyzes fake CTA data, creates tasks
    try {
      const { runOptimizationAnalysis } = await import('@/lib/actions/optimization-engine');
      const optResult = await runOptimizationAnalysis('weekly');
      optimizationResult = {
        tasksCreated: optResult.tasksCreated,
      };
    } catch (err) {
      Sentry.captureException(err);
      logger.error('[simulator] runOptimizationAnalysis failed:', err);
    }

    // D3: Send Telegram summary
    try {
      const msg = [
        `🧪 <b>SIMULATION MODE AKTIV</b>`,
        ``,
        `✅ ${clicksInserted} Base-Clicks generiert`,
        `⚡ ${spikeClicksInserted} Spike-Clicks (${SPIKE_SLUG.slug})`,
        `📋 ${planningItemsInserted} Planning-Items erstellt`,
        spikeMonitorResult
          ? `🚀 Spike Monitor: ${spikeMonitorResult.spikesDetected} Spikes, ${spikeMonitorResult.alertsSent} Alerts`
          : `⚠️ Spike Monitor: nicht ausgeloest`,
        optimizationResult
          ? `🔧 Optimizer: ${optimizationResult.tasksCreated} Tasks erstellt`
          : `⚠️ Optimizer: nicht ausgeloest`,
        ``,
        `<i>Session: ${sessionPrefix}</i>`,
      ].join('\n');

      await sendTelegramAlert(msg);
    } catch {
      // Telegram is best-effort
    }

    return {
      success: true,
      clicksInserted,
      spikeClicksInserted,
      planningItemsInserted,
      spikeMonitorResult,
      optimizationResult,
    };
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[simulator] triggerFullSimulation failed:', msg);
    return {
      success: false,
      clicksInserted,
      spikeClicksInserted,
      planningItemsInserted,
      error: msg,
    };
  }
}

// ── Clear Simulation Data ────────────────────────────────────

export async function clearSimulationData(): Promise<ClearResult> {
  const supabase = createServiceClient();

  const deleted = {
    ctaAnalytics: 0,
    planningQueue: 0,
    optimizationTasks: 0,
    autopilotCooldowns: 0,
  };

  try {
    // 1. CTA Analytics — identified by session_id prefix 'sim_'
    const { data: ctaDeleted, error: ctaError } = await supabase
      .from('cta_analytics')
      .delete()
      .like('session_id', 'sim_%')
      .select('id');

    if (ctaError) {
      logger.error('[simulator] cta_analytics cleanup error:', ctaError.message);
    } else {
      deleted.ctaAnalytics = ctaDeleted?.length || 0;
    }

    // 2. Planning Queue — identified by [SIM] marker in reason
    const { data: planDeleted, error: planError } = await supabase
      .from('planning_queue')
      .delete()
      .like('reason', '%[SIM]%')
      .select('id');

    if (planError) {
      logger.error('[simulator] planning_queue cleanup error:', planError.message);
    } else {
      deleted.planningQueue = planDeleted?.length || 0;
    }

    // 3. Optimization Tasks — scoped by simulation slugs + recency (last 24h)
    const simSlugs = SIMULATION_SLUGS.map((s) => s.slug);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: optDeleted, error: optError } = await supabase
      .from('optimization_tasks')
      .delete()
      .in('slug', simSlugs)
      .gte('created_at', oneDayAgo)
      .select('id');

    if (optError) {
      logger.error('[simulator] optimization_tasks cleanup error:', optError.message);
    } else {
      deleted.optimizationTasks = optDeleted?.length || 0;
    }

    // 4. Autopilot Cooldowns — remove cooldowns for simulation slugs
    const { data: cooldownDeleted, error: cooldownError } = await supabase
      .from('autopilot_cooldowns')
      .delete()
      .in('slug', simSlugs)
      .select('slug');

    if (cooldownError) {
      logger.error('[simulator] autopilot_cooldowns cleanup error:', cooldownError.message);
    } else {
      deleted.autopilotCooldowns = cooldownDeleted?.length || 0;
    }

    // Send Telegram cleanup notification
    try {
      const total = deleted.ctaAnalytics + deleted.planningQueue + deleted.optimizationTasks + deleted.autopilotCooldowns;
      const msg = [
        `🧹 <b>SIMULATION DATA CLEARED</b>`,
        ``,
        `📊 CTA Clicks: ${deleted.ctaAnalytics} geloescht`,
        `📋 Planning Items: ${deleted.planningQueue} geloescht`,
        `🔧 Optimization Tasks: ${deleted.optimizationTasks} geloescht`,
        `⏸️ Cooldowns: ${deleted.autopilotCooldowns} geloescht`,
        ``,
        `<b>Total: ${total} Eintraege entfernt</b>`,
      ].join('\n');

      await sendTelegramAlert(msg);
    } catch {
      // Telegram is best-effort
    }

    return { success: true, deleted };
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[simulator] clearSimulationData failed:', msg);
    return { success: false, deleted, error: msg };
  }
}

// ── Get Simulation Status ────────────────────────────────────

export async function getSimulationStatus(): Promise<SimulationStatus> {
  const supabase = createServiceClient();

  try {
    const [clickResult, planResult, optResult] = await Promise.all([
      supabase
        .from('cta_analytics')
        .select('id', { count: 'exact', head: true })
        .like('session_id', 'sim_%'),
      supabase
        .from('planning_queue')
        .select('id', { count: 'exact', head: true })
        .like('reason', '%[SIM]%'),
      supabase
        .from('optimization_tasks')
        .select('id', { count: 'exact', head: true })
        .in('slug', SIMULATION_SLUGS.map((s) => s.slug))
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const clickCount = clickResult.count || 0;
    const planningCount = planResult.count || 0;
    const optimizationCount = optResult.count || 0;

    return {
      active: clickCount > 0 || planningCount > 0 || optimizationCount > 0,
      clickCount,
      planningCount,
      optimizationCount,
    };
  } catch (err) {
    Sentry.captureException(err);
    logger.error('[simulator] getSimulationStatus failed:', err);
    return {
      active: false,
      clickCount: 0,
      planningCount: 0,
      optimizationCount: 0,
    };
  }
}
