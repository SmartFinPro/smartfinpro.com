/**
 * Server Actions for Google Indexing API
 * ───────────────────────────────────────
 * Dashboard-safe wrappers for submitting URLs to Google Indexing API.
 */

'use server';

import 'server-only';
import { logger } from '@/lib/logging';

import {
  submitUrlForIndexing,
  submitBatchForIndexing,
  submitNewSiloUrlsForIndexing,
  submitMarketUrlsForIndexing,
  type IndexingResult,
  type BatchIndexingResult,
} from '@/lib/seo/indexing';
import { createClient } from '@/lib/supabase/server';

// ── Server Actions ──────────────────────────────────────────

/**
 * Submit a single URL to Google Indexing API.
 */
export async function indexSingleUrl(url: string): Promise<IndexingResult> {
  return await submitUrlForIndexing(url, 'URL_UPDATED');
}

/**
 * Submit multiple URLs to Google Indexing API.
 */
export async function indexMultipleUrls(urls: string[]): Promise<BatchIndexingResult> {
  return await submitBatchForIndexing(urls, 'URL_UPDATED');
}

/**
 * Submit all new silo URLs for indexing.
 */
export async function indexNewSiloUrls(): Promise<BatchIndexingResult> {
  return await submitNewSiloUrlsForIndexing();
}

/**
 * Submit all URLs from a specific market for indexing.
 */
export async function indexMarketUrls(
  market: 'us' | 'uk' | 'ca' | 'au',
  categories: string[]
): Promise<BatchIndexingResult> {
  return await submitMarketUrlsForIndexing(market, categories);
}

/**
 * Get all content URLs from database and submit for indexing.
 */
export async function indexAllContentUrls(): Promise<BatchIndexingResult> {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

  const { data: content, error } = await supabase
    .from('content_items')
    .select('market, category, slug')
    .eq('status', 'published');

  if (error || !content) {
    return {
      total: 0,
      succeeded: 0,
      failed: 0,
      results: [],
    };
  }

  const urls = content.map(
    (item) => `${baseUrl}/${item.market}/${item.category}/${item.slug}`
  );

  logger.info(`[Indexing API] Submitting ${urls.length} content URLs from database...`);

  return await submitBatchForIndexing(urls, 'URL_UPDATED');
}

/**
 * Log indexing result to database for tracking.
 */
export async function logIndexingResult(result: IndexingResult): Promise<void> {
  const supabase = await createClient();

  await supabase.from('indexing_log').insert({
    url: result.url,
    status: result.status,
    message: result.message,
    submitted_at: result.timestamp,
  });
}
