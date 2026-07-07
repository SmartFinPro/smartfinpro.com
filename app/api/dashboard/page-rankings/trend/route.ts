// app/api/dashboard/page-rankings/trend/route.ts
// Daily position trend for a single page — fetched on demand when a row
// in /dashboard/ranking/pages is expanded. Live from GSC, no cache.

import { NextRequest, NextResponse } from 'next/server';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import { compareSecret } from '@/lib/security/timing-safe';
import { getPageTrend, type PageRankingRange } from '@/lib/actions/page-rankings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_RANGES: PageRankingRange[] = ['7d', '28d', '90d'];

function isAuthorized(request: NextRequest): boolean {
  if (process.env.DASHBOARD_AUTH_DISABLED === 'true') return true;

  const dashSecret = process.env.DASHBOARD_SECRET;
  const authCookie = request.cookies.get('sfp-dash-auth')?.value;
  const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  return (
    isValidDashboardSessionValue(authCookie, dashSecret) ||
    compareSecret(bearerToken, dashSecret)
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page');
  if (!page || !page.startsWith('/') || page.length > 500) {
    return NextResponse.json({ error: 'Valid "page" path required' }, { status: 400 });
  }

  const rangeParam = searchParams.get('range') as PageRankingRange | null;
  const range: PageRankingRange =
    rangeParam && VALID_RANGES.includes(rangeParam) ? rangeParam : '28d';

  try {
    const trend = await getPageTrend(page, range);
    return NextResponse.json({ page, range, trend });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Trend fetch failed' },
      { status: 500 },
    );
  }
}
