'use server';

import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';

// ── Types ────────────────────────────────────────────────────

export interface ContentOverride {
  id: string;
  slug: string;
  boost_date: string;
  reason: string | null;
  created_at: string;
}

export interface FreshnessBoostResult {
  success: boolean;
  slug: string;
  boost_date: string;
  error?: string;
}

// ── Safe query helper ────────────────────────────────────────

type SupabaseResult<T> = {
  data: T | null;
  error: { code?: string; message?: string } | null;
};

function safeSingle<T>(result: SupabaseResult<T>): T | null {
  if (result.error) {
    if (
      result.error.code === 'PGRST204' ||
      result.error.code === '42P01' ||
      result.error.message?.includes('schema cache') ||
      result.error.message?.includes('does not exist')
    ) {
      return null;
    }
    console.warn('[content-overrides] Query warning:', result.error.message);
  }
  return result.data;
}

function safeRows<T>(result: {
  data: T[] | null;
  error: { code?: string; message?: string } | null;
}): T[] {
  if (result.error) {
    if (
      result.error.code === 'PGRST204' ||
      result.error.code === '42P01' ||
      result.error.message?.includes('schema cache') ||
      result.error.message?.includes('does not exist')
    ) {
      return [];
    }
    console.warn('[content-overrides] Query warning:', result.error.message);
  }
  return result.data || [];
}

// ── Core Actions ─────────────────────────────────────────────

/**
 * Trigger a freshness boost for a given slug.
 * Upserts into content_overrides so only ONE active override
 * exists per slug (the latest boost_date wins).
 *
 * @param slug  – full URL path, e.g. '/uk/trading/etoro-review'
 * @param reason – optional reason, e.g. 'Ranking drop detected'
 */
export async function triggerFreshnessBoost(
  slug: string,
  reason?: string,
): Promise<FreshnessBoostResult> {
  const boostDate = new Date().toISOString();

  try {
    const supabase = createServiceClient();

    const { error } = await supabase.from('content_overrides').upsert(
      {
        slug,
        boost_date: boostDate,
        reason: reason || null,
        created_at: boostDate,
      },
      { onConflict: 'slug' },
    );

    if (error) {
      console.error('[content-overrides] Upsert failed:', error.message);
      return { success: false, slug, boost_date: boostDate, error: error.message };
    }

    return { success: true, slug, boost_date: boostDate };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[content-overrides] triggerFreshnessBoost error:', msg);
    return { success: false, slug, boost_date: boostDate, error: msg };
  }
}

/**
 * Remove a freshness boost for a given slug.
 */
export async function removeFreshnessBoost(
  slug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('content_overrides')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.error('[content-overrides] Delete failed:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Get all active content overrides.
 * Used by the dashboard to display which slugs have active boosts.
 */
export async function getContentOverrides(): Promise<ContentOverride[]> {
  const supabase = createServiceClient();

  const result = await supabase
    .from('content_overrides')
    .select('*')
    .order('boost_date', { ascending: false })
    .limit(100);

  return safeRows(result) as ContentOverride[];
}

/**
 * Get a single content override by slug.
 */
export async function getContentOverrideBySlug(
  slug: string,
): Promise<ContentOverride | null> {
  const supabase = createServiceClient();

  const result = await supabase
    .from('content_overrides')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  return safeSingle(result) as ContentOverride | null;
}

// ── On-Demand ISR Revalidation ──────────────────────────────

export interface RevalidateResult {
  success: boolean;
  error?: string;
}

/**
 * Fast-path: Trigger on-demand ISR revalidation for a single slug.
 * Calls the local /api/revalidate endpoint which uses Next.js revalidatePath().
 * This is instant — no full rebuild needed.
 */
async function triggerRevalidation(slug: string): Promise<RevalidateResult> {
  const cronSecret = process.env.CRON_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (!cronSecret) {
    return { success: false, error: 'CRON_SECRET not configured' };
  }

  try {
    const res = await fetch(`${siteUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('[content-overrides] Revalidation failed:', res.status, text);
      return { success: false, error: `Revalidation returned ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[content-overrides] Revalidation error:', msg);
    return { success: false, error: msg };
  }
}

// ── Deploy Hook (Full Rebuild) ──────────────────────────────

export interface DeployHookResult {
  success: boolean;
  error?: string;
}

/**
 * Trigger a full deployment via webhook (e.g. Cloudways, Vercel, Netlify).
 * The DEPLOY_HOOK_URL env var should be a POST endpoint that triggers a rebuild.
 * Used as fallback when ISR revalidation is not available.
 */
export async function triggerDeployHook(): Promise<DeployHookResult> {
  const hookUrl = process.env.DEPLOY_HOOK_URL;

  if (!hookUrl) {
    console.warn('[content-overrides] DEPLOY_HOOK_URL not configured');
    return { success: false, error: 'DEPLOY_HOOK_URL not configured' };
  }

  try {
    const res = await fetch(hookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger: 'freshness-boost', timestamp: new Date().toISOString() }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[content-overrides] Deploy hook failed:', res.status, text);
      return { success: false, error: `Deploy hook returned ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[content-overrides] Deploy hook error:', msg);
    return { success: false, error: msg };
  }
}

// ── Combined: Boost + Revalidate + Deploy ────────────────────

export interface BoostAndDeployResult {
  boostSuccess: boolean;
  revalidateSuccess: boolean;
  deploySuccess: boolean;
  slug: string;
  boost_date: string;
  error?: string;
}

/**
 * Combined action: Freshness Boost → ISR Revalidation → Deploy Hook.
 *
 * Strategy (fast to slow):
 *   1. Write freshness boost to Supabase (content_overrides)
 *   2. Try fast ISR revalidation via /api/revalidate (instant, no rebuild)
 *   3. If DEPLOY_HOOK_URL is set, also fire the deploy hook (full rebuild)
 *
 * Used by the Ranking Dashboard's "Boost Freshness" button.
 */
export async function boostAndDeploy(
  slug: string,
  reason?: string,
): Promise<BoostAndDeployResult> {
  // Step 1: Write the freshness boost to Supabase
  const boostResult = await triggerFreshnessBoost(slug, reason);

  if (!boostResult.success) {
    return {
      boostSuccess: false,
      revalidateSuccess: false,
      deploySuccess: false,
      slug,
      boost_date: boostResult.boost_date,
      error: boostResult.error,
    };
  }

  // Step 2: Try fast ISR revalidation (instant cache invalidation)
  const revalidateResult = await triggerRevalidation(slug);

  // Step 3: If DEPLOY_HOOK_URL is set, also fire a full rebuild
  //         (the deploy hook creates a fully fresh SSG build)
  let deployResult: DeployHookResult = { success: false, error: 'Skipped — no DEPLOY_HOOK_URL' };
  if (process.env.DEPLOY_HOOK_URL) {
    deployResult = await triggerDeployHook();
  }

  return {
    boostSuccess: true,
    revalidateSuccess: revalidateResult.success,
    deploySuccess: deployResult.success,
    slug,
    boost_date: boostResult.boost_date,
    error: !revalidateResult.success && !deployResult.success
      ? revalidateResult.error || deployResult.error
      : undefined,
  };
}
