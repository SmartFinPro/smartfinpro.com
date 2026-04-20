// Fire-and-forget audit logger for MCP tool calls.
// Pattern analog lib/logging.ts:92 logCron() — never throws, never blocks.

import { getServiceClient } from './supabase.js';

export type AuditStatus = 'success' | 'error' | 'validation_failed' | 'unauthorized';

export interface AuditContext {
  tool: string;
  args: unknown;
  status: AuditStatus;
  duration_ms: number;
  result_summary?: string;
  error?: string;
}

export function logToolCall(ctx: AuditContext): void {
  // Never blocks the caller — fire-and-forget with internal error trap.
  void (async () => {
    try {
      const supabase = getServiceClient();
      const { error } = await supabase.from('claude_audit_log').insert({
        tool_name: ctx.tool,
        args_json: ctx.args ?? {},
        result_summary: ctx.result_summary ?? null,
        status: ctx.status,
        duration_ms: ctx.duration_ms,
        error: ctx.error ?? null,
      });
      if (error) {
        console.error('[mcp-audit] insert failed:', error.message);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[mcp-audit] unexpected error:', msg);
    }
  })();
}

/**
 * Wrap a tool handler with timing + audit-logging.
 * Usage:
 *   export const handleX = withAudit('tool_name', async (args) => { ... });
 */
export function withAudit<TArgs, TResult>(
  toolName: string,
  handler: (args: TArgs) => Promise<TResult>,
): (args: TArgs) => Promise<TResult> {
  return async (args: TArgs) => {
    const start = Date.now();
    try {
      const result = await handler(args);
      logToolCall({
        tool: toolName,
        args,
        status: 'success',
        duration_ms: Date.now() - start,
        result_summary: summarize(result),
      });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const status: AuditStatus = msg.startsWith('VALIDATION:') ? 'validation_failed' : 'error';
      logToolCall({
        tool: toolName,
        args,
        status,
        duration_ms: Date.now() - start,
        error: msg.slice(0, 500),
      });
      throw err;
    }
  };
}

function summarize(result: unknown): string {
  if (result == null) return 'null';
  if (Array.isArray(result)) return `array(${result.length})`;
  if (typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    const keys = Object.keys(obj);
    const hints: string[] = [];
    for (const key of ['count', 'total', 'success', 'was_new']) {
      if (key in obj) hints.push(`${key}=${String(obj[key])}`);
    }
    for (const key of ['links', 'pages', 'stages', 'orphan', 'drift']) {
      const v = obj[key];
      if (Array.isArray(v)) hints.push(`${key}=${v.length}`);
    }
    return hints.length ? hints.join(', ') : `object(${keys.length} keys)`;
  }
  return String(result).slice(0, 100);
}
