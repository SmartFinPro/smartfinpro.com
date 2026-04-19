// app/api/cron/{{NAME}}/route.ts
import { NextRequest } from 'next/server';
import { logger, logCron } from '@/lib/logging';
import { withRetry } from '@/lib/utils/retry';
import { validateBearer } from '@/lib/security/timing-safe';
// import { sendTelegramMessage } from '@/lib/telegram'; // optional alerts

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const start = Date.now();

  // ── Auth (timing-safe) ────────────────────────────────────
  if (!validateBearer(request.headers.get('Authorization'), process.env.CRON_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    logger.info('[{{NAME}}] starting');

    // ── Core Logic ────────────────────────────────────────
    const result = await withRetry(
      async (_attempt) => {
        // TODO: implement core logic here
        return { processed: 0 };
      },
      { maxAttempts: 3, backoffMs: [1000, 2000, 4000] }
    );

    // ── Success Logging ───────────────────────────────────
    const duration_ms = Date.now() - start;
    logger.info('[{{NAME}}] complete', { ...result, duration_ms });
    await logCron({ job: '{{NAME}}', status: 'success', duration_ms, ...result });

    return Response.json({ ok: true, ...result });

  } catch (error) {
    const duration_ms = Date.now() - start;
    logger.error('[{{NAME}}] failed', error);
    await logCron({ job: '{{NAME}}', status: 'error', duration_ms, error: String(error) });
    // await sendTelegramMessage(`❌ {{NAME}} failed: ${String(error)}`);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
