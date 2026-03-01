'use server';

import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { sendTelegramAlert } from '@/lib/alerts/telegram';
import type { Market } from '@/lib/supabase/types';
import { createClaudeMessage } from '@/lib/claude/client';

// ════════════════════════════════════════════════════════════════
// WEEKLY PERFORMANCE REPORT — Revenue Radar
//
// generateWeeklyReport()  — Aggregate 7-day metrics, compare to
//                           previous week, generate AI strategy tip,
//                           format and send via Telegram.
//
// Revenue formula is IDENTICAL to getRevenueForecast() in
// lib/actions/revenue-forecast.ts:
//   Revenue = Emerald Clicks × CPA × Conversion Rate
//   Default conversion rate: 3% (0.03)
//
// Schedule: Sunday 20:00 UTC via /api/cron/weekly-report
// ════════════════════════════════════════════════════════════════

const DEFAULT_CONVERSION_RATE = 0.03;

const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

// ── Types ────────────────────────────────────────────────────

interface MarketMetrics {
  market: Market;
  totalClicks: number;
  emeraldClicks: number;
  revenue: number;
}

interface WeeklyReportData {
  // Revenue
  totalRevenue: number;
  previousRevenue: number;
  revenueDelta: number; // percentage

  // Traffic
  totalClicks: number;
  previousClicks: number;
  clicksDelta: number;

  // Markets
  markets: MarketMetrics[];
  topMarket: { market: Market; clicks: number } | null;

  // Winner of the week
  winnerSlug: string | null;
  winnerRevenue: number;
  winnerClicks: number;

  // Auto-Pilot summary
  freshnessBoosts: number;
  genesisAssets: number;
  optimizationsApplied: number;

  // AI Strategy Tip
  aiTip: string | null;
}

export interface WeeklyReportResult {
  success: boolean;
  data: WeeklyReportData | null;
  telegramSent: boolean;
  error?: string;
}

// ── Main: Generate Weekly Report ──────────────────────────────

export async function generateWeeklyReport(): Promise<WeeklyReportResult> {
  try {
    const supabase = createServiceClient();

    // Time boundaries
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const prevWeekStart = new Date(now);
    prevWeekStart.setDate(prevWeekStart.getDate() - 14);

    // ── 1. Fetch CTA clicks: current week + previous week ─────

    const [currentClicksRes, previousClicksRes] = await Promise.all([
      supabase
        .from('cta_analytics')
        .select('slug, market, provider, variant')
        .gte('clicked_at', weekStart.toISOString()),
      supabase
        .from('cta_analytics')
        .select('slug, market, provider, variant')
        .gte('clicked_at', prevWeekStart.toISOString())
        .lt('clicked_at', weekStart.toISOString()),
    ]);

    const currentClicks = currentClicksRes.data || [];
    const previousClicks = previousClicksRes.data || [];

    // ── 2. Fetch affiliate rates ──────────────────────────────

    const { data: rates } = await supabase
      .from('affiliate_rates')
      .select('provider_name, market, cpa_value, avg_conversion_rate')
      .eq('active', true);

    // Build rate lookup: provider+market → { cpa, convRate }
    const rateMap = new Map<string, { cpa: number; convRate: number }>();
    for (const rate of rates || []) {
      if (rate.market) {
        rateMap.set(`${rate.provider_name}|${rate.market}`, {
          cpa: rate.cpa_value,
          convRate: rate.avg_conversion_rate ?? DEFAULT_CONVERSION_RATE,
        });
      }
      rateMap.set(`${rate.provider_name}|*`, {
        cpa: rate.cpa_value,
        convRate: rate.avg_conversion_rate ?? DEFAULT_CONVERSION_RATE,
      });
    }

    function getRate(provider: string, market: string) {
      return (
        rateMap.get(`${provider}|${market}`) ||
        rateMap.get(`${provider}|*`) ||
        null
      );
    }

    // ── 3. Calculate current week revenue ─────────────────────

    const marketAgg = new Map<Market, MarketMetrics>();
    const slugRevenue = new Map<string, { slug: string; revenue: number; clicks: number }>();
    let totalRevenue = 0;
    const totalClicks = currentClicks.length;

    for (const row of currentClicks) {
      const m = row.market as Market;

      // Market aggregation
      if (!marketAgg.has(m)) {
        marketAgg.set(m, { market: m, totalClicks: 0, emeraldClicks: 0, revenue: 0 });
      }
      const mk = marketAgg.get(m)!;
      mk.totalClicks++;

      if (row.variant === 'emerald-shimmer') {
        mk.emeraldClicks++;

        const rate = getRate(row.provider, row.market);
        if (rate) {
          const rev = rate.cpa * rate.convRate;
          mk.revenue += rev;
          totalRevenue += rev;

          // Slug-level tracking for "Winner of the Week"
          const slugKey = row.slug;
          const existing = slugRevenue.get(slugKey) || { slug: slugKey, revenue: 0, clicks: 0 };
          existing.revenue += rev;
          existing.clicks++;
          slugRevenue.set(slugKey, existing);
        }
      }
    }

    // ── 4. Calculate previous week revenue ────────────────────

    let previousRevenue = 0;
    const previousClicks_total = previousClicks.length;

    for (const row of previousClicks) {
      if (row.variant !== 'emerald-shimmer') continue;
      const rate = getRate(row.provider, row.market);
      if (rate) {
        previousRevenue += rate.cpa * rate.convRate;
      }
    }

    // ── 5. Deltas ─────────────────────────────────────────────

    const revenueDelta = previousRevenue > 0
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
      : totalRevenue > 0 ? 100 : 0;

    const clicksDelta = previousClicks_total > 0
      ? Math.round(((totalClicks - previousClicks_total) / previousClicks_total) * 100)
      : totalClicks > 0 ? 100 : 0;

    // ── 6. Top market & Winner slug ───────────────────────────

    const markets = Array.from(marketAgg.values()).sort((a, b) => b.totalClicks - a.totalClicks);
    const topMarket = markets.length > 0
      ? { market: markets[0].market, clicks: markets[0].totalClicks }
      : null;

    let winnerSlug: string | null = null;
    let winnerRevenue = 0;
    let winnerClicks = 0;

    for (const entry of slugRevenue.values()) {
      if (entry.revenue > winnerRevenue) {
        winnerSlug = entry.slug;
        winnerRevenue = entry.revenue;
        winnerClicks = entry.clicks;
      }
    }

    // ── 7. Auto-Pilot summary (last 7 days) ──────────────────

    const [boostsRes, genesisRes, optimizationsRes] = await Promise.all([
      // Freshness boosts triggered this week
      supabase
        .from('autopilot_cooldowns')
        .select('slug', { count: 'exact' })
        .gte('last_triggered_at', weekStart.toISOString()),
      // Genesis assets completed this week
      supabase
        .from('genesis_pipeline_runs')
        .select('id', { count: 'exact' })
        .eq('status', 'completed')
        .gte('completed_at', weekStart.toISOString()),
      // Optimization tasks applied this week
      supabase
        .from('optimization_tasks')
        .select('id', { count: 'exact' })
        .eq('status', 'applied')
        .gte('applied_at', weekStart.toISOString()),
    ]);

    const freshnessBoosts = boostsRes.count || 0;
    const genesisAssets = genesisRes.count || 0;
    const optimizationsApplied = optimizationsRes.count || 0;

    // ── 8. AI Strategy Tip via Anthropic ──────────────────────

    let aiTip: string | null = null;

    try {
      const marketsBreakdown = markets
        .map((m) => `${m.market.toUpperCase()}: ${m.totalClicks} clicks, $${m.revenue.toFixed(2)} rev`)
        .join('; ');

      const topSlugs = Array.from(slugRevenue.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((s) => `${s.slug}: $${s.revenue.toFixed(2)} (${s.clicks} emerald clicks)`)
        .join('; ');

      // Read Anthropic API key from settings
      const { data: keyRow } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'anthropic_api_key')
        .single();

      const apiKey = keyRow?.value;

      if (apiKey && apiKey.length > 10) {
        const response = await createClaudeMessage({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 150,
          messages: [{
            role: 'user',
            content: `Du bist ein datengetriebener Affiliate-Marketing-Analyst. Analysiere diese Wochendaten und gib EINEN kurzen, konkreten Strategie-Tipp (max. 2 Saetze, deutsch):

Traffic: ${totalClicks} clicks (${clicksDelta > 0 ? '+' : ''}${clicksDelta}% vs Vorwoche)
Revenue: $${totalRevenue.toFixed(2)} (${revenueDelta > 0 ? '+' : ''}${revenueDelta}% vs Vorwoche)
Markets: ${marketsBreakdown}
Top Slugs: ${topSlugs}
Auto-Pilot: ${freshnessBoosts} Boosts, ${genesisAssets} Genesis Assets, ${optimizationsApplied} Optimierungen

Antworte NUR mit dem Tipp, ohne Einleitung.`,
          }],
        }, { apiKey, operation: 'weekly_report_tip' });

        if (response.content.length > 0 && response.content[0].type === 'text') {
          aiTip = response.content[0].text.trim();
        }
      }
    } catch (aiErr) {
      console.error('[weekly-report] AI tip generation failed (non-blocking):',
        aiErr instanceof Error ? aiErr.message : 'Unknown');
    }

    // ── 9. Build report data ──────────────────────────────────

    const data: WeeklyReportData = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      previousRevenue: Math.round(previousRevenue * 100) / 100,
      revenueDelta,
      totalClicks,
      previousClicks: previousClicks_total,
      clicksDelta,
      markets,
      topMarket,
      winnerSlug,
      winnerRevenue: Math.round(winnerRevenue * 100) / 100,
      winnerClicks,
      freshnessBoosts,
      genesisAssets,
      optimizationsApplied,
      aiTip,
    };

    // ── 10. Format & send Telegram ────────────────────────────

    const message = formatWeeklyReport(data);
    const telegramResult = await sendTelegramAlert(message);

    if (!telegramResult.success) {
      console.error('[weekly-report] Telegram failed:', telegramResult.error);
    }

    console.log(
      `[weekly-report] Report generated: $${data.totalRevenue} revenue, ${data.totalClicks} clicks, ` +
      `${data.freshnessBoosts} boosts, ${data.genesisAssets} genesis, ${data.optimizationsApplied} optimizations`,
    );

    return {
      success: true,
      data,
      telegramSent: telegramResult.success,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[weekly-report] generateWeeklyReport failed:', msg);
    return {
      success: false,
      data: null,
      telegramSent: false,
      error: msg,
    };
  }
}

// ── Telegram Message Formatter ────────────────────────────────

function formatWeeklyReport(data: WeeklyReportData): string {
  const MARKET_FLAGS: Record<string, string> = {
    us: '\ud83c\uddfa\ud83c\uddf8',
    uk: '\ud83c\uddec\ud83c\udde7',
    ca: '\ud83c\udde8\ud83c\udde6',
    au: '\ud83c\udde6\ud83c\uddfa',
  };

  const revArrow = data.revenueDelta >= 0 ? '\u2197\ufe0f' : '\u2198\ufe0f';
  const clickArrow = data.clicksDelta >= 0 ? '\u2197\ufe0f' : '\u2198\ufe0f';
  const revSign = data.revenueDelta >= 0 ? '+' : '';
  const clickSign = data.clicksDelta >= 0 ? '+' : '';

  // Market breakdown
  const marketLines = data.markets
    .filter((m) => m.totalClicks > 0)
    .map((m) => {
      const flag = MARKET_FLAGS[m.market] || '\ud83c\udf10';
      return `  ${flag} <b>${m.market.toUpperCase()}</b>: ${m.totalClicks} clicks | $${m.revenue.toFixed(2)}`;
    })
    .join('\n');

  // Winner line
  const winnerLine = data.winnerSlug
    ? `\ud83c\udfc6 <b>WINNER OF THE WEEK:</b>\n  <code>${data.winnerSlug}</code>\n  $${data.winnerRevenue.toFixed(2)} Revenue | ${data.winnerClicks} Emerald Clicks`
    : '\ud83c\udfc6 <b>WINNER OF THE WEEK:</b> Keine Daten';

  // AI tip
  const aiTipLine = data.aiTip
    ? `\ud83d\udca1 <b>AI STRATEGY TIP:</b>\n<i>${data.aiTip}</i>`
    : '\ud83d\udca1 <b>AI STRATEGY TIP:</b> <i>Nicht verfuegbar (Anthropic Key fehlt)</i>';

  return `\ud83d\udcca <b>SMARTFIN WEEKLY REVENUE RADAR</b>
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

\ud83d\udcb0 <b>Est. Revenue:</b> $${data.totalRevenue.toFixed(2)} ${revArrow} (${revSign}${data.revenueDelta}% vs Vorwoche)
\ud83d\udcc8 <b>Total Traffic:</b> ${data.totalClicks.toLocaleString('de-DE')} Clicks ${clickArrow} (${clickSign}${data.clicksDelta}% vs Vorwoche)
\ud83c\udf0d <b>Top Market:</b> ${data.topMarket ? `${MARKET_FLAGS[data.topMarket.market] || ''} ${data.topMarket.market.toUpperCase()} mit ${data.topMarket.clicks} Clicks` : 'Keine Daten'}

\ud83c\udf0d <b>MARKET BREAKDOWN:</b>
${marketLines || '  Keine Daten'}

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

\ud83e\udd16 <b>AUTO-PILOT SUMMARY:</b>
  \u26a1 ${data.freshnessBoosts} Freshness-Boosts ausgefuehrt
  \ud83d\udcdd ${data.genesisAssets} Neue Genesis-Assets indexiert
  \ud83d\udd27 ${data.optimizationsApplied} Optimierungen erfolgreich angewendet

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

${winnerLine}

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

${aiTipLine}

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
\ud83d\udd17 <a href="${DASHBOARD_URL}/dashboard/analytics">Dashboard</a> | <a href="${DASHBOARD_URL}/dashboard/analytics/heatmap">Heatmap</a> | <a href="${DASHBOARD_URL}/dashboard/revenue">Revenue</a>`;
}
