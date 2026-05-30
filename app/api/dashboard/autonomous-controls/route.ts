// app/api/dashboard/autonomous-controls/route.ts
import { NextRequest } from 'next/server';
import { randomUUID, createHash } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';

export const dynamic = 'force-dynamic';

/**
 * Autonomous controls — dashboard-only mutation endpoint.
 *
 * Auth: gated centrally by proxy.ts (session cookie on /api/dashboard/*).
 *
 * Two actions, discriminated by `action` in the JSON body:
 *
 *   1. action: "settings"
 *      Persist guardrail settings into `system_settings`.
 *      Body: { action: "settings", settings: { auto_executor_daily_budget?, auto_executor_max_tier?, simulation_mode? } }
 *      - auto_executor_daily_budget: integer >= 0
 *      - auto_executor_max_tier:     "1" | "2" | "3"
 *      - simulation_mode:            "true" | "false"
 *
 *   2. action: "undo"
 *      Reverse a Tier-2+ autonomous action by id.
 *      Body: { action: "undo", id: "<autonomous_actions.id>" }
 *      The raw undo token is never persisted (only its SHA-256 hash lives in
 *      the DB), so the dashboard cannot replay an existing token. Instead this
 *      route mints a fresh one-time token for the row (race-safe conditional
 *      UPDATE), then calls the canonical POST /api/autonomous/undo so the real
 *      rollback logic (applyRollback) stays the single source of truth.
 */

// Settings keys this route is allowed to write (security whitelist).
const SETTINGS_KEYS = new Set([
  'auto_executor_daily_budget',
  'auto_executor_max_tier',
  'simulation_mode',
]);

export async function POST(request: NextRequest) {
  // Auth handled by proxy.ts (/api/dashboard/* session-cookie gate).
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = body.action;

  if (action === 'settings') {
    return handleSettings(body);
  }
  if (action === 'undo') {
    return handleUndo(body, request);
  }

  return Response.json(
    { error: 'Invalid action. Expected "settings" or "undo".' },
    { status: 400 },
  );
}

// ── Guardrail settings ─────────────────────────────────────────────────────

async function handleSettings(body: Record<string, unknown>) {
  const settings = body.settings;
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return Response.json({ error: '`settings` object required' }, { status: 400 });
  }

  const updates: Array<{ key: string; value: string }> = [];

  for (const [key, rawValue] of Object.entries(settings as Record<string, unknown>)) {
    if (!SETTINGS_KEYS.has(key)) {
      return Response.json(
        { error: `Invalid key "${key}". Allowed: ${[...SETTINGS_KEYS].join(', ')}` },
        { status: 400 },
      );
    }

    if (key === 'auto_executor_daily_budget') {
      const n = Number(rawValue);
      if (!Number.isInteger(n) || n < 0) {
        return Response.json(
          { error: 'auto_executor_daily_budget must be an integer >= 0' },
          { status: 400 },
        );
      }
      updates.push({ key, value: String(n) });
    } else if (key === 'auto_executor_max_tier') {
      const n = Number(rawValue);
      if (!Number.isInteger(n) || n < 1 || n > 3) {
        return Response.json(
          { error: 'auto_executor_max_tier must be 1, 2, or 3' },
          { status: 400 },
        );
      }
      updates.push({ key, value: String(n) });
    } else if (key === 'simulation_mode') {
      const v = String(rawValue);
      if (v !== 'true' && v !== 'false') {
        return Response.json(
          { error: 'simulation_mode must be "true" or "false"' },
          { status: 400 },
        );
      }
      updates.push({ key, value: v });
    }
  }

  if (updates.length === 0) {
    return Response.json({ error: 'No valid settings provided' }, { status: 400 });
  }

  const supabase = createServiceClient();

  for (const { key, value } of updates) {
    const { error } = await supabase
      .from('system_settings')
      .update({ value })
      .eq('key', key);

    if (error) {
      logger.error('[autonomous-controls] Setting update failed', { key, error: error.message });
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  logger.info('[autonomous-controls] Settings updated', { updates });

  return Response.json({ ok: true, updated: updates });
}

// ── Undo trigger (by action id) ──────────────────────────────────────────────

async function handleUndo(body: Record<string, unknown>, request: NextRequest) {
  const id = body.id;
  if (!id || typeof id !== 'string') {
    return Response.json({ error: 'Action `id` required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();

  // Verify eligibility: Tier-2+, not yet undone, within the undo window.
  const { data: action, error: fetchErr } = await supabase
    .from('autonomous_actions')
    .select('id, risk_tier, undone_at, undo_expires_at')
    .eq('id', id)
    .single();

  if (fetchErr || !action) {
    return Response.json({ error: 'Action not found' }, { status: 404 });
  }
  if (action.risk_tier < 2) {
    return Response.json({ error: 'Action is not undoable (tier < 2)' }, { status: 400 });
  }
  if (action.undone_at) {
    return Response.json({ error: 'Action already undone' }, { status: 409 });
  }
  if (!action.undo_expires_at || action.undo_expires_at <= nowIso) {
    return Response.json({ error: 'Undo window expired' }, { status: 410 });
  }

  // Mint a fresh one-time token and bind its hash to this row, but ONLY while
  // it is still un-undone (race-safe: the canonical undo route then performs
  // the atomic claim on the same hash).
  const rawToken = randomUUID();
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  const { data: claimed, error: bindErr } = await supabase
    .from('autonomous_actions')
    .update({ undo_token_hash: tokenHash })
    .eq('id', id)
    .is('undone_at', null)
    .gt('undo_expires_at', nowIso)
    .select('id')
    .single();

  if (bindErr || !claimed) {
    logger.warn('[autonomous-controls] Undo token bind failed', {
      id,
      error: bindErr?.message,
    });
    return Response.json(
      { error: 'Could not initiate undo (expired or already used)' },
      { status: 409 },
    );
  }

  // Call the canonical undo route so applyRollback stays the single source of
  // truth. Same-origin internal call.
  const origin = request.nextUrl.origin;
  let undoRes: Response;
  try {
    undoRes = await fetch(`${origin}/api/autonomous/undo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[autonomous-controls] Undo call failed', { id, error: msg });
    return Response.json({ error: `Undo request failed: ${msg}` }, { status: 502 });
  }

  const undoBody = await undoRes.json().catch(() => ({}));

  if (!undoRes.ok) {
    logger.warn('[autonomous-controls] Undo rejected', { id, status: undoRes.status, undoBody });
    return Response.json(
      { error: (undoBody as { error?: string }).error ?? 'Undo failed' },
      { status: undoRes.status },
    );
  }

  logger.info('[autonomous-controls] Action undone via dashboard', { id });

  return Response.json({ ok: true, id, undo: undoBody });
}
