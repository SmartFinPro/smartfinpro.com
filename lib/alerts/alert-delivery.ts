// lib/alerts/alert-delivery.ts
// ============================================================================
// Channel-neutral alert / system-notification delivery layer.
//
// This is the canonical entry point for ALL system alerts. It knows nothing
// about any specific transport (no Telegram, no email, no webhooks). The
// standard sink is the in-app Notification Center (the `notifications` table,
// persisted via recordNotification). Additional sinks can be added here later
// without touching producers.
//
// Contract (important — see lib/alerts/telegram.ts legacy shim):
//   sendAlert()/sendAlertWithActions() ALWAYS resolve { success: true } when the
//   alert was accepted by this layer. They never throw and never report failure
//   back to the producer, so a missing DB row (e.g. notifications table not yet
//   migrated) can NEVER artificially degrade a cron/job to "failed". Persistence
//   status is exposed separately as `persisted` for observability.
// ============================================================================

import 'server-only';
import { recordNotification, type NotificationSeverity } from '@/lib/notifications';

export type AlertSeverity = NotificationSeverity; // 'info' | 'success' | 'warning' | 'critical'

export interface AlertResult {
  /** Always true once the layer accepts the alert (guaranteed log sink). */
  success: true;
  /** Whether the alert was written to the notifications table. */
  persisted: boolean;
}

export interface AlertAction {
  label: string;
  /** In-app deep link the action navigates to (no remote callbacks). */
  href: string;
}

export interface AlertInput {
  /** Stable machine type, e.g. 'spike', 'revenue_sync', 'seo_drift'. */
  type?: string;
  severity?: AlertSeverity;
  /** Short headline. If omitted, derived from `message`. */
  title?: string;
  /** Full body (may contain legacy HTML — it is stripped before storage). */
  message: string;
  /** Originating subsystem, e.g. 'spike-monitor', 'weekly-report'. */
  source?: string;
  /** In-app deep link for the notification. */
  link_url?: string;
  metadata?: Record<string, unknown>;
}

// ── Text helpers (parse legacy HTML/emoji alert strings) ────────────────────

/** Infer severity from leading emoji/markers in a free-text alert string. */
export function inferSeverity(message: string): AlertSeverity {
  if (message.includes('🚨') || message.includes('🔴') || /\bFAILED|FEHLER|CRASH\b/i.test(message)) return 'critical';
  if (message.includes('⚠️') || message.includes('🟠') || /\bWARN|PARTIAL\b/i.test(message)) return 'warning';
  if (message.includes('✅')) return 'success';
  return 'info';
}

/** Strip HTML tags so legacy HTML-formatted messages store as clean text. */
function stripHtml(message: string): string {
  return message.replace(/<[^>]+>/g, '').trim();
}

/** Derive a short title from the first <b>bold</b> span, else first line. */
export function deriveTitle(message: string): string {
  const boldMatch = message.match(/<b>(.*?)<\/b>/);
  const raw = boldMatch
    ? boldMatch[1]
    : (message.split('\n').find((l) => l.trim().length > 0) ?? 'Alert');
  const clean = raw
    .replace(/<[^>]+>/g, '')
    .replace(/^[\s\p{Emoji_Presentation}\p{Extended_Pictographic}️]+/u, '')
    .trim();
  const title = clean.length > 0 ? clean : 'Alert';
  return title.length > 120 ? `${title.slice(0, 117)}…` : title;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Deliver a system alert. Persists to the Notification Center (best-effort) and
 * always resolves { success: true } so producers are never degraded.
 */
export async function sendAlert(input: AlertInput | string): Promise<AlertResult> {
  const normalized: AlertInput = typeof input === 'string' ? { message: input } : input;
  const message = normalized.message ?? '';

  const persisted = await recordNotification({
    type: normalized.type ?? 'system_alert',
    severity: normalized.severity ?? inferSeverity(message),
    title: normalized.title ?? deriveTitle(message),
    message: stripHtml(message) || undefined,
    source: normalized.source,
    link_url: normalized.link_url,
    metadata: normalized.metadata,
  });

  return { success: true, persisted };
}

/**
 * Deliver an alert that offers follow-up actions. Actions are stored as in-app
 * deep links in metadata (no remote/interactive callbacks). Same success
 * contract as sendAlert.
 */
export async function sendAlertWithActions(
  input: AlertInput | string,
  actions: AlertAction[],
): Promise<AlertResult> {
  const normalized: AlertInput = typeof input === 'string' ? { message: input } : input;
  return sendAlert({
    ...normalized,
    metadata: { ...(normalized.metadata ?? {}), actions },
  });
}

/**
 * Record a structured system notification directly (no message parsing).
 * Returns the same success contract.
 */
export async function recordSystemNotification(input: {
  type: string;
  severity?: AlertSeverity;
  title: string;
  message?: string;
  source?: string;
  link_url?: string;
  metadata?: Record<string, unknown>;
}): Promise<AlertResult> {
  const persisted = await recordNotification({
    type: input.type,
    severity: input.severity ?? 'info',
    title: input.title,
    message: input.message,
    source: input.source,
    link_url: input.link_url,
    metadata: input.metadata,
  });
  return { success: true, persisted };
}
