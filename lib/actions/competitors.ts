'use server';

import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logging';

import { createClient } from '@/lib/supabase/server';
import {
  COMPETITOR_KEYWORDS,
  AUTHORITY_DOMAINS,
  calculateCPS,
  extractDomain,
  type SerperSignals,
  type CompetitorKeyword,
} from '@/lib/seo/competitor-keywords';
import { boostAndDeploy } from '@/lib/actions/content-overrides';
import type { Market, Category } from '@/lib/i18n/config';

// ── Types ────────────────────────────────────────────────────

export interface OrganicResult {
  position: number;
  title: string;
  link: string;
  domain: string;
  snippet: string;
  isOwnSite: boolean;
  isAuthority: boolean;
}

export interface SerpSnapshot {
  keyword: string;
  market: Market;
  category: string;
  cpsScore: number;
  ownPosition: number | null;
  ownUrl: string | null;
  organicResults: OrganicResult[];
  adCount: number;
  paaCount: number;
  authorityCount: number;
  hasKnowledgeGraph: boolean;
  scannedAt: string;
}

export interface CompetitorAlert {
  id: string;
  keyword: string;
  market: string;
  category: string;
  alertType: 'competitor_drop' | 'new_gap' | 'authority_exit';
  severity: 'info' | 'warning' | 'critical';
  competitorDomain: string | null;
  previousPosition: number | null;
  currentPosition: number | null;
  cpsScore: number | null;
  ownPosition: number | null;
  dismissed: boolean;
  boostTriggered: boolean;
  slugToBoost: string | null;
  detectedAt: string;
}

export interface HeatmapCell {
  market: Market;
  category: string;
  avgCps: number;
  keywordCount: number;
  gapCount: number;
}

export interface CpsTrendPoint {
  date: string;
  avgCps: number;
  scanned: number;
}

export interface SpyResult {
  keyword: string;
  market: string;
  category: string;
  theirPosition: number;
  ourPosition: number | null;
  cpsScore: number;
  gap: number | null;
}

export interface CompetitorStats {
  totalKeywords: number;
  avgCps: number;
  gapCount: number;
  alertCount: number;
}

export interface CompetitorDashboardData {
  stats: CompetitorStats;
  top25: SerpSnapshot[];
  heatmap: HeatmapCell[];
  alerts: CompetitorAlert[];
  cpsTrend: CpsTrendPoint[];
  serperConfigured: boolean;
}

// ── Safe Query Helpers ───────────────────────────────────────

function safeRows<T>(result: {
  data: T[] | null;
  error: { code?: string; message?: string } | null;
}): T[] {
  if (result.error) {
    const code = result.error.code;
    const msg = result.error.message || '';
    if (code === 'PGRST204' || code === '42P01' || msg.includes('does not exist') || msg.includes('schema cache')) {
      return [];
    }
    logger.warn('[competitors] Query warning:', msg);
  }
  return result.data || [];
}

// ── Serper API ───────────────────────────────────────────────

interface SerperResponse {
  organic?: Array<{ position: number; title: string; link: string; snippet: string }>;
  ads?: Array<{ position: number; title: string; link: string }>;
  shopping?: Array<{ title: string; price: string; link: string }>;
  peopleAlsoAsk?: Array<{ question: string; snippet: string; title: string; link: string }>;
  relatedSearches?: Array<{ query: string }>;
  knowledgeGraph?: Record<string, unknown>;
}

const GL_MAP: Record<Market, string> = { us: 'us', uk: 'uk', ca: 'ca', au: 'au' };

async function fetchSerp(keyword: string, market: Market): Promise<SerperResponse | null> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: keyword, gl: GL_MAP[market] || 'us', num: 10 }),
    });

    if (!res.ok) {
      logger.error('[competitors] Serper API error:', res.status);
      return null;
    }

    return (await res.json()) as SerperResponse;
  } catch (err) {
    Sentry.captureException(err);
    logger.error('[competitors] Serper fetch error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Core: Analyze a Single Keyword ──────────────────────────

export async function analyzeKeyword(
  keyword: string,
  market: Market,
  category: string,
): Promise<SerpSnapshot | null> {
  const serperData = await fetchSerp(keyword, market);
  if (!serperData) return null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'smartfinpro.com';
  const siteDomain = extractDomain(siteUrl) || 'smartfinpro.com';

  // Process organic results
  const organicResults: OrganicResult[] = (serperData.organic || []).map((item) => {
    const domain = extractDomain(item.link);
    return {
      position: item.position,
      title: item.title,
      link: item.link,
      domain,
      snippet: item.snippet || '',
      isOwnSite: domain.includes(siteDomain),
      isAuthority: AUTHORITY_DOMAINS.some((auth) => domain.includes(auth)),
    };
  });

  // Detect own position
  const ownResult = organicResults.find((r) => r.isOwnSite);
  const ownPosition = ownResult?.position ?? null;
  const ownUrl = ownResult?.link ?? null;

  // Count authority domains
  const authorityCount = organicResults.filter((r) => r.isAuthority).length;

  // Build CPS signals
  const signals: SerperSignals = {
    adCount: serperData.ads?.length ?? 0,
    hasShopping: !!(serperData.shopping && serperData.shopping.length > 0),
    paaCount: serperData.peopleAlsoAsk?.length ?? 0,
    hasKnowledgeGraph: !!serperData.knowledgeGraph,
    authorityCount,
    ownPosition,
  };

  const cpsScore = calculateCPS(signals);
  const scannedAt = new Date().toISOString();

  // Persist snapshot to Supabase
  try {
    const supabase = await createClient();

    await supabase.from('competitor_serp_snapshots').insert({
      keyword,
      market,
      category,
      has_ads: signals.adCount > 0,
      ad_count: signals.adCount,
      has_knowledge_graph: signals.hasKnowledgeGraph,
      paa_count: signals.paaCount,
      related_count: serperData.relatedSearches?.length ?? 0,
      organic_results: organicResults,
      cps_score: cpsScore,
      authority_count: authorityCount,
      own_position: ownPosition,
      own_url: ownUrl,
      scanned_at: scannedAt,
    });

    // Update tracked keyword with latest CPS
    await supabase.from('competitor_tracked_keywords').upsert(
      {
        keyword,
        market,
        category,
        source: 'seed',
        active: true,
        latest_cps: cpsScore,
        latest_own_position: ownPosition,
        last_scanned_at: scannedAt,
      },
      { onConflict: 'keyword,market' },
    );

    // Auto-discover related keywords (cap at 200 per market)
    const relatedSearches = serperData.relatedSearches || [];
    if (relatedSearches.length > 0) {
      const { count } = await supabase
        .from('competitor_tracked_keywords')
        .select('id', { count: 'exact', head: true })
        .eq('market', market)
        .eq('active', true);

      if ((count ?? 0) < 200) {
        const newKws = relatedSearches.slice(0, 3).map((r) => ({
          keyword: r.query.toLowerCase(),
          market,
          category,
          source: 'related_search' as const,
          active: true,
          latest_cps: 0,
          latest_own_position: null,
          last_scanned_at: null,
          created_at: scannedAt,
        }));

        await supabase
          .from('competitor_tracked_keywords')
          .upsert(newKws, { onConflict: 'keyword,market', ignoreDuplicates: true });
      }
    }
  } catch (err) {
    Sentry.captureException(err);
    logger.error('[competitors] Persist error:', err instanceof Error ? err.message : err);
  }

  return {
    keyword,
    market,
    category,
    cpsScore,
    ownPosition,
    ownUrl,
    organicResults,
    adCount: signals.adCount,
    paaCount: signals.paaCount,
    authorityCount,
    hasKnowledgeGraph: signals.hasKnowledgeGraph,
    scannedAt,
  };
}

// ── Dashboard Data Fetcher ──────────────────────────────────

export async function getCompetitorData(): Promise<CompetitorDashboardData> {
  const supabase = await createClient();
  const serperConfigured = !!process.env.SERPER_API_KEY;

  // Pre-compute date range (needed by the trend query below)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch all three in parallel (fully independent queries)
  const [snapshotsResult, alertsResult, trendResult] = await Promise.all([
    supabase
      .from('competitor_serp_snapshots')
      .select('*')
      .order('scanned_at', { ascending: false })
      .limit(500),
    supabase
      .from('competitor_alerts')
      .select('*')
      .eq('dismissed', false)
      .order('detected_at', { ascending: false })
      .limit(50),
    supabase
      .from('competitor_serp_snapshots')
      .select('cps_score, scanned_at')
      .gte('scanned_at', thirtyDaysAgo.toISOString())
      .order('scanned_at', { ascending: true }),
  ]);

  const allSnapshots = safeRows(snapshotsResult);

  // Deduplicate: keep only latest per keyword+market
  const latestMap = new Map<string, typeof allSnapshots[0]>();
  for (const s of allSnapshots) {
    const key = `${s.keyword}::${s.market}`;
    if (!latestMap.has(key)) latestMap.set(key, s);
  }
  const latestSnapshots = Array.from(latestMap.values());

  // Top 25 by CPS
  const top25Raw = [...latestSnapshots]
    .sort((a, b) => (b.cps_score ?? 0) - (a.cps_score ?? 0))
    .slice(0, 25);

  const top25: SerpSnapshot[] = top25Raw.map((s) => ({
    keyword: s.keyword,
    market: s.market as Market,
    category: s.category,
    cpsScore: s.cps_score ?? 0,
    ownPosition: s.own_position ?? null,
    ownUrl: s.own_url ?? null,
    organicResults: (s.organic_results || []) as OrganicResult[],
    adCount: s.ad_count ?? 0,
    paaCount: s.paa_count ?? 0,
    authorityCount: s.authority_count ?? 0,
    hasKnowledgeGraph: s.has_knowledge_graph ?? false,
    scannedAt: s.scanned_at,
  }));

  // Stats
  const totalKeywords = latestSnapshots.length;
  const avgCps = totalKeywords > 0
    ? Math.round((latestSnapshots.reduce((sum, s) => sum + (s.cps_score ?? 0), 0) / totalKeywords) * 10) / 10
    : 0;
  const gapCount = latestSnapshots.filter((s) => s.own_position === null && (s.cps_score ?? 0) > 50).length;

  // Heatmap: avg CPS per market × category
  const heatmapMap = new Map<string, { totalCps: number; count: number; gaps: number }>();
  for (const s of latestSnapshots) {
    const key = `${s.market}::${s.category}`;
    const existing = heatmapMap.get(key) || { totalCps: 0, count: 0, gaps: 0 };
    existing.totalCps += s.cps_score ?? 0;
    existing.count += 1;
    if (s.own_position === null && (s.cps_score ?? 0) > 50) existing.gaps += 1;
    heatmapMap.set(key, existing);
  }

  const heatmap: HeatmapCell[] = Array.from(heatmapMap.entries()).map(([key, data]) => {
    const [market, category] = key.split('::');
    return {
      market: market as Market,
      category,
      avgCps: data.count > 0 ? Math.round((data.totalCps / data.count) * 10) / 10 : 0,
      keywordCount: data.count,
      gapCount: data.gaps,
    };
  });

  // Alerts (already fetched in parallel above)
  const rawAlerts = safeRows(alertsResult);
  const alerts: CompetitorAlert[] = rawAlerts.map((a) => ({
    id: a.id,
    keyword: a.keyword,
    market: a.market,
    category: a.category,
    alertType: a.alert_type,
    severity: a.severity,
    competitorDomain: a.competitor_domain,
    previousPosition: a.previous_position,
    currentPosition: a.current_position,
    cpsScore: a.cps_score,
    ownPosition: a.own_position,
    dismissed: a.dismissed,
    boostTriggered: a.boost_triggered,
    slugToBoost: a.slug_to_boost,
    detectedAt: a.detected_at,
  }));

  // CPS Trend: daily averages for the last 30 days (already fetched in parallel above)
  const trendRows = safeRows(trendResult);

  const trendByDay = new Map<string, { total: number; count: number }>();
  for (const row of trendRows) {
    const day = new Date(row.scanned_at).toISOString().split('T')[0];
    const existing = trendByDay.get(day) || { total: 0, count: 0 };
    existing.total += row.cps_score ?? 0;
    existing.count += 1;
    trendByDay.set(day, existing);
  }

  const cpsTrend: CpsTrendPoint[] = Array.from(trendByDay.entries())
    .map(([date, data]) => ({
      date,
      avgCps: Math.round((data.total / data.count) * 10) / 10,
      scanned: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    stats: {
      totalKeywords,
      avgCps,
      gapCount,
      alertCount: alerts.length,
    },
    top25,
    heatmap,
    alerts,
    cpsTrend,
    serperConfigured,
  };
}

// ── Domain Spy ──────────────────────────────────────────────

export async function spyDomain(
  domain: string,
  market?: Market,
): Promise<SpyResult[]> {
  const supabase = await createClient();
  const cleanDomain = domain.replace('www.', '').toLowerCase().replace(/\/$/, '');

  // Fetch recent snapshots
  let query = supabase
    .from('competitor_serp_snapshots')
    .select('keyword, market, category, organic_results, cps_score, own_position, scanned_at')
    .order('scanned_at', { ascending: false })
    .limit(500);

  if (market) {
    query = query.eq('market', market);
  }

  const result = await query;
  const rows = safeRows(result);

  // Deduplicate by keyword+market (keep latest)
  const deduped = new Map<string, typeof rows[0]>();
  for (const row of rows) {
    const key = `${row.keyword}::${row.market}`;
    if (!deduped.has(key)) deduped.set(key, row);
  }

  // Filter: find where the target domain appears in organic results
  const results: SpyResult[] = [];

  for (const row of deduped.values()) {
    const organics = (row.organic_results || []) as OrganicResult[];
    const found = organics.find((r) => {
      const rDomain = (r.domain || '').replace('www.', '').toLowerCase();
      return rDomain.includes(cleanDomain) || cleanDomain.includes(rDomain);
    });

    if (found) {
      results.push({
        keyword: row.keyword,
        market: row.market,
        category: row.category,
        theirPosition: found.position,
        ourPosition: row.own_position ?? null,
        cpsScore: row.cps_score ?? 0,
        gap: row.own_position != null
          ? row.own_position - found.position
          : null,
      });
    }
  }

  // Sort by CPS descending (most valuable keywords first)
  return results.sort((a, b) => b.cpsScore - a.cpsScore);
}

// ── Manual Scan Trigger ─────────────────────────────────────

export async function triggerCompetitorScan(
  market?: Market,
  category?: string,
): Promise<{ scanned: number; newAlerts: number }> {
  const supabase = await createClient();

  // Fetch active tracked keywords
  let query = supabase
    .from('competitor_tracked_keywords')
    .select('keyword, market, category')
    .eq('active', true)
    .limit(200);

  if (market) query = query.eq('market', market);
  if (category) query = query.eq('category', category);

  const result = await query;
  const keywords = safeRows(result);

  // If no tracked keywords, seed them first
  if (keywords.length === 0) {
    await seedCompetitorKeywords();
    const seeded = COMPETITOR_KEYWORDS
      .filter((k) => (!market || k.market === market) && (!category || k.category === category));
    keywords.push(...seeded.map((k) => ({ keyword: k.keyword, market: k.market, category: k.category })));
  }

  let scanned = 0;

  for (const kw of keywords) {
    await analyzeKeyword(kw.keyword, kw.market as Market, kw.category);
    scanned++;

    // Rate limit: 50ms between requests
    if (scanned < keywords.length) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  // Run alert detection
  const newAlerts = await detectAlerts(market);

  return { scanned, newAlerts };
}

// ── Seed Keywords ───────────────────────────────────────────

export async function seedCompetitorKeywords(): Promise<{ seeded: number }> {
  const supabase = await createClient();

  const rows = COMPETITOR_KEYWORDS.map((k) => ({
    keyword: k.keyword,
    market: k.market,
    category: k.category,
    source: 'seed',
    active: true,
    latest_cps: 0,
    latest_own_position: null,
    last_scanned_at: null,
  }));

  const { data } = await supabase
    .from('competitor_tracked_keywords')
    .upsert(rows, { onConflict: 'keyword,market', ignoreDuplicates: true })
    .select('id');

  return { seeded: data?.length ?? 0 };
}

// ── Alert Management ────────────────────────────────────────

export async function dismissAlert(
  alertId: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('competitor_alerts')
    .update({ dismissed: true, dismissed_at: new Date().toISOString() })
    .eq('id', alertId);

  return { success: !error };
}

export async function boostFromAlert(
  alertId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Fetch alert
  const { data: alert } = await supabase
    .from('competitor_alerts')
    .select('*')
    .eq('id', alertId)
    .maybeSingle();

  if (!alert || !alert.slug_to_boost) {
    return { success: false, error: 'Alert not found or no slug to boost' };
  }

  // Trigger freshness boost
  const result = await boostAndDeploy(alert.slug_to_boost, `Competitor opportunity: ${alert.keyword}`);

  if (result.boostSuccess) {
    await supabase
      .from('competitor_alerts')
      .update({ boost_triggered: true })
      .eq('id', alertId);
  }

  return {
    success: result.boostSuccess,
    error: result.error,
  };
}

// ── Add Manual Keyword ──────────────────────────────────────

export async function addManualKeyword(
  keyword: string,
  market: Market,
  category: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('competitor_tracked_keywords')
    .upsert(
      {
        keyword: keyword.toLowerCase().trim(),
        market,
        category,
        source: 'manual',
        active: true,
        latest_cps: 0,
        latest_own_position: null,
        last_scanned_at: null,
      },
      { onConflict: 'keyword,market', ignoreDuplicates: true },
    );

  return { success: !error };
}

// ── Alert Detection (internal) ──────────────────────────────

async function detectAlerts(market?: Market): Promise<number> {
  const supabase = await createClient();
  let newAlerts = 0;

  // Fetch snapshots: we need the 2 most recent per keyword+market to detect changes
  let query = supabase
    .from('competitor_serp_snapshots')
    .select('keyword, market, category, cps_score, own_position, organic_results, scanned_at')
    .order('scanned_at', { ascending: false })
    .limit(1000);

  if (market) query = query.eq('market', market);

  const result = await query;
  const rows = safeRows(result);

  // Group by keyword+market: collect latest 2 snapshots
  const grouped = new Map<string, Array<typeof rows[0]>>();
  for (const row of rows) {
    const key = `${row.keyword}::${row.market}`;
    const arr = grouped.get(key) || [];
    if (arr.length < 2) arr.push(row);
    grouped.set(key, arr);
  }

  const now = new Date().toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  for (const [, snapshots] of grouped) {
    if (snapshots.length < 2) continue;

    const [current, previous] = snapshots;
    const currentOrganics = (current.organic_results || []) as OrganicResult[];
    const previousOrganics = (previous.organic_results || []) as OrganicResult[];
    const cps = current.cps_score ?? 0;

    // Build domain→position maps
    const prevPositions = new Map<string, number>();
    for (const r of previousOrganics) {
      if (r.domain) prevPositions.set(r.domain, r.position);
    }
    const currPositions = new Map<string, number>();
    for (const r of currentOrganics) {
      if (r.domain) currPositions.set(r.domain, r.position);
    }

    // Detect: competitor_drop — top-5 competitor dropped ≥3 positions
    for (const [domain, prevPos] of prevPositions) {
      if (prevPos > 5) continue; // Only track top-5 competitors
      const currPos = currPositions.get(domain);

      if (currPos !== undefined && currPos - prevPos >= 3) {
        const severity = currPos - prevPos >= 5 ? 'critical' : 'warning';

        // Resolve slug to boost: map keyword → page
        const slugToBoost = resolveSlug(current.keyword, current.market, current.category);

        // Deduplicate: check if same alert exists within 24h
        const { count } = await supabase
          .from('competitor_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('keyword', current.keyword)
          .eq('market', current.market)
          .eq('alert_type', 'competitor_drop')
          .eq('competitor_domain', domain)
          .gte('detected_at', oneDayAgo);

        if ((count ?? 0) === 0) {
          await supabase.from('competitor_alerts').insert({
            keyword: current.keyword,
            market: current.market,
            category: current.category,
            alert_type: 'competitor_drop',
            severity,
            competitor_domain: domain,
            previous_position: prevPos,
            current_position: currPos,
            cps_score: cps,
            own_position: current.own_position,
            slug_to_boost: slugToBoost,
            detected_at: now,
          });
          newAlerts++;
        }
      }
    }

    // Detect: new_gap — high CPS keyword where we're not in top 10
    if (cps >= 60 && current.own_position === null) {
      const severity = cps >= 80 ? 'critical' : 'warning';
      const slugToBoost = resolveSlug(current.keyword, current.market, current.category);

      const { count } = await supabase
        .from('competitor_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('keyword', current.keyword)
        .eq('market', current.market)
        .eq('alert_type', 'new_gap')
        .gte('detected_at', oneDayAgo);

      if ((count ?? 0) === 0) {
        await supabase.from('competitor_alerts').insert({
          keyword: current.keyword,
          market: current.market,
          category: current.category,
          alert_type: 'new_gap',
          severity,
          cps_score: cps,
          own_position: null,
          slug_to_boost: slugToBoost,
          detected_at: now,
        });
        newAlerts++;
      }
    }

    // Detect: authority_exit — authority domain left top 10
    for (const auth of AUTHORITY_DOMAINS) {
      const wasIn = previousOrganics.some((r) => r.domain?.includes(auth));
      const isIn = currentOrganics.some((r) => r.domain?.includes(auth));

      if (wasIn && !isIn && cps >= 50) {
        const slugToBoost = resolveSlug(current.keyword, current.market, current.category);

        const { count } = await supabase
          .from('competitor_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('keyword', current.keyword)
          .eq('market', current.market)
          .eq('alert_type', 'authority_exit')
          .eq('competitor_domain', auth)
          .gte('detected_at', oneDayAgo);

        if ((count ?? 0) === 0) {
          await supabase.from('competitor_alerts').insert({
            keyword: current.keyword,
            market: current.market,
            category: current.category,
            alert_type: 'authority_exit',
            severity: 'warning',
            competitor_domain: auth,
            cps_score: cps,
            own_position: current.own_position,
            slug_to_boost: slugToBoost,
            detected_at: now,
          });
          newAlerts++;
        }
      }
    }
  }

  return newAlerts;
}

// ── Slug Resolution (keyword → page path) ───────────────────

function resolveSlug(keyword: string, market: string, category: string): string {
  // Try to match from COMPETITOR_KEYWORDS
  const match = COMPETITOR_KEYWORDS.find(
    (k) => k.keyword === keyword && k.market === market,
  );

  if (match) {
    // Return the category index page
    const prefix = `/${market}`;
    return `${prefix}/${match.category}`;
  }

  // Fallback: construct from market + category
  const prefix = `/${market}`;
  return `${prefix}/${category}`;
}
