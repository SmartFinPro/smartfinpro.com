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

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  ts:    string;
  msg:   string;
  env:   string;
  [key: string]: unknown;
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
  debug(msg: string, ctx?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'production') emit('debug', msg, ctx);
  },

  /** Operational events (cron success, user action, etc.) */
  info(msg: string, ctx?: Record<string, unknown>) {
    emit('info', msg, ctx);
  },

  /** Non-critical issues that need attention */
  warn(msg: string, ctx?: Record<string, unknown>) {
    emit('warn', msg, ctx);
  },

  /** Errors that impact functionality */
  error(msg: string, ctx?: Record<string, unknown>) {
    emit('error', msg, ctx);
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
