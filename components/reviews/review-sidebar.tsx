// components/reviews/review-sidebar.tsx — V2 sticky right sidebar
// ============================================================
// Server Component. Betreiber-Wunsch (2026-07-18): reinstate a right rail
// on V2 review pages after T0c had deliberately left V2 single-column.
// Built entirely from already-existing, already-audited parts — no new copy
// is invented here (same T0d discipline every other V2 zone follows):
//
//   a. Report-Info-Card — the same card components/marketing/report-layout.tsx
//      renders in its sidebar ("EXPERT REVIEW" eyebrow, product name,
//      "Published {Month Year}"), with the generic Navy/BarChart3 icon
//      swapped for the reviewed provider's real logo when one exists in
//      public/images/brokers/ — fs.existsSync-checked against the real file,
//      never a guessed or hardcoded-present logo. Falls back to the
//      original BarChart3 icon when no file exists for the slug.
//   b. Market Check — the SAME <DecisionBridge> component report-layout.tsx
//      renders, with showCta=false: its own internal "Compare" CTA is
//      suppressed because (c) below is the sidebar's one Compare button
//      (avoids doubling the same link in one rail).
//   c. Button pair — "{compareLabel}" (gold, → cockpitHref) + "Visit
//      {productName}" (outline navy, → affiliateUrl) via TrackedAffiliateLink
//      so the click is tracked exactly like every other affiliate CTA site-wide.
//   d. Compact affiliate/risk disclosure — required because (c)'s "Visit" is
//      an affiliate link (F-05 above-the-fold-adjacent disclosure rule).
//      RiskWarningBox additionally gated on category (trading/forex) or the
//      hasLeverageRisk frontmatter flag — the same F-04b rule
//      report-layout.tsx already applies for its risk warning.
//
// Sticky only at lg: (`lg:sticky lg:top-24`) — plain static/in-flow below
// that breakpoint. This lets ONE component serve both roles ReviewLayoutV2
// needs: the desktop rail (rendered once inside a `hidden lg:block`
// wrapper) and the mobile in-flow fallback rendered directly under the
// Verdict zone (`lg:hidden` wrapper) — the same dual-render-per-breakpoint
// pattern report-layout.tsx already uses for its ProtocolBridge "mobile
// fallback" (see that file's comment above the `lg:hidden` ProtocolBridge
// render).
// ============================================================

import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { DecisionBridge, DecisionBridgeProvider } from '@/components/marketing/decision-bridge';
import { TrackedAffiliateLink } from '@/components/marketing/tracked-affiliate-link';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';
import { RiskWarningBox } from '@/components/marketing/risk-warning';
import type { Market, Category } from '@/lib/i18n/config';
import type { DecisionBridgeData } from '@/lib/comparison/types';

export interface ReviewSidebarProps {
  productName: string;
  /** ISO YYYY-MM-DD (ContentMeta.publishDate) — rendered as "Published {Month Year}". */
  publishDate: string;
  decisionBridge: DecisionBridgeData;
  /** Same string ReviewLayoutV2 already computes for FinalDecision's CTA
   *  ("Compare all {fieldCount} {topicLabel}") — reused, not recomputed, so
   *  there is exactly one place that builds this copy. */
  compareLabel: string;
  affiliateUrl: string | null;
  market: Market;
  category: Category;
  /** F-04b override — same flag report-layout.tsx reads from frontmatter to force the risk warning regardless of category. */
  hasLeverageRisk?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** ISO YYYY-MM-DD → "February 2026". Manual parse (no `Date`) — same
 *  discipline as decision-bridge.tsx's formatVerifiedDate. This component
 *  only ever renders on the server, so a `Date`-based format wouldn't risk
 *  a hydration mismatch here, but a manual parse keeps one date-formatting
 *  idiom across the V2 zones instead of introducing a second one. */
function formatPublishMonth(iso: string): string | null {
  const parts = iso.split('-');
  if (parts.length !== 3) return null;
  const [y, m] = parts.map(Number);
  if (!y || !m || m < 1 || m > 12) return null;
  return `${MONTHS[m - 1]} ${y}`;
}

/**
 * Broker slugs that actually have a logo file in public/images/brokers/ —
 * verified against the directory listing during this task (2026-07-18).
 * Documentation only; resolveLogoSrc() below checks the real filesystem,
 * so a new logo dropped into that folder later works without a code change,
 * and a slug NOT in this list still safely falls through to the BarChart3
 * icon instead of ever guessing a src that 404s.
 */
const KNOWN_BROKER_LOGO_SLUGS = ['etoro', 'ibkr', 'ig', 'plus500', 'capital-com', 'revolut', 'investing'] as const;
void KNOWN_BROKER_LOGO_SLUGS; // documentation constant — see resolveLogoSrc()

function resolveLogoSrc(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const absolutePath = path.join(process.cwd(), 'public', 'images', 'brokers', `${slug}.svg`);
  try {
    return fs.existsSync(absolutePath) ? `/images/brokers/${slug}.svg` : null;
  } catch {
    return null;
  }
}

export function ReviewSidebar({
  productName,
  publishDate,
  decisionBridge,
  compareLabel,
  affiliateUrl,
  market,
  category,
  hasLeverageRisk,
}: ReviewSidebarProps) {
  const publishedLabel = formatPublishMonth(publishDate);
  const logoSrc = resolveLogoSrc(decisionBridge.position?.slug);
  // Prominent CFD/leverage warning ONLY for products that actually carry that
  // risk (frontmatter `hasLeverageRisk`), NOT every trading/forex page. The
  // old category-wide trigger printed a CFD warning on eToro US, which offers
  // no CFDs — factually wrong, same class as the debt-profile disclaimer bug.
  // Non-leverage products get the quiet general-risk line instead (see d.).
  const showRiskWarning = Boolean(hasLeverageRisk);

  return (
    <aside className="lg:sticky lg:top-24" style={{ fontFamily: 'var(--font-primary)' }}>
      <div className="flex flex-col gap-5">
        {/* a. Report Info Card — hairline border + radius, matches VerdictCard's card idiom (border, not shadow). */}
        <div
          style={{
            border: '1px solid var(--sfp-hairline-strong)',
            borderRadius: '18px',
            background: '#fff',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px' }}>
            <div className="rounded-xl p-4" style={{ background: 'var(--sfp-sky)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                  style={{
                    background: logoSrc ? '#fff' : 'var(--sfp-navy)',
                    border: logoSrc ? '1px solid var(--sfp-hairline)' : 'none',
                  }}
                >
                  {logoSrc ? (
                    // Plain <img>, not next/image: next.config.ts has no
                    // `dangerouslyAllowSVG`, so the built-in optimizer 400s
                    // on local SVGs (a pre-existing gap that also affects
                    // components/tools/broker-finder-quiz.tsx and
                    // trading-cost-calculator.tsx). A static <img> bypasses
                    // the optimizer entirely — correct for a small vector
                    // icon that needs no resize pipeline anyway.
                    //
                    // object-cover + object-left: the shared brokers/*.svg are
                    // WIDE lockups (viewBox 200x48 = mark on the left + white
                    // wordmark on the right). In a square tile object-contain
                    // shrinks the whole lockup to tile-WIDTH → a tiny mark and
                    // an invisible white wordmark. Cover+left fills the tile
                    // with the left mark (the wordmark is redundant here — the
                    // product name sits next to this tile as text) and crops
                    // the wordmark off.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoSrc} alt={`${productName} logo`} className="w-full h-full object-cover object-left" />
                  ) : (
                    <BarChart3 className="h-7 w-7 text-white" />
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--sfp-slate)',
                    }}
                  >
                    Expert Review
                  </div>
                  <div className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>
                    {productName}
                  </div>
                </div>
              </div>
              {publishedLabel && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--sfp-slate)' }}>Published</span>
                  <span className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>{publishedLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* c. Button pair — placed BETWEEN the two cards (Betreiber-Wunsch 2026-07-18):
            the primary action sits right under the provider identity, above the
            Market Check. Colours are Tailwind classes (NOT inline style) so the
            :hover rules actually win — inline `background`/`color` would out-
            specify a hover class and silently kill the effect. */}
        <div className="flex flex-col gap-2.5">
          <Link
            href={decisionBridge.cockpitHref}
            className="block text-center font-semibold no-underline rounded-[10px] px-4 py-[11px] text-[13.5px] bg-[var(--sfp-gold)] text-[var(--sfp-ink)] transition-colors duration-150 hover:bg-[var(--sfp-gold-dark)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--sfp-navy)]"
          >
            {compareLabel}
          </Link>
          {affiliateUrl && (
            <TrackedAffiliateLink
              href={affiliateUrl}
              // color + textDecoration as inline style (specificity 1,0,0) — the
              // global `a[href^="/go/"]` affiliate rule (globals.css:774, gold +
              // underline, specificity 0,1,1) otherwise out-specifies Tailwind's
              // text-white / no-underline utility classes. bg stays a class so the
              // brightness/lift hover still works (inline bg would kill :hover).
              className="block w-full text-center no-underline rounded-[10px] px-4 py-[11px] text-[13.5px] font-semibold bg-[var(--sfp-blue-bright)] shadow-sm transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:brightness-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--sfp-blue-bright)]"
              style={{ color: 'white', textDecoration: 'none' }}
              eventLabel={`Visit ${productName}`}
              market={market}
              category={category}
              pageType="review"
              layoutVariant="v2_sidebar"
              placement="sidebar"
            >
              Visit {productName}
            </TrackedAffiliateLink>
          )}
        </div>

        {/* b. Market Check — internal CTA suppressed; (c) above is the sidebar's one Compare button. */}
        <div
          style={{
            border: '1px solid var(--sfp-hairline-strong)',
            borderRadius: '18px',
            background: '#fff',
            padding: '20px',
          }}
        >
          <DecisionBridgeProvider data={decisionBridge}>
            <DecisionBridge showCta={false} />
          </DecisionBridgeProvider>
        </div>

        {/* d. Disclosure/risk — Betreiber-Wunsch 2026-07-18: below the Market
            Check, deliberately quiet. Affiliate disclosure in the whisper
            `minimal` variant (FTC "clear and conspicuous" = legible, not
            hidden). The prominent CFD RiskWarningBox now renders ONLY when the
            product is actually a leveraged/CFD product (`hasLeverageRisk`) —
            NOT for every `trading` page: eToro US offers no CFDs (the article
            states this three times), so the category-generic CFD warning was
            factually wrong here, the same class of bug as the debt-profile
            disclaimer. A quiet, correct general-risk line replaces it. */}
        {affiliateUrl && (
          <div className="flex flex-col gap-1.5 pt-1">
            <AffiliateDisclosure market={market} variant="minimal" />
            {showRiskWarning ? (
              <RiskWarningBox variant="compact" market={market} />
            ) : (
              <p className="m-0 text-[11px] leading-snug text-sfp-slate">
                Investing involves risk, including possible loss of principal.
                Options and crypto carry additional risk.
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
