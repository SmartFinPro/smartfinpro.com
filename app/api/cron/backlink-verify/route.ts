import { NextRequest, NextResponse } from 'next/server';
import { runBacklinkVerify } from '@/lib/actions/backlink-automation';
import { logCron } from '@/lib/logging';

/**
 * Backlink Verify — Weekly Link Health Check Cron Job
 *
 * Verifies that all live backlink placements are still active.
 * Fetches each source URL and checks for our domain in the page content.
 * Updates status to 'live', 'lost', or 'unverified'.
 *
 * Processes oldest-verified-first (up to 50 per run).
 * Sends weekly summary to Telegram.
 *
 * Schedule: Weekly, Monday at 9:00 AM
 *
 * Self-hosted crontab entry:
 *   0 9 * * 1 curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/backlink-verify >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) {
    if (!cronSecret || cronSecret.startsWith('your-')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startTime = Date.now();

  try {
    const result = await runBacklinkVerify();
    const duration = Date.now() - startTime;

    logCron({
      job: 'backlink-verify',
      status: 'success',
      duration_ms: duration,
      checked: result.checked,
      live: result.live,
      lost: result.lost,
    });

    return NextResponse.json({
      success: true,
      checked: result.checked,
      live: result.live,
      lost: result.lost,
      duration: `${(duration / 1000).toFixed(1)}s`,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logCron({ job: 'backlink-verify', status: 'error', error: msg });

    return NextResponse.json(
      { success: false, error: msg, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
