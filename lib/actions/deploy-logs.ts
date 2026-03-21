// lib/actions/deploy-logs.ts — Deploy history for dashboard
'use server';
import 'server-only';
import { logger } from '@/lib/logging';
import { createServiceClient } from '@/lib/supabase/server';

// ── Types ──────────────────────────────────────────────────────

export interface DeployLog {
  id: number;
  commit_sha: string;
  commit_message: string | null;
  branch: string;
  actor: string | null;
  status: 'pending' | 'success' | 'failed' | 'rolled_back';
  health_check: boolean | null;
  rollback: boolean;
  duration_s: number | null;
  error_message: string | null;
  run_id: number | null;
  run_url: string | null;
  deployed_at: string;
}

export interface DeployStats {
  totalDeploys: number;
  successCount: number;
  failedCount: number;
  rollbackCount: number;
  successRate: number;
  avgDuration: number;
  lastDeploy: DeployLog | null;
  recentDeploys: DeployLog[];
}

// ── Main Query ─────────────────────────────────────────────────

export async function getDeployStats(limit: number = 20): Promise<DeployStats> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('deploy_logs')
      .select('*')
      .order('deployed_at', { ascending: false })
      .limit(limit);

    if (error) {
      // Table might not exist yet — return empty
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return emptyStats();
      }
      logger.warn('[deploy-logs] Query error:', error.message);
      return emptyStats();
    }

    if (!data || data.length === 0) {
      return emptyStats();
    }

    const deploys = data as DeployLog[];
    const successCount = deploys.filter((d) => d.status === 'success').length;
    const failedCount = deploys.filter((d) => d.status === 'failed').length;
    const rollbackCount = deploys.filter((d) => d.status === 'rolled_back').length;

    const durations = deploys
      .filter((d) => d.duration_s !== null && d.duration_s > 0)
      .map((d) => d.duration_s!);
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    return {
      totalDeploys: deploys.length,
      successCount,
      failedCount,
      rollbackCount,
      successRate: deploys.length > 0 ? Math.round((successCount / deploys.length) * 100) : 0,
      avgDuration,
      lastDeploy: deploys[0] || null,
      recentDeploys: deploys,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[deploy-logs] getDeployStats error:', msg);
    return emptyStats();
  }
}

function emptyStats(): DeployStats {
  return {
    totalDeploys: 0,
    successCount: 0,
    failedCount: 0,
    rollbackCount: 0,
    successRate: 0,
    avgDuration: 0,
    lastDeploy: null,
    recentDeploys: [],
  };
}
