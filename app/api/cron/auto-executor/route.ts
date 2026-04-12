// app/api/cron/auto-executor/route.ts
import { NextRequest } from 'next/server';
import { logger, logCron } from '@/lib/logging';
import { runAutoExecutor } from '@/lib/actions/auto-executor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute max

/**
 * Auto-Executor — Risk-tiered autonomous action execution
 * Schedule: Daily 05:00 UTC
 *
 * Tier 0: Silent — EV refresh, score updates
 * Tier 1: Notify — A/B winner deploy, freshness boost
 * Tier 2: Undo   — DB-overrides, link activation (Week 3)
 * Tier 3: ALWAYS approval-only (hardcoded, never auto-executed)
 *
 * Guardrails:
 *   - auto_executor_enabled must be 'true'
 *   - simulation_mode: logs but doesn't execute
 *   - daily_budget: max actions per day
 *   - disabled_action_types: per-type kill switch
 *   - Tier 3 hardcoded to approval-only
 *
 * Auth: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const start = Date.now();

  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await runAutoExecutor();

    await logCron({
      job: 'auto-executor',
      status: result.success ? 'success' : 'error',
      duration_ms: Date.now() - start,
      ...(result.errors.length > 0 && { error: result.errors.join('; ') }),
    });

    return Response.json({
      ok: result.success,
      audit_id: result.auditId,
      actions_executed: result.actionsExecuted,
      actions_skipped: result.actionsSkipped,
      simulation_mode: result.simulationMode,
      tier_breakdown: result.tierBreakdown,
      estimated_revenue: result.totalEstimatedRevenue,
      errors: result.errors,
      duration_ms: Date.now() - start,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[cron/auto-executor] Fatal', { error: msg });

    await logCron({
      job: 'auto-executor',
      status: 'error',
      duration_ms: Date.now() - start,
      error: msg,
    });

    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
