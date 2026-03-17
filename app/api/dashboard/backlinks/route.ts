import { NextRequest, NextResponse } from 'next/server';
import { getBacklinkDashboardData } from '@/lib/actions/backlink-automation';

/**
 * Dashboard Backlinks API
 * GET /api/dashboard/backlinks — Returns all backlink dashboard data
 */
export async function GET(_request: NextRequest) {
  try {
    const data = await getBacklinkDashboardData();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
