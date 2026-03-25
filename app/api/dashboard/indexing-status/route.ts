// app/api/dashboard/indexing-status/route.ts
// Returns persistent indexing status: sitemap count, submitted, remaining, indexed.
// Called on IndexingCard mount to show status without submitting anything.

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
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
    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
    const EXCLUDED = ['/dashboard', '/api/', '/login', '/_next', '/go/'];
    const prodBase = 'https://smartfinpro.com';

    allUrls = matches
      .map((m) => {
        let url = m[1].trim();
        if (url && !url.startsWith(prodBase)) {
          try {
            const parsed = new URL(url);
            url = `${prodBase}${parsed.pathname}`;
          } catch {
            return '';
          }
        }
        return url;
      })
      .filter((u) => u && !EXCLUDED.some((ex) => u.includes(ex)));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sitemap fetch failed' },
      { status: 502 },
    );
  }

  // Query indexing_log for counts
  const supabase = createServiceClient();

  const { data: logs } = await supabase
    .from('indexing_log')
    .select('url, status, indexed_status, indexed_checked_at')
    .eq('status', 'success');

  const submittedUrls = new Set((logs ?? []).map((l) => l.url));
  const alreadySubmitted = submittedUrls.size;
  const remaining = Math.max(0, allUrls.length - alreadySubmitted);

  // Count indexed status
  const indexed = (logs ?? []).filter((l) => l.indexed_status === 'indexed').length;
  const notIndexed = (logs ?? []).filter((l) => l.indexed_status === 'not_indexed').length;
  const unchecked = alreadySubmitted - indexed - notIndexed;

  // Find most recent check timestamp
  const checkedLogs = (logs ?? []).filter((l) => l.indexed_checked_at);
  const lastCheckedAt = checkedLogs.length > 0
    ? checkedLogs.reduce((latest, l) =>
        l.indexed_checked_at! > latest ? l.indexed_checked_at! : latest,
        checkedLogs[0].indexed_checked_at!
      )
    : null;

  return NextResponse.json({
    totalInSitemap: allUrls.length,
    alreadySubmitted,
    remaining,
    indexed,
    notIndexed,
    unchecked,
    lastCheckedAt,
  });
}
