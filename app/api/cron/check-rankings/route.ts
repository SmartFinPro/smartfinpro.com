import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendTelegramAlert } from '@/lib/alerts/telegram';
import { logger, logCron } from '@/lib/logging';
import { validateBearer } from '@/lib/security/timing-safe';

/**
 * Ranking Health Check — Cron Job
 *
 * Monitors keyword rankings and flags articles that have fallen
 * outside the top 20 position. Automatically queues them for
 * content updates via the planning_queue system.
 *
 * Process:
 * 1. Load all keywords where position > 20 from keyword_rankings
 * 2. Match to source articles via slug field
 * 3. Insert/update planning_queue entries with status='needs-update'
 * 4. Send Telegram alert with count of affected articles
 * 5. Log execution in cron_logs
 *
 * Schedule: Daily at 4 AM UTC (after sync-competitors at 3 AM)
 *
 * Self-hosted crontab entry:
 *   0 4 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/check-rankings >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  // Verify CRON_SECRET (timing-safe)
  if (!validateBearer(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    logger.warn('[check-rankings] Unauthorized attempt', { ip: request.headers.get('x-forwarded-for') ?? 'unknown' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const supabase = createServiceClient();

    // 1. Fetch keywords currently ranked outside top 20
    const { data: poorRankings, error: rankingError } = await supabase
      .from('keyword_tracking')
      .select('id, keyword, market, current_position, page, clicks, ctr')
      .or('current_position.gt.20,current_position.is.null') // Include both: >20 and unranked
      .order('current_position', { ascending: true, nullsFirst: false });

    if (rankingError) {
      throw new Error(`Failed to fetch rankings: ${rankingError.message}`);
    }

    const poorKeywords = poorRankings || [];
    logger.info('[check-rankings] Keywords scanned', { outside_top20: poorKeywords.length });

    // 2. Group by slug and market to identify affected articles
    const affectedArticles = new Map<string, {
      slug: string;
      market: string;
      category: string;
      keywords: string[];
      avgPosition: number;
      totalClicks: number;
    }>();

    for (const kw of poorKeywords) {
      const slug = kw.page || '';
      if (!slug) continue;
      const pathParts = slug.replace(/^\/+/, '').split('/');
      const category = pathParts[1] || 'unknown';

      const key = `${slug}:${kw.market}`;
      const existing = affectedArticles.get(key) || {
        slug,
        market: kw.market,
        category,
        keywords: [] as string[],
        avgPosition: 0,
        totalClicks: 0,
      };

      existing.keywords.push(kw.keyword);
      existing.totalClicks += kw.clicks || 0;

      affectedArticles.set(key, existing);
    }

    logger.info('[check-rankings] Articles mapped', { affected: affectedArticles.size });

    // 3. Insert/update planning_queue entries for affected articles
    const queueUpdates: Array<{
      slug: string;
      market: string;
      category: string;
      keyword: string;
      reason: string;
      status: 'needs-update';
    }> = [];

    for (const [, article] of affectedArticles) {
      for (const keyword of article.keywords) {
        queueUpdates.push({
          slug: article.slug,
          market: article.market,
          category: article.category,
          keyword,
          reason: `Ranking check: keyword outside top 20 (${article.totalClicks} clicks)`,
          status: 'needs-update',
        });
      }
    }

    // 4. Upsert planning_queue entries
    let insertedCount = 0;
    if (queueUpdates.length > 0) {
      // Get existing entries to avoid duplicates
      const existingSlugs = queueUpdates.map((q) => q.slug);
      const { data: existing } = await supabase
        .from('planning_queue')
        .select('slug, status')
        .in('slug', [...new Set(existingSlugs)]);

      const existingMap = new Map(
        (existing || []).map((e) => [`${e.slug}:${e.status}`, true]),
      );

      for (const update of queueUpdates) {
        const key = `${update.slug}:needs-update`;
        if (existingMap.has(key)) {
          logger.debug('[check-rankings] Skipping duplicate', { slug: update.slug });
          continue;
        }

        const { error: insertError } = await supabase
          .from('planning_queue')
          .insert({
            keyword: update.keyword,
            market: update.market,
            category: update.category,
            reason: update.reason,
            status: update.status,
            digest_date: new Date().toISOString().split('T')[0],
            opportunity_score: 75, // Moderate priority for ranking recovery
          });

        if (insertError) {
          logger.warn('[check-rankings] Insert error', { keyword: update.keyword, error: insertError.message });
        } else {
          insertedCount++;
        }
      }
    }

    const duration = Date.now() - startTime;

    // 6. Send Telegram alert
    const message = formatRankingCheckAlert({
      keywordsFound: poorKeywords.length,
      articlesAffected: affectedArticles.size,
      itemsQueued: insertedCount,
      duration,
    });

    await sendTelegramAlert(message);

    logCron({
      job: 'check-rankings', status: 'success', duration_ms: duration,
      keywords: poorKeywords.length, articles: affectedArticles.size, queued: insertedCount,
    });

    return NextResponse.json({
      success: true,
      keywordsFound: poorKeywords.length,
      articlesAffected: affectedArticles.size,
      itemsQueued: insertedCount,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const duration = Date.now() - startTime;
    logCron({ job: 'check-rankings', status: 'error', duration_ms: duration, error: msg });

    // Send error alert
    await sendTelegramAlert(
      `🚨 <b>RANKING CHECK FAILED</b>\n\n${msg}\n\n<i>${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`,
    );

    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 },
    );
  }
}

// ── Message Formatter ────────────────────────────────────────

function formatRankingCheckAlert({
  keywordsFound,
  articlesAffected,
  itemsQueued,
  duration,
}: {
  keywordsFound: number;
  articlesAffected: number;
  itemsQueued: number;
  duration: number;
}): string {
  const severity =
    keywordsFound > 10 ? '🔴 HIGH' : keywordsFound > 5 ? '🟠 MEDIUM' : '🟢 LOW';

  return [
    `📊 <b>RANKING HEALTH CHECK</b>`,
    ``,
    `${severity} — ${keywordsFound} keywords outside top 20`,
    ``,
    `🎯 <b>Keywords Affected:</b> ${keywordsFound}`,
    `📄 <b>Articles to Update:</b> ${articlesAffected}`,
    `📋 <b>Items Queued:</b> ${itemsQueued}`,
    `⏱️ <b>Duration:</b> ${duration}ms`,
    ``,
    itemsQueued > 0
      ? `✅ Queued for content refresh (check planning_queue)`
      : `⚠️ No new items queued (may be duplicates or already processing)`,
    ``,
    `<i>${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`,
  ].join('\n');
}
