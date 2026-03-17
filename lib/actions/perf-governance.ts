// lib/actions/perf-governance.ts
// P2b: Performance-Governance — CWV budget monitoring + regression detection
//
// Called daily by /api/cron/perf-governance.
// Compares this week's p75 vs last week's p75 for LCP, INP, CLS.
// If regression exceeds threshold → Telegram alert.
// If an A/B test variant degrades CWV > 20% → auto-reset test + alert.

'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { sendTelegramAlert } from '@/lib/alerts/telegram';
import { resetAbTest } from '@/lib/actions/ab-testing';
import { logger } from '@/lib/logging';

// ── Types ────────────────────────────────────────────────────────

interface MetricBudget {
  name: string;
  budget: number;
  thisWeekP75: number | null;
  lastWeekP75: number | null;
  regressionPct: number | null;
  overBudget: boolean;
  regressed: boolean;
}

interface GovernanceResult {
  metrics: MetricBudget[];
  alertsSent: number;
  testsReset: string[];
  enabled: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────

function computeP75(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.75)] ?? null;
}

// ── Main ─────────────────────────────────────────────────────────

export async function runPerfGovernance(): Promise<GovernanceResult> {
  const supabase = createServiceClient();

  // ── 1. Read governance settings ───────────────────────────────
  const { data: settings } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('category', 'performance');

  const cfg: Record<string, string> = {};
  for (const s of settings || []) cfg[s.key] = s.value;

  const enabled = cfg.cwv_governance_enabled !== 'false';
  if (!enabled) {
    return { metrics: [], alertsSent: 0, testsReset: [], enabled: false };
  }

  const budgets: Record<string, number> = {
    LCP: parseFloat(cfg.cwv_budget_lcp || '2500'),
    INP: parseFloat(cfg.cwv_budget_inp || '200'),
    CLS: parseFloat(cfg.cwv_budget_cls || '0.1'),
  };
  const regressionThreshold = parseFloat(cfg.cwv_regression_threshold || '15');

  // ── 2. Query web_vitals: this week vs last week ───────────────
  const now = Date.now();
  const thisWeekStart = new Date(now - 7 * 86400_000).toISOString();
  const lastWeekStart = new Date(now - 14 * 86400_000).toISOString();
  const lastWeekEnd   = thisWeekStart;

  const [thisWeekRes, lastWeekRes] = await Promise.all([
    supabase
      .from('web_vitals')
      .select('name, value')
      .in('name', ['LCP', 'INP', 'CLS'])
      .gte('recorded_at', thisWeekStart),
    supabase
      .from('web_vitals')
      .select('name, value')
      .in('name', ['LCP', 'INP', 'CLS'])
      .gte('recorded_at', lastWeekStart)
      .lt('recorded_at', lastWeekEnd),
  ]);

  // Group by metric
  const thisWeek: Record<string, number[]> = { LCP: [], INP: [], CLS: [] };
  const lastWeek: Record<string, number[]> = { LCP: [], INP: [], CLS: [] };

  for (const r of thisWeekRes.data || []) {
    if (thisWeek[r.name]) thisWeek[r.name].push(r.value);
  }
  for (const r of lastWeekRes.data || []) {
    if (lastWeek[r.name]) lastWeek[r.name].push(r.value);
  }

  // ── 3. Compute p75 + regression ───────────────────────────────
  let alertsSent = 0;
  const testsReset: string[] = [];
  const metrics: MetricBudget[] = [];

  for (const name of ['LCP', 'INP', 'CLS']) {
    const budget = budgets[name] ?? 0;
    const thisP75 = computeP75(thisWeek[name]);
    const lastP75 = computeP75(lastWeek[name]);

    let regressionPct: number | null = null;
    if (thisP75 !== null && lastP75 !== null && lastP75 > 0) {
      regressionPct = ((thisP75 - lastP75) / lastP75) * 100;
    }

    const overBudget = thisP75 !== null && thisP75 > budget;
    const regressed = regressionPct !== null && regressionPct > regressionThreshold;

    metrics.push({
      name,
      budget,
      thisWeekP75: thisP75,
      lastWeekP75: lastP75,
      regressionPct,
      overBudget,
      regressed,
    });

    // ── Alert on regression ────────────────────────────────────
    if (regressed || overBudget) {
      const unit = name === 'CLS' ? '' : 'ms';
      const lines = [
        `⚠️ <b>CWV Regression: ${name}</b>`,
        '',
        `p75 this week: <b>${thisP75 !== null ? (name === 'CLS' ? thisP75.toFixed(3) : Math.round(thisP75)) : '—'}${unit}</b>`,
        `p75 last week: ${lastP75 !== null ? (name === 'CLS' ? lastP75.toFixed(3) : Math.round(lastP75)) : '—'}${unit}`,
        `Budget: ${name === 'CLS' ? budget : Math.round(budget)}${unit}`,
      ];
      if (regressionPct !== null) {
        lines.push(`Change: <b>${regressionPct > 0 ? '+' : ''}${regressionPct.toFixed(1)}%</b>`);
      }
      if (overBudget) lines.push('🔴 Over budget!');

      try {
        await sendTelegramAlert(lines.join('\n'));
        alertsSent++;
      } catch (e) {
        logger.error('[perf-governance] Telegram alert failed', { error: e });
      }
    }
  }

  // ── 4. A/B Test auto-pause on CWV degradation (hub-scoped) ──
  // For each active hub, check if its specific pages show > 20% CWV regression.
  // Hub IDs follow pattern: sticky_nav__{category}__{market}
  try {
    const { data: activeTests } = await supabase
      .from('ab_test_stats')
      .select('hub_id, variant, impressions')
      .eq('winner_declared', false)
      .gte('impressions', 100);

    if (activeTests?.length) {
      const hubIds = [...new Set(activeTests.map((t) => t.hub_id))];

      for (const hubId of hubIds) {
        // Parse hub_id → market + category for page-scoped CWV check
        const hubParts = hubId.split('__');
        const hubCategory = hubParts[1];
        const hubMarket = hubParts[2];

        if (!hubCategory || !hubMarket) continue;

        // Build page URL prefix for this hub's pages
        const pathPrefix = hubMarket === 'us'
          ? `/${hubCategory}/`
          : `/${hubMarket}/${hubCategory}/`;

        // Query CWV for this hub's pages only
        const [hubThisWeek, hubLastWeek] = await Promise.all([
          supabase
            .from('web_vitals')
            .select('name, value')
            .in('name', ['LCP', 'INP', 'CLS'])
            .eq('market', hubMarket)
            .like('page_url', `%${pathPrefix}%`)
            .gte('recorded_at', thisWeekStart),
          supabase
            .from('web_vitals')
            .select('name, value')
            .in('name', ['LCP', 'INP', 'CLS'])
            .eq('market', hubMarket)
            .like('page_url', `%${pathPrefix}%`)
            .gte('recorded_at', lastWeekStart)
            .lt('recorded_at', lastWeekEnd),
        ]);

        // Compute per-hub p75 regression
        const hubThis: Record<string, number[]> = { LCP: [], INP: [], CLS: [] };
        const hubLast: Record<string, number[]> = { LCP: [], INP: [], CLS: [] };
        for (const r of hubThisWeek.data || []) {
          if (hubThis[r.name]) hubThis[r.name].push(r.value);
        }
        for (const r of hubLastWeek.data || []) {
          if (hubLast[r.name]) hubLast[r.name].push(r.value);
        }

        const regressedNames: string[] = [];
        for (const name of ['LCP', 'INP', 'CLS']) {
          const thisP75 = computeP75(hubThis[name]);
          const lastP75 = computeP75(hubLast[name]);
          if (thisP75 !== null && lastP75 !== null && lastP75 > 0) {
            const pct = ((thisP75 - lastP75) / lastP75) * 100;
            if (pct > 20) regressedNames.push(`${name} (+${pct.toFixed(1)}%)`);
          }
        }

        if (regressedNames.length > 0) {
          await resetAbTest(hubId);
          testsReset.push(hubId);

          try {
            await sendTelegramAlert(
              `🛑 <b>A/B Test Auto-Paused</b>\n\n` +
              `Hub: <code>${hubId}</code>\n` +
              `Reason: CWV degradation > 20% on hub pages\n` +
              `Metrics: ${regressedNames.join(', ')}\n\n` +
              `Test has been reset to prevent further damage.`,
            );
            alertsSent++;
          } catch (e) {
            logger.error('[perf-governance] AB reset alert failed', { error: e });
          }
        }
      }
    }
  } catch (e) {
    logger.error('[perf-governance] AB test check failed', { error: e });
  }

  return { metrics, alertsSent, testsReset, enabled };
}
