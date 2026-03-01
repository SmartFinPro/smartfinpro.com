'use server';

import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { getRevenueForecast } from '@/lib/actions/revenue-forecast';
import { getRecentRuns } from '@/lib/actions/genesis';
import { getRankingData } from '@/lib/actions/ranking';
import { getAlertSettings } from '@/lib/actions/spike-monitor';
import { getAllContentSlugs } from '@/lib/mdx/index';
import type { Market } from '@/lib/i18n/config';
import { createClaudeMessage } from '@/lib/claude/client';

// ════════════════════════════════════════════════════════════════
// AI-STRATEGIST — Daily Digest Generator
//
// Aggregates data from all SmartFinPro subsystems, sends to
// Anthropic Claude for strategic analysis, then formats as a
// Telegram message with interactive inline-keyboard options.
// ════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export interface StrategyOption {
  id: string;
  label: string;
  description: string;
  action: 'lower_threshold' | 'boost_slug' | 'genesis_priority' | 'custom';
  params: Record<string, string | number>;
}

export interface DailyStrategyDigest {
  forecastToday: number;
  forecastDelta: number;
  forecastTrend: 'up' | 'down' | 'neutral';
  newAssetsIndexed: number;
  newAssetsGenerated: number;
  hotSpotSlug: string;
  hotSpotCtr: number;
  hotSpotClicks: number;
  winnerOfDay: string;
  winnerReason: string;
  weakSpot: string;
  weakSpotReason: string;
  strategicAdvice: string;
  optionA: StrategyOption;
  optionB: StrategyOption;
  buildStatus: string;
  recentBoosts: number;
  rankingMovers: { keyword: string; delta: number }[];
  milestoneAlerts: string[];
  revenueBySilo?: Record<string, number>;
  generatedAt: string;
}

// ── Data Collector ───────────────────────────────────────────

async function collectDailyData() {
  const supabase = createServiceClient();

  // Run all queries in parallel
  const [
    forecastResult,
    recentRuns,
    rankingData,
    alertSettings,
    todayClicksResult,
    yesterdayClicksResult,
    recentBoostsResult,
    cooldownResult,
  ] = await Promise.all([
    // Revenue forecast (30d)
    getRevenueForecast('30d'),

    // Genesis pipeline runs (last 7 days)
    getRecentRuns(20),

    // Ranking data
    getRankingData({ days: 7 }),

    // Alert settings (thresholds)
    getAlertSettings(),

    // Today's CTA clicks
    supabase
      .from('cta_analytics')
      .select('slug, market, provider, variant', { count: 'exact' })
      .gte('clicked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

    // Yesterday's CTA clicks (for comparison)
    supabase
      .from('cta_analytics')
      .select('slug, market, provider, variant', { count: 'exact' })
      .gte('clicked_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .lt('clicked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

    // Boosts in last 24h
    supabase
      .from('content_overrides')
      .select('slug, boost_date, reason')
      .gte('boost_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

    // Auto-pilot cooldowns (triggered today)
    supabase
      .from('autopilot_cooldowns')
      .select('slug, market, spike_multiplier, clicks_at_trigger')
      .gte('last_triggered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  // Aggregate today's clicks by slug for hot-spot detection
  const todayClicks = todayClicksResult.data || [];
  const slugClickMap = new Map<string, { total: number; emerald: number; market: string }>();
  for (const click of todayClicks) {
    const existing = slugClickMap.get(click.slug) || { total: 0, emerald: 0, market: click.market };
    existing.total += 1;
    if (click.variant === 'emerald-shimmer') existing.emerald += 1;
    slugClickMap.set(click.slug, existing);
  }

  // Find hot-spot (highest emerald clicks today)
  let hotSpotSlug = '';
  let hotSpotClicks = 0;
  let hotSpotMarket = 'us';
  for (const [slug, data] of slugClickMap) {
    if (data.emerald > hotSpotClicks) {
      hotSpotClicks = data.emerald;
      hotSpotSlug = slug;
      hotSpotMarket = data.market;
    }
  }

  // Estimate CTR for hot-spot (clicks / estimated page views)
  const hotSpotTotal = slugClickMap.get(hotSpotSlug)?.total || 0;
  const estimatedPageViews = Math.max(hotSpotTotal * 10, 100); // Conservative estimate
  const hotSpotCtr = hotSpotTotal > 0 ? (hotSpotClicks / estimatedPageViews) * 100 : 0;

  // Genesis runs stats (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentGenesisRuns = recentRuns.filter(
    (r) => new Date(r.createdAt) >= sevenDaysAgo
  );
  const completedRuns = recentGenesisRuns.filter((r) => r.status === 'completed');
  const indexedRuns = completedRuns.filter((r) => r.indexedAt);

  // Milestone detection — check if any market just hit 100 clicks
  // Query clicks table to get all-time clicks per market
  const { data: allTimeClicksByMarket } = await supabase
    .from('clicks')
    .select('market', { count: 'exact' })
    .not('market', 'is', null);

  const milestoneAlerts: string[] = [];
  const clicksByMarket = new Map<string, number>();

  // Count clicks per market
  for (const click of (allTimeClicksByMarket || [])) {
    const market = (click.market as string) || 'us';
    clicksByMarket.set(market, (clicksByMarket.get(market) || 0) + 1);
  }

  // Check for 100-click milestones
  for (const [market, totalClicks] of clicksByMarket) {
    if (totalClicks === 100) {
      milestoneAlerts.push(`🎉 ${market.toUpperCase()} silo reached 100 clicks milestone!`);
    } else if (totalClicks % 500 === 0) {
      milestoneAlerts.push(`🚀 ${market.toUpperCase()} silo reached ${totalClicks} clicks!`);
    }
  }

  return {
    forecast: forecastResult.data,
    todayTotalClicks: todayClicksResult.count || todayClicks.length,
    yesterdayTotalClicks: yesterdayClicksResult.count || (yesterdayClicksResult.data || []).length,
    hotSpotSlug,
    hotSpotClicks,
    hotSpotCtr,
    hotSpotMarket,
    recentGenesisRuns,
    completedRuns,
    indexedRuns,
    rankingData,
    alertSettings,
    recentBoosts: recentBoostsResult.data || [],
    cooldowns: cooldownResult.data || [],
    slugClickMap,
    milestoneAlerts,
  };
}

// ── AI Strategy Generator ────────────────────────────────────

export async function generateDailyStrategy(): Promise<{
  success: boolean;
  digest: DailyStrategyDigest | null;
  error?: string;
}> {
  try {
    const data = await collectDailyData();

    // Build the data summary for Anthropic
    const forecast = data.forecast;
    const forecastToday = forecast?.totalExpectedRevenue || 0;
    const forecastDelta = forecast?.trendChange || 0;
    const forecastTrend = forecast?.trend || 'neutral';
    const monthlyRunRate = forecast?.monthlyRunRate || 0;

    // Click delta vs yesterday
    const clickDelta = data.todayTotalClicks - data.yesterdayTotalClicks;
    const clickDeltaPct = data.yesterdayTotalClicks > 0
      ? ((clickDelta / data.yesterdayTotalClicks) * 100).toFixed(1)
      : '0';

    // Top slugs by revenue
    const topSlugs = (forecast?.topSlugs || []).slice(0, 5);

    // Revenue by market (silo comparison)
    const revenueByMarket = forecast?.byMarket || [];
    const siloSummary = revenueByMarket
      .sort((a, b) => b.revenue - a.revenue)
      .map((m) => `${m.market.toUpperCase()}: $${m.revenue.toFixed(0)} (${m.clicks} clicks)`)
      .join(' | ');

    // Ranking movers
    const winners = data.rankingData.winners.slice(0, 3);
    const losers = data.rankingData.losers.slice(0, 3);

    // Alert thresholds
    const thresholds = data.alertSettings.map(
      (s) => `${s.market.toUpperCase()}: ${s.ctrThreshold}% CTR (${s.telegramEnabled ? 'ON' : 'OFF'})`
    );

    // Build the AI prompt with all raw data
    const dataPrompt = `
## SMARTFINPRO PERFORMANCE DATA — ${new Date().toISOString().split('T')[0]}

### REVENUE FORECAST (30d)
- Total Expected Revenue: $${forecastToday.toFixed(2)}
- Trend: ${forecastTrend} (${forecastDelta > 0 ? '+' : ''}${forecastDelta.toFixed(1)}% vs previous period)
- Monthly Run Rate: $${monthlyRunRate.toFixed(2)}
- Top Revenue Slugs:
${topSlugs.map((s) => `  * ${s.slug} (${s.market.toUpperCase()}) — $${s.expectedRevenue.toFixed(2)} from ${s.emeraldClicks} emerald clicks, CPA $${s.cpaValue}`).join('\n') || '  (No data)'}

### REVENUE BY SILO (Market Comparison)
${siloSummary}

### CLICKS TODAY
- Total CTA Clicks Today: ${data.todayTotalClicks}
- Yesterday: ${data.yesterdayTotalClicks} (Delta: ${clickDelta > 0 ? '+' : ''}${clickDelta}, ${clickDeltaPct}%)
- Hot-Spot: ${data.hotSpotSlug || 'None'} — ${data.hotSpotClicks} emerald clicks, ~${data.hotSpotCtr.toFixed(1)}% CTR

### AUTO-PILOT ACTIVITY (24h)
- Boosts Triggered: ${data.recentBoosts.length}
${data.recentBoosts.map((b) => `  * ${b.slug} — ${b.reason || 'manual'}`).join('\n') || '  (None)'}
- Auto-Pilot Cooldowns Active: ${data.cooldowns.length}
${data.cooldowns.map((c) => `  * ${c.slug} (${c.market}) — ${c.spike_multiplier.toFixed(1)}x spike, ${c.clicks_at_trigger} clicks`).join('\n') || '  (None)'}

### GENESIS HUB (7d)
- Runs Created: ${data.recentGenesisRuns.length}
- Completed: ${data.completedRuns.length}
- Indexed: ${data.indexedRuns.length}
${data.completedRuns.map((r) => `  * "${r.keyword}" (${r.market}/${r.category}) — ${r.wordCount || 0} words, ${r.indexedAt ? 'INDEXED' : 'NOT indexed'}`).join('\n') || '  (No runs)'}

### RANKING (7d)
- Total Tracked Keywords: ${data.rankingData.stats.totalKeywords}
- Average Position: ${data.rankingData.stats.avgPosition.toFixed(1)}
- Top 3: ${data.rankingData.stats.top3Keywords} | Top 10: ${data.rankingData.stats.top10Keywords}
- Winners (improved):
${winners.map((w) => `  * "${w.keyword}" — Position ${w.position} (${w.positionDelta > 0 ? '+' : ''}${w.positionDelta}), ${w.clicks} clicks`).join('\n') || '  (None)'}
- Losers (dropped):
${losers.map((l) => `  * "${l.keyword}" — Position ${l.position} (${l.positionDelta > 0 ? '+' : ''}${l.positionDelta}), ${l.clicks} clicks`).join('\n') || '  (None)'}

### CTR THRESHOLDS
${thresholds.join('\n') || '(Not configured)'}

### AFFILIATE RATES
- Average CPA: $${(forecast?.avgCpa || 0).toFixed(2)}
- Top Providers: ${(forecast?.byProvider || []).slice(0, 3).map((p) => `${p.provider} ($${p.cpa})`).join(', ') || 'N/A'}
`;

    // Call Anthropic Claude for strategic analysis
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    let aiAnalysis: {
      winnerOfDay: string;
      winnerReason: string;
      weakSpot: string;
      weakSpotReason: string;
      strategicAdvice: string;
      optionA: StrategyOption;
      optionB: StrategyOption;
    };

    if (anthropicKey) {
      const response = await createClaudeMessage({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        system: `You are the AI Strategy Officer for SmartFinPro, a finance affiliate SEO platform.
Analyze the performance data and respond in valid JSON ONLY (no markdown, no code blocks).

Identify:
1. "Winner of the Day" — the best performing slug, keyword, or market
2. A critical weakness — a slug with high traffic but low CTR, or a dropping keyword
3. Strategic advice — 1-2 sentences of actionable insight
4. Two concrete action options (A and B) — each must specify an action type

Action types available:
- "lower_threshold" — Lower a market's CTR threshold (params: market, new_threshold)
- "boost_slug" — Trigger freshness boost on a specific slug (params: slug, market)
- "genesis_priority" — Prioritize Genesis content creation for a niche (params: keyword, market, category)
- "custom" — Custom advice (params: description)

JSON format:
{
  "winnerOfDay": "slug or keyword name",
  "winnerReason": "why it won",
  "weakSpot": "slug or area",
  "weakSpotReason": "why it's weak",
  "strategicAdvice": "1-2 sentences",
  "optionA": {
    "id": "opt_a_<timestamp>",
    "label": "short button label (max 30 chars)",
    "description": "what this does",
    "action": "lower_threshold|boost_slug|genesis_priority|custom",
    "params": {}
  },
  "optionB": {
    "id": "opt_b_<timestamp>",
    "label": "short button label (max 30 chars)",
    "description": "what this does",
    "action": "lower_threshold|boost_slug|genesis_priority|custom",
    "params": {}
  }
}`,
        messages: [{ role: 'user', content: dataPrompt }],
      }, { apiKey: anthropicKey, operation: 'daily_strategy_digest' });

      const aiText = response.content[0].type === 'text' ? response.content[0].text : '';

      try {
        aiAnalysis = JSON.parse(aiText);
      } catch {
        // Try to extract JSON from potential code blocks
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI response was not valid JSON');
        }
      }
    } else {
      // Fallback without AI
      const topSlug = topSlugs[0];
      const loser = losers[0];

      aiAnalysis = {
        winnerOfDay: topSlug?.slug || data.hotSpotSlug || 'N/A',
        winnerReason: topSlug
          ? `Highest revenue slug with $${topSlug.expectedRevenue.toFixed(0)} from ${topSlug.emeraldClicks} clicks`
          : 'Most CTA clicks today',
        weakSpot: loser?.keyword || 'No weak spots detected',
        weakSpotReason: loser
          ? `Dropped ${Math.abs(loser.positionDelta)} positions with ${loser.clicks} clicks`
          : 'All metrics stable',
        strategicAdvice: 'Review top-performing slugs and consider creating Genesis content for gaps in underperforming markets.',
        optionA: {
          id: `opt_a_${Date.now()}`,
          label: 'Boost Top Slug',
          description: `Trigger freshness boost on ${topSlug?.slug || 'top performer'}`,
          action: 'boost_slug',
          params: { slug: topSlug?.slug || '', market: topSlug?.market || 'us' },
        },
        optionB: {
          id: `opt_b_${Date.now()}`,
          label: 'Create Genesis Content',
          description: 'Prioritize new content for underperforming niche',
          action: 'genesis_priority',
          params: { keyword: loser?.keyword || 'best trading platforms', market: 'us', category: 'trading' },
        },
      };
    }

    // Compose the digest
    const digest: DailyStrategyDigest = {
      forecastToday,
      forecastDelta,
      forecastTrend,
      newAssetsIndexed: data.indexedRuns.length,
      newAssetsGenerated: data.completedRuns.length,
      hotSpotSlug: data.hotSpotSlug,
      hotSpotCtr: data.hotSpotCtr,
      hotSpotClicks: data.hotSpotClicks,
      winnerOfDay: aiAnalysis.winnerOfDay,
      winnerReason: aiAnalysis.winnerReason,
      weakSpot: aiAnalysis.weakSpot,
      weakSpotReason: aiAnalysis.weakSpotReason,
      strategicAdvice: aiAnalysis.strategicAdvice,
      optionA: aiAnalysis.optionA,
      optionB: aiAnalysis.optionB,
      buildStatus: `${data.recentBoosts.length} boosts, ${data.indexedRuns.length} indexed`,
      recentBoosts: data.recentBoosts.length,
      rankingMovers: [
        ...winners.map((w) => ({ keyword: w.keyword, delta: w.positionDelta })),
        ...losers.map((l) => ({ keyword: l.keyword, delta: l.positionDelta })),
      ],
      milestoneAlerts: data.milestoneAlerts || [],
      generatedAt: new Date().toISOString(),
    };

    // Store in DB for audit trail
    const supabase = createServiceClient();
    await supabase
      .from('genesis_pipeline_runs')
      .insert({
        keyword: `[STRATEGY-DIGEST] ${new Date().toISOString().split('T')[0]}`,
        market: 'us' as Market,
        category: 'strategy-digest',
        status: 'completed',
        research_data: digest as unknown as Record<string, unknown>,
        completed_at: new Date().toISOString(),
      })
      .then(() => {});

    return { success: true, digest };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[daily-strategy] generateDailyStrategy failed:', msg);
    return { success: false, digest: null, error: msg };
  }
}

// ── Execute Strategy Option ──────────────────────────────────

export async function executeStrategyOption(
  option: StrategyOption,
): Promise<{ success: boolean; message: string }> {
  try {
    switch (option.action) {
      case 'lower_threshold': {
        const { updateCtrThreshold } = await import('@/lib/actions/spike-monitor');
        const market = (option.params.market as string) || 'us';
        const newThreshold = Number(option.params.new_threshold) || 3.0;
        const result = await updateCtrThreshold(market as Market, newThreshold);
        return {
          success: result.success,
          message: result.success
            ? `CTR-Threshold for ${market.toUpperCase()} lowered to ${newThreshold}%`
            : `Failed: ${result.error || 'Unknown error'}`,
        };
      }

      case 'boost_slug': {
        const { boostAndDeploy } = await import('@/lib/actions/content-overrides');
        const slug = (option.params.slug as string) || '';
        const result = await boostAndDeploy(slug, `Strategy Digest: ${option.label}`);
        return {
          success: result.boostSuccess,
          message: result.boostSuccess
            ? `Freshness Boost triggered for ${slug}`
            : `Boost failed for ${slug}`,
        };
      }

      case 'genesis_priority': {
        // Just return a recommendation — Genesis requires human input
        const keyword = (option.params.keyword as string) || '';
        const market = (option.params.market as string) || 'us';
        const category = (option.params.category as string) || 'trading';
        return {
          success: true,
          message: `Genesis priority noted: "${keyword}" in ${market.toUpperCase()}/${category}. Open the Genesis Hub to start.`,
        };
      }

      case 'custom':
      default:
        return {
          success: true,
          message: `Custom action noted: ${option.params.description || option.description}`,
        };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, message: `Action failed: ${msg}` };
  }
}

// ════════════════════════════════════════════════════════════════
// SELF-PLANNING LOOP
//
// analyzeAndPlanNextDay()  — scans top categories, finds keyword
//                            gaps via Serper, filters duplicates,
//                            saves top 3 to planning_queue
//
// approvePlanAndExecute()  — triggers generateLongFormAsset for
//                            all approved tasks sequentially
//
// getPendingPlans()        — returns today's planning queue
// ════════════════════════════════════════════════════════════════

export interface PlanningQueueItem {
  id: string;
  keyword: string;
  market: Market;
  category: string;
  predictedCpa: number;
  reason: string;
  opportunityScore: number;
  sourceSlug: string | null;
  status: 'planned' | 'approved' | 'executing' | 'completed' | 'failed' | 'skipped';
  genesisRunId: string | null;
  digestDate: string;
  createdAt: string;
  approvedAt: string | null;
  completedAt: string | null;
}

/**
 * Analyze today's performance and plan tomorrow's content.
 *
 * 1. Scans cta_analytics for top-performing categories (last 24h)
 * 2. Uses Serper to find related keywords with search demand
 * 3. Filters out existing slugs (MDX files + genesis_pipeline_runs + planning_queue)
 * 4. Scores by CPA × opportunity and saves top 3 to planning_queue
 */
export async function analyzeAndPlanNextDay(): Promise<{
  success: boolean;
  plans: PlanningQueueItem[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    // 1. Get top-performing categories from cta_analytics (last 24h)
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: clickData } = await supabase
      .from('cta_analytics')
      .select('slug, market, provider')
      .gte('clicked_at', since24h);

    // Aggregate clicks by category (extract from slug pattern: /category/slug)
    const categoryClicks = new Map<string, { count: number; market: Market; topSlug: string; topCount: number }>();
    for (const click of (clickData || [])) {
      // Slug format: /market/category/slug or /category/slug (US)
      const parts = (click.slug || '').split('/').filter(Boolean);
      let category: string;
      const market: Market = (click.market as Market) || 'us';

      if (parts.length >= 2) {
        // Could be /uk/trading/slug or /trading/slug
        const possibleMarkets = ['us', 'uk', 'ca', 'au'];
        if (possibleMarkets.includes(parts[0])) {
          category = parts[1];
        } else {
          category = parts[0];
        }
      } else {
        continue;
      }

      const key = `${category}:${market}`;
      const existing = categoryClicks.get(key) || { count: 0, market, topSlug: click.slug, topCount: 0 };
      existing.count += 1;
      // Track the slug that drives the most clicks
      if (existing.count === 1 || Math.random() < 0.3) {
        existing.topSlug = click.slug;
      }
      categoryClicks.set(key, existing);
    }

    // Sort categories by click count, take top 3
    const topCategories = Array.from(categoryClicks.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);

    if (topCategories.length === 0) {
      // Fallback to default categories if no click data
      topCategories.push(
        ['trading:us', { count: 0, market: 'us' as Market, topSlug: '', topCount: 0 }],
        ['forex:us', { count: 0, market: 'us' as Market, topSlug: '', topCount: 0 }],
        ['ai-tools:us', { count: 0, market: 'us' as Market, topSlug: '', topCount: 0 }],
      );
    }

    // 2. Collect existing slugs for duplicate detection
    const [existingSlugs, existingRuns, existingPlans] = await Promise.all([
      // Filesystem MDX slugs
      getAllContentSlugs(),
      // DB genesis runs (completed or in progress)
      supabase
        .from('genesis_pipeline_runs')
        .select('slug, keyword, market')
        .in('status', ['completed', 'generating', 'media', 'publishing', 'research']),
      // Existing planning queue (not skipped/failed)
      supabase
        .from('planning_queue')
        .select('keyword, market')
        .in('status', ['planned', 'approved', 'executing', 'completed']),
    ]);

    // Build a Set of normalized slugs for fast lookup
    const existingSlugSet = new Set<string>();

    // Add MDX file slugs
    for (const s of existingSlugs) {
      existingSlugSet.add(`${s.market}:${s.slug.toLowerCase()}`);
    }

    // Add genesis pipeline slugs
    for (const r of (existingRuns.data || [])) {
      if (r.slug) {
        const slugBase = r.slug.split('/').pop()?.toLowerCase() || '';
        existingSlugSet.add(`${r.market}:${slugBase}`);
      }
      if (r.keyword) {
        existingSlugSet.add(`${r.market}:${normalizeToSlug(r.keyword)}`);
      }
    }

    // Add planning queue keywords
    for (const p of (existingPlans.data || [])) {
      existingSlugSet.add(`${p.market}:${normalizeToSlug(p.keyword)}`);
    }

    // 3. For each top category, find related keywords via Serper
    const apiKey = process.env.SERPER_API_KEY;
    const GL_MAP: Record<string, string> = { us: 'us', uk: 'uk', ca: 'ca', au: 'au' };

    const candidateKeywords: Array<{
      keyword: string;
      market: Market;
      category: string;
      sourceSlug: string;
      searchVolume: number;
    }> = [];

    if (apiKey) {
      for (const [catKey, catData] of topCategories) {
        const [category, market] = catKey.split(':');
        // Build a broad query to find content gaps
        const searchQuery = `best ${category.replace(/-/g, ' ')} ${new Date().getFullYear()}`;

        try {
          const res = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: searchQuery,
              gl: GL_MAP[market] || 'us',
              num: 10,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const relatedSearches = (data.relatedSearches || []) as Array<{ query: string }>;
            const peopleAlsoAsk = (data.peopleAlsoAsk || []) as Array<{ question: string }>;

            // Collect keyword candidates from related searches
            for (const r of relatedSearches.slice(0, 5)) {
              candidateKeywords.push({
                keyword: r.query,
                market: market as Market,
                category,
                sourceSlug: catData.topSlug,
                searchVolume: catData.count * 10, // Heuristic
              });
            }

            // Also consider people-also-ask as keyword targets
            for (const q of peopleAlsoAsk.slice(0, 3)) {
              candidateKeywords.push({
                keyword: q.question,
                market: market as Market,
                category,
                sourceSlug: catData.topSlug,
                searchVolume: catData.count * 5,
              });
            }
          }
        } catch {
          // Serper API failed, skip this category
        }

        await new Promise((r) => setTimeout(r, 200)); // Rate limit
      }
    }

    // 4. Filter duplicates and score
    const { data: rates } = await supabase
      .from('affiliate_rates')
      .select('provider_name, cpa_value, avg_conversion_rate, market')
      .eq('active', true);

    const filteredCandidates = candidateKeywords
      .filter((c) => {
        const normalized = normalizeToSlug(c.keyword);
        return !existingSlugSet.has(`${c.market}:${normalized}`);
      })
      .map((c) => {
        // Calculate predicted CPA revenue
        const marketRates = (rates || []).filter(
          (r) => r.market === c.market || r.market === null
        );
        const topRate = marketRates.sort((a, b) => b.cpa_value - a.cpa_value)[0];
        const cpa = topRate?.cpa_value || 0;
        const convRate = topRate?.avg_conversion_rate || 0.03;
        const predictedCpa = Math.round(cpa * convRate * c.searchVolume * 100) / 100;

        // Opportunity score (0-100)
        const lengthScore = c.keyword.split(' ').length >= 3 ? 20 : 0; // Long-tail bonus
        const volumeScore = Math.min(50, c.searchVolume);
        const cpaScore = Math.min(30, cpa / 5);
        const opportunityScore = Math.round(lengthScore + volumeScore + cpaScore);

        return {
          ...c,
          predictedCpa,
          opportunityScore,
          topProviderName: topRate?.provider_name || 'Unknown',
        };
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 3); // Top 3 suggestions

    // 5. Save to planning_queue
    const plans: PlanningQueueItem[] = [];

    for (const candidate of filteredCandidates) {
      const reason = `Top-performing category "${candidate.category}" with ${candidate.searchVolume} est. monthly traffic. ` +
        `Predicted CPA: $${candidate.predictedCpa.toFixed(2)} via ${candidate.topProviderName}. ` +
        `Source: ${candidate.sourceSlug || 'category analysis'}.`;

      const { data: inserted, error } = await supabase
        .from('planning_queue')
        .insert({
          keyword: candidate.keyword,
          market: candidate.market,
          category: candidate.category,
          predicted_cpa: candidate.predictedCpa,
          reason,
          opportunity_score: candidate.opportunityScore,
          source_slug: candidate.sourceSlug || null,
          status: 'planned',
          digest_date: new Date().toISOString().split('T')[0],
        })
        .select('*')
        .single();

      if (!error && inserted) {
        plans.push(mapPlanRow(inserted));
      }
    }

    console.log(`[planning] analyzeAndPlanNextDay: ${plans.length} plans created`);
    return { success: true, plans };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[planning] analyzeAndPlanNextDay failed:', msg);
    return { success: false, plans: [], error: msg };
  }
}

/**
 * Get pending plans for a given date (default: today).
 */
export async function getPendingPlans(
  date?: string,
): Promise<PlanningQueueItem[]> {
  const supabase = createServiceClient();
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Load plans for today + any planned items from previous days (e.g. affiliate opportunities)
  const { data } = await supabase
    .from('planning_queue')
    .select('*')
    .in('status', ['planned', 'approved', 'executing'])
    .or(`digest_date.eq.${targetDate},status.eq.planned`)
    .order('opportunity_score', { ascending: false });

  // Deduplicate (the OR may return duplicates for today's planned items)
  const seen = new Set<string>();
  const unique = (data || []).filter((row) => {
    const id = row.id as string;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return unique.map(mapPlanRow);
}

/**
 * Approve all planned items for today and trigger sequential execution.
 *
 * For each planned item:
 * 1. Mark as "approved"
 * 2. Call magicFind to create a genesis pipeline run
 * 3. Call generateLongFormAsset to create the content
 * 4. Mark as "completed" or "failed"
 *
 * Returns a summary of execution results.
 */
export async function approvePlanAndExecute(
  date?: string,
): Promise<{
  success: boolean;
  results: Array<{ keyword: string; status: string; error?: string }>;
  error?: string;
}> {
  const supabase = createServiceClient();
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    // Get all planned items for this date
    const { data: plans } = await supabase
      .from('planning_queue')
      .select('*')
      .eq('digest_date', targetDate)
      .eq('status', 'planned')
      .order('opportunity_score', { ascending: false });

    if (!plans || plans.length === 0) {
      return { success: true, results: [], error: 'No planned items to execute' };
    }

    // Mark all as approved
    const planIds = plans.map((p) => p.id);
    await supabase
      .from('planning_queue')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .in('id', planIds);

    // Import genesis actions for execution
    const { magicFind, generateLongFormAsset } = await import('@/lib/actions/genesis');

    const results: Array<{ keyword: string; status: string; error?: string }> = [];

    // Execute sequentially (avoid overwhelming the API)
    for (const plan of plans) {
      const keyword = plan.keyword;
      const market = plan.market as Market;
      const category = plan.category;

      try {
        // Mark as executing
        await supabase
          .from('planning_queue')
          .update({ status: 'executing' })
          .eq('id', plan.id);

        // Step 1: Magic Find (research)
        const research = await magicFind(keyword, market, category);

        if (!research.success || !research.data) {
          await supabase
            .from('planning_queue')
            .update({ status: 'failed' })
            .eq('id', plan.id);
          results.push({ keyword, status: 'failed', error: research.error || 'Research failed' });
          continue;
        }

        const runId = research.data.runId;

        // Link genesis run to planning queue
        await supabase
          .from('planning_queue')
          .update({ genesis_run_id: runId })
          .eq('id', plan.id);

        // Step 2: Generate long-form asset
        const generation = await generateLongFormAsset(runId, keyword, market, category);

        if (!generation.success) {
          await supabase
            .from('planning_queue')
            .update({ status: 'failed' })
            .eq('id', plan.id);
          results.push({ keyword, status: 'failed', error: generation.error || 'Generation failed' });
          continue;
        }

        // Mark as completed
        await supabase
          .from('planning_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', plan.id);

        results.push({
          keyword,
          status: 'completed',
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        await supabase
          .from('planning_queue')
          .update({ status: 'failed' })
          .eq('id', plan.id);
        results.push({ keyword, status: 'failed', error: msg });
      }

      // Brief pause between executions
      await new Promise((r) => setTimeout(r, 1000));
    }

    console.log(`[planning] approvePlanAndExecute: ${results.filter((r) => r.status === 'completed').length}/${results.length} succeeded`);
    return { success: true, results };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[planning] approvePlanAndExecute failed:', msg);
    return { success: false, results: [], error: msg };
  }
}

// ── Single-Item Approve & Execute (for Swipe UI) ─────────────

/**
 * Approve a single planning queue item and execute the full pipeline.
 * Used by the Executive Approval swipe-card interface.
 */
export async function approveAndExecuteSingle(
  planId: string,
): Promise<{
  success: boolean;
  keyword: string;
  genesisRunId?: string;
  slug?: string;
  wordCount?: number;
  error?: string;
}> {
  const supabase = createServiceClient();

  try {
    // Load the plan
    const { data: plan } = await supabase
      .from('planning_queue')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      return { success: false, keyword: '', error: 'Plan not found' };
    }

    if (plan.status !== 'planned') {
      return { success: false, keyword: plan.keyword, error: `Plan already ${plan.status}` };
    }

    // Mark as approved → executing
    await supabase
      .from('planning_queue')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', planId);

    await supabase
      .from('planning_queue')
      .update({ status: 'executing' })
      .eq('id', planId);

    const keyword = plan.keyword;
    const market = plan.market as Market;
    const category = plan.category;

    // Import genesis actions
    const { magicFind, generateLongFormAsset } = await import('@/lib/actions/genesis');

    // Step 1: Research
    const research = await magicFind(keyword, market, category);

    if (!research.success || !research.data) {
      await supabase
        .from('planning_queue')
        .update({ status: 'failed' })
        .eq('id', planId);
      return { success: false, keyword, error: research.error || 'Research failed' };
    }

    const runId = research.data.runId;

    // Link genesis run
    await supabase
      .from('planning_queue')
      .update({ genesis_run_id: runId })
      .eq('id', planId);

    // Step 2: Generate long-form content
    const generation = await generateLongFormAsset(runId, keyword, market, category);

    if (!generation.success) {
      await supabase
        .from('planning_queue')
        .update({ status: 'failed' })
        .eq('id', planId);
      return { success: false, keyword, genesisRunId: runId, error: generation.error || 'Generation failed' };
    }

    // Mark as completed
    await supabase
      .from('planning_queue')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', planId);

    return {
      success: true,
      keyword,
      genesisRunId: runId,
      slug: generation.slug,
      wordCount: generation.wordCount,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[planning] approveAndExecuteSingle failed:', msg);
    return { success: false, keyword: '', error: msg };
  }
}

// ── Reject / Skip a Plan Item ─────────────────────────────────

/**
 * Reject a planning queue item. Marks it as 'skipped' with a reason.
 * Future planning runs can use rejection data to avoid similar keywords.
 */
export async function rejectPlanItem(
  planId: string,
  rejectionReason?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  try {
    const { error } = await supabase
      .from('planning_queue')
      .update({
        status: 'skipped',
        reason: rejectionReason
          ? `[REJECTED] ${rejectionReason}`
          : '[REJECTED] Not interested',
        completed_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .eq('status', 'planned'); // Only reject planned items

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

// ── Get Planning Queue Count (for sidebar badge) ──────────────

/**
 * Returns the count of pending 'planned' items.
 * Used by the sidebar to show a notification badge.
 */
export async function getPlanningQueueCount(): Promise<number> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from('planning_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'planned');

  return count || 0;
}

// ── Helper: Normalize keyword to slug ─────────────────────────

function normalizeToSlug(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

// ── Helper: Map DB row to PlanningQueueItem ───────────────────

function mapPlanRow(row: Record<string, unknown>): PlanningQueueItem {
  return {
    id: row.id as string,
    keyword: row.keyword as string,
    market: row.market as Market,
    category: row.category as string,
    predictedCpa: Number(row.predicted_cpa) || 0,
    reason: (row.reason as string) || '',
    opportunityScore: Number(row.opportunity_score) || 0,
    sourceSlug: (row.source_slug as string) || null,
    status: row.status as PlanningQueueItem['status'],
    genesisRunId: (row.genesis_run_id as string) || null,
    digestDate: (row.digest_date as string) || '',
    createdAt: row.created_at as string,
    approvedAt: (row.approved_at as string) || null,
    completedAt: (row.completed_at as string) || null,
  };
}

// ════════════════════════════════════════════════════════════════
// AFFILIATE OPPORTUNITY ANALYZER
//
// Scans affiliate_rates for high-CPA partners that lack
// dedicated review pages or content assets. Inserts top
// opportunities into planning_queue for Executive Approval.
// ════════════════════════════════════════════════════════════════

const CATEGORY_FALLBACK: Record<string, string> = {
  etoro: 'trading',
  'interactive brokers': 'trading',
  'plus500': 'trading',
  'schwab intelligent': 'trading',
  betterment: 'personal-finance',
  wealthfront: 'personal-finance',
  wealthsimple: 'personal-finance',
  acorns: 'personal-finance',
  'ally invest': 'personal-finance',
  'fidelity go': 'personal-finance',
  'vanguard digital': 'personal-finance',
  stash: 'personal-finance',
  'sofi robo': 'personal-finance',
  robinhood: 'personal-finance',
  mercury: 'business-banking',
  relay: 'business-banking',
  tide: 'business-banking',
  nutmeg: 'personal-finance',
  nordvpn: 'cybersecurity',
  expressvpn: 'cybersecurity',
  surfshark: 'cybersecurity',
  'copy.ai': 'ai-tools',
  'jasper ai': 'ai-tools',
  'systeme.io': 'ai-tools',
};

/**
 * Analyze affiliate_rates for high-CPA partners without dedicated content.
 *
 * 1. Loads all active affiliate_rates (sorted by CPA desc)
 * 2. Cross-references against existing MDX files, genesis runs, and planning_queue
 * 3. Identifies "Missing Assets" — high-CPA partners with no dedicated page
 * 4. Validates search demand via Serper API
 * 5. Scores and inserts top 3-5 into planning_queue
 */
export async function analyzeAffiliateOpportunities(
  targetMarket?: Market,
): Promise<{ success: boolean; plans: PlanningQueueItem[]; error?: string }> {
  try {
    const supabase = createServiceClient();

    // 1. Load all active affiliate rates
    let ratesQuery = supabase
      .from('affiliate_rates')
      .select('provider_name, market, cpa_value, currency, avg_conversion_rate, commission_type')
      .eq('active', true)
      .gte('cpa_value', 50) // Only high-CPA partners
      .order('cpa_value', { ascending: false });

    if (targetMarket) {
      ratesQuery = ratesQuery.or(`market.eq.${targetMarket},market.is.null`);
    }

    const { data: rates } = await ratesQuery;
    if (!rates || rates.length === 0) {
      return { success: true, plans: [], error: 'No high-CPA partners found' };
    }

    // 2. Collect existing coverage (slugs, keywords, plans)
    const [existingSlugs, existingRuns, existingPlans] = await Promise.all([
      getAllContentSlugs(),
      supabase
        .from('genesis_pipeline_runs')
        .select('slug, keyword, market')
        .in('status', ['completed', 'generating', 'media', 'publishing', 'research']),
      supabase
        .from('planning_queue')
        .select('keyword, market')
        .in('status', ['planned', 'approved', 'executing', 'completed']),
    ]);

    // 3. Build a set of covered provider names (fuzzy matching)
    const coveredProviders = new Set<string>();

    // Check MDX file slugs
    for (const s of existingSlugs) {
      const slugLower = s.slug.toLowerCase();
      for (const rate of rates) {
        const providerNorm = rate.provider_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (slugLower.includes(providerNorm) || providerNorm.includes(slugLower.replace(/-/g, ''))) {
          coveredProviders.add(rate.provider_name.toLowerCase());
        }
      }
    }

    // Check genesis pipeline keywords
    for (const run of (existingRuns.data || [])) {
      if (run.keyword) {
        const keywordLower = run.keyword.toLowerCase();
        for (const rate of rates) {
          const providerNorm = rate.provider_name.toLowerCase();
          if (keywordLower.includes(providerNorm) || providerNorm.includes(keywordLower)) {
            coveredProviders.add(providerNorm);
          }
        }
      }
    }

    // Check existing planning queue
    for (const plan of (existingPlans.data || [])) {
      if (plan.keyword) {
        const keywordLower = plan.keyword.toLowerCase();
        for (const rate of rates) {
          const providerNorm = rate.provider_name.toLowerCase();
          if (keywordLower.includes(providerNorm)) {
            coveredProviders.add(providerNorm);
          }
        }
      }
    }

    // 4. Identify missing assets
    const missingAssets = rates.filter(
      (r) => !coveredProviders.has(r.provider_name.toLowerCase()),
    );

    if (missingAssets.length === 0) {
      return { success: true, plans: [], error: 'All high-CPA partners are covered' };
    }

    // 5. Resolve category for each missing asset
    const { data: linkCategories } = await supabase
      .from('affiliate_links')
      .select('partner_name, category')
      .in(
        'partner_name',
        missingAssets.map((a) => a.provider_name),
      );

    const categoryMap = new Map<string, string>();
    for (const lc of (linkCategories || [])) {
      if (lc.category) {
        categoryMap.set(lc.partner_name.toLowerCase(), lc.category);
      }
    }

    // 6. Serper validation for top 5 candidates
    const apiKey = process.env.SERPER_API_KEY;
    const GL_MAP: Record<string, string> = { us: 'us', uk: 'uk', ca: 'ca', au: 'au' };

    interface ScoredAsset {
      providerName: string;
      market: string | null;
      cpaValue: number;
      currency: string;
      category: string;
      searchDemand: number;
      opportunityScore: number;
    }

    const scoredAssets: ScoredAsset[] = [];

    for (const asset of missingAssets.slice(0, 5)) {
      let searchDemand = 0;
      const assetMarket = asset.market || targetMarket || 'us';

      if (apiKey) {
        try {
          const res = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: `best ${asset.provider_name} review ${new Date().getFullYear()}`,
              gl: GL_MAP[assetMarket] || 'us',
              num: 5,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            searchDemand =
              (data.relatedSearches?.length || 0) +
              (data.peopleAlsoAsk?.length || 0);
          }

          await new Promise((r) => setTimeout(r, 200)); // Rate limit
        } catch {
          // Serper failed — use 0 search demand
        }
      } else {
        // No API key — assign default demand based on CPA
        searchDemand = Math.min(8, Math.round(asset.cpa_value / 20));
      }

      // Scoring
      const cpaScore = Math.min(40, asset.cpa_value / 5);
      const volumeScore = Math.min(40, searchDemand * 5);
      const freshnessBonus = 20; // New partner without content
      const opportunityScore = Math.round(cpaScore + volumeScore + freshnessBonus);

      // Category resolution
      const category =
        categoryMap.get(asset.provider_name.toLowerCase()) ||
        CATEGORY_FALLBACK[asset.provider_name.toLowerCase()] ||
        'personal-finance';

      scoredAssets.push({
        providerName: asset.provider_name,
        market: asset.market,
        cpaValue: asset.cpa_value,
        currency: asset.currency,
        category,
        searchDemand,
        opportunityScore: Math.min(100, opportunityScore),
      });
    }

    // 7. Sort by score and insert top 3-5 into planning_queue
    scoredAssets.sort((a, b) => b.opportunityScore - a.opportunityScore);
    const topAssets = scoredAssets.slice(0, 5);
    const plans: PlanningQueueItem[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const asset of topAssets) {
      const keyword = `Best ${asset.providerName} Review ${new Date().getFullYear()}`;
      const market = (asset.market || targetMarket || 'us') as Market;

      const reason =
        `🚀 High-Profit Opportunity: ${asset.providerName} hat einen CPA von $${asset.cpaValue.toFixed(0)} ` +
        `(${asset.currency}). Kein dediziertes Review-Asset vorhanden. ` +
        `Suchdemand: ${asset.searchDemand} verwandte Suchanfragen gefunden. ` +
        `Kategorie: ${asset.category}.`;

      const { data: inserted, error } = await supabase
        .from('planning_queue')
        .insert({
          keyword,
          market,
          category: asset.category,
          predicted_cpa: asset.cpaValue,
          reason,
          opportunity_score: asset.opportunityScore,
          source_slug: null, // Affiliate-driven, not click-driven
          status: 'planned',
          digest_date: today,
        })
        .select('*')
        .single();

      if (!error && inserted) {
        plans.push(mapPlanRow(inserted));
      } else if (error) {
        // Likely duplicate — skip silently
        console.warn(`[affiliate-opportunities] Skipped "${keyword}": ${error.message}`);
      }
    }

    console.log(`[affiliate-opportunities] Found ${missingAssets.length} gaps, created ${plans.length} opportunities`);
    return { success: true, plans };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[affiliate-opportunities] analyzeAffiliateOpportunities failed:', msg);
    return { success: false, plans: [], error: msg };
  }
}
