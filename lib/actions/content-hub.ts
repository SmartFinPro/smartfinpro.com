// lib/actions/content-hub.ts — Content Hub data aggregation + health checks
'use server';
import 'server-only';

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unstable_cache } from 'next/cache';

// ── Types ──────────────────────────────────────────────────────

export type HealthStatus = 'green' | 'yellow' | 'red';

export interface SeoHealth {
  titleStatus: HealthStatus;
  titleLength: number;
  descStatus: HealthStatus;
  descLength: number;
  overall: HealthStatus;
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

    return { rows: allRows, stats: computeStats(allRows) };
  },
  ['content-hub-data'],
  { revalidate: 600 } // 10 min TTL
);
