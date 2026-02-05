import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { syncConnector } from '@/lib/api/sync-service';

/**
 * Scheduled sync endpoint for daily conversion synchronization.
 *
 * This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions).
 * It syncs all enabled connectors.
 *
 * Security: Requires CRON_SECRET environment variable to match.
 *
 * Vercel Cron configuration (add to vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-conversions",
 *     "schedule": "0 6 * * *"  // Daily at 6 AM UTC
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
      console.log(`Starting scheduled sync for: ${connector.name}`);

      const result = await syncConnector(connector.name, 'scheduled');

      results.push({
        connector: connector.name,
        success: result.success,
        records_synced: result.records_synced,
        records_skipped: result.records_skipped,
        errors: result.errors,
      });

      console.log(`Completed sync for ${connector.name}:`, {
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
    console.error('Cron sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST for manual trigger from dashboard
export async function POST(request: NextRequest) {
  // Same auth check
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // For POST requests, also accept requests from authenticated dashboard sessions
  // (In production, add proper session validation here)

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Check if it's a dashboard request with a valid session
    // For now, we'll allow POST requests without the secret for testing
    console.warn('POST request without CRON_SECRET - allowing for development');
  }

  // Delegate to GET handler
  return GET(request);
}
