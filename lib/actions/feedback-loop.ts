// lib/actions/feedback-loop.ts
'use server';
import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import { sendTelegramAlert } from '@/lib/alerts/telegram';
import * as fs from 'fs/promises';
import * as path from 'path';

// ── Types ──────────────────────────────────────────────────────────────────

interface ActionRow {
  id: string;
  dedupe_key: string;
  insight_id: string | null;
  action_type: string;
  risk_tier: number;
  slug: string | null;
  market: string | null;
  description: string;
  payload: Record<string, unknown>;
  rollback_payload: Record<string, unknown> | null;
  outcome: string;
  outcome_baseline: Record<string, unknown> | null;
  executed_at: string;
}

interface OutcomeMeasurement {
  outcome: 'positive' | 'neutral' | 'negative';
  metrics: Record<string, unknown>;
  reasoning: string;
}

interface LearningRow {
  id: string;
  dedupe_key: string;
  category: string;
  market: string | null;
  learning: string;
  evidence: Record<string, unknown>;
  confidence: number;
  sample_size: number;
  first_observed_at: string;
  last_confirmed_at: string;
  last_threshold_adjust_at: string | null;
  contradicted_count: number;
}

export interface FeedbackLoopResult {
  success: boolean;
  auditId: string | null;
  actionsMeasured: number;
  learningsUpdated: number;
  thresholdsAdjusted: number;
  errors: string[];
}

// ── Cron Run Audit Helpers ─────────────────────────────────────────────────

async function startAudit(supabase: ReturnType<typeof createServiceClient>, jobName: string) {
  const { data } = await supabase
    .from('cron_run_audit')
    .insert({ job_name: jobName, status: 'running' })
    .select('id')
    .single();
  return data?.id ?? null;
}

async function finishAudit(
  supabase: ReturnType<typeof createServiceClient>,
  auditId: string | null,
  status: 'success' | 'error',
  startTime: number,
  processedCount: number,
  errorMessage?: string,
  metadata?: Record<string, unknown>,
) {
  if (!auditId) return;
  await supabase
    .from('cron_run_audit')
    .update({
      status,
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      processed_count: processedCount,
      error_message: errorMessage ?? null,
      metadata: metadata ?? {},
    })
    .eq('id', auditId);
}

// ── Outcome Measurement Functions ──────────────────────────────────────────

async function measureBoostContent(
  action: ActionRow,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<OutcomeMeasurement> {
  const baseline = action.outcome_baseline;
  if (!baseline || !action.slug) {
    return { outcome: 'neutral', metrics: {}, reasoning: 'No baseline or slug available' };
  }

  // Get current health score
  const { data: current } = await supabase
    .from('content_health_scores')
    .select('health_score, ranking_score, monthly_clicks, monthly_revenue')
    .eq('slug', action.slug)
    .eq('market', action.market ?? 'us')
    .maybeSingle();

  if (!current) {
    return { outcome: 'neutral', metrics: {}, reasoning: 'No current health data found' };
  }

  const baselineRanking = Number(baseline.ranking_score ?? 0);
  const baselineClicks = Number(baseline.monthly_clicks ?? 0);
  const currentRanking = Number(current.ranking_score ?? 0);
  const currentClicks = current.monthly_clicks ?? 0;

  const rankingDelta = currentRanking - baselineRanking;
  const clicksDelta = baselineClicks > 0 ? (currentClicks - baselineClicks) / baselineClicks : 0;

  const metrics = {
    baseline_ranking: baselineRanking,
    current_ranking: currentRanking,
    ranking_delta: rankingDelta,
    baseline_clicks: baselineClicks,
    current_clicks: currentClicks,
    clicks_delta_pct: Math.round(clicksDelta * 100),
    baseline_revenue: Number(baseline.monthly_revenue ?? 0),
    current_revenue: Number(current.monthly_revenue ?? 0),
  };

  // Positive: ranking +0.05 OR clicks +10%
  if (rankingDelta >= 0.05 || clicksDelta >= 0.10) {
    return {
      outcome: 'positive',
      metrics,
      reasoning: `Ranking ${rankingDelta >= 0.05 ? 'improved' : 'stable'}, clicks ${clicksDelta >= 0.10 ? `+${Math.round(clicksDelta * 100)}%` : 'stable'}`,
    };
  }

  // Negative: ranking dropped OR clicks dropped >10%
  if (rankingDelta < -0.05 || clicksDelta < -0.10) {
    return {
      outcome: 'negative',
      metrics,
      reasoning: `Ranking ${rankingDelta < -0.05 ? 'dropped' : 'stable'}, clicks ${clicksDelta < -0.10 ? `${Math.round(clicksDelta * 100)}%` : 'stable'}`,
    };
  }

  return { outcome: 'neutral', metrics, reasoning: 'No significant change detected' };
}

async function measureDeployAbWinner(
  action: ActionRow,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<OutcomeMeasurement> {
  const payload = action.payload;
  const hubId = payload.hub_id as string;

  if (!hubId) {
    return { outcome: 'neutral', metrics: {}, reasoning: 'No hub_id in payload' };
  }

  // Get A/B test stats post-deploy
  const { data: stats } = await supabase
    .from('ab_test_stats')
    .select('*')
    .eq('hub_id', hubId)
    .maybeSingle();

  if (!stats) {
    return { outcome: 'neutral', metrics: {}, reasoning: 'No A/B test stats found' };
  }

  // Get winner data
  const { data: winner } = await supabase
    .from('ab_test_winners')
    .select('*')
    .eq('hub_id', hubId)
    .maybeSingle();

  if (!winner) {
    return { outcome: 'neutral', metrics: {}, reasoning: 'No winner record found' };
  }

  const winnerCR = winner.winning_variant === 'A'
    ? Number(winner.variant_a_cr ?? 0)
    : Number(winner.variant_b_cr ?? 0);

  // Current CTR approximation from stats
  const totalImpressions = (stats.variant_a_impressions ?? 0) + (stats.variant_b_impressions ?? 0);
  const totalClicks = (stats.variant_a_clicks ?? 0) + (stats.variant_b_clicks ?? 0);
  const currentCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

  const metrics = {
    hub_id: hubId,
    winner_variant: winner.winning_variant,
    expected_cr: winnerCR,
    current_ctr: currentCTR,
    total_impressions: totalImpressions,
  };

  // Positive: current CTR >= winner_variant_ctr * 0.95 (5% tolerance)
  if (currentCTR >= winnerCR * 0.95) {
    return {
      outcome: 'positive',
      metrics,
      reasoning: `CTR ${(currentCTR * 100).toFixed(1)}% meets expected ${(winnerCR * 100).toFixed(1)}%`,
    };
  }

  return {
    outcome: 'negative',
    metrics,
    reasoning: `CTR ${(currentCTR * 100).toFixed(1)}% below expected ${(winnerCR * 100).toFixed(1)}%`,
  };
}

async function measureQueueGenesis(
  action: ActionRow,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<OutcomeMeasurement> {
  const keyword = action.payload.keyword as string;
  const market = action.payload.market as string;

  if (!keyword) {
    return { outcome: 'neutral', metrics: {}, reasoning: 'No keyword in payload' };
  }

  // Check if genesis pipeline completed
  const { data: pipeline } = await supabase
    .from('genesis_pipeline_runs')
    .select('status, finished_at')
    .eq('keyword', keyword)
    .eq('market', market ?? 'us')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const metrics = {
    keyword,
    market,
    pipeline_status: pipeline?.status ?? 'not_found',
  };

  if (pipeline?.status === 'completed') {
    return {
      outcome: 'positive',
      metrics,
      reasoning: `Genesis completed for "${keyword}"`,
    };
  }

  if (!pipeline || pipeline.status === 'failed') {
    return {
      outcome: 'negative',
      metrics,
      reasoning: `Genesis ${pipeline ? 'failed' : 'not started'} for "${keyword}"`,
    };
  }

  return {
    outcome: 'neutral',
    metrics,
    reasoning: `Genesis in progress: ${pipeline.status}`,
  };
}

async function measureActivateLink(
  action: ActionRow,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<OutcomeMeasurement> {
  const linkId = action.payload.link_id as string;
  const slug = action.slug;

  if (!linkId && !slug) {
    return { outcome: 'neutral', metrics: {}, reasoning: 'No link_id or slug' };
  }

  // Check clicks/conversions since activation
  const executedAt = action.executed_at;
  const { data: clicks } = await supabase
    .from('clicks')
    .select('id', { count: 'exact', head: true })
    .eq('link_id', linkId ?? '')
    .gte('timestamp', executedAt);

  const { data: conversions } = await supabase
    .from('conversions')
    .select('id', { count: 'exact', head: true })
    .eq('link_id', linkId ?? '')
    .gte('created_at', executedAt);

  const clickCount = (clicks as unknown as { count: number })?.count ?? 0;
  const convCount = (conversions as unknown as { count: number })?.count ?? 0;

  const metrics = {
    link_id: linkId,
    clicks_since: clickCount,
    conversions_since: convCount,
  };

  if (convCount > 0) {
    return { outcome: 'positive', metrics, reasoning: `${convCount} conversions since activation` };
  }
  if (clickCount > 5) {
    return { outcome: 'neutral', metrics, reasoning: `${clickCount} clicks but no conversions yet` };
  }

  return { outcome: 'neutral', metrics, reasoning: `Low activity: ${clickCount} clicks` };
}

async function measureGenericAction(
  action: ActionRow,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<OutcomeMeasurement> {
  // For Tier 0 actions (retrain_bandit, update_facts), check if content health improved
  if (!action.slug) {
    return { outcome: 'neutral', metrics: {}, reasoning: 'No slug for generic measurement' };
  }

  const baseline = action.outcome_baseline;
  const { data: current } = await supabase
    .from('content_health_scores')
    .select('health_score')
    .eq('slug', action.slug)
    .eq('market', action.market ?? 'us')
    .maybeSingle();

  if (!current || !baseline) {
    return { outcome: 'neutral', metrics: {}, reasoning: 'Insufficient data' };
  }

  const baselineHealth = Number(baseline.health_score ?? 0);
  const currentHealth = Number(current.health_score ?? 0);
  const delta = currentHealth - baselineHealth;

  const metrics = {
    baseline_health: baselineHealth,
    current_health: currentHealth,
    delta,
  };

  if (delta >= 0.03) return { outcome: 'positive', metrics, reasoning: `Health +${delta.toFixed(3)}` };
  if (delta <= -0.05) return { outcome: 'negative', metrics, reasoning: `Health ${delta.toFixed(3)}` };
  return { outcome: 'neutral', metrics, reasoning: `Health change: ${delta.toFixed(3)}` };
}

// ── Route to Measurement Function ──────────────────────────────────────────

async function measureAction(
  action: ActionRow,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<OutcomeMeasurement> {
  switch (action.action_type) {
    case 'boost_content':
      return measureBoostContent(action, supabase);
    case 'deploy_ab_winner':
      return measureDeployAbWinner(action, supabase);
    case 'queue_genesis':
      return measureQueueGenesis(action, supabase);
    case 'activate_link':
    case 'deactivate_link':
      return measureActivateLink(action, supabase);
    case 'apply_optimization':
      return measureBoostContent(action, supabase); // Same metrics as boost
    default:
      return measureGenericAction(action, supabase);
  }
}

// ── Learning Category Mapping ──────────────────────────────────────────────

function getCategoryForAction(actionType: string): string {
  const map: Record<string, string> = {
    boost_content: 'content_freshness',
    deploy_ab_winner: 'ab_testing',
    update_facts: 'content_freshness',
    retrain_bandit: 'revenue_optimization',
    queue_genesis: 'content_freshness',
    activate_link: 'affiliate_selection',
    deactivate_link: 'affiliate_selection',
    apply_optimization: 'cta_positioning',
  };
  return map[actionType] ?? 'revenue_optimization';
}

// ── Accumulate Learnings ───────────────────────────────────────────────────

async function updateLearnings(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<number> {
  let updated = 0;

  // Group outcomes by action_type + market
  const { data: actions } = await supabase
    .from('autonomous_actions')
    .select('action_type, market, outcome')
    .neq('outcome', 'pending');

  if (!actions || actions.length === 0) return 0;

  // Build groups
  const groups = new Map<string, { positive: number; neutral: number; negative: number; total: number }>();

  for (const action of actions) {
    const key = `${action.action_type}:${action.market ?? 'global'}`;
    const group = groups.get(key) ?? { positive: 0, neutral: 0, negative: 0, total: 0 };
    group.total++;
    if (action.outcome === 'positive') group.positive++;
    else if (action.outcome === 'negative') group.negative++;
    else group.neutral++;
    groups.set(key, group);
  }

  for (const [key, stats] of groups) {
    const [actionType, market] = key.split(':');
    const successRate = stats.total > 0 ? stats.positive / stats.total : 0;
    const confidence = Math.min(0.99, 0.3 + (stats.total / 50) * 0.7); // Scale with sample size
    const category = getCategoryForAction(actionType);

    const dedupeKey = `${category}:${market}:${actionType}_success_rate`;
    const learning = `${actionType} in ${market}: ${Math.round(successRate * 100)}% success rate (${stats.positive}/${stats.total})`;

    const evidence = {
      positive: stats.positive,
      neutral: stats.neutral,
      negative: stats.negative,
      total: stats.total,
      success_rate: successRate,
    };

    const { error } = await supabase.from('learnings').upsert(
      {
        dedupe_key: dedupeKey,
        category,
        market: market === 'global' ? null : market,
        learning,
        evidence,
        confidence: Math.round(confidence * 1000) / 1000,
        sample_size: stats.total,
        last_confirmed_at: new Date().toISOString(),
      },
      { onConflict: 'dedupe_key' },
    );

    if (!error) updated++;
  }

  return updated;
}

// ── Threshold Adjustment (Auto-Escalation / De-Escalation) ─────────────────

async function adjustThresholds(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<number> {
  let adjusted = 0;

  // Load settings
  const { data: settingsRows } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', [
      'min_samples_for_escalation',
      'min_samples_for_deescalation',
      'max_threshold_adjustment',
      'threshold_adjust_cooldown_days',
    ]);

  const settings = new Map<string, string>();
  for (const row of settingsRows ?? []) {
    settings.set(row.key, row.value);
  }

  const minEscalation = parseInt(settings.get('min_samples_for_escalation') ?? '10', 10);
  const minDeescalation = parseInt(settings.get('min_samples_for_deescalation') ?? '20', 10);
  const cooldownDays = parseInt(settings.get('threshold_adjust_cooldown_days') ?? '7', 10);

  // Load learnings with enough samples
  const { data: learnings } = await supabase
    .from('learnings')
    .select('*')
    .gte('sample_size', Math.min(minEscalation, minDeescalation));

  if (!learnings || learnings.length === 0) return 0;

  for (const learning of learnings as LearningRow[]) {
    const evidence = learning.evidence as Record<string, unknown>;
    const successRate = Number(evidence.success_rate ?? 0);
    const sampleSize = learning.sample_size;

    // Check cooldown
    if (learning.last_threshold_adjust_at) {
      const lastAdjust = new Date(learning.last_threshold_adjust_at);
      const daysSinceAdjust = (Date.now() - lastAdjust.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceAdjust < cooldownDays) continue;
    }

    // Extract action type from dedupe key (format: category:market:actionType_success_rate)
    const parts = learning.dedupe_key.split(':');
    const actionSuffix = parts[parts.length - 1]; // e.g. "boost_content_success_rate"
    const actionType = actionSuffix.replace('_success_rate', '');

    // Get current tier for this action type from insights
    const { data: recentInsight } = await supabase
      .from('insights')
      .select('risk_tier')
      .eq('recommended_action', actionType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!recentInsight) continue;
    const currentTier = recentInsight.risk_tier;

    let newTier = currentTier;

    // Auto-Escalation: >30% negative outcomes, 10+ samples
    if (successRate < 0.50 && sampleSize >= minEscalation && currentTier < 3) {
      newTier = Math.min(currentTier + 1, 3);
      logger.warn('[feedback-loop] Escalating tier', {
        actionType,
        market: learning.market,
        currentTier,
        newTier,
        successRate,
        sampleSize,
      });
    }

    // Auto-Deescalation: >85% positive over 20+ samples, never below 0
    if (successRate > 0.85 && sampleSize >= minDeescalation && currentTier > 0) {
      newTier = Math.max(currentTier - 1, 0);
      logger.info('[feedback-loop] De-escalating tier', {
        actionType,
        market: learning.market,
        currentTier,
        newTier,
        successRate,
        sampleSize,
      });
    }

    // Tier 3 ALWAYS stays approval-only (hardcoded safety)
    if (currentTier === 3) {
      newTier = 3;
    }

    if (newTier !== currentTier) {
      // Update future insights for this action type with new default tier
      // Note: We don't retroactively change existing insights, only future ones
      // The tier adjustment is recorded in the learning for future insight-engine runs
      await supabase
        .from('learnings')
        .update({
          last_threshold_adjust_at: new Date().toISOString(),
          evidence: {
            ...evidence,
            tier_adjusted: true,
            previous_tier: currentTier,
            new_tier: newTier,
            adjusted_at: new Date().toISOString(),
          },
        })
        .eq('id', learning.id);

      adjusted++;

      await sendTelegramAlert(
        `📊 <b>Threshold Adjustment</b>\n\n` +
        `Action: ${actionType}\n` +
        `Market: ${learning.market ?? 'global'}\n` +
        `Tier: ${currentTier} → ${newTier} (${newTier > currentTier ? '⬆️ escalated' : '⬇️ de-escalated'})\n` +
        `Success rate: ${Math.round(successRate * 100)}% (${sampleSize} samples)`,
      );
    }
  }

  return adjusted;
}

// ── Generate memory/learnings.md ───────────────────────────────────────────

async function generateLearningsMd(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<void> {
  const { data: learnings } = await supabase
    .from('learnings')
    .select('*')
    .gte('confidence', 0.6)
    .order('last_confirmed_at', { ascending: false });

  if (!learnings || learnings.length === 0) {
    // Keep placeholder if no learnings
    return;
  }

  const highConfidence = learnings.filter((l: LearningRow) => l.confidence >= 0.8);
  const medConfidence = learnings.filter(
    (l: LearningRow) => l.confidence >= 0.6 && l.confidence < 0.8,
  );

  const lines: string[] = [
    '# SmartFinPro — Autonomous System Learnings',
    '> Auto-generated by feedback-loop cron — DO NOT EDIT MANUALLY',
    `> Last updated: ${new Date().toISOString()}`,
    '',
  ];

  if (highConfidence.length > 0) {
    lines.push('## High Confidence (>80%)', '');
    const grouped = groupByCategory(highConfidence);
    for (const [category, items] of grouped) {
      lines.push(`### ${formatCategory(category)}`, '');
      for (const item of items) {
        const evidence = item.evidence as Record<string, unknown>;
        lines.push(
          `- **${item.learning}**`,
          `  Evidence: ${JSON.stringify(evidence)} | Sample: ${item.sample_size} | Since: ${item.first_observed_at?.split('T')[0] ?? 'unknown'}`,
          '',
        );
      }
    }
  }

  if (medConfidence.length > 0) {
    lines.push('## Medium Confidence (60-80%)', '');
    const grouped = groupByCategory(medConfidence);
    for (const [category, items] of grouped) {
      lines.push(`### ${formatCategory(category)}`, '');
      for (const item of items) {
        const evidence = item.evidence as Record<string, unknown>;
        lines.push(
          `- **${item.learning}**`,
          `  Evidence: ${JSON.stringify(evidence)} | Sample: ${item.sample_size} | Since: ${item.first_observed_at?.split('T')[0] ?? 'unknown'}`,
          '',
        );
      }
    }
  }

  // Write to memory/learnings.md
  const filePath = path.join(process.cwd(), 'memory', 'learnings.md');
  try {
    await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
    logger.info('[feedback-loop] Updated memory/learnings.md', { entries: learnings.length });
  } catch (err) {
    // Non-fatal — file write may fail in production if path doesn't exist
    logger.warn('[feedback-loop] Could not write learnings.md', {
      error: err instanceof Error ? err.message : 'Unknown',
    });
  }
}

function groupByCategory(items: LearningRow[]): Map<string, LearningRow[]> {
  const map = new Map<string, LearningRow[]>();
  for (const item of items) {
    const existing = map.get(item.category) ?? [];
    existing.push(item);
    map.set(item.category, existing);
  }
  return map;
}

function formatCategory(category: string): string {
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── Main: Run Feedback Loop ────────────────────────────────────────────────

export async function runFeedbackLoop(): Promise<FeedbackLoopResult> {
  const startTime = Date.now();
  const supabase = createServiceClient();
  const auditId = await startAudit(supabase, 'feedback-loop');
  const errors: string[] = [];

  try {
    // ── Check if enabled ──
    const { data: enabledRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'feedback_loop_enabled')
      .maybeSingle();

    if (enabledRow?.value !== 'true') {
      logger.info('[feedback-loop] Disabled via system_settings');
      await finishAudit(supabase, auditId, 'success', startTime, 0, undefined, {
        skipped: true,
        reason: 'disabled',
      });
      return {
        success: true,
        auditId,
        actionsMeasured: 0,
        learningsUpdated: 0,
        thresholdsAdjusted: 0,
        errors: [],
      };
    }

    // ── Step 1: Load pending actions older than 7 days ──
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: pendingActions, error: queryErr } = await supabase
      .from('autonomous_actions')
      .select('*')
      .eq('outcome', 'pending')
      .lt('executed_at', cutoff)
      .order('executed_at', { ascending: true })
      .limit(50); // Process max 50 per run

    if (queryErr) {
      errors.push(`Query failed: ${queryErr.message}`);
      await finishAudit(supabase, auditId, 'error', startTime, 0, queryErr.message);
      return {
        success: false,
        auditId,
        actionsMeasured: 0,
        learningsUpdated: 0,
        thresholdsAdjusted: 0,
        errors,
      };
    }

    // ── Step 2: Measure each action ──
    let actionsMeasured = 0;
    const outcomeSummary = { positive: 0, neutral: 0, negative: 0 };

    for (const action of (pendingActions ?? []) as ActionRow[]) {
      try {
        const measurement = await measureAction(action, supabase);

        // Update the action with outcome
        const { error: updateErr } = await supabase
          .from('autonomous_actions')
          .update({
            outcome: measurement.outcome,
            outcome_metrics: measurement.metrics,
            measured_at: new Date().toISOString(),
          })
          .eq('id', action.id);

        if (updateErr) {
          errors.push(`Update failed for ${action.id}: ${updateErr.message}`);
          continue;
        }

        // Also update linked insight status
        if (action.insight_id) {
          await supabase
            .from('insights')
            .update({
              status: 'completed',
              execution_result: {
                outcome: measurement.outcome,
                reasoning: measurement.reasoning,
                measured_at: new Date().toISOString(),
              },
            })
            .eq('id', action.insight_id);
        }

        actionsMeasured++;
        outcomeSummary[measurement.outcome]++;

        logger.info('[feedback-loop] Measured action', {
          actionId: action.id,
          actionType: action.action_type,
          outcome: measurement.outcome,
          reasoning: measurement.reasoning,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown';
        errors.push(`Measurement error for ${action.id}: ${msg}`);
      }
    }

    // ── Step 3: Update learnings ──
    const learningsUpdated = await updateLearnings(supabase);

    // ── Step 4: Adjust thresholds ──
    const thresholdsAdjusted = await adjustThresholds(supabase);

    // ── Step 5: Generate memory/learnings.md ──
    await generateLearningsMd(supabase);

    // ── Step 6: Send Telegram summary ──
    if (actionsMeasured > 0 || learningsUpdated > 0) {
      const lines = [
        `📈 <b>Feedback Loop — Daily Report</b>`,
        '',
        `📊 Actions measured: ${actionsMeasured}`,
        `  ✅ Positive: ${outcomeSummary.positive}`,
        `  ➖ Neutral: ${outcomeSummary.neutral}`,
        `  ❌ Negative: ${outcomeSummary.negative}`,
        '',
        `📚 Learnings updated: ${learningsUpdated}`,
        thresholdsAdjusted > 0 ? `⚙️ Thresholds adjusted: ${thresholdsAdjusted}` : null,
        '',
        `⏱ Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      ].filter(Boolean);

      await sendTelegramAlert(lines.join('\n'));
    }

    // ── Finalize ──
    await finishAudit(
      supabase,
      auditId,
      errors.length > 0 ? 'error' : 'success',
      startTime,
      actionsMeasured,
      errors.length > 0 ? errors.join('; ') : undefined,
      {
        measured: actionsMeasured,
        outcomes: outcomeSummary,
        learnings: learningsUpdated,
        thresholds: thresholdsAdjusted,
      },
    );

    logger.info('[feedback-loop] Completed', {
      measured: actionsMeasured,
      learnings: learningsUpdated,
      thresholds: thresholdsAdjusted,
      durationMs: Date.now() - startTime,
    });

    return {
      success: true,
      auditId,
      actionsMeasured,
      learningsUpdated,
      thresholdsAdjusted,
      errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[feedback-loop] Fatal error', { error: msg });

    await finishAudit(supabase, auditId, 'error', startTime, 0, msg);
    await sendTelegramAlert(
      `🚨 <b>Feedback Loop FAILED</b>\n\nError: ${msg}\nDuration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
    );

    return {
      success: false,
      auditId,
      actionsMeasured: 0,
      learningsUpdated: 0,
      thresholdsAdjusted: 0,
      errors: [msg],
    };
  }
}
