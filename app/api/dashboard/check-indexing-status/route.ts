// app/api/dashboard/check-indexing-status/route.ts
// Checks actual Google indexing status for submitted URLs via URL Inspection API.
// Updates indexing_log with indexed_status + indexed_checked_at.
// Caches results: only re-checks URLs not checked in the last 24 hours.
// Protected by proxy.ts API auth gate (JSON 401 if unauthenticated).

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { inspectBatchUrls } from '@/lib/seo/url-inspection';

const CHECK_LIMIT = 30; // Max URLs per request (30 × ~500ms ≈ 15s, safe under Cloudflare 100s timeout)
const CACHE_HOURS = 24;  // Re-check after this many hours

export async function GET() {
  const supabase = createServiceClient();

  // Load all successfully submitted URLs
  const { data: logs, error: dbQueryError } = await supabase
    .from('indexing_log')
    .select('id, url, indexed_status, indexed_checked_at')
    .eq('status', 'success');

  if (dbQueryError) {
    return NextResponse.json(
      { error: `DB query failed: ${dbQueryError.message}` },
      { status: 500 },
    );
  }

  if (!logs || logs.length === 0) {
    return NextResponse.json({
      totalSubmitted: 0,
      indexed: 0,
      notIndexed: 0,
      unchecked: 0,
      errors: 0,
      dbErrors: 0,
      checkedNow: 0,
      cachedResults: 0,
      errorSample: null,
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
  let apiErrors = 0;
  let dbErrors = 0;
  let errorSample: string | null = null;

  if (urlsToCheck.length > 0) {
    const results = await inspectBatchUrls(urlsToCheck, CHECK_LIMIT);
    checkedNow = results.checked;
    apiErrors = results.errors;

    // Capture first error message for diagnostics
    const firstError = results.results.find((r) => r.status === 'error');
    if (firstError) errorSample = firstError.verdict;

    // Update DB — for errors: set indexed_checked_at (skip in next batch) but keep indexed_status NULL
    // Note: apiErrors already set from results.errors above — do NOT increment again here
    for (const r of results.results) {
      if (r.status === 'error') {
        // Set indexed_checked_at so this URL is excluded from needsCheck next batch
        // but keep indexed_status as NULL (= unchecked, not false not_indexed)
        const errEntry = needsCheck.find((l) => l.url === r.url);
        if (errEntry) {
          await supabase
            .from('indexing_log')
            .update({ indexed_checked_at: new Date().toISOString() })
            .eq('id', errEntry.id);
          errEntry.indexed_checked_at = new Date().toISOString();
        }
        continue;
      }

      const logEntry = needsCheck.find((l) => l.url === r.url);
      if (logEntry) {
        const { error: updateError } = await supabase
          .from('indexing_log')
          .update({
            indexed_status: r.status,
            indexed_checked_at: new Date().toISOString(),
          })
          .eq('id', logEntry.id);

        if (updateError) {
          dbErrors++;
        } else {
          // Update in-memory reference for final count calculation
          logEntry.indexed_status = r.status;
          logEntry.indexed_checked_at = new Date().toISOString();
        }
      }
    }
  }

  // Calculate final counts from all logs (cached + freshly checked)
  // Note: needsCheck entries that had API errors retain their previous indexed_status
  const allLogs = [...cached, ...needsCheck];
  const indexed = allLogs.filter((l) => l.indexed_status === 'indexed').length;
  const notIndexed = allLogs.filter((l) => l.indexed_status === 'not_indexed').length;
  const unchecked = allLogs.filter((l) => !l.indexed_status).length;

  return NextResponse.json({
    totalSubmitted: logs.length,
    indexed,
    notIndexed,
    unchecked,
    errors: apiErrors,
    dbErrors,
    checkedNow,
    cachedResults: cached.length,
    errorSample,
  });
}
