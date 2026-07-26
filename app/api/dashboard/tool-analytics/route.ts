// app/api/dashboard/tool-analytics/route.ts
// Thin GET proxy for the Tool Analytics dashboard (tool_v1). Pattern:
// app/api/dashboard/page-rankings/route.ts — dashboard-session-gated,
// query-string filters validated then handed to the 'use server' action.
//
// The client widget (components/dashboard/tool-analytics.tsx) fetches THIS
// route only — it never imports lib/actions/tool-analytics.ts.

import { NextRequest, NextResponse } from 'next/server';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import { compareSecret } from '@/lib/security/timing-safe';
import { getToolAnalytics } from '@/lib/actions/tool-analytics';
import { TOOL_ID_VALUES, type ToolId } from '@/lib/tools/registry';
import { VALID_MARKETS, type Market } from '@/lib/validation';
import type { ToolAnalyticsDays } from '@/lib/analytics/tool-analytics-aggregate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_DAYS: ToolAnalyticsDays[] = [7, 14, 30, 90];

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
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const daysParam = Number(searchParams.get('days'));
  const days: ToolAnalyticsDays = (VALID_DAYS as number[]).includes(daysParam)
    ? (daysParam as ToolAnalyticsDays)
    : 7;

  const marketParam = searchParams.get('market');
  const market: Market | undefined =
    marketParam && (VALID_MARKETS as readonly string[]).includes(marketParam) ? (marketParam as Market) : undefined;

  const toolIdParam = searchParams.get('toolId');
  const toolId: ToolId | undefined =
    toolIdParam && (TOOL_ID_VALUES as readonly string[]).includes(toolIdParam) ? (toolIdParam as ToolId) : undefined;

  const device = searchParams.get('device') || undefined;

  const result = await getToolAnalytics({ days, market, toolId, device });

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}
