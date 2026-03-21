// app/api/webhooks/github-deploy/route.ts
// GitHub Actions Deploy Webhook — logs deploy results to dashboard
//
// Called from deploy.yml after health check (success or failure).
// Auth: Bearer CRON_SECRET (same secret used for cron jobs).

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';

interface DeployPayload {
  commit_sha: string;
  commit_message?: string;
  branch?: string;
  actor?: string;
  status: 'success' | 'failed' | 'rolled_back';
  health_check?: boolean;
  rollback?: boolean;
  duration_s?: number;
  error_message?: string;
  run_id?: number;
  run_url?: string;
}

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as DeployPayload;

    if (!body.commit_sha || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields: commit_sha, status' },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    const { error } = await supabase.from('deploy_logs').insert({
      commit_sha: body.commit_sha.slice(0, 40),
      commit_message: body.commit_message?.slice(0, 500) || null,
      branch: body.branch || 'main',
      actor: body.actor || null,
      status: body.status,
      health_check: body.health_check ?? null,
      rollback: body.rollback ?? false,
      duration_s: body.duration_s ?? null,
      error_message: body.error_message || null,
      run_id: body.run_id ?? null,
      run_url: body.run_url || null,
    });

    if (error) {
      logger.error('[github-deploy] Insert failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info('[github-deploy] Deploy logged', {
      sha: body.commit_sha.slice(0, 7),
      status: body.status,
    });

    return NextResponse.json({
      success: true,
      sha: body.commit_sha.slice(0, 7),
      status: body.status,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[github-deploy] Webhook error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
