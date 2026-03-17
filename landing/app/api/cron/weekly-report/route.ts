import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyReport } from '@/lib/actions/weekly-report';

/**
 * Weekly Performance Report — Cron Job
 *
 * Aggregates 7-day metrics (revenue, traffic, auto-pilot actions,
 * genesis assets), compares to previous week, generates an AI
 * strategy tip via Anthropic, and delivers a formatted Telegram
 * message as the "SmartFin Weekly Revenue Radar".
 *
 * Revenue formula: Emerald Clicks × CPA × Conversion Rate (3%)
 * Consistent with getRevenueForecast() and the Dollar-Heatmap.
 *
 * Schedule: Sunday 20:00 UTC
 *
 * Self-hosted crontab entry:
 *   0 20 * * 0 curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/weekly-report >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.startsWith('your-')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Allow dev bypass
  const isDev = process.env.NODE_ENV === 'development';
  const isAuthenticated = authHeader === `Bearer ${cronSecret}`;

  if (!isAuthenticated && !isDev) {
    console.warn(
      `[weekly-report] Unauthorized attempt from ${request.headers.get('x-forwarded-for') || 'unknown'}`,
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    const result = await generateWeeklyReport();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!result.success) {
      console.error('[weekly-report] Generation failed:', result.error);
      return NextResponse.json(
        {
          error: result.error,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      );
    }

    const d = result.data;

    console.log(
      `[weekly-report] Complete: $${d?.totalRevenue} revenue, ` +
      `${d?.totalClicks} clicks, ` +
      `${(d?.revenueDelta ?? 0) > 0 ? '+' : ''}${d?.revenueDelta ?? 0}% delta, ` +
      `telegram=${result.telegramSent}, ${duration}s`,
    );

    return NextResponse.json({
      success: true,
      revenue: {
        total: d?.totalRevenue ?? 0,
        previous: d?.previousRevenue ?? 0,
        delta: `${d?.revenueDelta ?? 0}%`,
      },
      traffic: {
        total: d?.totalClicks ?? 0,
        previous: d?.previousClicks ?? 0,
        delta: `${d?.clicksDelta ?? 0}%`,
      },
      topMarket: d?.topMarket ?? null,
      winner: d?.winnerSlug
        ? {
            slug: d.winnerSlug,
            revenue: d.winnerRevenue,
            clicks: d.winnerClicks,
          }
        : null,
      autoPilot: {
        freshnessBoosts: d?.freshnessBoosts ?? 0,
        genesisAssets: d?.genesisAssets ?? 0,
        optimizationsApplied: d?.optimizationsApplied ?? 0,
      },
      aiTip: d?.aiTip ? true : false,
      telegramSent: result.telegramSent,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[weekly-report] Cron failed:', msg);
    return NextResponse.json(
      { error: msg, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
