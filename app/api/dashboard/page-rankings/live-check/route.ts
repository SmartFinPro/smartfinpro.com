// app/api/dashboard/page-rankings/live-check/route.ts
// Page-specific live SERP check — verifies whether THIS page ranks for a
// keyword right now (Serper.dev, top 10). Distinguishes "this page ranks",
// "another own page ranks" (cannibalization) and "check failed".

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import { compareSecret } from '@/lib/security/timing-safe';
import { validate } from '@/lib/validation';
import { checkPageLiveRanking } from '@/lib/actions/page-rankings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LiveCheckSchema = z.object({
  keyword: z.string().min(1).max(200),
  market: z.enum(['us', 'uk', 'ca', 'au']),
  page: z.string().startsWith('/').max(500),
});

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

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = validate(LiveCheckSchema, await request.json());
  if (!result.ok) return result.error;
  const { keyword, market, page } = result.data;

  try {
    const check = await checkPageLiveRanking(keyword, market, page);
    if (check.checkFailed) {
      return NextResponse.json(
        {
          ...check,
          error: check.serperConfigured
            ? 'Live-SERP-Abfrage fehlgeschlagen (Serper-API-Fehler)'
            : 'SERPER_API_KEY ist nicht konfiguriert',
        },
        { status: 502 },
      );
    }
    return NextResponse.json(check);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Live check failed' },
      { status: 500 },
    );
  }
}
