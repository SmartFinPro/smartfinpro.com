import { NextRequest, NextResponse } from 'next/server';
import { triggerCompetitorScan } from '@/lib/actions/competitors';
import { logCron } from '@/lib/logging';
import { validateBearer } from '@/lib/security/timing-safe';

/**
 * Competitor Radar — Daily Sync Cron Job
 *
 * Scans all tracked keywords via Serper.dev, computes CPS scores,
 * stores snapshots, and generates opportunity alerts.
 *
 * Schedule: Daily at 3 AM UTC
 *
 * Self-hosted crontab entry:
 *   0 3 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-competitors >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  // Verify CRON_SECRET (timing-safe)
  if (!validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    const result = await triggerCompetitorScan();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const cronStatus = result.failed > 0
      ? result.scanned > 0 ? 'partial' : 'error'
      : 'success';

    logCron({
      job: 'sync-competitors', status: cronStatus,
      duration_ms: Math.round(parseFloat(duration) * 1000),
      scanned: result.scanned,
      failed: result.failed,
      new_alerts: result.newAlerts,
      error: result.failed > 0 ? `${result.failed} keyword scans failed` : undefined,
    });

    return NextResponse.json({
      success: cronStatus === 'success',
      partial: cronStatus === 'partial',
      scanned: result.scanned,
      failed: result.failed,
      newAlerts: result.newAlerts,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    }, { status: cronStatus === 'error' ? 500 : cronStatus === 'partial' ? 207 : 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logCron({ job: 'sync-competitors', status: 'error', error: msg });
    return NextResponse.json(
      { error: msg, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
