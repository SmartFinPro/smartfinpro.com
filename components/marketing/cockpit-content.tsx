// components/marketing/cockpit-content.tsx
// Server-rendered SEO/AEO content around the Comparison Cockpit (Phase C, spec §10).
// Tier 1 (Editor's verdict + trust strip) renders ABOVE the cockpit; Tier 3
// (methodology, buyer's guide, FAQ, reviewer) renders BELOW it.
//
// Server component — receives ONLY plain props (never the TopicConfig, which holds
// functions). The client islands (FAQSection, ExpertVerifier) get plain arrays/strings
// + includeSchema={false}: the route owns the single FAQPage + Person JSON-LD. Custom
// compact verdict markup (not WinnerAtGlance) so the heading is a proper <h2> and pick
// links respect the attribution gate (no blanket rel="sponsored").

import Image from 'next/image';
import { Star, ArrowUpRight, Clock } from 'lucide-react';
import { CheckCircleIcon } from './check-icon';
import { FAQSection } from './faq-section';
import { ExpertVerifier } from './expert-verifier';
import { CockpitVerdictCta } from './cockpit-verdict-cta';
import type { CockpitCtaMode, CockpitDestinationType } from '@/lib/analytics/cockpit-events';

const BORDER = '#E1E7F0';

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function fmtMonthYear(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

interface CockpitHeroProps {
  image: string | null;
  imageAlt: string;
  categoryLabel: string;
  h1: string;
  intro: string;
  verifiedDate: string; // ISO YYYY-MM-DD
  productCount: number;
  regulators: string[];
  /** TopicConfig.compliance.notice — rendered as a small risk/context line
   *  under the regulator pills (YMYL gate: high-risk topics must show it). */
  complianceNotice?: string | null;
}

/** Tier-0 hero — topic image + title + short description so the user is oriented
 *  the moment they land (image-left/right split). Replaces the bare H1+intro. */
export function CockpitHero({
  image,
  imageAlt,
  categoryLabel,
  h1,
  intro,
  verifiedDate,
  productCount,
  regulators,
  complianceNotice,
}: CockpitHeroProps) {
  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-[1.5px]" style={{ color: 'var(--sfp-slate)' }}>
          {categoryLabel} · Comparison
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-[38px] sm:leading-[1.12]" style={{ color: 'var(--sfp-ink)' }}>
          {h1}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
          {intro}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
            <CheckCircleIcon size={13} /> {productCount} providers tested
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
            <Clock size={13} aria-hidden="true" /> Updated {fmtMonthYear(verifiedDate)}
          </span>
          {regulators.map((r) => (
            <span
              key={r}
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: 'rgba(26,107,58,0.08)', color: 'var(--sfp-green)', border: '1px solid rgba(26,107,58,0.2)' }}
            >
              {r}
            </span>
          ))}
        </div>
        {complianceNotice && (
          <p className="mt-3 text-xs" style={{ color: 'var(--sfp-slate)' }}>
            {complianceNotice}
          </p>
        )}
        <p className="mt-4 text-xs" style={{ color: 'var(--sfp-slate)' }}>
          Advertising disclosure: some links may earn us a commission at no cost to you — it never affects our rankings.{' '}
          <a href="#affiliate-disclosure" className="underline" style={{ color: 'var(--sfp-navy)' }}>
            Details
          </a>
        </p>
      </div>
      {image && (
        <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '4 / 3', border: `1px solid ${BORDER}` }}>
          <Image src={image} alt={imageAlt} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" priority />
        </div>
      )}
    </section>
  );
}

export interface VerdictPick {
  rank: number;
  name: string;
  why: string;
  rating: number;
  reviewCount: number;
  href: string;
  external: boolean;
  ctaLabel: string;
  // cockpit_v1 tracking fields — derived from the rendered link via
  // resolveCockpitCta in page.tsx buildVerdictPicks.
  productSlug: string;
  ctaMode: CockpitCtaMode;
  destinationType: CockpitDestinationType;
  productCtaMode: string;
  isTopPick: boolean;
}

interface CockpitVerdictProps {
  intro: string;
  picks: VerdictPick[];
  verifiedDate: string; // ISO YYYY-MM-DD
  reviewerName: string;
  reviewerCredential?: string;
  market: string;
  category: string;
  topic: string;
}

/** Tier 1 — compact decision block, rendered above the cockpit.
 *  Three slim cards side by side (no rank numbers) so the block reads like an
 *  institutional review summary at ~half the original vertical height.
 *  No trust footer here — provider count and regulator pills already sit in the
 *  hero directly above, duplicating them read as clutter. */
export function CockpitVerdict({
  intro,
  picks,
  verifiedDate,
  reviewerName,
  reviewerCredential,
  market,
  category,
  topic,
}: CockpitVerdictProps) {
  return (
    <section className="mb-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--sfp-ink)' }}>
          Expert Reviews &amp; Ratings
        </h2>
        <p className="m-0 text-xs" style={{ color: 'var(--sfp-slate)' }}>
          Data verified {fmtDate(verifiedDate)} · Reviewed by {reviewerName}
          {reviewerCredential ? `, ${reviewerCredential}` : ''} ·{' '}
          <a href="#how-we-test" className="underline" style={{ color: 'var(--sfp-navy)' }}>
            How we test
          </a>
        </p>
      </div>
      <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
        {intro}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Hover slides each card onto a light-green gradient (built around #E9F4ED,
            the cockpit's winner-cell green) — light enough that the ink/slate text
            stays readable, so no color flips needed. */}
        {picks.map((p) => (
          <CockpitVerdictCta key={p.rank} {...p} market={market} category={category} topic={topic} />
        ))}
      </div>
    </section>
  );
}

interface CockpitBodyProps {
  label: string;
  methodology: string;
  buyerGuide: { h3: string; body: string }[];
  faq: { q: string; a: string }[];
  reviewer: {
    name: string;
    role: string;
    bio: string | null;
    image_url: string | null;
    credentials: string[];
    linkedin_url: string | null;
  };
  verifiedDate: string; // ISO
  /** Config-authored external authority references (regulator registers,
   *  official protection-limit/fee pages) — SEO addendum §8. */
  sources?: { label: string; url: string }[];
  /** Config-authored internal related guides/tools links — SEO addendum §7. */
  relatedLinks?: { label: string; href: string }[];
  /** Per-provider primary data sources (distinct product_attributes.source_url),
   *  derived by the route from the loaded rows. */
  dataSources?: { name: string; url: string; verifiedAt: string | null }[];
}

/** Tier 3 — depth below the cockpit. */
export function CockpitBody({
  label,
  methodology,
  buyerGuide,
  faq,
  reviewer,
  verifiedDate,
  sources,
  relatedLinks,
  dataSources,
}: CockpitBodyProps) {
  const hasSources = (sources?.length ?? 0) > 0 || (dataSources?.length ?? 0) > 0;
  return (
    <div className="mt-12 space-y-12">
      <section>
        <h2 id="how-we-test" className="text-2xl font-bold tracking-tight" style={{ color: 'var(--sfp-ink)' }}>
          How we test {label}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
          {methodology}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--sfp-ink)' }}>
          What to look for
        </h2>
        <div className="mt-4 space-y-5">
          {buyerGuide.map((g) => (
            <div key={g.h3}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                {g.h3}
              </h3>
              <p className="mt-1 text-[15px] leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                {g.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {relatedLinks && relatedLinks.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--sfp-ink)' }}>
            Related guides &amp; tools
          </h2>
          <ul className="mt-3 space-y-1.5">
            {relatedLinks.map((l) => (
              <li key={l.href} className="text-[15px] leading-relaxed">
                <a href={l.href} className="underline" style={{ color: 'var(--sfp-navy)' }}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasSources && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--sfp-ink)' }}>
            Sources &amp; references
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
            Provider data is collected from official pricing and disclosure pages and re-verified on the
            dates shown. Regulatory references link to the official register or scheme page.
          </p>
          {sources && sources.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {sources.map((s) => (
                <li key={s.url} className="text-[14px] leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                  {/* Regulator/scheme citations: editorial references, deliberately followed. */}
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--sfp-navy)' }}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {dataSources && dataSources.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {dataSources.map((d) => (
                <li key={d.url} className="text-[14px] leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                  {/* Provider pricing pages: commercial context → nofollow. */}
                  <a href={d.url} target="_blank" rel="nofollow noopener noreferrer" className="underline" style={{ color: 'var(--sfp-navy)' }}>
                    {d.name} — official pricing &amp; terms
                  </a>
                  {d.verifiedAt ? ` (verified ${fmtMonthYear(d.verifiedAt)})` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <FAQSection faqs={faq.map((f) => ({ question: f.q, answer: f.a }))} title="Frequently asked questions" includeSchema={false} />

      <section>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--sfp-ink)' }}>
          About our reviewer
        </h2>
        <ExpertVerifier
          variant="default"
          includeSchema={false}
          name={reviewer.name}
          title={reviewer.role}
          credentials={reviewer.credentials}
          image={reviewer.image_url ?? undefined}
          bio={reviewer.bio ?? undefined}
          lastFactChecked={verifiedDate}
          linkedInUrl={reviewer.linkedin_url ?? undefined}
        />
      </section>
    </div>
  );
}
