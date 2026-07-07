// app/api/dashboard/page-rankings/route.ts
// Live Google positions for ALL site pages — powers /dashboard/ranking/pages.
// Every request pulls fresh data from the GSC Search Analytics API (no cache),
// so the refresh button always returns current positions.

import { NextRequest, NextResponse } from 'next/server';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import { compareSecret } from '@/lib/security/timing-safe';
import { getPageRankings, type PageRankingRange } from '@/lib/actions/page-rankings';

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
  const rangeParam = searchParams.get('range') as PageRankingRange | null;
  const range: PageRankingRange =
    rangeParam && VALID_RANGES.includes(rangeParam) ? rangeParam : '28d';

  const result = await getPageRankings(range);

  if (result.error) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}
