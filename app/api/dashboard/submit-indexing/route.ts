// app/api/dashboard/submit-indexing/route.ts
// Submits all sitemap URLs to Google Indexing API for fast crawling.
// Protected by proxy.ts (same session auth as all /api/dashboard/* routes).
// Google Indexing API quota: 200 URL notifications per day.

import { NextRequest, NextResponse } from 'next/server';
import { submitBatchForIndexing } from '@/lib/seo/indexing';

const DAILY_QUOTA = 200; // Google Indexing API hard limit

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const limit: number = Math.min(body.limit ?? DAILY_QUOTA, DAILY_QUOTA);

  // Fetch sitemap from localhost to avoid Cloudflare hairpin loop
  const port = process.env.PORT ?? '3000';
  const sitemapUrl = `http://localhost:${port}/sitemap.xml`;

  let urls: string[] = [];

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
    urls = matches
      .map((m) => m[1].trim())
      .filter((u) => u && !EXCLUDED.some((ex) => u.includes(ex)));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sitemap fetch failed' },
      { status: 502 },
    );
  }

  if (urls.length === 0) {
    return NextResponse.json({ error: 'No URLs found in sitemap' }, { status: 400 });
  }

  // Respect daily quota — submit first `limit` URLs (priority order from sitemap)
  const batch = urls.slice(0, limit);
  const skipped = urls.length - batch.length;

  const result = await submitBatchForIndexing(batch, 'URL_UPDATED');

  return NextResponse.json({
    ...result,
    totalInSitemap: urls.length,
    submitted: batch.length,
    skipped,
    quotaNote:
      skipped > 0
        ? `${skipped} URLs übersprungen (Google-Tageslimit: ${DAILY_QUOTA}). Morgen erneut triggern.`
        : null,
  });
}
