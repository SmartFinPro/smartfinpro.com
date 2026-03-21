// app/api/dashboard/gsc-analytics/route.ts
// API Route for Google Search Console data — used by Analytics Dashboard
// Fetches real GSC Performance data: impressions, clicks, CTR, positions, top keywords, top pages

import { NextRequest, NextResponse } from 'next/server';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import {
  isGSCConfigured,
  querySearchAnalytics,
  getTopKeywords,
  getWinnersAndLosers,
  countryToMarket,
} from '@/lib/seo/google-search-console';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── Date helpers ──────────────────────────────────────────
function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getDateRange(range: string): { start: string; end: string } {
  const end = new Date();
  end.setDate(end.getDate() - 3); // GSC data has ~3 day lag
  const start = new Date(end);

  switch (range) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    default:
      start.setDate(start.getDate() - 28); // default 28 days
  }

  return { start: fmt(start), end: fmt(end) };
}

export async function GET(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────
  const dashSecret = process.env.DASHBOARD_SECRET;
  const authCookie = request.cookies.get('sfp-dash-auth')?.value;
  const bearerToken = request.headers.get('authorization')?.replace('Bearer ', '');

  const isAuthed =
    isValidDashboardSessionValue(authCookie, dashSecret) ||
    (dashSecret && bearerToken === dashSecret);

  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── GSC check ───────────────────────────────────────────
  if (!isGSCConfigured()) {
    return NextResponse.json({
      configured: false,
      message: 'GSC credentials not configured. Set GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY, GSC_SITE_URL.',
    });
  }

  // ── Parse params ────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '28d';
  const market = searchParams.get('market') || undefined;
  const { start, end } = getDateRange(range);

  try {
    // ── Parallel data fetches ─────────────────────────────
    const [
      overviewRows,
      dailyRows,
      topKeywords,
      topPageRows,
      winnersLosers,
    ] = await Promise.all([
      // 1. Aggregate overview (total clicks, impressions, CTR, position)
      querySearchAnalytics({
        startDate: start,
        endDate: end,
        dimensions: ['country'],
        rowLimit: 10,
      }),
      // 2. Daily trend
      querySearchAnalytics({
        startDate: start,
        endDate: end,
        dimensions: ['date'],
        rowLimit: 100,
      }),
      // 3. Top keywords
      getTopKeywords({ days: range === '7d' ? 7 : range === '90d' ? 90 : 28, limit: 25, market }),
      // 4. Top pages by clicks
      querySearchAnalytics({
        startDate: start,
        endDate: end,
        dimensions: ['page'],
        rowLimit: 25,
      }),
      // 5. Winners & Losers
      getWinnersAndLosers(range === '7d' ? 7 : 14),
    ]);

    // ── Aggregate overview KPIs ───────────────────────────
    let totalClicks = 0;
    let totalImpressions = 0;
    let weightedPosition = 0;
    let weightedCTR = 0;

    const marketBreakdown: Record<string, { clicks: number; impressions: number }> = {};

    for (const row of overviewRows) {
      totalClicks += row.clicks;
      totalImpressions += row.impressions;
      weightedPosition += row.position * row.impressions;
      weightedCTR += row.ctr * row.impressions;

      const mkt = countryToMarket(row.keys[0]);
      if (!marketBreakdown[mkt]) {
        marketBreakdown[mkt] = { clicks: 0, impressions: 0 };
      }
      marketBreakdown[mkt].clicks += row.clicks;
      marketBreakdown[mkt].impressions += row.impressions;
    }

    const avgPosition = totalImpressions > 0
      ? Math.round((weightedPosition / totalImpressions) * 10) / 10
      : 0;
    const avgCTR = totalImpressions > 0
      ? Math.round((weightedCTR / totalImpressions) * 10000) / 100
      : 0;

    // ── Daily trend data ──────────────────────────────────
    const dailyTrend = dailyRows
      .map((row) => ({
        date: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: Math.round(row.ctr * 10000) / 100,
        position: Math.round(row.position * 10) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Top pages ─────────────────────────────────────────
    const topPages = topPageRows
      .map((row) => {
        const fullUrl = row.keys[0];
        // Extract path from full URL
        const path = fullUrl.replace(/^https?:\/\/[^/]+/, '') || '/';
        return {
          page: path,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: Math.round(row.ctr * 10000) / 100,
          position: Math.round(row.position * 10) / 10,
        };
      })
      .sort((a, b) => b.clicks - a.clicks);

    return NextResponse.json({
      configured: true,
      range: { start, end, label: range },
      overview: {
        totalClicks,
        totalImpressions,
        avgPosition,
        avgCTR,
      },
      marketBreakdown,
      dailyTrend,
      topKeywords,
      topPages,
      winnersLosers,
    });
  } catch (err) {
    console.error('[GSC Analytics] Error:', err);
    return NextResponse.json({
      configured: true,
      error: err instanceof Error ? err.message : 'Unknown error fetching GSC data',
    }, { status: 500 });
  }
}
