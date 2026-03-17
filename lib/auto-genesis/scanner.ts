// lib/auto-genesis/scanner.ts
// Pure server-side scanner utility — NO 'use server' directive.
// Used by both the dashboard page (Server Component) and the
// auto-genesis server action (cron pipeline).

import 'server-only';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { markets, categories, marketCategories } from '@/lib/i18n/config';
import type { Market, Category } from '@/lib/i18n/config';

const SEO_TEXTE_DIR = path.join(process.cwd(), 'seo texte');
const CONTENT_DIR = path.join(process.cwd(), 'content');

// ── Types ────────────────────────────────────────────────────

export interface PendingBrief {
  folderName: string;
  briefPath: string;
  absoluteMdPath: string;
  market: Market;
  category: Category;
  slug: string | null;
  keyword: string;
  briefContent: string;
  briefHash: string;
  seoAssets: SeoAssets;
  folderMtime: number;
}

export interface SeoAssets {
  metaTitle: string | null;
  metaDescription: string | null;
  longDescription: string | null;
  schemaJson: string | null;
  legalDisclaimer: string | null;
}

export interface ScanSummary {
  scanned: number;
  pending: PendingBrief[];
  alreadyExist: number;
  alreadyProcessed: number;
  parseErrors: number;
}

// ── Folder Name Parser ──────────────────────────────────────

const SORTED_CATEGORIES = [...categories].sort((a, b) => b.length - a.length);

export function parseFolderName(
  folderName: string,
): { market: Market; category: Category; slug: string | null } | null {
  const marketCandidate = folderName.slice(0, 2) as Market;
  if (!markets.includes(marketCandidate)) return null;
  if (folderName[2] !== '-') return null;

  const rest = folderName.slice(3);

  for (const cat of SORTED_CATEGORIES) {
    if (rest === cat) {
      const validCats = marketCategories[marketCandidate] as readonly string[];
      if (!validCats.includes(cat)) continue;
      return { market: marketCandidate, category: cat as Category, slug: null };
    }
    if (rest.startsWith(cat + '-')) {
      const validCats = marketCategories[marketCandidate] as readonly string[];
      if (!validCats.includes(cat)) continue;
      const slug = rest.slice(cat.length + 1);
      if (!slug) continue;
      return { market: marketCandidate, category: cat as Category, slug };
    }
  }

  return null;
}

// ── SEO Assets Extractor ────────────────────────────────────

export function extractSeoAssets(content: string): SeoAssets {
  const assets: SeoAssets = {
    metaTitle: null,
    metaDescription: null,
    longDescription: null,
    schemaJson: null,
    legalDisclaimer: null,
  };

  const titleMatch = content.match(/###?\s*Meta Title[^:]*:\s*\n(.+)/i);
  if (titleMatch) assets.metaTitle = titleMatch[1].trim();

  const descMatch = content.match(/###?\s*Meta Description[^:]*:\s*\n(.+)/i);
  if (descMatch) assets.metaDescription = descMatch[1].trim();

  const longDescMatch = content.match(/###?\s*144-word Description:\s*\n([\s\S]*?)(?=\n###|\n##|$)/i);
  if (longDescMatch) assets.longDescription = longDescMatch[1].trim();

  const schemaMatch = content.match(/###?\s*Schema\.org JSON-LD:\s*\n```json\n([\s\S]*?)```/i);
  if (schemaMatch) assets.schemaJson = schemaMatch[1].trim();

  const disclaimerMatch = content.match(/###?\s*Legal Disclaimer:\s*\n([\s\S]*?)$/i);
  if (disclaimerMatch) assets.legalDisclaimer = disclaimerMatch[1].trim();

  return assets;
}

// ── Build Enriched Research Brief ───────────────────────────

export function buildEnrichedBrief(brief: PendingBrief): string {
  const hints: string[] = ['SEO VORGABEN (PFLICHT — exakt umsetzen):'];

  if (brief.seoAssets.metaTitle) hints.push(`TITLE: ${brief.seoAssets.metaTitle}`);
  if (brief.seoAssets.metaDescription) hints.push(`META DESCRIPTION: ${brief.seoAssets.metaDescription}`);
  hints.push('TARGET WORD COUNT: 3300');
  if (brief.seoAssets.longDescription) hints.push(`EXTENDED DESCRIPTION: ${brief.seoAssets.longDescription}`);
  if (brief.seoAssets.schemaJson) hints.push(`SCHEMA.ORG REFERENCE: ${brief.seoAssets.schemaJson}`);
  hints.push('---');

  return hints.join('\n') + '\n\n' + brief.briefContent;
}

// ── Filesystem Scanner (no DB dependency) ───────────────────

/**
 * Lightweight scan that only checks filesystem — no DB queries.
 * Used by the dashboard page for quick stats.
 */
export function scanSeoTexteQuick(): {
  totalFolders: number;
  existingMdx: number;
  pending: number;
  pendingFolders: string[];
} {
  let totalFolders = 0;
  let existingMdx = 0;
  const pendingFolders: string[] = [];

  if (!fs.existsSync(SEO_TEXTE_DIR)) {
    return { totalFolders: 0, existingMdx: 0, pending: 0, pendingFolders: [] };
  }

  const entries = fs.readdirSync(SEO_TEXTE_DIR, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory());

  for (const folder of folders) {
    const parsed = parseFolderName(folder.name);
    if (!parsed) continue;

    totalFolders++;

    const { market, category, slug } = parsed;
    const mdxFileName = slug ? `${slug}.mdx` : 'index.mdx';
    const mdxPath = path.join(CONTENT_DIR, market, category, mdxFileName);

    if (fs.existsSync(mdxPath)) {
      existingMdx++;
    } else {
      pendingFolders.push(folder.name);
    }
  }

  return {
    totalFolders,
    existingMdx,
    pending: pendingFolders.length,
    pendingFolders,
  };
}

// ── Full Scanner (with DB idempotency check) ────────────────

export async function scanForPendingBriefs(
  supabase: ReturnType<typeof import('@/lib/supabase/server').createServiceClient>,
): Promise<ScanSummary> {
  let scanned = 0;
  let alreadyExist = 0;
  let alreadyProcessed = 0;
  let parseErrors = 0;
  const pending: PendingBrief[] = [];

  if (!fs.existsSync(SEO_TEXTE_DIR)) {
    return { scanned: 0, pending: [], alreadyExist: 0, alreadyProcessed: 0, parseErrors: 0 };
  }

  const entries = fs.readdirSync(SEO_TEXTE_DIR, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory());

  for (const folder of folders) {
    scanned++;

    const parsed = parseFolderName(folder.name);
    if (!parsed) {
      parseErrors++;
      continue;
    }

    const { market, category, slug } = parsed;

    const folderPath = path.join(SEO_TEXTE_DIR, folder.name);
    const filesInFolder = fs.readdirSync(folderPath);
    const mdFile = filesInFolder.find((f) => f.endsWith('.md'));
    if (!mdFile) continue;

    const mdxFileName = slug ? `${slug}.mdx` : 'index.mdx';
    const mdxPath = path.join(CONTENT_DIR, market, category, mdxFileName);

    if (fs.existsSync(mdxPath)) {
      alreadyExist++;
      continue;
    }

    const absoluteMdPath = path.join(folderPath, mdFile);
    let briefContent: string;
    try {
      briefContent = fs.readFileSync(absoluteMdPath, 'utf-8');
    } catch {
      continue;
    }

    const briefHash = crypto.createHash('sha256').update(briefContent).digest('hex');

    // Check DB for existing completed entry
    try {
      const { data: existing } = await supabase
        .from('auto_genesis_log')
        .select('status')
        .eq('brief_path', folder.name)
        .eq('brief_hash', briefHash)
        .maybeSingle();

      if (existing?.status === 'completed') {
        alreadyProcessed++;
        continue;
      }
    } catch {
      // Table may not exist yet — skip DB check
    }

    const seoAssets = extractSeoAssets(briefContent);
    const keyword = slug
      ? slug.replace(/-/g, ' ')
      : `best ${category.replace(/-/g, ' ')} ${market}`;

    const folderStat = fs.statSync(folderPath);

    pending.push({
      folderName: folder.name,
      briefPath: `seo texte/${folder.name}`,
      absoluteMdPath,
      market,
      category,
      slug,
      keyword,
      briefContent,
      briefHash,
      seoAssets,
      folderMtime: folderStat.mtimeMs,
    });
  }

  pending.sort((a, b) => b.folderMtime - a.folderMtime);

  return { scanned, pending, alreadyExist, alreadyProcessed, parseErrors };
}
