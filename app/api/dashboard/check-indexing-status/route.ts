// app/api/dashboard/check-indexing-status/route.ts
// Checks actual Google indexing status for submitted URLs via URL Inspection API.
// Updates indexing_log with indexed_status + indexed_checked_at.
// Caches results: only re-checks URLs not checked in the last 24 hours.

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { inspectBatchUrls } from '@/lib/seo/url-inspection';

const CHECK_LIMIT = 200; // Max URLs to check per request (API: 2000/day)
const CACHE_HOURS = 24;  // Re-check after this many hours

export async function GET() {
  const supabase = createServiceClient();

  // Load all successfully submitted URLs
  const { data: logs, error } = await supabase
    .from('indexing_log')
    .select('id, url, indexed_status, indexed_checked_at')
    .eq('status', 'success');

  if (error) {
    return NextResponse.json(
      { error: `DB query failed: ${error.message}` },
      { status: 500 },
    );
  }

  if (!logs || logs.length === 0) {
    return NextResponse.json({
      totalSubmitted: 0,
      indexed: 0,
      notIndexed: 0,
      unchecked: 0,
      checkedNow: 0,
      cachedResults: 0,
    });
  }

  // Determine which URLs need (re-)checking
  const cutoff = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
  const needsCheck = logs.filter(
    (l) => !l.indexed_checked_at || l.indexed_checked_at < cutoff
  );
  const cached = logs.filter(
    (l) => l.indexed_checked_at && l.indexed_checked_at >= cutoff
  );

  // Check URLs that need it (respect daily limit)
  const urlsToCheck = needsCheck.slice(0, CHECK_LIMIT).map((l) => l.url);
  let checkedNow = 0;

  if (urlsToCheck.length > 0) {
    const results = await inspectBatchUrls(urlsToCheck, CHECK_LIMIT);
    checkedNow = results.checked;

    // Update DB with results
    for (const r of results.results) {
      const logEntry = needsCheck.find((l) => l.url === r.url);
      if (logEntry) {
        await supabase
          .from('indexing_log')
          .update({
            indexed_status: r.status,
            indexed_checked_at: new Date().toISOString(),
          })
          .eq('id', logEntry.id);

        // Update local reference for final count
        logEntry.indexed_status = r.status;
        logEntry.indexed_checked_at = new Date().toISOString();
      }
    }
  }

  // Calculate final counts from all logs (cached + freshly checked)
  const allLogs = [...cached, ...needsCheck];
  const indexed = allLogs.filter((l) => l.indexed_status === 'indexed').length;
  const notIndexed = allLogs.filter((l) => l.indexed_status === 'not_indexed').length;
  const unchecked = allLogs.filter((l) => !l.indexed_status).length;

  return NextResponse.json({
    totalSubmitted: logs.length,
    indexed,
    notIndexed,
    unchecked,
    checkedNow,
    cachedResults: cached.length,
  });
}
