'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { AffiliateLink } from '@/types';

export async function getAffiliateLinks() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('affiliate_links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching affiliate links:', error);
    return { error: error.message };
  }

  return { data };
}

export async function getAffiliateLink(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('affiliate_links')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching affiliate link:', error);
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
    console.error('Error creating affiliate link:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/links');
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
    console.error('Error updating affiliate link:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/links');
  return { data };
}

export async function deleteAffiliateLink(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('affiliate_links')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting affiliate link:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/links');
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
    console.error('Error fetching click stats:', error);
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
