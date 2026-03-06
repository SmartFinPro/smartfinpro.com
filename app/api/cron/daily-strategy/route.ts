import { NextRequest, NextResponse } from 'next/server';
import { generateDailyStrategy, analyzeAndPlanNextDay } from '@/lib/actions/daily-strategy';
import { sendTelegramWithKeyboard } from '@/lib/alerts/telegram';
import type { DailyStrategyDigest, PlanningQueueItem } from '@/lib/actions/daily-strategy';

/**
 * AI-Strategist Daily Digest — Cron Job
 *
 * Aggregates all SmartFinPro performance data, sends to Claude
 * for strategic analysis, then delivers an interactive Telegram
 * message with inline keyboard buttons for A/B decisions.
 *
 * NEW: Also runs the Self-Planning Loop to generate tomorrow's
 * content plan and includes it in the digest with an approve button.
 *
 * Schedule: Daily at 20:00 UTC
 *
 * Self-hosted crontab entry:
 *   0 20 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily-strategy >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.startsWith('your-')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Run strategy analysis and planning in parallel.
    // Promise.allSettled() ensures a planning failure never blocks the digest.
    const [strategySettled, planningSettled] = await Promise.allSettled([
      generateDailyStrategy(),
      analyzeAndPlanNextDay(),
    ]);

    // Strategy is mandatory — abort if it failed
    if (strategySettled.status === 'rejected') {
      const reason = strategySettled.reason instanceof Error
        ? strategySettled.reason.message : String(strategySettled.reason);
      console.error('[daily-strategy] generateDailyStrategy rejected:', reason);
      return NextResponse.json({ error: reason }, { status: 500 });
    }

    const strategyResult = strategySettled.value;
    if (!strategyResult.success || !strategyResult.digest) {
      return NextResponse.json(
        { error: strategyResult.error || 'Strategy generation failed' },
        { status: 500 },
      );
    }

    // Planning is optional — degrade gracefully if it failed
    const planningResult = planningSettled.status === 'fulfilled'
      ? planningSettled.value
      : { plans: [] };
    if (planningSettled.status === 'rejected') {
      console.warn('[daily-strategy] analyzeAndPlanNextDay failed (non-critical):',
        planningSettled.reason instanceof Error
          ? planningSettled.reason.message : planningSettled.reason,
      );
    }

    const digest = strategyResult.digest;
    const plans = planningResult.plans || [];

    // Format the Telegram message (with planning section)
    const message = formatDigestMessage(digest, plans);

    // Build inline keyboard with A/B options + approve button
    const timestamp = Date.now();
    const buttons = [
      [
        { text: `A) ${digest.optionA.label}`, callback_data: `strategy:${digest.optionA.id}` },
        { text: `B) ${digest.optionB.label}`, callback_data: `strategy:${digest.optionB.id}` },
      ],
    ];

    // Add approve button only if there are planned items
    if (plans.length > 0) {
      buttons.push([
        {
          text: `\u{2705} Alle freigeben & starten (${plans.length})`,
          callback_data: `approve:${new Date().toISOString().split('T')[0]}_${timestamp}`,
        },
      ]);
    }

    // Send via Telegram with inline keyboard
    const telegramResult = await sendTelegramWithKeyboard(message, buttons);

    return NextResponse.json({
      success: true,
      digest: {
        forecastToday: digest.forecastToday,
        forecastDelta: digest.forecastDelta,
        newAssetsIndexed: digest.newAssetsIndexed,
        hotSpotSlug: digest.hotSpotSlug,
        winnerOfDay: digest.winnerOfDay,
        weakSpot: digest.weakSpot,
        optionA: digest.optionA.label,
        optionB: digest.optionB.label,
      },
      planning: {
        count: plans.length,
        keywords: plans.map((p) => p.keyword),
      },
      telegram: telegramResult,
      generatedAt: digest.generatedAt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[daily-strategy] Cron failed:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── Message Formatter ────────────────────────────────────────

function formatDigestMessage(d: DailyStrategyDigest, plans: PlanningQueueItem[]): string {
  const trendEmoji = d.forecastTrend === 'up' ? '\u2191' : d.forecastTrend === 'down' ? '\u2193' : '\u2194';
  const trendSign = d.forecastDelta > 0 ? '+' : '';
  const date = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  const rankingLines = d.rankingMovers.slice(0, 4).map((m) => {
    const emoji = m.delta > 0 ? '\u2B06' : m.delta < 0 ? '\u2B07' : '\u2796';
    return `  ${emoji} "${m.keyword}" (${m.delta > 0 ? '+' : ''}${m.delta})`;
  });

  // Build milestone alerts section
  const milestoneLines: string[] = [];
  if (d.milestoneAlerts && d.milestoneAlerts.length > 0) {
    milestoneLines.push(``);
    milestoneLines.push(`\u{1F3A9} <b>MILESTONES:</b>`);
    d.milestoneAlerts.forEach((alert) => {
      milestoneLines.push(`  ${alert}`);
    });
  }

  // Build planning section
  const planningLines: string[] = [];
  if (plans.length > 0) {
    planningLines.push(``);
    planningLines.push(`\u{1F4DD} <b>MORGIGER CONTENT-PLAN:</b>`);
    plans.forEach((p, i) => {
      const flag = p.market === 'us' ? '\u{1F1FA}\u{1F1F8}' :
                   p.market === 'uk' ? '\u{1F1EC}\u{1F1E7}' :
                   p.market === 'ca' ? '\u{1F1E8}\u{1F1E6}' : '\u{1F1E6}\u{1F1FA}';
      planningLines.push(
        `  ${i + 1}. <b>${p.keyword}</b> (${flag} ${p.market.toUpperCase()}/${p.category})`
      );
      planningLines.push(
        `     \u{1F4B0} ~$${p.predictedCpa.toFixed(0)} CPA | \u{1F3AF} Score: ${p.opportunityScore}/100`
      );
    });
    planningLines.push(``);
    planningLines.push(`\u{1F449} <i>Klicke "Alle freigeben" um die Generierung zu starten</i>`);
  } else {
    planningLines.push(``);
    planningLines.push(`\u{1F4DD} <b>CONTENT-PLAN:</b> Keine neuen Vorschlaege (alle Keywords abgedeckt)`);
  }

  return [
    `\u{1F319} <b>SMARTFIN STRATEGY DIGEST</b>`,
    `<i>${date}</i>`,
    ``,
    `\u{1F4B0} <b>Forecast:</b> $${d.forecastToday.toFixed(0)} (${trendEmoji}${trendSign}${d.forecastDelta.toFixed(1)}%)`,
    `\u{1F680} <b>Assets:</b> ${d.newAssetsGenerated} generiert, ${d.newAssetsIndexed} indexiert`,
    `\u{1F525} <b>Hot-Spot:</b> <code>${d.hotSpotSlug || 'N/A'}</code> (${d.hotSpotClicks} Clicks, ~${d.hotSpotCtr.toFixed(1)}% CTR)`,
    `\u{26A1} <b>Boosts:</b> ${d.recentBoosts} in den letzten 24h`,
    ``,
    rankingLines.length > 0
      ? `\u{1F4CA} <b>Ranking-Bewegungen:</b>\n${rankingLines.join('\n')}`
      : `\u{1F4CA} <b>Rankings:</b> Keine signifikanten Bewegungen`,
    ...milestoneLines,
    ``,
    `\u{1F3C6} <b>Winner of the Day:</b>`,
    `<code>${d.winnerOfDay}</code>`,
    `<i>${d.winnerReason}</i>`,
    ``,
    `\u{26A0}\u{FE0F} <b>Schwachstelle:</b>`,
    `<code>${d.weakSpot}</code>`,
    `<i>${d.weakSpotReason}</i>`,
    ...planningLines,
    ``,
    `\u{1F4CA} <b>REVENUE BY SILO:</b>`,
    ...(d.revenueBySilo ? Object.entries(d.revenueBySilo).map(([silo, rev]) => {
      const flag = silo.startsWith('us') ? '\u{1F1FA}\u{1F1F8}' :
                   silo.startsWith('uk') ? '\u{1F1EC}\u{1F1E7}' :
                   silo.startsWith('ca') ? '\u{1F1E8}\u{1F1E6}' :
                   silo.startsWith('au') ? '\u{1F1E6}\u{1F1FA}' : '\u{1F30D}';
      return `  ${flag} ${silo}: $${(rev as number).toFixed(0)}`;
    }) : ['  No silo revenue data yet']),
    ``,
    `\u{1F916} <b>STRATEGISCHER RAT:</b>`,
    `"${d.strategicAdvice}"`,
    ``,
    `\u{1F3AF} <b>OPTIONEN:</b>`,
    `<b>A)</b> ${d.optionA.description}`,
    `<b>B)</b> ${d.optionB.description}`,
    ``,
    `<i>\u{1F552} ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`,
  ].join('\n');
}
