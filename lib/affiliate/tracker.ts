import { createServiceClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

interface UTMParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
}

// ── Bot User-Agent Signatures (AP-06 Phase 4 — Click-Fraud Detection) ────────
// Lowercase substrings matched against the UA string.
// Extend this list when new bot patterns are discovered.
const BOT_UA_SIGNATURES = [
  'googlebot', 'bingbot', 'baiduspider', 'duckduckbot', 'slurp',
  'yandexbot', 'msnbot', 'teoma', 'ia_archiver', 'facebot', 'facebookexternalhit',
  'twitterbot', 'linkedinbot', 'whatsapp', 'applebot', 'semrushbot',
  'ahrefsbot', 'dotbot', 'mj12bot', 'petalbot', 'seznambot',
  // Headless / automation
  'headlesschrome', 'phantomjs', 'selenium', 'playwright', 'puppeteer',
  'cypress', 'htmlunit',
  // Download tools
  'wget/', 'curl/', 'python-requests', 'python-urllib', 'java/', 'go-http',
  'axios/', 'node-fetch', 'libwww-perl',
  // Generic signals
  'bot/', 'crawler', 'spider/', 'scraper', 'archive.org',
] as const;

/**
 * Returns true if the User-Agent looks like an automated bot.
 */
function isBotUserAgent(ua: string): boolean {
  if (!ua) return true; // No UA → suspicious
  const lower = ua.toLowerCase();
  return BOT_UA_SIGNATURES.some((sig) => lower.includes(sig));
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

// ── Fraud Detection ──────────────────────────────────────────────────────────

interface FraudResult {
  isSuspicious: boolean;
  reason: string | null;
}

/**
 * Run fraud heuristics on a click before recording it.
 *
 * Checks (in order):
 *  1. Bot User-Agent signature match
 *  2. Duplicate click: same IP + same link within 60 s
 *
 * Non-blocking — if the Supabase check fails, defaults to "not suspicious"
 * to avoid false positives on legitimate clicks.
 */
async function detectFraud(params: {
  ip: string;
  userAgent: string;
  linkId: string;
}): Promise<FraudResult> {
  const { ip, userAgent, linkId } = params;
  const reasons: string[] = [];

  // 1. Bot UA check
  if (isBotUserAgent(userAgent)) {
    reasons.push('bot_ua');
  }

  // 2. Duplicate-IP click within 60 seconds for the same link
  // Uses index: idx_link_clicks_ip_link_time
  if (ip && ip !== 'unknown') {
    try {
      const supabase = createServiceClient();
      const cutoff = new Date(Date.now() - 60_000).toISOString(); // 60 s ago
      const { data } = await supabase
        .from('link_clicks')
        .select('click_id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .eq('link_id', linkId)
        .gte('clicked_at', cutoff)
        .limit(1);

      // If data has results (or count > 0), it's a duplicate
      if (data !== null) {
        reasons.push('duplicate_ip');
      }
    } catch {
      // Non-blocking — silently skip if DB check fails
    }
  }

  return {
    isSuspicious: reasons.length > 0,
    reason: reasons.length > 0 ? reasons.join('|') : null,
  };
}

/**
 * Track an affiliate link click and return the destination URL.
 * Now includes click-fraud detection (AP-06 Phase 4).
 *
 * Suspicious clicks are still recorded (for analysis) but flagged
 * with is_suspicious = true and a fraud_reason string.
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

  // Extract IP (respects Cloudflare / reverse-proxy x-forwarded-for)
  const ip =
    headersList.get('cf-connecting-ip') ||           // Cloudflare (most reliable)
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
    headersList.get('x-real-ip') ||
    'unknown';

  const userAgent = headersList.get('user-agent') || '';

  // ── Fraud Detection ────────────────────────────────────────
  const fraud = await detectFraud({ ip, userAgent, linkId: link.id });

  if (fraud.isSuspicious) {
    console.warn(
      `[tracker] Suspicious click on /${slug} — ip=${ip} reason=${fraud.reason}`,
    );
  }

  // Generate unique click ID for SubID tracking
  const clickId = crypto.randomUUID();

  // Record the click — suspicious clicks are still stored for analysis
  const { error: clickError } = await supabase.from('link_clicks').insert({
    link_id:      link.id,
    click_id:     clickId,
    country_code: countryCode,
    referrer:     referer || null,
    user_agent:   userAgent || null,
    ip_address:   ip !== 'unknown' ? ip : null,
    is_suspicious: fraud.isSuspicious,
    fraud_reason:  fraud.reason,
    ...utmParams,
  });

  if (clickError) {
    console.error('Error recording click:', clickError);
  }

  // Build destination URL with tracking parameters
  const destUrl = new URL(link.destination_url);
  destUrl.searchParams.set('subid', clickId);
  destUrl.searchParams.set('sid', slug);

  // Pass through UTM params if present
  if (utmParams.utm_source)   destUrl.searchParams.set('utm_source',   utmParams.utm_source);
  if (utmParams.utm_medium)   destUrl.searchParams.set('utm_medium',   utmParams.utm_medium);
  if (utmParams.utm_campaign) destUrl.searchParams.set('utm_campaign', utmParams.utm_campaign);

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
    suspiciousClicks: clicks.filter((c) => c.is_suspicious).length,
  };
}

/**
 * Helper function to group array by key
 */
function groupBy<T>(
  array: T[],
  key: keyof T,
): Record<string, number> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key] || 'unknown');
      result[groupKey] = (result[groupKey] || 0) + 1;
      return result;
    },
    {} as Record<string, number>,
  );
}
