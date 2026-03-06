'use server';

import 'server-only';
import { logger } from '@/lib/logging';

import { createClient } from '@/lib/supabase/server';
import {
  COMPETITOR_KEYWORDS,
  calculateCPS,
  extractDomain,
  AUTHORITY_DOMAINS,
  type SerperSignals,
} from '@/lib/seo/competitor-keywords';
import { boostAndDeploy } from '@/lib/actions/content-overrides';
import type { Market, Category } from '@/lib/i18n/config';

// ── Types ────────────────────────────────────────────────────

export interface GapResult {
  keyword: string;
  market: Market;
  category: string;
  competitorDomain: string;
  competitorPosition: number | null;
  ownPosition: number | null;
  gap: number | null;
  cpsScore: number;
  opportunityScore: number;
  gapType: 'missing' | 'behind' | 'ahead' | 'tied';
  scannedAt: string;
}

export interface GapDraft {
  id: string;
  keyword: string;
  market: Market;
  category: string;
  slug: string;
  title: string;
  status: 'draft' | 'published' | 'discarded';
  competitorDomain: string | null;
  opportunityScore: number;
  mdxSkeleton: string | null;
  createdAt: string;
}

export interface GapCategorySummary {
  category: string;
  totalGaps: number;
  missingCount: number;
  behindCount: number;
  avgOpportunity: number;
}

export interface GapDashboardData {
  results: GapResult[];
  categorySummary: GapCategorySummary[];
  drafts: GapDraft[];
  totalGaps: number;
  avgOpportunity: number;
  highPriorityCount: number;
  scansRemaining: number;
  lastScanAt: string | null;
  serperConfigured: boolean;
}

export interface ScanLimitInfo {
  scansUsed: number;
  maxScans: number;
  remaining: number;
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
    logger.warn('[gap-analysis] Query warning:', msg);
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
      logger.error('[gap-analysis] Serper API error:', res.status);
      return null;
    }

    return (await res.json()) as SerperResponse;
  } catch (err) {
    logger.error('[gap-analysis] Serper fetch error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Scan Limit Management ────────────────────────────────────

async function getScanLimit(): Promise<ScanLimitInfo> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const result = await supabase
    .from('gap_scan_usage')
    .select('scans_used, max_scans')
    .eq('scan_date', today)
    .maybeSingle();

  if (result.error && !result.error.message?.includes('does not exist')) {
    logger.warn('[gap-analysis] Scan limit query warning:', result.error.message);
  }

  const row = result.data;
  if (!row) return { scansUsed: 0, maxScans: 50, remaining: 50 };
  return {
    scansUsed: row.scans_used,
    maxScans: row.max_scans,
    remaining: Math.max(0, row.max_scans - row.scans_used),
  };
}

async function incrementScanCount(count: number): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Upsert: create row for today or increment existing
  const { data: existing } = await supabase
    .from('gap_scan_usage')
    .select('scans_used')
    .eq('scan_date', today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('gap_scan_usage')
      .update({ scans_used: existing.scans_used + count })
      .eq('scan_date', today);
  } else {
    await supabase
      .from('gap_scan_usage')
      .insert({ scan_date: today, scans_used: count, max_scans: 50 });
  }
}

// ── Opportunity Score Algorithm ──────────────────────────────

/**
 * Calculate Opportunity Score (0–100) from gap signals.
 *
 * Factors:
 *   1. Gap Size (35): Bigger gap = more upside
 *   2. CPS Score (30): Higher CPS = more commercial value
 *   3. Position Weakness (20): We're not ranking or ranking poorly
 *   4. Category Relevance (15): Whether we have content in this category
 */
function calculateOpportunityScore(params: {
  gapType: 'missing' | 'behind' | 'ahead' | 'tied';
  competitorPosition: number | null;
  ownPosition: number | null;
  cps: number;
  hasContent: boolean;
}): number {
  const { gapType, competitorPosition, ownPosition, cps, hasContent } = params;

  // Factor 1: Gap Size (0-35)
  let gapFactor = 0;
  if (gapType === 'missing') {
    gapFactor = 35; // Full points — we don't rank at all
  } else if (gapType === 'behind') {
    const diff = (ownPosition ?? 99) - (competitorPosition ?? 1);
    if (diff >= 5) gapFactor = 30;
    else if (diff >= 3) gapFactor = 22;
    else gapFactor = 12;
  } else if (gapType === 'tied') {
    gapFactor = 5;
  } else {
    gapFactor = 0; // We're ahead
  }

  // Factor 2: CPS Score (0-30)
  const cpsFactor = (cps / 100) * 30;

  // Factor 3: Position Weakness (0-20)
  let posFactor = 0;
  if (ownPosition === null) {
    posFactor = 20; // Not ranking at all
  } else if (ownPosition > 10) {
    posFactor = 16;
  } else if (ownPosition > 5) {
    posFactor = 10;
  } else if (ownPosition > 3) {
    posFactor = 5;
  } else {
    posFactor = 0; // Top 3 — no weakness
  }

  // Factor 4: Category Relevance (0-15)
  const relevanceFactor = hasContent ? 15 : 8; // We can boost existing content = higher opportunity

  const total = gapFactor + cpsFactor + posFactor + relevanceFactor;
  return Math.round(Math.min(100, total) * 10) / 10;
}

// ── Core: Analyze Keyword Gap ────────────────────────────────

/**
 * Analyze a single keyword: fetch SERP, compare competitor vs our position,
 * compute CPS + Opportunity Score, store result.
 */
async function analyzeGapKeyword(
  keyword: string,
  market: Market,
  category: string,
  competitorDomain: string,
): Promise<GapResult | null> {
  const serperData = await fetchSerp(keyword, market);
  if (!serperData) return null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'smartfinpro.com';
  const siteDomain = extractDomain(siteUrl) || 'smartfinpro.com';
  const cleanCompetitor = competitorDomain.replace('www.', '').toLowerCase();

  // Parse organic results
  const organics = (serperData.organic || []).map((item) => {
    const domain = extractDomain(item.link);
    return {
      position: item.position,
      title: item.title,
      link: item.link,
      domain,
      isOwnSite: domain.includes(siteDomain),
      isCompetitor: domain.includes(cleanCompetitor) || cleanCompetitor.includes(domain),
      isAuthority: AUTHORITY_DOMAINS.some((auth) => domain.includes(auth)),
    };
  });

  const ownResult = organics.find((r) => r.isOwnSite);
  const competitorResult = organics.find((r) => r.isCompetitor);
  const ownPosition = ownResult?.position ?? null;
  const competitorPosition = competitorResult?.position ?? null;

  // Skip if competitor isn't ranking for this keyword either
  if (competitorPosition === null) return null;

  // Determine gap type
  let gapType: 'missing' | 'behind' | 'ahead' | 'tied';
  let gap: number | null = null;

  if (ownPosition === null) {
    gapType = 'missing';
    gap = null;
  } else if (ownPosition === competitorPosition) {
    gapType = 'tied';
    gap = 0;
  } else if (ownPosition > competitorPosition) {
    gapType = 'behind';
    gap = ownPosition - competitorPosition;
  } else {
    gapType = 'ahead';
    gap = ownPosition - competitorPosition; // negative = we're ahead
  }

  // Compute CPS
  const authorityCount = organics.filter((r) => r.isAuthority).length;
  const signals: SerperSignals = {
    adCount: serperData.ads?.length ?? 0,
    hasShopping: !!(serperData.shopping && serperData.shopping.length > 0),
    paaCount: serperData.peopleAlsoAsk?.length ?? 0,
    hasKnowledgeGraph: !!serperData.knowledgeGraph,
    authorityCount,
    ownPosition,
  };
  const cpsScore = calculateCPS(signals);

  // Check if we have content for this keyword's category
  const hasContent = COMPETITOR_KEYWORDS.some(
    (k) => k.category === category && k.market === market,
  );

  // Compute Opportunity Score
  const opportunityScore = calculateOpportunityScore({
    gapType,
    competitorPosition,
    ownPosition,
    cps: cpsScore,
    hasContent,
  });

  const scannedAt = new Date().toISOString();

  // Persist to Supabase
  try {
    const supabase = await createClient();

    await supabase.from('keyword_gap_results').upsert(
      {
        competitor_domain: cleanCompetitor,
        market,
        keyword,
        category,
        competitor_position: competitorPosition,
        own_position: ownPosition,
        gap,
        cps_score: cpsScore,
        opportunity_score: opportunityScore,
        gap_type: gapType,
        scanned_at: scannedAt,
      },
      { onConflict: 'competitor_domain,keyword,market' },
    );
  } catch (err) {
    logger.error('[gap-analysis] Persist error:', err instanceof Error ? err.message : err);
  }

  return {
    keyword,
    market,
    category,
    competitorDomain: cleanCompetitor,
    competitorPosition,
    ownPosition,
    gap,
    cpsScore,
    opportunityScore,
    gapType,
    scannedAt,
  };
}

// ── Main: Full Gap Analysis ──────────────────────────────────

export async function analyzeKeywordGap(
  competitorDomain: string,
  market: Market,
): Promise<{ results: GapResult[]; scanned: number; error?: string }> {
  // Check daily limit
  const limit = await getScanLimit();
  if (limit.remaining <= 0) {
    return {
      results: [],
      scanned: 0,
      error: `Tägliches Scan-Limit erreicht (${limit.maxScans}/${limit.maxScans}). Morgen wieder verfügbar.`,
    };
  }

  const cleanDomain = competitorDomain.replace('www.', '').toLowerCase().replace(/\/$/, '');

  // Get all tracked keywords for this market
  const supabase = await createClient();
  const trackedResult = await supabase
    .from('competitor_tracked_keywords')
    .select('keyword, market, category')
    .eq('market', market)
    .eq('active', true)
    .limit(200);

  let keywords = safeRows(trackedResult);

  // Fallback: use seed keywords
  if (keywords.length === 0) {
    keywords = COMPETITOR_KEYWORDS
      .filter((k) => k.market === market)
      .map((k) => ({ keyword: k.keyword, market: k.market, category: k.category }));
  }

  // Cap at remaining scans for today
  const maxToScan = Math.min(keywords.length, limit.remaining);
  const toScan = keywords.slice(0, maxToScan);

  const results: GapResult[] = [];
  let scanned = 0;

  for (const kw of toScan) {
    const result = await analyzeGapKeyword(kw.keyword, market, kw.category, cleanDomain);
    if (result) results.push(result);
    scanned++;

    // Rate limit: 60ms between requests
    if (scanned < toScan.length) {
      await new Promise((r) => setTimeout(r, 60));
    }
  }

  // Update scan count
  await incrementScanCount(scanned);

  // Sort by opportunity score descending
  results.sort((a, b) => b.opportunityScore - a.opportunityScore);

  return { results, scanned };
}

// ── Dashboard Data Fetcher ───────────────────────────────────

export async function getGapDashboardData(
  competitorDomain?: string,
  market?: Market,
): Promise<GapDashboardData> {
  const supabase = await createClient();
  const serperConfigured = !!process.env.SERPER_API_KEY;

  // Fetch gap results
  let query = supabase
    .from('keyword_gap_results')
    .select('*')
    .order('opportunity_score', { ascending: false })
    .limit(200);

  if (competitorDomain) {
    const clean = competitorDomain.replace('www.', '').toLowerCase().replace(/\/$/, '');
    query = query.eq('competitor_domain', clean);
  }
  if (market) query = query.eq('market', market);

  const gapRows = safeRows(await query);

  const results: GapResult[] = gapRows.map((r) => ({
    keyword: r.keyword,
    market: r.market as Market,
    category: r.category,
    competitorDomain: r.competitor_domain,
    competitorPosition: r.competitor_position,
    ownPosition: r.own_position,
    gap: r.gap,
    cpsScore: r.cps_score ?? 0,
    opportunityScore: r.opportunity_score ?? 0,
    gapType: r.gap_type as GapResult['gapType'],
    scannedAt: r.scanned_at,
  }));

  // Category summary
  const catMap = new Map<string, { total: number; missing: number; behind: number; oppSum: number }>();
  for (const r of results) {
    const existing = catMap.get(r.category) || { total: 0, missing: 0, behind: 0, oppSum: 0 };
    existing.total++;
    if (r.gapType === 'missing') existing.missing++;
    if (r.gapType === 'behind') existing.behind++;
    existing.oppSum += r.opportunityScore;
    catMap.set(r.category, existing);
  }

  const categorySummary: GapCategorySummary[] = Array.from(catMap.entries())
    .map(([category, data]) => ({
      category,
      totalGaps: data.total,
      missingCount: data.missing,
      behindCount: data.behind,
      avgOpportunity: data.total > 0 ? Math.round((data.oppSum / data.total) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.avgOpportunity - a.avgOpportunity);

  // Drafts
  const draftsQuery = supabase
    .from('keyword_gap_drafts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const draftRows = safeRows(await draftsQuery);
  const drafts: GapDraft[] = draftRows.map((d) => ({
    id: d.id,
    keyword: d.keyword,
    market: d.market as Market,
    category: d.category,
    slug: d.slug,
    title: d.title,
    status: d.status as GapDraft['status'],
    competitorDomain: d.competitor_domain,
    opportunityScore: d.opportunity_score ?? 0,
    mdxSkeleton: d.mdx_skeleton,
    createdAt: d.created_at,
  }));

  // Scan limits
  const scanLimit = await getScanLimit();

  // Stats
  const totalGaps = results.filter((r) => r.gapType === 'missing' || r.gapType === 'behind').length;
  const avgOpportunity = results.length > 0
    ? Math.round((results.reduce((sum, r) => sum + r.opportunityScore, 0) / results.length) * 10) / 10
    : 0;
  const highPriorityCount = results.filter((r) => r.opportunityScore >= 70).length;
  const lastScanAt = gapRows.length > 0 ? gapRows[0].scanned_at : null;

  return {
    results,
    categorySummary,
    drafts,
    totalGaps,
    avgOpportunity,
    highPriorityCount,
    scansRemaining: scanLimit.remaining,
    lastScanAt,
    serperConfigured,
  };
}

// ── Shadow-Draft Generator ───────────────────────────────────

/**
 * Generate an MDX skeleton for a gap keyword.
 * Creates a draft entry in Supabase + returns the MDX content.
 */
export async function createShadowDraft(
  keyword: string,
  market: Market,
  category: string,
  competitorDomain?: string,
): Promise<{ success: boolean; draft?: GapDraft; error?: string }> {
  // Generate slug from keyword
  const slugBase = keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

  const prefix = `/${market}`;
  const slug = `${prefix}/${category}/${slugBase}`;

  // Generate title
  const year = new Date().getFullYear();
  const titleKeyword = keyword
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const title = `${titleKeyword}: Complete Guide & Expert Review ${year}`;

  // Generate MDX skeleton
  const today = new Date().toISOString().split('T')[0];
  const mdxSkeleton = `---
title: "${title}"
description: "Expert analysis and comparison of ${keyword}. Data-driven review with ratings, pros, cons, and recommendations."
author: "SmartFinPro Editorial Team"
reviewedBy: "Editorial Board"
publishDate: "${today}"
modifiedDate: "${today}"
category: "${category}"
market: "${market}"
rating: 0
affiliateDisclosure: true
featured: false
bestFor: "TODO: Define target audience"
---

## ${titleKeyword}

{/* TODO: Write introduction — 150-200 words, include primary keyword in first paragraph */}

## Quick Comparison Table

{/* TODO: Add comparison table with top 3-5 options */}

| Platform | Rating | Best For | Key Feature |
|----------|--------|----------|-------------|
| TODO | ⭐ 0/5 | TODO | TODO |

## Detailed Analysis

{/* TODO: Write 300-500 word analysis per option */}

### Option 1: TODO

**Pros:**
- TODO

**Cons:**
- TODO

## How We Evaluated

{/* TODO: Describe methodology — 100-150 words */}

## FAQ

<details>
<summary>What is the best ${keyword.toLowerCase()}?</summary>

TODO: Answer — 50-100 words

</details>

<details>
<summary>How do I choose the right option?</summary>

TODO: Answer — 50-100 words

</details>

## Conclusion

{/* TODO: Write conclusion — 100-150 words, include CTA */}
`;

  // Persist draft
  try {
    const supabase = await createClient();

    const opportunityScore = competitorDomain ? 70 : 50; // Placeholder

    const { data, error } = await supabase
      .from('keyword_gap_drafts')
      .upsert(
        {
          keyword,
          market,
          category,
          slug,
          title,
          status: 'draft',
          competitor_domain: competitorDomain || null,
          opportunity_score: opportunityScore,
          mdx_skeleton: mdxSkeleton,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'keyword,market' },
      )
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      draft: {
        id: data.id,
        keyword: data.keyword,
        market: data.market as Market,
        category: data.category,
        slug: data.slug,
        title: data.title,
        status: data.status,
        competitorDomain: data.competitor_domain,
        opportunityScore: data.opportunity_score ?? 0,
        mdxSkeleton: data.mdx_skeleton,
        createdAt: data.created_at,
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ── Bridge the Gap (Freshness Boost) ─────────────────────────

export async function bridgeTheGap(
  keyword: string,
  market: Market,
  category: string,
): Promise<{ success: boolean; error?: string }> {
  const prefix = `/${market}`;
  const slug = `${prefix}/${category}`;

  const result = await boostAndDeploy(slug, `Gap Analysis: bridge gap for "${keyword}"`);
  return {
    success: result.boostSuccess,
    error: result.error,
  };
}

// ── Discard Draft ────────────────────────────────────────────

export async function discardDraft(
  draftId: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('keyword_gap_drafts')
    .update({ status: 'discarded' })
    .eq('id', draftId);

  return { success: !error };
}

// ── Get Analyzed Competitors ─────────────────────────────────

export async function getAnalyzedCompetitors(): Promise<string[]> {
  const supabase = await createClient();

  const result = await supabase
    .from('keyword_gap_results')
    .select('competitor_domain')
    .limit(500);

  const rows = safeRows(result);
  const domains = new Set(rows.map((r) => r.competitor_domain as string));
  return Array.from(domains).sort();
}
