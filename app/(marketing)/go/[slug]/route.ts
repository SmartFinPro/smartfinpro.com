import { NextResponse } from 'next/server';
import { trackClick } from '@/lib/affiliate/tracker';
import { resolveLink } from '@/lib/affiliate/link-registry';
import { affiliateRedirectLimiter } from '@/lib/security/rate-limit';
import { isIpBlocked, blockIp } from '@/lib/security/ip-blocklist';
import { logger } from '@/lib/logging';

// ── Bot / Scraper User-Agent Detection ───────────────────────
// Common headless browsers, scrapers, and click-fraud bots.
// Legitimate browsers (Chrome, Firefox, Safari, Edge) never match these.
const BOT_UA_PATTERNS: RegExp[] = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /headless/i,
  /phantomjs/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  /wget/i,
  /curl\//i,
  /python-requests/i,
  /go-http-client/i,
  /java\//i,
  /httpclient/i,
  /axios/i,
  /node-fetch/i,
  /libwww/i,
  /mechanize/i,
  /scrapy/i,
];

/**
 * Returns true if the User-Agent string matches a known bot pattern.
 * Empty / missing UA is also treated as suspicious (real browsers always send one).
 */
function isBotUserAgent(ua: string | null): boolean {
  if (!ua || ua.trim().length === 0) return true;
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(ua));
}

// ── Affiliate Hostname Whitelist (defense-in-depth) ──────────
// Only redirect to known partner domains. Prevents open-redirect
// if affiliate_links DB is ever compromised. Update this set when
// onboarding new partners.
const ALLOWED_HOSTS = new Set([
  // Trading / Forex
  'etoro.com',
  'www.etoro.com',
  'capital.com',
  'www.capital.com',
  'interactivebrokers.com',
  'www.interactivebrokers.com',
  'ibkr.com',
  'www.ibkr.com',
  'plus500.com',
  'www.plus500.com',
  'ig.com',
  'www.ig.com',
  'pepperstone.com',
  'www.pepperstone.com',
  'oanda.com',
  'www.oanda.com',
  'cmcmarkets.com',
  'www.cmcmarkets.com',
  'icmarkets.com',
  'www.icmarkets.com',
  'questrade.com',
  'www.questrade.com',
  'tdameritrade.com',
  'www.tdameritrade.com',
  // Personal Finance / Banking
  'wealthsimple.com',
  'www.wealthsimple.com',
  'wealthfront.com',
  'www.wealthfront.com',
  'sofi.com',
  'www.sofi.com',
  'relay.com',
  'www.relay.com',
  'mercury.com',
  'www.mercury.com',
  'revolut.com',
  'www.revolut.com',
  'wise.com',
  'www.wise.com',
  'starlingbank.com',
  'www.starlingbank.com',
  'tide.co',
  'www.tide.co',
  'marcus.co.uk',
  'www.marcus.co.uk',
  'nutmeg.com',
  'www.nutmeg.com',
  'trading212.com',
  'www.trading212.com',
  'vanguardinvestor.co.uk',
  'www.vanguardinvestor.co.uk',
  'hargreaveslandsdwon.co.uk',
  'www.hargreaveslansdwon.co.uk',
  'hl.co.uk',
  'www.hl.co.uk',
  'ajbell.co.uk',
  'www.ajbell.co.uk',
  'fidelity.co.uk',
  'www.fidelity.co.uk',
  'zopa.com',
  'www.zopa.com',
  // AI Tools
  'jasper.ai',
  'www.jasper.ai',
  'copy.ai',
  'www.copy.ai',
  // Cybersecurity
  'nordvpn.com',
  'www.nordvpn.com',
  '1password.com',
  'www.1password.com',
  'crowdstrike.com',
  'www.crowdstrike.com',
  'perimeter81.com',
  'www.perimeter81.com',
  'proofpoint.com',
  'www.proofpoint.com',
  // Credit / Debt
  'lexingtonlaw.com',
  'www.lexingtonlaw.com',
  'thecreditpeople.com',
  'www.thecreditpeople.com',
  'nationaldebtrelief.com',
  'www.nationaldebtrelief.com',
  // Gold / Investing
  'perthmint.com',
  'www.perthmint.com',
  // Mortgage / Housing
  'habito.com',
  'www.habito.com',
  // Affiliate networks (tracking domains)
  'go.etoro.com',
  'partners.etoro.com',
  'ad.doubleclick.net',
  'impact.com',
  'www.impact.com',
  'shareasale.com',
  'www.shareasale.com',
  'partnerize.com',
  'www.partnerize.com',
  'prf.hn',
  'financeads.net',
  'www.financeads.net',
  'tradedoubler.com',
  'www.tradedoubler.com',
  'awin1.com',
  'www.awin1.com',
  'commission-junction.com',
  'www.cj.com',
  // CJ tracking domains (jdoqocy, dpbolvw, tkqlhce, anrdoezrs are all CJ sub-networks)
  'www.jdoqocy.com',
  'jdoqocy.com',
  'www.dpbolvw.net',
  'dpbolvw.net',
  'www.tkqlhce.com',
  'tkqlhce.com',
  'www.anrdoezrs.net',
  'anrdoezrs.net',
  'track.flexoffers.com',
]);

/**
 * Validate that a URL's hostname is in the allowed whitelist.
 * Checks exact match and bare domain (strips www. prefix).
 */
function isAllowedRedirect(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (ALLOWED_HOSTS.has(hostname)) return true;
    // Also try bare domain without www
    const bare = hostname.replace(/^www\./, '');
    if (ALLOWED_HOSTS.has(bare)) return true;
    // Allow subdomains of whitelisted domains (e.g., go.etoro.com)
    for (const allowed of ALLOWED_HOSTS) {
      if (hostname.endsWith(`.${allowed}`)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const ua = request.headers.get('user-agent');

  // ── Click-Fraud: Bot UA Detection ────────────────────────────
  // Return 403 silently — bots should not get a helpful redirect
  if (isBotUserAgent(ua)) {
    logger.warn('[affiliate] Bot UA blocked', {
      ip,
      ua: ua?.slice(0, 200) ?? '(empty)',
    });
    // Persist 24h block for confirmed bots (cluster-safe via Supabase)
    void blockIp(ip, 'bot_ua_detected', {
      durationMs: 24 * 60 * 60 * 1000,
      path: request.url,
      ua: ua ?? undefined,
    });
    return new NextResponse(null, { status: 403 });
  }

  // ── Click-Fraud: Persistent IP Blocklist ─────────────────────
  // Shared across all PM2 cluster workers via Supabase (cluster-safe).
  // Local 60s cache prevents DB hit on every request.
  const blocked = await isIpBlocked(ip);
  if (blocked) {
    logger.warn('[affiliate] Blocked IP denied', { ip });
    return new NextResponse(null, { status: 403 });
  }

  // ── Click-Fraud: Rate Limit (10 req/min per IP per worker) ───
  // In-memory per-worker; complements the persistent blocklist.
  if (!affiliateRedirectLimiter.check(ip)) {
    logger.warn('[affiliate] Rate limit exceeded — auto-blocking IP', { ip, ua: ua?.slice(0, 100) });
    // Auto-block for 1 hour and persist to Supabase
    void blockIp(ip, 'rate_limit_exceeded', {
      durationMs: 60 * 60 * 1000,
      path: request.url,
      ua: ua ?? undefined,
    });
    return new NextResponse('Too many requests', { status: 429 });
  }

  const { slug } = await params;

  // Pre-validate via registry cache (fast path)
  const registryLink = await resolveLink(slug);

  // Track the click (logs to Supabase with UTM, geo, subid)
  const destinationUrl = await trackClick(slug);

  // Safe fallback URL — uses NEXT_PUBLIC_SITE_URL to avoid 0.0.0.0:3000 on VPS
  // (request.url on VPS resolves to http://0.0.0.0:3000 — never use it for redirects)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

  if (!destinationUrl) {
    // If tracker fails but registry has the link, use registry fallback
    if (registryLink && isAllowedRedirect(registryLink.destination_url)) {
      return NextResponse.redirect(registryLink.destination_url, 307);
    }
    // Link not found or blocked — redirect to homepage
    return NextResponse.redirect(new URL('/', siteUrl));
  }

  // Validate destination against whitelist
  if (!isAllowedRedirect(destinationUrl)) {
    logger.warn('[affiliate] Blocked redirect to non-whitelisted domain', {
      destination: destinationUrl,
      slug,
      ip,
    });
    return NextResponse.redirect(new URL('/', siteUrl));
  }

  // Use 307 Temporary Redirect to preserve SEO
  return NextResponse.redirect(destinationUrl, 307);
}
