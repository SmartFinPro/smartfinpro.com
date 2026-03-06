// lib/actions/backlinks.ts — Backlink data loading, CSV import, internal link scanning
'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import type {
  Backlink,
  BacklinkCounts,
  BacklinkImportResult,
  BacklinkCsvMapping,
  GSC_COLUMN_NAMES,
} from '@/lib/types/backlink';
import { GSC_COLUMN_NAMES as COLUMN_NAMES } from '@/lib/types/backlink';
import fs from 'fs/promises';
import path from 'path';

// ── Load aggregated backlink counts per URL ────────────────────
// Used inside getContentHubData() — follows the loadCpsScores() pattern

export async function loadBacklinkCounts(): Promise<Map<string, BacklinkCounts>> {
  const countsMap = new Map<string, BacklinkCounts>();

  try {
    const supabase = createServiceClient();

    // Single query with conditional aggregation
    const { data, error } = await supabase.rpc('get_backlink_counts');

    if (error) {
      // Fallback: manual query if RPC doesn't exist yet
      const { data: rawData, error: rawError } = await supabase
        .from('backlinks')
        .select('target_url, is_lost, first_seen_at');

      if (rawError || !rawData) return countsMap;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Group by target_url
      const grouped = new Map<string, { active: number; new30d: number }>();
      for (const row of rawData) {
        const url = row.target_url as string;
        if (!grouped.has(url)) {
          grouped.set(url, { active: 0, new30d: 0 });
        }
        const entry = grouped.get(url)!;
        if (!row.is_lost) {
          entry.active++;
          if (new Date(row.first_seen_at) >= thirtyDaysAgo) {
            entry.new30d++;
          }
        }
      }

      for (const [url, counts] of grouped) {
        countsMap.set(url, counts);
      }

      return countsMap;
    }

    // RPC returns: [{ target_url, active, new_30d }]
    if (data) {
      for (const row of data as Array<{ target_url: string; active: number; new_30d: number }>) {
        countsMap.set(row.target_url, {
          active: row.active,
          new30d: row.new_30d,
        });
      }
    }
  } catch (err) {
    console.warn('[backlinks] Failed to load backlink counts:', err);
  }

  return countsMap;
}

// ── Get all backlinks for a specific page ──────────────────────
// Used by the backlink detail popup via API route

export async function getBacklinksForPage(targetUrl: string): Promise<Backlink[]> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('backlinks')
      .select('*')
      .eq('target_url', targetUrl)
      .order('is_lost', { ascending: true })
      .order('last_seen_at', { ascending: false });

    if (error) {
      console.error('[backlinks] getBacklinksForPage error:', error);
      return [];
    }

    return (data || []) as Backlink[];
  } catch (err) {
    console.error('[backlinks] getBacklinksForPage error:', err);
    return [];
  }
}

// ── Import backlinks from CSV text ─────────────────────────────

export async function importBacklinksFromCSV(
  csvText: string,
  mapping: BacklinkCsvMapping
): Promise<BacklinkImportResult> {
  const result: BacklinkImportResult = {
    success: false,
    imported: 0,
    updated: 0,
    lost: 0,
    errors: [],
  };

  try {
    const supabase = createServiceClient();
    const batchId = `csv_${Date.now()}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

    // Parse CSV
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      result.errors.push('CSV must have at least a header row and one data row');
      return result;
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);
    const colIdx: Record<string, number> = {};
    for (const [key, value] of Object.entries(mapping)) {
      const idx = headers.findIndex(
        (h) => h.trim().toLowerCase() === value.toLowerCase()
      );
      if (idx >= 0) colIdx[key] = idx;
    }

    if (colIdx.target_url === undefined && colIdx.source_url === undefined) {
      result.errors.push('Could not find target_url or source_url columns in CSV');
      return result;
    }

    // Collect target URLs for lost-detection
    const importedTargetUrls = new Set<string>();
    const rows: Array<{
      target_url: string;
      source_url: string;
      source_domain: string;
      anchor_text: string;
    }> = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);

      let targetUrl = cols[colIdx.target_url] || '';
      let sourceUrl = cols[colIdx.source_url] || '';
      const sourceDomain = cols[colIdx.source_domain] || extractDomain(sourceUrl);
      const anchorText = colIdx.anchor_text !== undefined ? (cols[colIdx.anchor_text] || '') : '';

      // Normalize target URL — strip site domain to get path
      if (targetUrl.startsWith(siteUrl)) {
        targetUrl = targetUrl.slice(siteUrl.length);
      } else if (targetUrl.startsWith('http')) {
        try {
          targetUrl = new URL(targetUrl).pathname;
        } catch {
          result.errors.push(`Row ${i + 1}: Invalid target URL: ${targetUrl}`);
          continue;
        }
      }
      targetUrl = targetUrl.replace(/\/$/, '') || '/';

      if (!sourceUrl) {
        // If only source_domain is provided (GSC "Top linking sites" format)
        if (sourceDomain) {
          sourceUrl = `https://${sourceDomain}`;
        } else {
          continue;
        }
      }

      if (!sourceUrl.startsWith('http')) {
        sourceUrl = `https://${sourceUrl}`;
      }

      rows.push({
        target_url: targetUrl,
        source_url: sourceUrl,
        source_domain: sourceDomain || extractDomain(sourceUrl),
        anchor_text: anchorText,
      });

      importedTargetUrls.add(targetUrl);
    }

    if (rows.length === 0) {
      result.errors.push('No valid rows found in CSV');
      return result;
    }

    // Upsert in batches of 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE).map((r) => ({
        target_url: r.target_url,
        source_url: r.source_url,
        source_domain: r.source_domain,
        anchor_text: r.anchor_text,
        link_type: 'external' as const,
        import_source: 'gsc_csv' as const,
        import_batch_id: batchId,
        last_seen_at: new Date().toISOString(),
        is_lost: false,
      }));

      const { error, count } = await supabase
        .from('backlinks')
        .upsert(batch, {
          onConflict: 'target_url,source_url',
          ignoreDuplicates: false,
        });

      if (error) {
        result.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        result.imported += batch.length;
      }
    }

    // Mark lost links: existing external links for these target URLs that weren't in this import
    const targetUrlArray = Array.from(importedTargetUrls);
    for (let i = 0; i < targetUrlArray.length; i += 50) {
      const urlBatch = targetUrlArray.slice(i, i + 50);
      const { data: lostData, error: lostError } = await supabase
        .from('backlinks')
        .update({ is_lost: true, updated_at: new Date().toISOString() })
        .in('target_url', urlBatch)
        .eq('link_type', 'external')
        .eq('import_source', 'gsc_csv')
        .neq('import_batch_id', batchId)
        .eq('is_lost', false)
        .select('id');

      if (!lostError && lostData) {
        result.lost += lostData.length;
      }
    }

    result.success = true;

    // Invalidate content-hub cache
    revalidateTag('content-hub', {});
  } catch (err) {
    console.error('[backlinks] importBacklinksFromCSV error:', err);
    result.errors.push(String(err));
  }

  return result;
}

// ── Scan MDX files for internal backlinks ──────────────────────

export async function scanInternalBacklinks(): Promise<{
  success: boolean;
  found: number;
  errors: string[];
}> {
  const result = { success: false, found: 0, errors: [] as string[] };

  try {
    const supabase = createServiceClient();
    const contentDir = path.join(process.cwd(), 'content');
    const batchId = `internal_${Date.now()}`;

    // Recursively find all MDX files
    const mdxFiles = await findMdxFiles(contentDir);
    const internalLinks: Array<{
      target_url: string;
      source_url: string;
      source_domain: string;
      anchor_text: string;
    }> = [];

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

    for (const filePath of mdxFiles) {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(contentDir, filePath);

      // Determine source URL from file path
      // content/us/ai-tools/chatgpt-review.mdx → /ai-tools/chatgpt-review
      // content/uk/trading/etoro-review.mdx → /uk/trading/etoro-review
      const sourceUrl = mdxPathToUrl(relativePath);

      // Find all internal links: [text](/path) or [text](https://smartfinpro.com/path)
      const linkRegex = /\[([^\]]*)\]\((\/?[^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        const anchorText = match[1];
        let href = match[2];

        // Skip external links, anchors, mailto, etc.
        if (href.startsWith('http') && !href.startsWith(siteUrl)) continue;
        if (href.startsWith('#') || href.startsWith('mailto:')) continue;

        // Normalize to path
        if (href.startsWith(siteUrl)) {
          href = href.slice(siteUrl.length);
        }
        href = href.split('#')[0].split('?')[0]; // Remove hash and query
        href = href.replace(/\/$/, '') || '/';

        // Skip self-links
        if (href === sourceUrl) continue;

        // Skip /go/ affiliate links
        if (href.startsWith('/go/')) continue;

        internalLinks.push({
          target_url: href,
          source_url: `${siteUrl}${sourceUrl}`,
          source_domain: 'smartfinpro.com',
          anchor_text: anchorText.slice(0, 200), // Truncate
        });
      }
    }

    if (internalLinks.length === 0) {
      result.success = true;
      return result;
    }

    // First, clear old internal scan results
    await supabase
      .from('backlinks')
      .delete()
      .eq('import_source', 'internal_scan');

    // Insert in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < internalLinks.length; i += BATCH_SIZE) {
      const batch = internalLinks.slice(i, i + BATCH_SIZE).map((l) => ({
        target_url: l.target_url,
        source_url: l.source_url,
        source_domain: l.source_domain,
        anchor_text: l.anchor_text,
        link_type: 'internal' as const,
        import_source: 'internal_scan' as const,
        import_batch_id: batchId,
        is_lost: false,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('backlinks')
        .upsert(batch, {
          onConflict: 'target_url,source_url',
          ignoreDuplicates: false,
        });

      if (error) {
        result.errors.push(`Internal batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        result.found += batch.length;
      }
    }

    result.success = true;

    // Invalidate content-hub cache
    revalidateTag('content-hub', {});
  } catch (err) {
    console.error('[backlinks] scanInternalBacklinks error:', err);
    result.errors.push(String(err));
  }

  return result;
}

// ── Helper: Parse a CSV line (handles quoted fields) ───────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ── Helper: Extract domain from URL ────────────────────────────

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.split('/')[0].replace(/^www\./, '');
  }
}

// ── Helper: Recursively find .mdx files ────────────────────────

async function findMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip _templates and hidden dirs
        if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
        const subFiles = await findMdxFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  } catch {
    // Ignore read errors
  }

  return files;
}

// ── Helper: Convert MDX file path to URL ───────────────────────

function mdxPathToUrl(relativePath: string): string {
  // content/us/ai-tools/chatgpt-review.mdx → /ai-tools/chatgpt-review
  // content/uk/trading/etoro-review.mdx → /uk/trading/etoro-review
  // content/au/forex/ig-review/index.mdx → /au/forex/ig-review
  let url = relativePath
    .replace(/\.mdx$/, '')
    .replace(/\/index$/, '')
    .replace(/\\/g, '/');

  // US market has no prefix
  if (url.startsWith('us/')) {
    url = url.slice(2); // "us/ai-tools/foo" → "/ai-tools/foo"
  }

  if (!url.startsWith('/')) url = '/' + url;
  return url;
}
