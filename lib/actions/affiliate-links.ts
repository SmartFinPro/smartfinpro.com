'use server';

import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logging';

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { AffiliateLink } from '@/types';

// ── Auto-Sync Helper ────────────────────────────────────────
// Syncs affiliate_links data → affiliate_rates table so the
// Genesis Hub (and Revenue Forecast, Optimization Engine, etc.)
// always sees newly-added or updated partners automatically.
// ─────────────────────────────────────────────────────────────

async function syncToAffiliateRates(link: {
  partner_name: string;
  market?: string | null;
  commission_type?: string | null;
  commission_value?: number | null;
  commission_currency?: string | null;
  active?: boolean;
}) {
  try {
    const supabase = createServiceClient(); // affiliate_rates requires service_role

    const upsertData: Record<string, unknown> = {
      provider_name: link.partner_name,
      market: link.market || null,
      commission_type: link.commission_type || 'cpa',
      cpa_value: link.commission_value || 0,
      currency: link.commission_currency || 'USD',
      active: link.active !== false,
      updated_at: new Date().toISOString(),
    };

    // Upsert: insert or update on conflict (provider_name, market)
    const { error } = await supabase
      .from('affiliate_rates')
      .upsert(upsertData, { onConflict: 'provider_name,market' });

    if (error) {
      logger.warn('[affiliate-sync] Failed to sync to affiliate_rates:', error.message);
    } else {
      logger.info(`[affiliate-sync] Synced "${link.partner_name}" (${link.market || 'global'}) → affiliate_rates`);
    }
  } catch (err) {
    Sentry.captureException(err);
    // Non-blocking — log but don't fail the primary operation
    logger.warn('[affiliate-sync] Sync error:', err);
  }
}

async function deactivateInAffiliateRates(partnerName: string, market?: string | null) {
  try {
    const supabase = createServiceClient();

    let query = supabase
      .from('affiliate_rates')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('provider_name', partnerName);

    if (market) {
      query = query.eq('market', market);
    } else {
      query = query.is('market', null);
    }

    const { error } = await query;

    if (error) {
      logger.warn('[affiliate-sync] Failed to deactivate in affiliate_rates:', error.message);
    } else {
      logger.info(`[affiliate-sync] Deactivated "${partnerName}" (${market || 'global'}) in affiliate_rates`);
    }
  } catch (err) {
    Sentry.captureException(err);
    logger.warn('[affiliate-sync] Deactivate error:', err);
  }
}

export async function getAffiliateLinks() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching affiliate links:', error);
      return { error: error.message };
    }

    return { data };
  } catch {
    // Fallback to service client when cookie context is unavailable
    // (e.g. during SSR or when called from Server Components)
    return getAffiliateLinksService();
  }
}

// ── 30s Cached Query (AP-06 Phase 2) ────────────────────────
// Wraps the raw Supabase fetch with a 30-second TTL cache.
// Invalidated immediately by revalidateTag('affiliate-links')
// whenever a link is created, updated, or deleted.
const _fetchLinksService = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      logger.error('[affiliate-links] cache fetch error:', error.message);
      return null;
    }
    return data;
  },
  ['affiliate-links-all'],
  { revalidate: 30, tags: ['affiliate-links'] },
);

/** Cookie-free fetch for Server Components & SSR — cached 30s */
export async function getAffiliateLinksService() {
  try {
    const data = await _fetchLinksService();
    if (data === null) return { error: 'Failed to fetch affiliate links' };
    return { data };
  } catch (err) {
    Sentry.captureException(err);
    logger.error('Error fetching affiliate links (service):', err);
    return { data: [] };
  }
}

export async function getAffiliateLink(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('affiliate_links')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Error fetching affiliate link:', error);
    return { error: error.message };
  }

  return { data };
}

export async function createAffiliateLink(
  link: Omit<AffiliateLink, 'id' | 'created_at'>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('affiliate_links')
    .insert(link)
    .select()
    .single();

  if (error) {
    logger.error('Error creating affiliate link:', error);
    return { error: error.message };
  }

  // Auto-sync to affiliate_rates → Genesis Hub, Revenue Forecast, etc.
  // Use `data` from DB response (includes all columns like commission_currency)
  await syncToAffiliateRates({
    partner_name: data.partner_name,
    market: data.market,
    commission_type: data.commission_type,
    commission_value: data.commission_value,
    commission_currency: (data as Record<string, unknown>).commission_currency as string | undefined,
    active: data.active,
  });

  revalidatePath('/dashboard/links');
  revalidatePath('/dashboard/content/genesis');
  revalidateTag('affiliate-links', {}); // Invalidate 30s cache
  return { data };
}

export async function updateAffiliateLink(
  id: string,
  updates: Partial<AffiliateLink>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('affiliate_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating affiliate link:', error);
    return { error: error.message };
  }

  // Auto-sync updated fields to affiliate_rates
  if (data) {
    await syncToAffiliateRates({
      partner_name: data.partner_name,
      market: data.market,
      commission_type: data.commission_type,
      commission_value: data.commission_value,
      commission_currency: (data as Record<string, unknown>).commission_currency as string | undefined,
      active: data.active,
    });
  }

  revalidatePath('/dashboard/links');
  revalidatePath('/dashboard/content/genesis');
  revalidateTag('affiliate-links', {}); // Invalidate 30s cache
  return { data };
}

export async function deleteAffiliateLink(id: string) {
  const supabase = await createClient();

  // Fetch link details before deleting (needed for affiliate_rates deactivation)
  const { data: linkData } = await supabase
    .from('affiliate_links')
    .select('partner_name, market')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('affiliate_links')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting affiliate link:', error);
    return { error: error.message };
  }

  // Deactivate (not delete) in affiliate_rates — existing Runs may reference this partner
  if (linkData) {
    await deactivateInAffiliateRates(linkData.partner_name, linkData.market);
  }

  revalidatePath('/dashboard/links');
  revalidatePath('/dashboard/content/genesis');
  revalidateTag('affiliate-links', {}); // Invalidate 30s cache
  return { success: true };
}

export async function toggleAffiliateLinkStatus(id: string, active: boolean) {
  return updateAffiliateLink(id, { active });
}

// Analytics helpers
export async function getLinkClickStats(linkId: string, days: number = 30) {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('link_clicks')
    .select('*')
    .eq('link_id', linkId)
    .gte('clicked_at', startDate.toISOString())
    .order('clicked_at', { ascending: false });

  if (error) {
    logger.error('Error fetching click stats:', error);
    return { error: error.message };
  }

  // Group by day
  const dailyStats = data.reduce(
    (acc, click) => {
      const date = new Date(click.clicked_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Group by country
  const countryStats = data.reduce(
    (acc, click) => {
      const country = click.country_code || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Group by source
  const sourceStats = data.reduce(
    (acc, click) => {
      const source = click.utm_source || 'direct';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    data: {
      totalClicks: data.length,
      dailyStats,
      countryStats,
      sourceStats,
      recentClicks: data.slice(0, 10),
    },
  };
}

export async function getDashboardStats() {
  const supabase = await createClient();

  // Get total clicks
  const { count: totalClicks } = await supabase
    .from('link_clicks')
    .select('*', { count: 'exact', head: true });

  // Get total conversions
  const { data: conversions } = await supabase
    .from('conversions')
    .select('commission_earned')
    .eq('status', 'approved');

  const totalRevenue =
    conversions?.reduce((sum, c) => sum + c.commission_earned, 0) || 0;

  // Get active links count
  const { count: activeLinks } = await supabase
    .from('affiliate_links')
    .select('*', { count: 'exact', head: true })
    .eq('active', true);

  return {
    totalClicks: totalClicks || 0,
    totalRevenue,
    totalConversions: conversions?.length || 0,
    activeLinks: activeLinks || 0,
    conversionRate:
      totalClicks && conversions
        ? ((conversions.length / totalClicks) * 100).toFixed(2)
        : '0',
    epc:
      totalClicks && totalRevenue
        ? (totalRevenue / totalClicks).toFixed(2)
        : '0',
  };
}
