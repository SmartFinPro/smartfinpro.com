// app/api/dashboard/autonomous-toggle/route.ts
import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';

export const dynamic = 'force-dynamic';

// Only allow toggling these specific keys (security whitelist)
const ALLOWED_KEYS = new Set([
  'auto_executor_enabled',
  'simulation_mode',
  'feedback_loop_enabled',
  'insight_engine_enabled',
]);

export async function POST(request: NextRequest) {
  // Auth handled by dashboard layout (middleware)

  const body = await request.json();
  const { key, value } = body;

  if (!key || !value || !ALLOWED_KEYS.has(key)) {
    return Response.json(
      { error: `Invalid key. Allowed: ${[...ALLOWED_KEYS].join(', ')}` },
      { status: 400 },
    );
  }

  if (value !== 'true' && value !== 'false') {
    return Response.json({ error: 'Value must be "true" or "false"' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from('system_settings')
    .update({ value })
    .eq('key', key);

  if (error) {
    logger.error('[autonomous-toggle] Update failed', { key, error: error.message });
    return Response.json({ error: error.message }, { status: 500 });
  }

  logger.info('[autonomous-toggle] Setting updated', { key, value });

  return Response.json({ ok: true, key, value });
}
