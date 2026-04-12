// app/api/cron/feedback-loop/route.ts
import { NextRequest } from 'next/server';
import { logger, logCron } from '@/lib/logging';
import { runFeedbackLoop } from '@/lib/actions/feedback-loop';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes max (many DB queries + learning updates)

/**
 * Feedback Loop — Daily outcome measurement + learning accumulation
 * Schedule: Daily 22:00 UTC
 *
 * Steps:
 *   1. Measure outcomes for actions executed 7+ days ago
 *   2. Update learnings table with success rates per action_type + market
 *   3. Auto-adjust risk tiers based on success rates (with cooldown + caps)
 *   4. Generate memory/learnings.md
 *
 * Guardrails:
 *   - feedback_loop_enabled must be 'true'
 *   - Tier 3 ALWAYS stays approval-only (hardcoded)
 *   - Max ±10% threshold adjustment per run
 *   - 7-day cooldown between adjustments
 *   - Min 10 samples for escalation, 20 for de-escalation
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
    const result = await runFeedbackLoop();

    await logCron({
      job: 'feedback-loop',
      status: result.success ? 'success' : 'error',
      duration_ms: Date.now() - start,
      ...(result.errors.length > 0 && { error: result.errors.join('; ') }),
    });

    return Response.json({
      ok: result.success,
      audit_id: result.auditId,
      actions_measured: result.actionsMeasured,
      learnings_updated: result.learningsUpdated,
      thresholds_adjusted: result.thresholdsAdjusted,
      errors: result.errors,
      duration_ms: Date.now() - start,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[cron/feedback-loop] Fatal', { error: msg });

    await logCron({
      job: 'feedback-loop',
      status: 'error',
      duration_ms: Date.now() - start,
      error: msg,
    });

    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
