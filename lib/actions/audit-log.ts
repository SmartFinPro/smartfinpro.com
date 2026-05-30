// lib/actions/audit-log.ts
'use server';
import 'server-only';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';

// ── Public types ───────────────────────────────────────────────

export type AuditLogSource = 'cron' | 'autonomous';

/**
 * Unified status vocabulary across both sources:
 *  - cron:        running | success | error | timeout
 *  - autonomous:  pending | positive | neutral | negative | undone
 */
export type AuditLogStatus =
  | 'running'
  | 'success'
  | 'error'
  | 'timeout'
  | 'pending'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'undone';

export interface AuditLogEntry {
  id: string;
  ts: string; // ISO timestamp used for sorting/display
  source: AuditLogSource;
  category: string; // job_name (cron) / action_type (autonomous)
  status: AuditLogStatus;
  title: string;
  detail: string | null; // error_message (cron) / description (autonomous)
  durationMs?: number | null;
  metadata: Record<string, unknown> | null;
}

export interface GetAuditLogOptions {
  source?: 'all' | 'cron' | 'autonomous';
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface GetAuditLogResult {
  entries: AuditLogEntry[];
  total: number;
}

// ── Internal row shapes ────────────────────────────────────────

interface CronRunAuditRow {
  id: string;
  job_name: string;
  started_at: string | null;
  finished_at: string | null;
  status: string | null;
  duration_ms: number | null;
  processed_count: number | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
}

interface AutonomousActionRow {
  id: string;
  action_type: string;
  risk_tier: number;
  slug: string | null;
  market: string | null;
  description: string;
  outcome: string | null;
  outcome_metrics: Record<string, unknown> | null;
  undone_at: string | null;
  executed_at: string | null;
}

// How many recent rows to pull per table before merging. Keeps the
// query bounded while leaving plenty of headroom for client filtering.
const FETCH_PER_TABLE = 500;

// ── Status derivation for autonomous rows ──────────────────────
// An action that has been rolled back is always reported as 'undone',
// regardless of the recorded outcome. Otherwise we surface the raw
// outcome enum (pending | positive | neutral | negative).
function deriveAutonomousStatus(row: AutonomousActionRow): AuditLogStatus {
  if (row.undone_at) return 'undone';
  switch (row.outcome) {
    case 'positive':
      return 'positive';
    case 'negative':
      return 'negative';
    case 'neutral':
      return 'neutral';
    default:
      return 'pending';
  }
}

function normalizeCronStatus(status: string | null): AuditLogStatus {
  switch (status) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'timeout':
      return 'timeout';
    case 'running':
      return 'running';
    default:
      return 'running';
  }
}

// ── Main action ────────────────────────────────────────────────

export async function getAuditLog(
  opts: GetAuditLogOptions = {},
): Promise<GetAuditLogResult> {
  const source = opts.source ?? 'all';
  const status = opts.status?.trim() || undefined;
  const q = opts.q?.trim().toLowerCase() || undefined;
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);

  try {
    const supabase = createServiceClient();

    const wantCron = source === 'all' || source === 'cron';
    const wantAutonomous = source === 'all' || source === 'autonomous';

    const [cronResult, autoResult] = await Promise.all([
      wantCron
        ? supabase
            .from('cron_run_audit')
            .select(
              'id, job_name, started_at, finished_at, status, duration_ms, processed_count, error_message, metadata',
            )
            .order('started_at', { ascending: false })
            .limit(FETCH_PER_TABLE)
        : Promise.resolve({ data: [] as CronRunAuditRow[], error: null }),
      wantAutonomous
        ? supabase
            .from('autonomous_actions')
            .select(
              'id, action_type, risk_tier, slug, market, description, outcome, outcome_metrics, undone_at, executed_at',
            )
            .order('executed_at', { ascending: false })
            .limit(FETCH_PER_TABLE)
        : Promise.resolve({ data: [] as AutonomousActionRow[], error: null }),
    ]);

    if (cronResult.error) {
      logger.error('audit-log: cron_run_audit query failed', {
        error: cronResult.error.message,
      });
    }
    if (autoResult.error) {
      logger.error('audit-log: autonomous_actions query failed', {
        error: autoResult.error.message,
      });
    }

    const cronEntries: AuditLogEntry[] = ((cronResult.data ?? []) as CronRunAuditRow[]).map(
      (row) => ({
        id: `cron:${row.id}`,
        ts: row.started_at ?? row.finished_at ?? new Date(0).toISOString(),
        source: 'cron' as const,
        category: row.job_name,
        status: normalizeCronStatus(row.status),
        title: row.job_name,
        detail: row.error_message,
        durationMs: row.duration_ms,
        metadata: {
          ...(row.metadata ?? {}),
          finished_at: row.finished_at,
          processed_count: row.processed_count,
        },
      }),
    );

    const autoEntries: AuditLogEntry[] = ((autoResult.data ?? []) as AutonomousActionRow[]).map(
      (row) => ({
        id: `autonomous:${row.id}`,
        ts: row.executed_at ?? new Date(0).toISOString(),
        source: 'autonomous' as const,
        category: row.action_type,
        status: deriveAutonomousStatus(row),
        title: row.description,
        detail: row.description,
        durationMs: null,
        metadata: {
          risk_tier: row.risk_tier,
          slug: row.slug,
          market: row.market,
          undone_at: row.undone_at,
          outcome_metrics: row.outcome_metrics,
        },
      }),
    );

    // Merge + filter
    let merged = [...cronEntries, ...autoEntries];

    if (status) {
      merged = merged.filter((e) => e.status === status);
    }

    if (q) {
      merged = merged.filter((e) => {
        const haystack = `${e.category} ${e.title} ${e.detail ?? ''}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    // Sort by ts DESC
    merged.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    const total = merged.length;
    const entries = merged.slice(offset, offset + limit);

    return { entries, total };
  } catch (err) {
    logger.error('audit-log: getAuditLog failed', err);
    return { entries: [], total: 0 };
  }
}
