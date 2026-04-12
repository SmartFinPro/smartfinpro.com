// app/api/cron/insight-engine/route.ts
import { NextRequest } from 'next/server';
import { logger, logCron } from '@/lib/logging';
import { runInsightEngine } from '@/lib/actions/insight-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes max (5 modules + Claude synthesis)

/**
 * Insight Engine — Weekly cross-analysis of all data sources
 * Schedule: Sunday 04:00 UTC
 *
 * Modules:
 *   1. Content Health Scoring (all pages)
 *   2. Content Decay Detection
 *   3. Competitor Opportunity Detection
 *   4. A/B Test Winner Auto-Detection
 *   5. Revenue Anomaly Detection
 *   + Claude AI Synthesis (with deterministic fallback)
 *
 * Auth: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const start = Date.now();

  // ── Auth ──
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await runInsightEngine();

    await logCron({
      job: 'insight-engine',
      status: result.success ? 'success' : 'error',
      duration_ms: Date.now() - start,
      ...(result.errors.length > 0 && { error: result.errors.join('; ') }),
    });

    return Response.json({
      ok: result.success,
      audit_id: result.auditId,
      health_scored: result.healthScored,
      insights_generated: result.insightsGenerated,
      ai_synthesis: result.aiSynthesis,
      modules: result.modules,
      errors: result.errors,
      duration_ms: Date.now() - start,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[cron/insight-engine] Fatal', { error: msg });

    await logCron({
      job: 'insight-engine',
      status: 'error',
      duration_ms: Date.now() - start,
      error: msg,
    });

    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
