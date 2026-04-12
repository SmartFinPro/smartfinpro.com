// lib/actions/auto-executor.ts
'use server';
import 'server-only';

import { createHash, randomUUID } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import { sendTelegramAlert } from '@/lib/alerts/telegram';
import { triggerFreshnessBoost } from '@/lib/actions/content-overrides';
import { computeOfferEV } from '@/lib/actions/offer-ev';

// ── Types ──────────────────────────────────────────────────────────────────

interface InsightRow {
  id: string;
  dedupe_key: string;
  insight_type: string;
  slug: string | null;
  market: string | null;
  category: string | null;
  title: string;
  detail: Record<string, unknown>;
  recommended_action: string | null;
  risk_tier: number;
  expected_revenue_impact: number;
  confidence: number;
}

interface ActionResult {
  success: boolean;
  actionType: string;
  description: string;
  payload: Record<string, unknown>;
  rollbackPayload: Record<string, unknown> | null;
  error?: string;
}

interface SystemSettings {
  autoExecutorEnabled: boolean;
  simulationMode: boolean;
  maxTier: number;
  dailyBudget: number;
  undoWindowHours: number;
  disabledActionTypes: string[];
}

export interface AutoExecutorResult {
  success: boolean;
  auditId: string | null;
  actionsExecuted: number;
  actionsSkipped: number;
  simulationMode: boolean;
  tierBreakdown: Record<number, number>;
  totalEstimatedRevenue: number;
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

// ── Load System Settings ───────────────────────────────────────────────────

async function loadSettings(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<SystemSettings> {
  const keys = [
    'auto_executor_enabled',
    'simulation_mode',
    'auto_executor_max_tier',
    'auto_executor_daily_budget',
    'undo_window_hours',
    'disabled_action_types',
  ];

  const { data } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', keys);

  const settingsMap = new Map<string, string>();
  for (const row of data ?? []) {
    settingsMap.set(row.key, row.value);
  }

  return {
    autoExecutorEnabled: settingsMap.get('auto_executor_enabled') === 'true',
    simulationMode: settingsMap.get('simulation_mode') === 'true',
    maxTier: Math.min(parseInt(settingsMap.get('auto_executor_max_tier') ?? '1', 10), 2),
    dailyBudget: parseInt(settingsMap.get('auto_executor_daily_budget') ?? '5', 10),
    undoWindowHours: parseInt(settingsMap.get('undo_window_hours') ?? '24', 10),
    disabledActionTypes: (settingsMap.get('disabled_action_types') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

// ── Check Daily Budget ─────────────────────────────────────────────────────

async function getActionsExecutedToday(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<number> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('autonomous_actions')
    .select('id', { count: 'exact', head: true })
    .gte('executed_at', todayStart.toISOString());

  return count ?? 0;
}

// ── Action Handlers ────────────────────────────────────────────────────────

async function handleBoostContent(
  insight: InsightRow,
  simulation: boolean,
): Promise<ActionResult> {
  const slug = insight.slug;
  if (!slug) {
    return {
      success: false,
      actionType: 'boost_content',
      description: `Boost skipped: no slug for insight ${insight.title}`,
      payload: {},
      rollbackPayload: null,
      error: 'No slug provided',
    };
  }

  if (simulation) {
    return {
      success: true,
      actionType: 'boost_content',
      description: `[SIM] Would boost: ${slug} (${insight.market})`,
      payload: { slug, market: insight.market, reason: insight.title },
      rollbackPayload: { slug, action: 'remove_boost' },
    };
  }

  const result = await triggerFreshnessBoost(slug, `Auto-executor: ${insight.title}`);
  return {
    success: result.success,
    actionType: 'boost_content',
    description: `Boosted: ${slug} (${insight.market})`,
    payload: { slug, market: insight.market, boost_date: result.boost_date, reason: insight.title },
    rollbackPayload: { slug, action: 'remove_boost' },
    error: result.error,
  };
}

async function handleDeployAbWinner(
  insight: InsightRow,
  simulation: boolean,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<ActionResult> {
  const detail = insight.detail;
  const hubId = detail.hub_id as string;
  const winner = detail.winner as string;
  const liftPercent = detail.lift_percent as number;

  if (!hubId || !winner) {
    return {
      success: false,
      actionType: 'deploy_ab_winner',
      description: `A/B deploy skipped: missing hub_id or winner`,
      payload: {},
      rollbackPayload: null,
      error: 'Missing hub_id or winner in detail',
    };
  }

  if (simulation) {
    return {
      success: true,
      actionType: 'deploy_ab_winner',
      description: `[SIM] Would deploy A/B winner: ${hubId} → Variant ${winner} (+${liftPercent}% lift)`,
      payload: { hub_id: hubId, winner, lift_percent: liftPercent },
      rollbackPayload: { hub_id: hubId, action: 'reset_ab_test' },
    };
  }

  // Insert into ab_test_winners
  const { error: winnerErr } = await supabase.from('ab_test_winners').upsert(
    {
      hub_id: hubId,
      winning_variant: winner,
      variant_a_cr: detail.variant_a_cr,
      variant_b_cr: detail.variant_b_cr,
      variant_a_impressions: detail.variant_a_impressions,
      variant_b_impressions: detail.variant_b_impressions,
      variant_a_clicks: Math.round(
        (detail.variant_a_cr as number) * (detail.variant_a_impressions as number),
      ),
      variant_b_clicks: Math.round(
        (detail.variant_b_cr as number) * (detail.variant_b_impressions as number),
      ),
      lift_percent: liftPercent,
      confidence: (insight.confidence * 100).toFixed(1),
      declared_at: new Date().toISOString(),
    },
    { onConflict: 'hub_id' },
  );

  if (winnerErr) {
    return {
      success: false,
      actionType: 'deploy_ab_winner',
      description: `A/B deploy failed: ${hubId}`,
      payload: { hub_id: hubId, winner },
      rollbackPayload: null,
      error: winnerErr.message,
    };
  }

  // Mark the test as winner_declared
  await supabase
    .from('ab_test_stats')
    .update({ winner_declared: true, winner_declared_at: new Date().toISOString() })
    .eq('hub_id', hubId);

  return {
    success: true,
    actionType: 'deploy_ab_winner',
    description: `Deployed A/B winner: ${hubId} → Variant ${winner} (+${liftPercent}% lift)`,
    payload: { hub_id: hubId, winner, lift_percent: liftPercent },
    rollbackPayload: { hub_id: hubId, action: 'reset_ab_test' },
  };
}

async function handleUpdateFacts(
  insight: InsightRow,
  simulation: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _supabase: ReturnType<typeof createServiceClient>,
): Promise<ActionResult> {
  // Fact updates use content_overrides with override_type for frontmatter patches
  const slug = insight.slug;
  if (!slug) {
    return {
      success: false,
      actionType: 'update_facts',
      description: 'Fact update skipped: no slug',
      payload: {},
      rollbackPayload: null,
      error: 'No slug',
    };
  }

  if (simulation) {
    return {
      success: true,
      actionType: 'update_facts',
      description: `[SIM] Would update facts for: ${slug}`,
      payload: { slug, detail: insight.detail },
      rollbackPayload: null,
    };
  }

  // For now, fact updates trigger a freshness boost to signal content was updated
  const result = await triggerFreshnessBoost(slug, `Fact update: ${insight.title}`);
  return {
    success: result.success,
    actionType: 'update_facts',
    description: `Updated facts: ${slug}`,
    payload: { slug, boost_date: result.boost_date },
    rollbackPayload: { slug, action: 'remove_boost' },
    error: result.error,
  };
}

async function handleRetrainBandit(
  insight: InsightRow,
  simulation: boolean,
): Promise<ActionResult> {
  if (simulation) {
    return {
      success: true,
      actionType: 'retrain_bandit',
      description: `[SIM] Would retrain bandit / refresh EV cache`,
      payload: { reason: insight.title },
      rollbackPayload: null,
    };
  }

  try {
    const result = await computeOfferEV();
    return {
      success: result.success,
      actionType: 'retrain_bandit',
      description: `Retrained bandit: EV cache refreshed (${result.computed} offers)`,
      payload: { computed: result.computed, reason: insight.title },
      rollbackPayload: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      actionType: 'retrain_bandit',
      description: 'Bandit retrain failed',
      payload: {},
      rollbackPayload: null,
      error: msg,
    };
  }
}

async function handleQueueGenesis(
  insight: InsightRow,
  simulation: boolean,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<ActionResult> {
  const keyword = (insight.detail.keyword as string) ?? insight.title;
  const market = insight.market ?? 'us';
  const category = insight.category;

  if (simulation) {
    return {
      success: true,
      actionType: 'queue_genesis',
      description: `[SIM] Would queue genesis: "${keyword}" (${market}/${category})`,
      payload: { keyword, market, category },
      rollbackPayload: null,
    };
  }

  const { error } = await supabase.from('planning_queue').upsert(
    {
      keyword,
      market,
      category,
      reason: `Auto-executor: ${insight.title}`,
      opportunity_score: Math.round(insight.expected_revenue_impact),
      status: 'planned',
    },
    { onConflict: 'keyword,market', ignoreDuplicates: true },
  );

  if (error) {
    return {
      success: false,
      actionType: 'queue_genesis',
      description: `Genesis queue failed: "${keyword}"`,
      payload: { keyword, market },
      rollbackPayload: null,
      error: error.message,
    };
  }

  return {
    success: true,
    actionType: 'queue_genesis',
    description: `Queued genesis: "${keyword}" (${market}/${category})`,
    payload: { keyword, market, category, opportunity_score: Math.round(insight.expected_revenue_impact) },
    rollbackPayload: { keyword, market, action: 'remove_from_queue' },
  };
}

// ── Tier 2 Action Handlers ────────────────────────────────────────────────

async function handleActivateLink(
  insight: InsightRow,
  simulation: boolean,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<ActionResult> {
  const linkId = insight.detail.link_id as string;
  if (!linkId) {
    return {
      success: false,
      actionType: 'activate_link',
      description: 'Link activation skipped: no link_id in detail',
      payload: {},
      rollbackPayload: null,
      error: 'No link_id',
    };
  }

  // Get current state for rollback
  const { data: link } = await supabase
    .from('affiliate_links')
    .select('id, slug, provider, is_active, market')
    .eq('id', linkId)
    .maybeSingle();

  if (!link) {
    return {
      success: false,
      actionType: 'activate_link',
      description: `Link ${linkId} not found`,
      payload: {},
      rollbackPayload: null,
      error: 'Link not found',
    };
  }

  if (simulation) {
    return {
      success: true,
      actionType: 'activate_link',
      description: `[SIM] Would activate link: ${link.provider} (${link.slug})`,
      payload: { link_id: linkId, provider: link.provider, slug: link.slug },
      rollbackPayload: { link_id: linkId, previous_active: link.is_active },
    };
  }

  const { error } = await supabase
    .from('affiliate_links')
    .update({ is_active: true })
    .eq('id', linkId);

  if (error) {
    return {
      success: false,
      actionType: 'activate_link',
      description: `Link activation failed: ${link.provider}`,
      payload: { link_id: linkId },
      rollbackPayload: null,
      error: error.message,
    };
  }

  return {
    success: true,
    actionType: 'activate_link',
    description: `Activated link: ${link.provider} (${link.slug})`,
    payload: { link_id: linkId, provider: link.provider, slug: link.slug, market: link.market },
    rollbackPayload: { link_id: linkId, previous_active: link.is_active },
  };
}

async function handleDeactivateLink(
  insight: InsightRow,
  simulation: boolean,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<ActionResult> {
  const linkId = insight.detail.link_id as string;
  if (!linkId) {
    return {
      success: false,
      actionType: 'deactivate_link',
      description: 'Link deactivation skipped: no link_id in detail',
      payload: {},
      rollbackPayload: null,
      error: 'No link_id',
    };
  }

  const { data: link } = await supabase
    .from('affiliate_links')
    .select('id, slug, provider, is_active, market')
    .eq('id', linkId)
    .maybeSingle();

  if (!link) {
    return {
      success: false,
      actionType: 'deactivate_link',
      description: `Link ${linkId} not found`,
      payload: {},
      rollbackPayload: null,
      error: 'Link not found',
    };
  }

  if (simulation) {
    return {
      success: true,
      actionType: 'deactivate_link',
      description: `[SIM] Would deactivate link: ${link.provider} (${link.slug})`,
      payload: { link_id: linkId, provider: link.provider, slug: link.slug },
      rollbackPayload: { link_id: linkId, previous_active: link.is_active },
    };
  }

  const { error } = await supabase
    .from('affiliate_links')
    .update({ is_active: false })
    .eq('id', linkId);

  if (error) {
    return {
      success: false,
      actionType: 'deactivate_link',
      description: `Link deactivation failed: ${link.provider}`,
      payload: { link_id: linkId },
      rollbackPayload: null,
      error: error.message,
    };
  }

  return {
    success: true,
    actionType: 'deactivate_link',
    description: `Deactivated link: ${link.provider} (${link.slug})`,
    payload: { link_id: linkId, provider: link.provider, slug: link.slug, market: link.market },
    rollbackPayload: { link_id: linkId, previous_active: link.is_active },
  };
}

async function handleApplyOptimization(
  insight: InsightRow,
  simulation: boolean,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<ActionResult> {
  // Apply optimization as DB-override (NEVER direct file writes)
  const slug = insight.slug;
  if (!slug) {
    return {
      success: false,
      actionType: 'apply_optimization',
      description: 'Optimization skipped: no slug',
      payload: {},
      rollbackPayload: null,
      error: 'No slug',
    };
  }

  const optimizationDetail = insight.detail;
  const reason = `Auto-executor: ${insight.title}`;

  if (simulation) {
    return {
      success: true,
      actionType: 'apply_optimization',
      description: `[SIM] Would apply optimization to: ${slug} (${insight.market})`,
      payload: { slug, market: insight.market, optimization: optimizationDetail },
      rollbackPayload: { slug, action: 'remove_override' },
    };
  }

  // Upsert into content_overrides as DB-override
  const { data: override, error } = await supabase
    .from('content_overrides')
    .upsert(
      {
        slug,
        boost_date: new Date().toISOString(),
        reason,
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single();

  if (error) {
    return {
      success: false,
      actionType: 'apply_optimization',
      description: `Optimization failed: ${slug}`,
      payload: { slug },
      rollbackPayload: null,
      error: error.message,
    };
  }

  return {
    success: true,
    actionType: 'apply_optimization',
    description: `Applied optimization: ${slug} (${insight.market})`,
    payload: { slug, market: insight.market, optimization: optimizationDetail, override_id: override?.id },
    rollbackPayload: { slug, override_id: override?.id, action: 'remove_override' },
  };
}

// ── Route to Action Handler ───────────────────────────────────────────────

async function executeAction(
  insight: InsightRow,
  simulation: boolean,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<ActionResult> {
  const action = insight.recommended_action;

  switch (action) {
    case 'boost_content':
      return handleBoostContent(insight, simulation);
    case 'deploy_ab_winner':
      return handleDeployAbWinner(insight, simulation, supabase);
    case 'update_facts':
      return handleUpdateFacts(insight, simulation, supabase);
    case 'retrain_bandit':
      return handleRetrainBandit(insight, simulation);
    case 'queue_genesis':
      return handleQueueGenesis(insight, simulation, supabase);
    case 'activate_link':
      return handleActivateLink(insight, simulation, supabase);
    case 'deactivate_link':
      return handleDeactivateLink(insight, simulation, supabase);
    case 'apply_optimization':
      return handleApplyOptimization(insight, simulation, supabase);
    default:
      return {
        success: false,
        actionType: action ?? 'unknown',
        description: `Unknown action type: ${action}`,
        payload: {},
        rollbackPayload: null,
        error: `Unknown action: ${action}`,
      };
  }
}

// ── Generate Undo Token (hashed, one-time) ─────────────────────────────────

function generateUndoToken(): { raw: string; hash: string } {
  const raw = randomUUID();
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

// ── ISO Week Key for Dedupe ────────────────────────────────────────────────

function getISODate(): string {
  return new Date().toISOString().split('T')[0]; // 2026-04-12
}

// ── Main: Run Auto-Executor ────────────────────────────────────────────────

export async function runAutoExecutor(): Promise<AutoExecutorResult> {
  const startTime = Date.now();
  const supabase = createServiceClient();
  const auditId = await startAudit(supabase, 'auto-executor');
  const errors: string[] = [];

  try {
    // ── Load settings ──
    const settings = await loadSettings(supabase);

    if (!settings.autoExecutorEnabled) {
      logger.info('[auto-executor] Disabled via system_settings');
      await finishAudit(supabase, auditId, 'success', startTime, 0, undefined, {
        skipped: true,
        reason: 'disabled',
      });
      return {
        success: true,
        auditId,
        actionsExecuted: 0,
        actionsSkipped: 0,
        simulationMode: settings.simulationMode,
        tierBreakdown: {},
        totalEstimatedRevenue: 0,
        errors: [],
      };
    }

    // ── Check daily budget ──
    const actionsToday = await getActionsExecutedToday(supabase);
    const remainingBudget = Math.max(0, settings.dailyBudget - actionsToday);

    if (remainingBudget <= 0) {
      logger.info('[auto-executor] Daily budget exhausted', {
        budget: settings.dailyBudget,
        used: actionsToday,
      });
      await finishAudit(supabase, auditId, 'success', startTime, 0, undefined, {
        skipped: true,
        reason: 'budget_exhausted',
        used: actionsToday,
        budget: settings.dailyBudget,
      });
      return {
        success: true,
        auditId,
        actionsExecuted: 0,
        actionsSkipped: 0,
        simulationMode: settings.simulationMode,
        tierBreakdown: {},
        totalEstimatedRevenue: 0,
        errors: [],
      };
    }

    // ── Load pending insights ──
    // Tier 3 is ALWAYS approval-only (hardcoded — never auto-execute)
    const effectiveMaxTier = Math.min(settings.maxTier, 2);

    const { data: insights, error: insightsErr } = await supabase
      .from('insights')
      .select('*')
      .eq('status', 'pending')
      .lte('risk_tier', effectiveMaxTier)
      .gt('expires_at', new Date().toISOString())
      .order('priority_score', { ascending: false })
      .limit(remainingBudget);

    if (insightsErr) {
      errors.push(`Failed to load insights: ${insightsErr.message}`);
      await finishAudit(supabase, auditId, 'error', startTime, 0, insightsErr.message);
      return {
        success: false,
        auditId,
        actionsExecuted: 0,
        actionsSkipped: 0,
        simulationMode: settings.simulationMode,
        tierBreakdown: {},
        totalEstimatedRevenue: 0,
        errors,
      };
    }

    if (!insights || insights.length === 0) {
      logger.info('[auto-executor] No pending insights to execute');
      await finishAudit(supabase, auditId, 'success', startTime, 0, undefined, {
        reason: 'no_pending_insights',
      });
      return {
        success: true,
        auditId,
        actionsExecuted: 0,
        actionsSkipped: 0,
        simulationMode: settings.simulationMode,
        tierBreakdown: {},
        totalEstimatedRevenue: 0,
        errors: [],
      };
    }

    // ── Execute each insight ──
    let actionsExecuted = 0;
    let actionsSkipped = 0;
    const tierBreakdown: Record<number, number> = {};
    let totalRevenue = 0;
    const actionSummaries: string[] = [];
    const today = getISODate();

    for (const insight of insights as InsightRow[]) {
      const actionType = insight.recommended_action ?? 'unknown';

      // Skip disabled action types
      if (settings.disabledActionTypes.includes(actionType)) {
        actionsSkipped++;
        logger.info(`[auto-executor] Skipping disabled action: ${actionType}`);
        continue;
      }

      // Build dedupe key
      const dedupeKey = `${actionType}:${insight.market ?? 'global'}:${insight.slug ?? 'none'}:${today}`;

      // Check idempotency — skip if already executed today
      const { data: existing } = await supabase
        .from('autonomous_actions')
        .select('id')
        .eq('dedupe_key', dedupeKey)
        .maybeSingle();

      if (existing) {
        actionsSkipped++;
        continue;
      }

      // Execute the action
      const result = await executeAction(insight, settings.simulationMode, supabase);

      if (!result.success && !settings.simulationMode) {
        errors.push(`Action failed: ${result.description} — ${result.error}`);
        actionsSkipped++;

        // Update insight status to failed
        await supabase
          .from('insights')
          .update({ status: 'failed', execution_result: { error: result.error } })
          .eq('id', insight.id);

        continue;
      }

      // Generate undo token for Tier 2 actions
      let undoTokenHash: string | null = null;
      let undoRawToken: string | null = null;
      let undoExpiresAt: string | null = null;

      if (insight.risk_tier >= 2 && !settings.simulationMode) {
        const undo = generateUndoToken();
        undoTokenHash = undo.hash;
        undoRawToken = undo.raw;
        undoExpiresAt = new Date(
          Date.now() + settings.undoWindowHours * 60 * 60 * 1000,
        ).toISOString();
      }

      // Capture baseline metrics for feedback loop
      const baseline = await captureBaseline(insight, supabase);

      // Log the action
      const { error: insertErr } = await supabase.from('autonomous_actions').insert({
        dedupe_key: dedupeKey,
        insight_id: insight.id,
        action_type: actionType,
        risk_tier: insight.risk_tier,
        slug: insight.slug,
        market: insight.market,
        description: result.description,
        payload: result.payload,
        rollback_payload: result.rollbackPayload,
        outcome: 'pending',
        outcome_baseline: baseline,
        undo_token_hash: undoTokenHash,
        undo_expires_at: undoExpiresAt,
      });

      if (insertErr) {
        // Duplicate = expected (idempotent)
        if (insertErr.message.includes('duplicate') || insertErr.message.includes('unique')) {
          actionsSkipped++;
          continue;
        }
        errors.push(`Action log failed: ${insertErr.message}`);
        continue;
      }

      // Update insight status
      await supabase
        .from('insights')
        .update({
          status: settings.simulationMode ? 'pending' : 'executing',
          executed_at: new Date().toISOString(),
          execution_result: { action: result.actionType, simulation: settings.simulationMode },
        })
        .eq('id', insight.id);

      actionsExecuted++;
      tierBreakdown[insight.risk_tier] = (tierBreakdown[insight.risk_tier] ?? 0) + 1;
      totalRevenue += insight.expected_revenue_impact;

      // Build summary line for Telegram
      const simPrefix = settings.simulationMode ? '🔬 ' : '';
      const undoSuffix =
        undoRawToken && !settings.simulationMode
          ? ` (Undo: ${settings.undoWindowHours}h)`
          : '';
      actionSummaries.push(
        `${simPrefix}• ${result.description}${undoSuffix}`,
      );
    }

    // ── Send Telegram Summary ──
    if (actionsExecuted > 0 || actionsSkipped > 0) {
      const mode = settings.simulationMode ? '🔬 SIMULATION' : '🤖 LIVE';
      const lines = [
        `${mode} <b>Auto-Executor — Daily Report</b>`,
        '',
        `✅ ${actionsExecuted} actions ${settings.simulationMode ? 'simulated' : 'executed'}`,
        actionsSkipped > 0 ? `⏭ ${actionsSkipped} skipped (budget/dedup/disabled)` : null,
        '',
        ...actionSummaries.slice(0, 10), // Max 10 lines
        actionSummaries.length > 10 ? `... and ${actionSummaries.length - 10} more` : null,
        '',
        `💰 Est. revenue impact: ~$${Math.round(totalRevenue)}/mo`,
        `📊 Tier breakdown: ${Object.entries(tierBreakdown).map(([t, c]) => `T${t}×${c}`).join(', ') || 'none'}`,
        `⏱ Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      ].filter(Boolean);

      await sendTelegramAlert(lines.join('\n'));
    }

    // ── Finalize ──
    await finishAudit(supabase, auditId, errors.length > 0 ? 'error' : 'success', startTime, actionsExecuted, errors.length > 0 ? errors.join('; ') : undefined, {
      simulation: settings.simulationMode,
      executed: actionsExecuted,
      skipped: actionsSkipped,
      tierBreakdown,
      totalRevenue: Math.round(totalRevenue),
    });

    logger.info('[auto-executor] Completed', {
      executed: actionsExecuted,
      skipped: actionsSkipped,
      simulation: settings.simulationMode,
      durationMs: Date.now() - startTime,
    });

    return {
      success: true,
      auditId,
      actionsExecuted,
      actionsSkipped,
      simulationMode: settings.simulationMode,
      tierBreakdown,
      totalEstimatedRevenue: Math.round(totalRevenue),
      errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[auto-executor] Fatal error', { error: msg });

    await finishAudit(supabase, auditId, 'error', startTime, 0, msg);
    await sendTelegramAlert(
      `🚨 <b>Auto-Executor FAILED</b>\n\nError: ${msg}\nDuration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
    );

    return {
      success: false,
      auditId,
      actionsExecuted: 0,
      actionsSkipped: 0,
      simulationMode: false,
      tierBreakdown: {},
      totalEstimatedRevenue: 0,
      errors: [msg],
    };
  }
}

// ── Baseline Capture (for feedback loop measurement) ───────────────────────

async function captureBaseline(
  insight: InsightRow,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<Record<string, unknown> | null> {
  if (!insight.slug) return null;

  try {
    // Get current health score
    const { data: health } = await supabase
      .from('content_health_scores')
      .select('health_score, ranking_score, monthly_clicks, monthly_revenue')
      .eq('slug', insight.slug)
      .eq('market', insight.market ?? 'us')
      .maybeSingle();

    // Get same-weekday baseline (for seasonality adjustment)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return {
      captured_at: new Date().toISOString(),
      weekday: new Date().getDay(),
      health_score: health?.health_score ? Number(health.health_score) : null,
      ranking_score: health?.ranking_score ? Number(health.ranking_score) : null,
      monthly_clicks: health?.monthly_clicks ?? null,
      monthly_revenue: health?.monthly_revenue ? Number(health.monthly_revenue) : null,
      baseline_date: sevenDaysAgo,
    };
  } catch {
    return null;
  }
}
