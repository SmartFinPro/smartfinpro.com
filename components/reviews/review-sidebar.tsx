// components/reviews/review-sidebar.tsx — V2 sticky right sidebar
// ============================================================
// Server Component. Betreiber-Wunsch (2026-07-18): reinstate a right rail
// on V2 review pages after T0c had deliberately left V2 single-column.
// Built entirely from already-existing, already-audited parts — no new copy
// is invented here (same T0d discipline every other V2 zone follows):
//
//   a. Report-Info-Card — the same card components/marketing/report-layout.tsx
//      renders in its sidebar ("EXPERT REVIEW" eyebrow, product name,
//      "Data verified {day month year}"), with the generic Navy/BarChart3 icon
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
// Sticky at lg (`lg:sticky lg:top-24`) and mounted only in ReviewLayoutV2's
// desktop rail. Smaller viewports use ReviewMobileActions inside VerdictCard,
// which avoids repeating this component's provider card and Market Check.
// ============================================================

import fs from 'fs';
import path from 'path';
import { BarChart3 } from 'lucide-react';
import { DecisionBridge, DecisionBridgeProvider } from '@/components/marketing/decision-bridge';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';
import { RiskWarningBox } from '@/components/marketing/risk-warning';
import type { Market, Category } from '@/lib/i18n/config';
import type { DecisionBridgeData } from '@/lib/comparison/types';
import { ReviewActionButtons } from './review-action-buttons';

export interface ReviewSidebarProps {
  productName: string;
  /** Latest available ISO YYYY-MM-DD review verification date. Absent when the
   *  frontmatter carries no date at all — the verified row is omitted, never
   *  stamped with an invented date. */
  verifiedDate?: string;
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** ISO YYYY-MM-DD → "18 Jul 2026". Manual parse (no `Date`) — same
 *  discipline as decision-bridge.tsx's formatVerifiedDate. This component
 *  only ever renders on the server, so a `Date`-based format wouldn't risk
 *  a hydration mismatch here, but a manual parse keeps one date-formatting
 *  idiom across the V2 zones instead of introducing a second one. */
function formatVerifiedDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const parts = iso.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${d} ${MONTHS[m - 1]} ${y}`;
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

/** Resolves the provider logo, preferring a real full wordmark (`{slug}-seeklogo.*`)
 *  over the generic square icon (`{slug}.svg`). `isWordmark` tells the card to show
 *  it big and drop the redundant text name (the wordmark already reads "eToro"),
 *  vs. the icon+text fallback layout. Square seeklogos (mark stacked over name)
 *  are named `{slug}-seeklogo-square.*`; `squareLockup` then lets the card use the
 *  PNG's transparent padding as a crop area instead of shrinking its visible mark.
 *  Filesystem-checked — a new logo dropped into public/images/brokers/ works without
 *  a code change (the contract forbids per-review style rules in code). */
function resolveLogoSrc(
  slug: string | null | undefined,
): { src: string; isWordmark: boolean; squareLockup: boolean } | null {
  if (!slug) return null;
  const candidates: Array<{ name: string; isWordmark: boolean; squareLockup: boolean }> = [
    { name: `${slug}-seeklogo-square.svg`, isWordmark: true, squareLockup: true },
    { name: `${slug}-seeklogo-square.png`, isWordmark: true, squareLockup: true },
    { name: `${slug}-seeklogo.svg`, isWordmark: true, squareLockup: false },
    { name: `${slug}-seeklogo.png`, isWordmark: true, squareLockup: false },
    { name: `${slug}.svg`, isWordmark: false, squareLockup: false },
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(path.join(process.cwd(), 'public', 'images', 'brokers', c.name))) {
        return {
          src: `/images/brokers/${c.name}`,
          isWordmark: c.isWordmark,
          squareLockup: c.squareLockup,
        };
      }
    } catch {
      /* ignore and try next */
    }
  }
  return null;
}

export function ReviewSidebar({
  productName,
  verifiedDate,
  decisionBridge,
  compareLabel,
  affiliateUrl,
  market,
  category,
  hasLeverageRisk,
}: ReviewSidebarProps) {
  const verifiedLabel = formatVerifiedDate(verifiedDate);
  const logo = resolveLogoSrc(decisionBridge.position?.slug);
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
              {logo?.isWordmark ? (
                // Real wordmark (e.g. brokers/etoro-seeklogo.svg): show it big
                // and drop the redundant "Expert Review / {name}" text block —
                // the wordmark already reads the brand name. Only a small
                // uppercase context label stays above it.
                <div className="mb-3">
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
                  {logo.squareLockup ? (
                    <div
                      className="mt-2 flex h-[110px] w-full items-center justify-center overflow-hidden"
                      data-logo-presentation="square-lockup"
                    >
                      {/* The 176px source canvas contains roughly 33px of
                          transparent padding per edge. A 110px viewport clips
                          only that padding and leaves the full blue lockup. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logo.src}
                        alt={`${productName} logo`}
                        className="h-44 w-44 max-w-none shrink-0 object-contain"
                      />
                    </div>
                  ) : (
                    // Full-width wordmark — as large as the card's inner sky box
                    // allows. The 3:1 eToro mark keeps its approved proportions.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo.src}
                      alt={`${productName} logo`}
                      className="mt-2 h-auto max-h-24 w-full object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                    style={{
                      background: logo ? '#fff' : 'var(--sfp-navy)',
                      border: logo ? '1px solid var(--sfp-hairline)' : 'none',
                    }}
                  >
                    {logo ? (
                      // Plain <img>, not next/image (next.config.ts has no
                      // dangerouslyAllowSVG → optimizer 400s on local SVGs).
                      // object-cover+left crops a wide icon lockup to its left mark.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo.src} alt={`${productName} logo`} className="w-full h-full object-cover object-left" />
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
              )}
              {verifiedLabel && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--sfp-slate)' }}>Data verified</span>
                  <span className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>{verifiedLabel}</span>
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
        <ReviewActionButtons
          productName={productName}
          compareHref={decisionBridge.cockpitHref}
          compareLabel={compareLabel}
          affiliateUrl={affiliateUrl}
          market={market}
          category={category}
          layoutVariant="v2_sidebar"
          placement="sidebar"
        />

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
