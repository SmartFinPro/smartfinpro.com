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
 * Append our click_id to the destination URL as the SubID the network will echo
 * back in its S2S postback.
 *
 * CRITICAL: the value a network returns in its postback MUST be our click_id
 * (a UUID) — `processPostback` rejects anything that is not a UUID matching a
 * `link_clicks` row ("Invalid click_id format" / "click_id_not_found"). Each
 * network reads a *different* SubID parameter, so we set the correct one
 * (detected from the tracking host or the link's `network`), always carrying
 * the click_id. A generic `subid` is always set as a fallback.
 *
 * Previously `sid` carried the *slug*, which CJ echoed back verbatim → every
 * CJ conversion was silently dropped at the UUID gate. This is that fix.
 */
export function buildTrackedDestinationUrl(
  destinationUrl: string,
  clickId: string,
  network: string | null,
  utm?: Partial<UTMParams>,
): string {
  const destUrl = new URL(destinationUrl);
  const host = destUrl.hostname.toLowerCase();
  const net = String(network || '').toLowerCase();

  // Generic fallback param read by many networks.
  destUrl.searchParams.set('subid', clickId);

  const isAwin = net.includes('awin') || /(^|\.)awin1\.com$/.test(host);
  const isImpact = net.includes('impact') || /(^|\.)impact\.com$/.test(host);

  if (isAwin) {
    destUrl.searchParams.set('clickref', clickId); // Awin echoes `clickref`
  } else if (isImpact) {
    destUrl.searchParams.set('subId1', clickId); // Impact echoes `subId1`
  } else {
    // CJ (echoes `sid`) + safe default for any other / unknown network.
    destUrl.searchParams.set('sid', clickId);
  }

  if (utm?.utm_source) destUrl.searchParams.set('utm_source', utm.utm_source);
  if (utm?.utm_medium) destUrl.searchParams.set('utm_medium', utm.utm_medium);
  if (utm?.utm_campaign) destUrl.searchParams.set('utm_campaign', utm.utm_campaign);

  return destUrl.toString();
}

/**
 * Get country code from request headers.
 * Supports: Cloudflare (CF-IPCountry), Vercel (x-vercel-ip-country),
 * and Next.js middleware (x-geo-country) as fallbacks.
 */
export async function getCountryCode(): Promise<string> {
  const headersList = await headers();
  const code =
    headersList.get('cf-ipcountry') ||          // Cloudflare (production)
    headersList.get('x-vercel-ip-country') ||    // Vercel (fallback)
    headersList.get('x-geo-country') ||          // Custom middleware
    'XX';
  // Normalize: uppercase, treat "XX" and "T1" (Tor) as unknown
  const normalized = code.toUpperCase();
  return (normalized === 'T1' || normalized === '') ? 'XX' : normalized;
}

// ── Fraud Detection ──────────────────────────────────────────────────────────

interface FraudResult {
  isSuspicious: boolean;
  reason: string | null;
}

// Countries the affiliate programs actually pay for (Tier-1 target markets).
// UK arrives as 'GB' from Cloudflare's CF-IPCountry header.
const MONETIZABLE_COUNTRIES = new Set(['US', 'GB', 'CA', 'AU']);

/**
 * Run fraud heuristics on a click before recording it.
 *
 * Checks (in order):
 *  1. Bot User-Agent signature match
 *  2. Off-target geography (non-monetizable / bot-prone)
 *  3. Duplicate click: same IP + same link within 60 s (IP velocity)
 *
 * Non-blocking — if the Supabase check fails, defaults to "not suspicious"
 * to avoid false positives on legitimate clicks.
 */
async function detectFraud(params: {
  ip: string;
  userAgent: string;
  linkId: string;
  countryCode: string;
}): Promise<FraudResult> {
  const { ip, userAgent, linkId, countryCode } = params;
  const reasons: string[] = [];

  // 1. Bot UA check
  if (isBotUserAgent(userAgent)) {
    reasons.push('bot_ua');
  }

  // 2. Off-target geography. The affiliate programs only pay for US/UK/CA/AU.
  // An English-language US/UK/CA/AU finance site receiving clicks from other
  // countries is overwhelmingly bot/proxy traffic (the live data was dominated
  // by VN/IL/CN + a long single-click tail) and is not monetizable. Flag it so
  // it is excluded from conversion-rate / EPC denominators. 'XX' (unknown geo)
  // is left UNflagged to avoid false positives on geo-unavailable real users.
  if (countryCode && countryCode !== 'XX' && !MONETIZABLE_COUNTRIES.has(countryCode)) {
    reasons.push('off_target_geo');
  }

  // 3. Duplicate-IP click within 60 seconds for the same link (IP velocity).
  // Uses index: idx_link_clicks_ip_link_time
  if (ip && ip !== 'unknown') {
    try {
      const supabase = createServiceClient();
      const cutoff = new Date(Date.now() - 60_000).toISOString(); // 60 s ago
      const { count } = await supabase
        .from('link_clicks')
        .select('click_id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .eq('link_id', linkId)
        .gte('clicked_at', cutoff);

      // count > 0 → a prior click from this IP+link within the window
      if ((count ?? 0) > 0) {
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
  const fraud = await detectFraud({ ip, userAgent, linkId: link.id, countryCode });

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

  // Build destination URL with the network-correct SubID passthrough so the
  // network echoes our click_id (UUID) back in its postback — not the slug.
  return buildTrackedDestinationUrl(link.destination_url, clickId, link.network, utmParams);
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
