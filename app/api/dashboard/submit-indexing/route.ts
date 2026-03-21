// app/api/dashboard/submit-indexing/route.ts
// Submits sitemap URLs to Google Indexing API — skips already-submitted URLs.
// Protected by proxy.ts (same session auth as all /api/dashboard/* routes).
// Google Indexing API quota: 200 URL notifications per day.

import { NextRequest, NextResponse } from 'next/server';
import { submitBatchForIndexing } from '@/lib/seo/indexing';
import { createClient } from '@/lib/supabase/server';

const DAILY_QUOTA = 200; // Google Indexing API hard limit

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const limit: number = Math.min(body.limit ?? DAILY_QUOTA, DAILY_QUOTA);

  // Fetch sitemap from localhost to avoid Cloudflare hairpin loop
  const port = process.env.PORT ?? '3000';
  const sitemapUrl = `http://localhost:${port}/sitemap.xml`;

  let allUrls: string[] = [];

  try {
    const res = await fetch(sitemapUrl, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Sitemap fetch failed: HTTP ${res.status}` },
        { status: 502 },
      );
    }

    const xml = await res.text();

    // Parse all <loc> entries — exclude internal/dashboard/login URLs
    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
    const EXCLUDED = ['/dashboard', '/api/', '/login', '/_next', '/go/'];
    allUrls = matches
      .map((m) => m[1].trim())
      .filter((u) => u && !EXCLUDED.some((ex) => u.includes(ex)));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sitemap fetch failed' },
      { status: 502 },
    );
  }

  if (allUrls.length === 0) {
    return NextResponse.json({ error: 'No URLs found in sitemap' }, { status: 400 });
  }

  // ── Check which URLs were already successfully submitted ──────────
  const supabase = await createClient();
  let alreadySubmittedUrls: Set<string> = new Set();

  try {
    const { data: logs } = await supabase
      .from('indexing_log')
      .select('url')
      .eq('status', 'success')
      .order('submitted_at', { ascending: false });

    if (logs && logs.length > 0) {
      alreadySubmittedUrls = new Set(logs.map((l) => l.url));
    }
  } catch {
    // If table doesn't exist or query fails, proceed without filtering
    console.warn('[Indexing] Could not query indexing_log — submitting all URLs');
  }

  // Filter out already-submitted URLs
  const pendingUrls = allUrls.filter((u) => !alreadySubmittedUrls.has(u));
  const alreadyDone = allUrls.length - pendingUrls.length;

  // If all URLs are already submitted
  if (pendingUrls.length === 0) {
    return NextResponse.json({
      total: 0,
      succeeded: 0,
      failed: 0,
      results: [],
      totalInSitemap: allUrls.length,
      alreadySubmitted: alreadyDone,
      submitted: 0,
      remaining: 0,
      skipped: 0,
      quotaNote: null,
      allDone: true,
      message: `Alle ${allUrls.length} URLs wurden bereits erfolgreich eingereicht. Keine ausstehenden URLs.`,
    });
  }

  // Respect daily quota — submit first `limit` pending URLs
  const batch = pendingUrls.slice(0, limit);
  const remaining = pendingUrls.length - batch.length;

  const result = await submitBatchForIndexing(batch, 'URL_UPDATED');

  // ── Log successful submissions to indexing_log ──────────────────
  const successfulResults = result.results.filter((r) => r.status === 'success');
  if (successfulResults.length > 0) {
    try {
      const rows = successfulResults.map((r) => ({
        url: r.url,
        status: r.status,
        message: r.message,
        submitted_at: r.timestamp,
      }));
      await supabase.from('indexing_log').insert(rows);
    } catch {
      console.warn('[Indexing] Could not log results to indexing_log');
    }
  }

  return NextResponse.json({
    ...result,
    totalInSitemap: allUrls.length,
    alreadySubmitted: alreadyDone,
    submitted: batch.length,
    remaining,
    skipped: remaining,
    allDone: false,
    quotaNote:
      remaining > 0
        ? `${remaining} URLs verbleibend (Google-Tageslimit: ${DAILY_QUOTA}). Morgen erneut einreichen.`
        : null,
  });
}
