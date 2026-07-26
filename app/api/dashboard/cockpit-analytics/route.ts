// app/api/dashboard/cockpit-analytics/route.ts
// Thin GET proxy for the Cockpit Analytics dashboard (pattern: cta-heatmap).

import { NextRequest, NextResponse } from 'next/server';
import { getCockpitAnalytics, type CockpitTimeRange } from '@/lib/actions/cockpit-analytics';
import { VALID_MARKETS } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRangeParam = searchParams.get('timeRange') || '7d';
    const timeRange: CockpitTimeRange = timeRangeParam === '24h' || timeRangeParam === '30d' ? timeRangeParam : '7d';
    const marketParam = searchParams.get('market');
    const market = marketParam && (VALID_MARKETS as readonly string[]).includes(marketParam) ? marketParam : undefined;

    const result = await getCockpitAnalytics(timeRange, market);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] cockpit-analytics error:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
