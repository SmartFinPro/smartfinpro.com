// lib/notifications.ts
// Notification producer — central event recorder for the dashboard Notification Center.
//
// recordNotification() is fire-and-forget: it NEVER throws and never blocks the
// caller. Mirrors logCron()'s resilient pattern (lib/logging.ts) — failures are
// logged to stdout only, so a broken DB connection can't break alert delivery.
//
// Kept in its own file (no Telegram imports) so lib/alerts/telegram.ts can call
// it without creating an import cycle.
//
// Usage:
//   import { recordNotification } from '@/lib/notifications';
//   await recordNotification({ type: 'spike', severity: 'warning', title: 'Traffic spike' });

import 'server-only';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface RecordNotificationInput {
  type: string;
  severity?: NotificationSeverity;
  title: string;
  message?: string;
  source?: string;
  link_url?: string;
  metadata?: Record<string, unknown>;
}

function formatErr(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Insert a notification row. NEVER throws — notification recording must not
 * break the caller. Returns `true` if the row was persisted to the
 * notifications table, `false` otherwise (DB error, table not yet migrated,
 * connection failure). Callers that only fire-and-forget can ignore the result;
 * the neutral alert-delivery layer uses it to report persistence status.
 */
export async function recordNotification(input: RecordNotificationInput): Promise<boolean> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/server');
    const supabase = createServiceClient();

    const { error } = await supabase.from('notifications').insert({
      type: input.type,
      severity: input.severity ?? 'info',
      title: input.title,
      message: input.message ?? null,
      source: input.source ?? null,
      link_url: input.link_url ?? null,
      metadata: input.metadata ?? {},
    });

    if (error) {
      console.error(JSON.stringify({
        level: 'error',
        ts: new Date().toISOString(),
        msg: '[recordNotification] insert failed',
        error: error.message,
        type: input.type,
      }));
      return false;
    }
    return true;
  } catch (err) {
    // Never throw — notification recording must not break the caller.
    console.error(JSON.stringify({
      level: 'error',
      ts: new Date().toISOString(),
      msg: '[recordNotification] unexpected failure',
      error: formatErr(err),
    }));
    return false;
  }
}
