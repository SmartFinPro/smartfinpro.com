import { createServiceClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

interface UTMParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
}

/**
 * Parse UTM parameters from a URL
 */
export function parseUTMParams(url: string): UTMParams {
  try {
    const urlObj = new URL(url);
    return {
      utm_source: urlObj.searchParams.get('utm_source'),
      utm_medium: urlObj.searchParams.get('utm_medium'),
      utm_campaign: urlObj.searchParams.get('utm_campaign'),
      utm_content: urlObj.searchParams.get('utm_content'),
    };
  } catch {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
    };
  }
}

/**
 * Get country code from request headers (Vercel geolocation)
 */
export async function getCountryCode(): Promise<string> {
  const headersList = await headers();
  return headersList.get('x-vercel-ip-country') || 'XX';
}

/**
 * Track an affiliate link click and return the destination URL
 */
export async function trackClick(slug: string): Promise<string | null> {
  const supabase = createServiceClient();
  const headersList = await headers();

  // Get the affiliate link
  const { data: link, error: linkError } = await supabase
    .from('affiliate_links')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (linkError || !link) {
    console.error('Affiliate link not found:', slug);
    return null;
  }

  // Parse referrer for UTM params
  const referer = headersList.get('referer') || '';
  const utmParams = parseUTMParams(referer);

  // Get geo data
  const countryCode = await getCountryCode();

  // Generate unique click ID for SubID tracking
  const clickId = crypto.randomUUID();

  // Record the click with click_id for later conversion matching
  const { error: clickError } = await supabase.from('link_clicks').insert({
    link_id: link.id,
    click_id: clickId,
    country_code: countryCode,
    referrer: referer || null,
    user_agent: headersList.get('user-agent') || null,
    ...utmParams,
  });

  if (clickError) {
    console.error('Error recording click:', clickError);
  }

  // Build destination URL with tracking parameters
  const destUrl = new URL(link.destination_url);

  // Add our tracking identifiers - clickId is the primary SubID for conversion matching
  destUrl.searchParams.set('subid', clickId);
  destUrl.searchParams.set('sid', slug); // Also include slug as secondary identifier

  // Pass through UTM params if present
  if (utmParams.utm_source) {
    destUrl.searchParams.set('utm_source', utmParams.utm_source);
  }
  if (utmParams.utm_medium) {
    destUrl.searchParams.set('utm_medium', utmParams.utm_medium);
  }
  if (utmParams.utm_campaign) {
    destUrl.searchParams.set('utm_campaign', utmParams.utm_campaign);
  }

  return destUrl.toString();
}

/**
 * Get click statistics for a specific link
 */
export async function getLinkStats(linkId: string) {
  const supabase = createServiceClient();

  const { data: clicks, error } = await supabase
    .from('link_clicks')
    .select('*')
    .eq('link_id', linkId)
    .order('clicked_at', { ascending: false });

  if (error) {
    console.error('Error fetching link stats:', error);
    return null;
  }

  return {
    totalClicks: clicks.length,
    clicksByCountry: groupBy(clicks, 'country_code'),
    clicksBySource: groupBy(clicks, 'utm_source'),
    recentClicks: clicks.slice(0, 10),
  };
}

/**
 * Helper function to group array by key
 */
function groupBy<T>(
  array: T[],
  key: keyof T
): Record<string, number> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key] || 'unknown');
      result[groupKey] = (result[groupKey] || 0) + 1;
      return result;
    },
    {} as Record<string, number>
  );
}
