import { NextRequest, NextResponse } from 'next/server';
import { runBacklinkScout } from '@/lib/actions/backlink-automation';
import { logCron } from '@/lib/logging';
import { validateBearer } from '@/lib/security/timing-safe';

/**
 * Backlink Scout — Opportunity Discovery Cron Job
 *
 * Scans Reddit, Quora, forums and niche communities via Serper.dev
 * for keyword-relevant threads where we can place natural backlinks.
 * Scores each opportunity and saves to backlink_opportunities table.
 *
 * Schedule: Every 6 hours
 *
 * Self-hosted crontab entry (every 6 hours):
 *   0 0,6,12,18 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/backlink-scout >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const result = await runBacklinkScout();
    const duration = Date.now() - startTime;

    logCron({
      job: 'backlink-scout',
      status: 'success',
      duration_ms: duration,
      scanned: result.scanned,
      found: result.found,
      saved: result.saved,
    });

    return NextResponse.json({
      success: true,
      scanned: result.scanned,
      found: result.found,
      saved: result.saved,
      duration: `${(duration / 1000).toFixed(1)}s`,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logCron({ job: 'backlink-scout', status: 'error', error: msg });

    return NextResponse.json(
      { success: false, error: msg, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
