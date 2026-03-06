// lib/logging.ts
// Structured JSON logger for SmartFinPro.com
//
// Drop-in replacement for console.log/error/warn with structured output.
// Outputs newline-delimited JSON — compatible with PM2 log aggregation,
// Cloudways log viewer and any JSON-aware log shipper (Loki, Datadog, etc.).
//
// Usage:
//   import { logger } from '@/lib/logging';
//   logger.info('Cron complete', { job: 'daily-strategy', duration_ms: 1200 });
//   logger.error('Supabase down', { error: err.message, latency_ms: 3100 });
//   logger.error('DB error:', err);          // Error objects auto-serialized
//   logger.warn('Slow response:', latency);  // Primitives wrapped as { value }

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  ts:    string;
  msg:   string;
  env:   string;
  [key: string]: unknown;
}

/** Serialize arbitrary second argument into a structured context object */
function normalizeCtx(ctx: unknown): Record<string, unknown> | undefined {
  if (ctx === undefined || ctx === null) return undefined;
  // Error objects: extract message + stack for JSON-friendly output
  if (ctx instanceof Error) return { error: ctx.message, stack: ctx.stack };
  // Plain objects (most common — { error: msg, key: val }): pass through
  if (typeof ctx === 'object' && !Array.isArray(ctx)) return ctx as Record<string, unknown>;
  // Primitives (string, number, boolean): wrap as { value }
  return { value: String(ctx) };
}

function emit(level: LogLevel, msg: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    ts:  new Date().toISOString(),
    msg,
    env: process.env.NODE_ENV ?? 'production',
    ...context,
  };

  const line = JSON.stringify(entry);

  // Route to appropriate stream so PM2 separates app.log / error.log
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  /** Verbose output — suppressed in production */
  debug(msg: string, ctx?: unknown) {
    if (process.env.NODE_ENV !== 'production') emit('debug', msg, normalizeCtx(ctx));
  },

  /** Operational events (cron success, user action, etc.) */
  info(msg: string, ctx?: unknown) {
    emit('info', msg, normalizeCtx(ctx));
  },

  /** Non-critical issues that need attention */
  warn(msg: string, ctx?: unknown) {
    emit('warn', msg, normalizeCtx(ctx));
  },

  /** Errors that impact functionality */
  error(msg: string, ctx?: unknown) {
    emit('error', msg, normalizeCtx(ctx));
  },
};

// ── Convenience: structured cron log helper ───────────────────────────────
// Used by cron routes to emit consistent job-level logs.
export interface CronLogContext {
  job:        string;
  status:     'success' | 'error' | 'skipped';
  duration_ms?: number;
  [key: string]: unknown;
}

export function logCron(ctx: CronLogContext) {
  const level: LogLevel = ctx.status === 'error' ? 'error' : 'info';
  emit(level, `[cron] ${ctx.job} — ${ctx.status}`, ctx);
}
