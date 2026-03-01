import { NextResponse } from 'next/server';
import { trackClick } from '@/lib/affiliate/tracker';
import { resolveLink } from '@/lib/affiliate/link-registry';
import { affiliateRedirectLimiter } from '@/lib/security/rate-limit';

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
  // Rate limit: 30 req/min per IP to prevent click fraud
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  if (!affiliateRedirectLimiter.check(ip)) {
    return new NextResponse('Too many requests', { status: 429 });
  }

  const { slug } = await params;

  // Pre-validate via registry cache (fast path)
  const registryLink = await resolveLink(slug);

  // Track the click (logs to Supabase with UTM, geo, subid)
  const destinationUrl = await trackClick(slug);

  if (!destinationUrl) {
    // If tracker fails but registry has the link, use registry fallback
    if (registryLink && isAllowedRedirect(registryLink.destination_url)) {
      return NextResponse.redirect(registryLink.destination_url, 307);
    }
    // Link not found or blocked — redirect to homepage
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Validate destination against whitelist
  if (!isAllowedRedirect(destinationUrl)) {
    console.warn(`[affiliate] Blocked redirect to non-whitelisted domain: ${destinationUrl} (slug: ${slug})`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Use 307 Temporary Redirect to preserve SEO
  return NextResponse.redirect(destinationUrl, 307);
}
