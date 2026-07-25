// __tests__/unit/affiliate-link-prefetch.test.ts
// Layer 1 of the phantom-click fix, enforced statically.
//
// Next's router prefetches `<Link>` targets on hover and in the viewport. For a
// CTA pointing at /go/[slug] that means a page VIEW issues the request the
// route counts as a click. The route guard (lib/affiliate/prefetch.ts) is the
// backstop, but the request should never be made in the first place — so every
// `<Link>` that can carry an affiliate href must opt out of prefetching.
//
// This is a source scan rather than a render test on purpose: it is the CI-run
// check (`npm run test`) that catches a NEW CTA component forgetting the opt-out
// months from now, which no rendering test of today's components would.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/**
 * Components whose `<Link>` href is an opaque prop that carries an affiliate
 * URL. The scan cannot infer this from the href expression alone, so the
 * inventory is explicit — and reviewable when a new CTA component is added.
 */
const AFFILIATE_LINK_SITES: Array<{ file: string; href: RegExp; what: string }> = [
  { file: 'components/marketing/affiliate-link.tsx', href: /^href$/, what: 'AffiliateLink (MDX inline/button/card)' },
  { file: 'components/marketing/tracked-cta.tsx', href: /^(href|option\.href)$/, what: 'TrackedCTA / ProductCTA / InlineCTA / DecisionCTA' },
  { file: 'components/marketing/frictionless-cta.tsx', href: /^affiliateUrl$/, what: 'FrictionlessCTA' },
  { file: 'components/marketing/smartfin-card.tsx', href: /^affiliateUrl$/, what: 'SmartFinCard' },
  { file: 'components/marketing/review-template.tsx', href: /^review\.affiliateUrl$/, what: 'ReportLayout hero + closing CTA' },
  { file: 'components/marketing/ai-savings-calculator.tsx', href: /^affiliateUrl$/, what: 'AI savings calculator CTA' },
  { file: 'components/marketing/sticky-review-nav.tsx', href: /cta\.url/, what: 'Sticky review nav CTA' },
  { file: 'components/marketing/review-exit-intent.tsx', href: /^topPartner\.url$/, what: 'Exit-intent partner CTA' },
  { file: 'components/home/uk-broker-hero-slider.tsx', href: /^slide\.href$/, what: 'UK broker hero slider CTA' },
];

interface LinkTag {
  /** Source of the opening tag, `<Link` … `>`. */
  source: string;
  /** The href expression with its braces stripped, e.g. `review.affiliateUrl`. */
  href: string | null;
  line: number;
}

/**
 * Extract the opening `<Link …>` tags from a JSX source file.
 *
 * Hand-rolled instead of regex because CTA tags carry arrow functions
 * (`onClick={(e) => …}`) — a naive `/<Link[\s\S]*?>/` stops at the `>` of the
 * arrow and reads the tag as attribute-less.
 */
function findLinkTags(source: string): LinkTag[] {
  const tags: LinkTag[] = [];
  const opener = /<Link[\s>]/g;
  let match: RegExpExecArray | null;

  while ((match = opener.exec(source)) !== null) {
    const start = match.index;
    let depth = 0;
    let quote: string | null = null;
    let end = -1;

    for (let i = start + '<Link'.length; i < source.length; i++) {
      const ch = source[i];
      if (quote) {
        if (ch === quote && source[i - 1] !== '\\') quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') quote = ch;
      else if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) { end = i; break; }
    }
    if (end === -1) continue;

    const tag = source.slice(start, end + 1);
    const href = tag.match(/\bhref=\{([\s\S]*?)\}\s*(?:\n|[a-zA-Z-]+=|\/?>)/)?.[1]
      ?? tag.match(/\bhref="([^"]*)"/)?.[1]
      ?? null;

    tags.push({
      source: tag,
      href: href?.trim() ?? null,
      line: source.slice(0, start).split('\n').length,
    });
  }
  return tags;
}

/** The two accepted ways to keep the router away from an affiliate href. */
function optsOutOfPrefetch(tag: string): boolean {
  return /prefetch=\{false\}/.test(tag) || /prefetch=\{affiliatePrefetch\(/.test(tag);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(join(ROOT, dir))) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const rel = join(dir, entry);
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else if (rel.endsWith('.tsx')) out.push(rel);
  }
  return out;
}

describe('affiliate CTAs opt out of router prefetching', () => {
  it.each(AFFILIATE_LINK_SITES)('$what — every affiliate <Link> in $file', ({ file, href }) => {
    const source = readFileSync(join(ROOT, file), 'utf8');
    const sites = findLinkTags(source).filter((tag) => tag.href !== null && href.test(tag.href));

    // Guards the guard: a rename must fail loudly, not silently check nothing.
    expect(sites.length, `no <Link> with an affiliate href found in ${file} — inventory is stale`).toBeGreaterThan(0);

    const leaking = sites.filter((tag) => !optsOutOfPrefetch(tag.source)).map((tag) => `${file}:${tag.line}`);
    expect(leaking, 'affiliate <Link> without prefetch opt-out — a page view would record a click').toEqual([]);
  });

  it('no <Link> anywhere points at a literal /go/ href without opting out', () => {
    const leaking: string[] = [];

    for (const file of [...walk('components'), ...walk('app')]) {
      for (const tag of findLinkTags(readFileSync(join(ROOT, file), 'utf8'))) {
        if (tag.href?.includes('/go/') && !optsOutOfPrefetch(tag.source)) leaking.push(`${file}:${tag.line}`);
      }
    }

    expect(leaking, 'affiliate <Link> without prefetch opt-out — a page view would record a click').toEqual([]);
  });
});
