import { NextRequest, NextResponse } from 'next/server';
import { runBacklinkPost } from '@/lib/actions/backlink-automation';
import { logCron } from '@/lib/logging';

/**
 * Backlink Post — Automated Content Posting Cron Job
 *
 * Processes pending backlink opportunities (score > 60) from the queue,
 * generates Claude-powered helpful responses, and posts to:
 * - Reddit (via OAuth API)
 * - Medium (via Integration Token + canonical backlink)
 * - Quora / Forums → moved to manual review queue
 *
 * Rate limits: Max 5 posts per run, 2s delay between posts.
 *
 * Schedule: Every 4 hours
 *
 * Self-hosted crontab entry (every 4 hours):
 *   0 0,4,8,12,16,20 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/backlink-post >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
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
    const result = await runBacklinkPost();
    const duration = Date.now() - startTime;

    logCron({
      job: 'backlink-post',
      status: 'success',
      duration_ms: duration,
      processed: result.processed,
      posted: result.posted,
      failed: result.failed,
      queued: result.queued,
    });

    return NextResponse.json({
      success: true,
      processed: result.processed,
      posted: result.posted,
      failed: result.failed,
      queued: result.queued,
      duration: `${(duration / 1000).toFixed(1)}s`,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logCron({ job: 'backlink-post', status: 'error', error: msg });

    return NextResponse.json(
      { success: false, error: msg, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
