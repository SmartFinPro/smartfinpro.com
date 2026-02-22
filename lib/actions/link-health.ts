'use server';

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { invalidateRegistry, loadRegistry } from '@/lib/affiliate/link-registry';
import type { LinkHealthResult } from '@/types';

/**
 * Check a single affiliate link's destination for availability.
 * Uses HEAD request with a short timeout to minimize latency.
 */
async function checkSingleLink(
  linkId: string,
  slug: string,
  destinationUrl: string
): Promise<LinkHealthResult> {
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(destinationUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'SmartFinPro-LinkChecker/1.0',
      },
    });

    clearTimeout(timeout);
    const elapsed = Date.now() - start;

    return {
      link_id: linkId,
      slug,
      status_code: res.status,
      healthy: res.status >= 200 && res.status < 400,
      response_time_ms: elapsed,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    const elapsed = Date.now() - start;
    return {
      link_id: linkId,
      slug,
      status_code: null,
      healthy: false,
      response_time_ms: elapsed,
      checked_at: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Run health checks on all active affiliate links.
 * Updates the health_status and last_health_check fields in Supabase.
 */
export async function runHealthChecks(): Promise<{
  results: LinkHealthResult[];
  healthy: number;
  degraded: number;
  dead: number;
}> {
  const links = await loadRegistry();
  const activeLinks = links.filter((l) => l.active);

  // Run checks in batches of 5 to avoid overwhelming targets
  const batchSize = 5;
  const results: LinkHealthResult[] = [];

  for (let i = 0; i < activeLinks.length; i += batchSize) {
    const batch = activeLinks.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((link) =>
        checkSingleLink(link.id, link.slug, link.destination_url)
      )
    );
    results.push(...batchResults);
  }

  // Persist results to Supabase
  const supabase = await createClient();

  for (const result of results) {
    const healthStatus = result.healthy
      ? result.response_time_ms && result.response_time_ms > 5000
        ? 'degraded'
        : 'healthy'
      : 'dead';

    await supabase
      .from('affiliate_links')
      .update({
        health_status: healthStatus,
        last_health_check: result.checked_at,
      })
      .eq('id', result.link_id);
  }

  // Invalidate cache so next read picks up new health data
  invalidateRegistry();

  const healthy = results.filter((r) => r.healthy && (r.response_time_ms ?? 0) <= 5000).length;
  const degraded = results.filter((r) => r.healthy && (r.response_time_ms ?? 0) > 5000).length;
  const dead = results.filter((r) => !r.healthy).length;

  return { results, healthy, degraded, dead };
}

/**
 * Check a single link by ID (for on-demand checks from dashboard)
 */
export async function checkLinkHealth(linkId: string): Promise<LinkHealthResult | null> {
  const supabase = await createClient();

  const { data: link, error } = await supabase
    .from('affiliate_links')
    .select('id, slug, destination_url')
    .eq('id', linkId)
    .single();

  if (error || !link) return null;

  const result = await checkSingleLink(link.id, link.slug, link.destination_url);

  const healthStatus = result.healthy
    ? result.response_time_ms && result.response_time_ms > 5000
      ? 'degraded'
      : 'healthy'
    : 'dead';

  await supabase
    .from('affiliate_links')
    .update({
      health_status: healthStatus,
      last_health_check: result.checked_at,
    })
    .eq('id', linkId);

  invalidateRegistry();

  return result;
}

/**
 * Get links with expiring offers (within N days) and expired-but-active links
 */
export async function getOfferExpiryReport(withinDays: number = 14): Promise<{
  expiringSoon: Array<{
    id: string;
    slug: string;
    partner_name: string;
    market: string;
    offer_expires_at: string;
    days_remaining: number;
  }>;
  expiredActive: Array<{
    id: string;
    slug: string;
    partner_name: string;
    market: string;
    offer_expires_at: string;
    days_overdue: number;
  }>;
}> {
  const links = await loadRegistry();
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);

  const expiringSoon: Array<{
    id: string;
    slug: string;
    partner_name: string;
    market: string;
    offer_expires_at: string;
    days_remaining: number;
  }> = [];

  const expiredActive: Array<{
    id: string;
    slug: string;
    partner_name: string;
    market: string;
    offer_expires_at: string;
    days_overdue: number;
  }> = [];

  for (const link of links) {
    if (!link.offer_expires_at) continue;
    const expires = new Date(link.offer_expires_at);

    if (expires < now && link.active) {
      const diffMs = now.getTime() - expires.getTime();
      expiredActive.push({
        id: link.id,
        slug: link.slug,
        partner_name: link.partner_name,
        market: link.market,
        offer_expires_at: link.offer_expires_at,
        days_overdue: Math.ceil(diffMs / (1000 * 60 * 60 * 24)),
      });
    } else if (expires >= now && expires <= cutoff) {
      const diffMs = expires.getTime() - now.getTime();
      expiringSoon.push({
        id: link.id,
        slug: link.slug,
        partner_name: link.partner_name,
        market: link.market,
        offer_expires_at: link.offer_expires_at,
        days_remaining: Math.ceil(diffMs / (1000 * 60 * 60 * 24)),
      });
    }
  }

  // Sort by urgency
  expiringSoon.sort((a, b) => a.days_remaining - b.days_remaining);
  expiredActive.sort((a, b) => b.days_overdue - a.days_overdue);

  return { expiringSoon, expiredActive };
}

/**
 * Bulk search & replace a URL parameter across all links
 */
export async function bulkReplaceParam(
  paramKey: string,
  oldValue: string,
  newValue: string
): Promise<{ updated: number; errors: string[] }> {
  const supabase = await createClient();
  const links = await loadRegistry();

  let updated = 0;
  const errors: string[] = [];

  for (const link of links) {
    try {
      const url = new URL(link.destination_url);
      if (url.searchParams.get(paramKey) === oldValue) {
        url.searchParams.set(paramKey, newValue);
        const { error } = await supabase
          .from('affiliate_links')
          .update({ destination_url: url.toString() })
          .eq('id', link.id);

        if (error) {
          errors.push(`${link.slug}: ${error.message}`);
        } else {
          updated++;
        }
      }
    } catch {
      errors.push(`${link.slug}: Invalid URL`);
    }
  }

  if (updated > 0) invalidateRegistry();

  return { updated, errors };
}
