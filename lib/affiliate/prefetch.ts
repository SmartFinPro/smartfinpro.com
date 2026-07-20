// lib/affiliate/prefetch.ts
// THE MONEY INVARIANT: viewing a page must never touch /go/[slug].
//
// A request to the affiliate redirect route is a claim that a person clicked a
// CTA: it writes a row to `link_clicks` and sends an outbound ping to the
// affiliate network. Anything that reaches that route without a human behind it
// corrupts the only number the business is steered by.
//
// Next's router prefetches `<Link>` targets on hover and in the viewport, so
// merely rendering a review or cockpit page used to issue GET /go/<slug>.
// Production before the fix: 205 of 2209 click rows had a shape no human can
// produce — 2+ different affiliate slugs from one IP inside 5 s, referred by
// the page rendering exactly those links.
//
// The fix is two-layered, because either layer alone leaks:
//   1. `affiliatePrefetch()` — CTA components opt out of router prefetching, so
//      the request is never made in the first place.
//   2. `speculativeRequestReason()` — the route refuses to treat a speculative
//      request as a click, whatever produced it (browser speculation rules, a
//      preview scanner, a future component that forgets layer 1).
//
// Deliberately dependency-free: this module is imported by the route handler
// (server) AND by client CTA components.

// ── Layer 1: client ─────────────────────────────────────────────────────────

/**
 * The `prefetch` value a `<Link>` must use for a CTA href.
 *
 * `false` for affiliate redirects (never speculate on money), `undefined` for
 * everything else so editorial links keep Next's default prefetching. Returning
 * `undefined` rather than `true` matters: it leaves the framework default in
 * place instead of pinning it.
 */
export function affiliatePrefetch(href: string | undefined | null): false | undefined {
  return isAffiliateRedirect(href) ? false : undefined;
}

/** True for the internal /go/[slug] redirect path in any of its written forms. */
export function isAffiliateRedirect(href: string | undefined | null): boolean {
  return typeof href === 'string' && href.startsWith('/go/');
}

// ── Layer 2: server ─────────────────────────────────────────────────────────

/** Why a request to /go/[slug] was not counted as a click. */
export type SpeculativeReason = 'next-router-prefetch' | 'rsc-payload' | 'purpose-prefetch' | 'not-a-navigation';

/** Header values that announce a look-ahead fetch rather than a user action. */
const SPECULATIVE_PURPOSES = /prefetch|prerender|preview/;

/**
 * Returns why a request to /go/[slug] is speculative, or `null` if it looks
 * like a genuine click.
 *
 * The bias is deliberately asymmetric. A false positive silently costs a real
 * commission, so every rule below keys on a POSITIVE signal that the request
 * was machine-initiated; a request carrying none of them is treated as human,
 * including from browsers old enough to send no Sec-Fetch-* headers at all.
 */
export function speculativeRequestReason(request: Request): SpeculativeReason | null {
  const h = request.headers;
  const get = (name: string) => h.get(name)?.trim().toLowerCase() ?? '';

  // Next.js router prefetch — the source of the production phantom clicks.
  if (h.has('next-router-prefetch')) return 'next-router-prefetch';

  // RSC payload request. The router asks for a flight response, never a
  // navigation; `_rsc` is appended by the router itself, so its presence on a
  // route handler URL is proof no user typed or clicked it.
  if (get('rsc') === '1' || new URL(request.url).searchParams.has('_rsc')) return 'rsc-payload';

  // Browser-level speculation: Chrome speculation rules (Sec-Purpose),
  // the legacy Purpose/X-Purpose headers, and Firefox's X-Moz: prefetch.
  for (const name of ['sec-purpose', 'purpose', 'x-purpose', 'x-moz']) {
    if (SPECULATIVE_PURPOSES.test(get(name))) return 'purpose-prefetch';
  }

  // Fetch metadata: a click — same tab, new tab, or script-initiated — is
  // always a top-level navigation with `Sec-Fetch-Dest: document`. Any other
  // destination (empty/script/iframe/image) is a background request. Checked
  // last and only when the header is actually present, so browsers that omit
  // Fetch Metadata keep redirecting normally.
  const dest = get('sec-fetch-dest');
  if (dest && dest !== 'document') return 'not-a-navigation';

  return null;
}
