import { NextRequest, NextResponse } from 'next/server';
import { triggerCompetitorScan } from '@/lib/actions/competitors';

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
  // Verify CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.startsWith('your-')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAuthenticated = authHeader === `Bearer ${cronSecret}`;
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    const result = await triggerCompetitorScan();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(
      `[sync-competitors] Scan complete: ${result.scanned} keywords, ${result.newAlerts} new alerts, ${duration}s`,
    );

    return NextResponse.json({
      success: true,
      scanned: result.scanned,
      newAlerts: result.newAlerts,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[sync-competitors] Cron failed:', msg);
    return NextResponse.json(
      { error: msg, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
