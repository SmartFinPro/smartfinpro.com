// lib/actions/content-hub.ts — Content Hub data aggregation + health checks
'use server';
import 'server-only';

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';

// ── Types ──────────────────────────────────────────────────────

export type HealthStatus = 'green' | 'yellow' | 'red';

export interface SeoHealth {
  titleStatus: HealthStatus;
  titleLength: number;
  descStatus: HealthStatus;
  descLength: number;
  overall: HealthStatus;
}

export interface ContentQuality {
  score: number;          // 0-100 overall
  wordScore: number;      // 0-100 word count quality
  structureScore: number; // 0-100 heading structure
  linkScore: number;      // 0-100 internal + external links
  componentScore: number; // 0-100 MDX components usage
  breakdown: string;      // "W:85 S:90 L:70 C:95" short form
}

export interface ContentHubRow {
  url: string;
  filePath: string;
  market: string;
  category: string;
  title: string;
  seoTitle: string;
  description: string;
  wordCount: number;
  sizeKB: number;
  httpStatus: number | null;
  httpHealth: HealthStatus;
  seoHealth: SeoHealth;
  contentQuality: ContentQuality;
  cpsScore: number | null;
  indexStatus: string;
  type: 'mdx' | 'core';
}

// ── Constants ──────────────────────────────────────────────────

const CONTENT_DIR = path.join(process.cwd(), 'content');
const MARKETS = ['us', 'uk', 'ca', 'au'] as const;

const CORE_ROUTES: { url: string; title: string }[] = [
  { url: '/', title: 'Homepage (US)' },
  { url: '/uk', title: 'Homepage (UK)' },
  { url: '/ca', title: 'Homepage (CA)' },
  { url: '/au', title: 'Homepage (AU)' },
  { url: '/tools', title: 'Tools Hub' },
  { url: '/tools/broker-finder', title: 'Broker Finder Quiz' },
  { url: '/tools/credit-score-simulator', title: 'Credit Score Simulator' },
  { url: '/tools/debt-payoff-calculator', title: 'Debt Payoff Calculator' },
  { url: '/tools/gold-roi-calculator', title: 'Gold ROI Calculator' },
  { url: '/uk/tools/remortgage-calculator', title: 'UK Remortgage Calculator' },
  { url: '/au/tools/superannuation-calculator', title: 'AU Super Calculator' },
  { url: '/ca/tools/tfsa-rrsp-calculator', title: 'CA TFSA/RRSP Calculator' },
];

// ── SEO Health Logic ───────────────────────────────────────────

function checkTitleHealth(seoTitle: string | undefined): { status: HealthStatus; length: number } {
  if (!seoTitle || seoTitle.trim().length === 0) {
    return { status: 'red', length: 0 };
  }
  const len = seoTitle.trim().length;
  if (len >= 45 && len <= 60) return { status: 'green', length: len };
  return { status: 'yellow', length: len };
}

function checkDescHealth(description: string | undefined): { status: HealthStatus; length: number } {
  if (!description || description.trim().length === 0) {
    return { status: 'red', length: 0 };
  }
  const len = description.trim().length;
  if (len >= 140 && len <= 160) return { status: 'green', length: len };
  return { status: 'yellow', length: len };
}

function computeSeoHealth(seoTitle: string | undefined, description: string | undefined): SeoHealth {
  const title = checkTitleHealth(seoTitle);
  const desc = checkDescHealth(description);

  let overall: HealthStatus = 'green';
  if (title.status === 'red' || desc.status === 'red') overall = 'red';
  else if (title.status === 'yellow' || desc.status === 'yellow') overall = 'yellow';

  return {
    titleStatus: title.status,
    titleLength: title.length,
    descStatus: desc.status,
    descLength: desc.length,
    overall,
  };
}

// ── Content Quality Scoring ─────────────────────────────────────

const MDX_COMPONENTS = [
  '<TrustAuthority', '<ExpertBox', '<Rating', '<AffiliateButton',
  '<ExecutiveSummary', '<CollapsibleSection', '<ComparisonTable',
  '<SimpleComparison', '<BrokerComparison', '<EnterpriseTable',
  '<FAQ', '<Pros', '<Cons', '<Info', '<Warning', '<Tip',
  '<EvidenceCarousel', '<NewsletterBox', '<WinnerAtGlance',
];

function computeContentQuality(content: string, wordCount: number): ContentQuality {
  // ── Word Score (30% weight) — target: 4000-7000 words ──
  let wordScore = 0;
  if (wordCount >= 4000 && wordCount <= 7000) wordScore = 100;
  else if (wordCount >= 3000 && wordCount < 4000) wordScore = 70;
  else if (wordCount > 7000 && wordCount <= 9000) wordScore = 80;
  else if (wordCount >= 2000 && wordCount < 3000) wordScore = 50;
  else if (wordCount > 9000) wordScore = 60;
  else if (wordCount >= 1000) wordScore = 30;
  else wordScore = 10;

  // ── Structure Score (25% weight) — headings + FAQ ──
  const h2Count = (content.match(/^## /gm) || []).length;
  const h3Count = (content.match(/^### /gm) || []).length;
  const hasFaq = /(<FAQ|^## .*FAQ|^## .*Frequently Asked)/im.test(content);
  const hasProsCons = /<Pros|<Cons|^## .*Pros|^## .*Cons/im.test(content);

  let structureScore = 0;
  structureScore += Math.min(h2Count, 8) * 8;  // Up to 64 points for H2s
  structureScore += Math.min(h3Count, 6) * 3;  // Up to 18 points for H3s
  if (hasFaq) structureScore += 10;
  if (hasProsCons) structureScore += 8;
  structureScore = Math.min(structureScore, 100);

  // ── Link Score (20% weight) — internal + external ──
  const internalLinks = (content.match(/\]\(\//g) || []).length;
  const externalLinks = (content.match(/\]\(https?:\/\//g) || []).length;

  let linkScore = 0;
  linkScore += Math.min(internalLinks, 8) * 7;  // Up to 56 pts for internal
  linkScore += Math.min(externalLinks, 6) * 7;  // Up to 42 pts for external
  linkScore = Math.min(linkScore, 100);

  // ── Component Score (25% weight) — MDX components usage ──
  let componentCount = 0;
  for (const comp of MDX_COMPONENTS) {
    if (content.includes(comp)) componentCount++;
  }
  const imageCount = (content.match(/!\[.*?\]/g) || []).length;

  let componentScore = 0;
  componentScore += Math.min(componentCount, 6) * 12; // Up to 72 pts for components
  componentScore += Math.min(imageCount, 4) * 7;      // Up to 28 pts for images
  componentScore = Math.min(componentScore, 100);

  // ── Weighted overall score ──
  const score = Math.round(
    wordScore * 0.30 +
    structureScore * 0.25 +
    linkScore * 0.20 +
    componentScore * 0.25
  );

  const breakdown = `W:${wordScore} S:${structureScore} L:${linkScore} C:${componentScore}`;

  return { score, wordScore, structureScore, linkScore, componentScore, breakdown };
}

const EMPTY_QUALITY: ContentQuality = {
  score: 0, wordScore: 0, structureScore: 0, linkScore: 0, componentScore: 0, breakdown: '—',
};

// ── CPS Score Loader (from Serper.dev competitor snapshots) ──────

async function loadCpsScores(): Promise<Map<string, number>> {
  const cpsMap = new Map<string, number>();

  try {
    const supabase = createServiceClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('competitor_serp_snapshots')
      .select('own_url, cps_score')
      .not('own_url', 'is', null)
      .not('cps_score', 'is', null)
      .gte('scanned_at', thirtyDaysAgo.toISOString())
      .order('scanned_at', { ascending: false });

    if (error || !data) return cpsMap;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

    for (const row of data) {
      const url = row.own_url as string;
      const cps = Number(row.cps_score);
      if (isNaN(cps)) continue;

      // Extract path from full URL
      let urlPath = url;
      if (url.startsWith(siteUrl)) {
        urlPath = url.slice(siteUrl.length);
      } else if (url.startsWith('http')) {
        try {
          urlPath = new URL(url).pathname;
        } catch {
          continue;
        }
      }

      // Normalize: remove trailing slash
      urlPath = urlPath.replace(/\/$/, '') || '/';

      // Keep the highest CPS score per URL (best opportunity)
      const existing = cpsMap.get(urlPath);
      if (!existing || cps > existing) {
        cpsMap.set(urlPath, cps);
      }
    }
  } catch (err) {
    console.warn('[content-hub] Failed to load CPS scores:', err);
  }

  return cpsMap;
}

// ── URL Builder ────────────────────────────────────────────────

function buildUrl(market: string, category: string, slug: string): string {
  const prefix = market === 'us' ? '' : `/${market}`;
  if (slug === 'index') return `${prefix}/${category}`;
  return `${prefix}/${category}/${slug}`;
}

// ── File Scanner ───────────────────────────────────────────────

function scanMdxFiles(): ContentHubRow[] {
  const rows: ContentHubRow[] = [];

  for (const market of MARKETS) {
    const marketDir = path.join(CONTENT_DIR, market);
    if (!fs.existsSync(marketDir)) continue;

    const categories = fs.readdirSync(marketDir).filter((f) => {
      try {
        return fs.statSync(path.join(marketDir, f)).isDirectory();
      } catch {
        return false;
      }
    });

    for (const category of categories) {
      const catDir = path.join(marketDir, category);
      let files: string[];
      try {
        files = fs.readdirSync(catDir).filter((f) => f.endsWith('.mdx'));
      } catch {
        continue;
      }

      for (const file of files) {
        const fullPath = path.join(catDir, file);
        const slug = file.replace('.mdx', '');

        try {
          const raw = fs.readFileSync(fullPath, 'utf8');
          const stats = fs.statSync(fullPath);
          const { data: fm, content } = matter(raw);

          const seoTitle = (fm.seoTitle as string) || (fm.title as string) || '';
          const description = (fm.description as string) || '';
          const wordCount = content.split(/\s+/).filter(Boolean).length;
          const sizeKB = Math.round((stats.size / 1024) * 10) / 10;

          rows.push({
            url: buildUrl(market, category, slug),
            filePath: path.relative(process.cwd(), fullPath),
            market: market.toUpperCase(),
            category,
            title: (fm.title as string) || slug,
            seoTitle,
            description,
            wordCount,
            sizeKB,
            httpStatus: null,
            httpHealth: 'yellow',
            seoHealth: computeSeoHealth(seoTitle, description),
            contentQuality: computeContentQuality(content, wordCount),
            cpsScore: null,
            indexStatus: 'Pending GSC Check',
            type: 'mdx',
          });
        } catch (err) {
          // Broken file — still show it with red status
          rows.push({
            url: buildUrl(market, category, slug),
            filePath: path.relative(process.cwd(), fullPath),
            market: market.toUpperCase(),
            category,
            title: `[Parse Error] ${slug}`,
            seoTitle: '',
            description: '',
            wordCount: 0,
            sizeKB: 0,
            httpStatus: null,
            httpHealth: 'red',
            seoHealth: computeSeoHealth(undefined, undefined),
            contentQuality: EMPTY_QUALITY,
            cpsScore: null,
            indexStatus: 'Parse Error',
            type: 'mdx',
          });
          console.warn(`[content-hub] Failed to parse ${fullPath}:`, err);
        }
      }
    }
  }

  // Also scan cross-market content
  const crossDir = path.join(CONTENT_DIR, 'cross-market');
  if (fs.existsSync(crossDir)) {
    const files = fs.readdirSync(crossDir).filter((f) => f.endsWith('.mdx'));
    for (const file of files) {
      const fullPath = path.join(crossDir, file);
      const slug = file.replace('.mdx', '');

      try {
        const raw = fs.readFileSync(fullPath, 'utf8');
        const stats = fs.statSync(fullPath);
        const { data: fm, content } = matter(raw);

        const seoTitle = (fm.seoTitle as string) || (fm.title as string) || '';
        const description = (fm.description as string) || '';
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        const sizeKB = Math.round((stats.size / 1024) * 10) / 10;

        rows.push({
          url: `/${slug}`,
          filePath: path.relative(process.cwd(), fullPath),
          market: 'GLOBAL',
          category: 'cross-market',
          title: (fm.title as string) || slug,
          seoTitle,
          description,
          wordCount,
          sizeKB,
          httpStatus: null,
          httpHealth: 'yellow',
          seoHealth: computeSeoHealth(seoTitle, description),
          contentQuality: computeContentQuality(content, wordCount),
          cpsScore: null,
          indexStatus: 'Pending GSC Check',
          type: 'mdx',
        });
      } catch {
        // Skip broken cross-market files
      }
    }
  }

  return rows;
}

// ── Core Routes ────────────────────────────────────────────────

function getCoreRouteRows(): ContentHubRow[] {
  return CORE_ROUTES.map((route) => ({
    url: route.url,
    filePath: '',
    market: route.url.startsWith('/uk')
      ? 'UK'
      : route.url.startsWith('/ca')
        ? 'CA'
        : route.url.startsWith('/au')
          ? 'AU'
          : 'US',
    category: 'core',
    title: route.title,
    seoTitle: route.title,
    description: '',
    wordCount: 0,
    sizeKB: 0,
    httpStatus: null,
    httpHealth: 'yellow',
    seoHealth: { titleStatus: 'yellow', titleLength: 0, descStatus: 'yellow', descLength: 0, overall: 'yellow' },
    contentQuality: EMPTY_QUALITY,
    cpsScore: null,
    indexStatus: 'Pending GSC Check',
    type: 'core',
  }));
}

// ── HTTP Health Check (batch, internal) ────────────────────────

async function checkHttpHealth(
  rows: ContentHubRow[],
  baseUrl: string
): Promise<ContentHubRow[]> {
  // Batch check with concurrency limit to avoid self-DoS
  const CONCURRENCY = 10;
  const results = [...rows];

  for (let i = 0; i < results.length; i += CONCURRENCY) {
    const batch = results.slice(i, i + CONCURRENCY);
    const checks = batch.map(async (row, idx) => {
      try {
        const res = await fetch(`${baseUrl}${row.url}`, {
          method: 'HEAD',
          redirect: 'follow',
          signal: AbortSignal.timeout(5000),
        });
        results[i + idx] = {
          ...results[i + idx],
          httpStatus: res.status,
          httpHealth: res.status >= 200 && res.status < 400 ? 'green' : 'red',
        };
      } catch {
        results[i + idx] = {
          ...results[i + idx],
          httpStatus: null,
          httpHealth: 'yellow',
        };
      }
    });
    await Promise.all(checks);
  }

  return results;
}

// ── Aggregated Stats ───────────────────────────────────────────

export interface ContentHubStats {
  totalPages: number;
  mdxPages: number;
  corePages: number;
  avgWordCount: number;
  totalWords: number;
  avgQuality: number;
  qualityGreen: number;
  qualityYellow: number;
  qualityRed: number;
  avgCps: number;
  pagesWithCps: number;
  seoGreen: number;
  seoYellow: number;
  seoRed: number;
  httpGreen: number;
  httpRed: number;
  httpUnknown: number;
  marketBreakdown: Record<string, number>;
}

function computeStats(rows: ContentHubRow[]): ContentHubStats {
  const mdxRows = rows.filter((r) => r.type === 'mdx');
  const totalWords = mdxRows.reduce((sum, r) => sum + r.wordCount, 0);
  const totalQuality = mdxRows.reduce((sum, r) => sum + r.contentQuality.score, 0);
  const cpsRows = rows.filter((r) => r.cpsScore !== null);
  const totalCps = cpsRows.reduce((sum, r) => sum + (r.cpsScore || 0), 0);
  const marketBreakdown: Record<string, number> = {};

  for (const row of rows) {
    marketBreakdown[row.market] = (marketBreakdown[row.market] || 0) + 1;
  }

  return {
    totalPages: rows.length,
    mdxPages: mdxRows.length,
    corePages: rows.filter((r) => r.type === 'core').length,
    avgWordCount: mdxRows.length > 0 ? Math.round(totalWords / mdxRows.length) : 0,
    totalWords,
    avgQuality: mdxRows.length > 0 ? Math.round(totalQuality / mdxRows.length) : 0,
    qualityGreen: mdxRows.filter((r) => r.contentQuality.score >= 80).length,
    qualityYellow: mdxRows.filter((r) => r.contentQuality.score >= 50 && r.contentQuality.score < 80).length,
    qualityRed: mdxRows.filter((r) => r.contentQuality.score < 50).length,
    avgCps: cpsRows.length > 0 ? Math.round(totalCps / cpsRows.length) : 0,
    pagesWithCps: cpsRows.length,
    seoGreen: rows.filter((r) => r.seoHealth.overall === 'green').length,
    seoYellow: rows.filter((r) => r.seoHealth.overall === 'yellow').length,
    seoRed: rows.filter((r) => r.seoHealth.overall === 'red').length,
    httpGreen: rows.filter((r) => r.httpHealth === 'green').length,
    httpRed: rows.filter((r) => r.httpHealth === 'red').length,
    httpUnknown: rows.filter((r) => r.httpHealth === 'yellow').length,
    marketBreakdown,
  };
}

// ── Main Export (cached) ───────────────────────────────────────

export const getContentHubData = unstable_cache(
  async (runHttpChecks = false): Promise<{ rows: ContentHubRow[]; stats: ContentHubStats }> => {
    const mdxRows = scanMdxFiles();
    const coreRows = getCoreRouteRows();
    let allRows = [...coreRows, ...mdxRows];

    // Sort: core routes first, then by market → category → title
    allRows.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'core' ? -1 : 1;
      if (a.market !== b.market) return a.market.localeCompare(b.market);
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.title.localeCompare(b.title);
    });

    // HTTP checks only when explicitly requested (skipped during static render)
    if (runHttpChecks) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';
      allRows = await checkHttpHealth(allRows, baseUrl);
    }

    // Merge CPS scores from competitor snapshots (Serper.dev DB)
    try {
      const cpsScores = await loadCpsScores();
      if (cpsScores.size > 0) {
        for (const row of allRows) {
          const urlPath = row.url.replace(/\/$/, '') || '/';
          row.cpsScore = cpsScores.get(urlPath) ?? null;
        }
      }
    } catch {
      // CPS loading is optional — don't break the hub if it fails
    }

    return { rows: allRows, stats: computeStats(allRows) };
  },
  ['content-hub-data'],
  { revalidate: 600, tags: ['content-hub'] } // 10 min TTL, invalidate via revalidateTag('content-hub')
);
