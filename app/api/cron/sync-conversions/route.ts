import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { syncConnector } from '@/lib/api/sync-service';

/**
 * Scheduled sync endpoint for daily conversion synchronization.
 *
 * Syncs all enabled connectors from Supabase.
 *
 * Security: Requires CRON_SECRET environment variable via Bearer token.
 *
 * Self-hosted crontab entry:
 *   0 6 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-conversions >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  // Verify CRON_SECRET — only Bearer token auth (self-hosted)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.startsWith('your-')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[sync-conversions] Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const results: Array<{
    connector: string;
    success: boolean;
    records_synced: number;
    records_skipped: number;
    errors: string[];
  }> = [];

  try {
    // Get all enabled connectors
    const { data: connectors } = await supabase
      .from('api_connectors')
      .select('name')
      .eq('is_enabled', true);

    if (!connectors || connectors.length === 0) {
      return NextResponse.json({
        message: 'No enabled connectors found',
        results: [],
      });
    }

    // Sync each connector
    for (const connector of connectors) {
      console.log(`[sync-conversions] Starting scheduled sync for: ${connector.name}`);

      const result = await syncConnector(connector.name, 'scheduled');

      results.push({
        connector: connector.name,
        success: result.success,
        records_synced: result.records_synced,
        records_skipped: result.records_skipped,
        errors: result.errors,
      });

      console.log(`[sync-conversions] Completed sync for ${connector.name}:`, {
        success: result.success,
        synced: result.records_synced,
        skipped: result.records_skipped,
      });
    }

    const totalSynced = results.reduce((sum, r) => sum + r.records_synced, 0);
    const allSuccessful = results.every((r) => r.success);

    return NextResponse.json({
      success: allSuccessful,
      total_records_synced: totalSynced,
      results,
    });
  } catch (error) {
    console.error('[sync-conversions] Cron sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST for manual trigger from dashboard
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return GET(request);
}
