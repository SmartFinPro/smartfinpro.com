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

import { Star, ArrowUpRight } from 'lucide-react';
import { FAQSection } from './faq-section';
import { ExpertVerifier } from './expert-verifier';

const BORDER = '#E1E7F0';

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

export interface VerdictPick {
  rank: number;
  name: string;
  why: string;
  rating: number;
  href: string;
  external: boolean;
  ctaLabel: string;
}

interface CockpitVerdictProps {
  intro: string;
  picks: VerdictPick[];
  verifiedDate: string; // ISO YYYY-MM-DD
  reviewerName: string;
  reviewerCredential?: string;
  productCount: number;
  regulators: string[];
  complianceNotice: string;
}

/** Tier 1 — compact decision block, rendered above the cockpit. */
export function CockpitVerdict({
  intro,
  picks,
  verifiedDate,
  reviewerName,
  reviewerCredential,
  productCount,
  regulators,
  complianceNotice,
}: CockpitVerdictProps) {
  return (
    <section className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--sfp-ink)' }}>
        Editor&rsquo;s verdict
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
        {intro}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {picks.map((p) => (
          <a
            key={p.rank}
            href={p.href}
            {...(p.external ? { target: '_blank', rel: 'nofollow sponsored noopener' } : {})}
            className="flex flex-col rounded-xl border bg-white p-4 no-underline transition-shadow hover:shadow-md"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center justify-between">
              <span
                className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-bold"
                style={{
                  background: p.rank === 1 ? 'var(--sfp-gold)' : 'var(--sfp-sky)',
                  color: p.rank === 1 ? '#fff' : 'var(--sfp-navy)',
                }}
              >
                #{p.rank}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                <Star size={13} aria-hidden="true" style={{ color: 'var(--sfp-gold)' }} /> {p.rating.toFixed(1)}
              </span>
            </div>
            <h3 className="mt-2 text-base font-bold" style={{ color: 'var(--sfp-ink)', margin: '0.5rem 0 0' }}>
              {p.name}
            </h3>
            <p className="mt-1 flex-1 text-sm leading-snug" style={{ color: 'var(--sfp-slate)' }}>
              {p.why}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--sfp-navy)' }}>
              {p.ctaLabel} <ArrowUpRight size={14} aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>

      {/* Trust strip */}
      <p className="mt-4 text-xs" style={{ color: 'var(--sfp-slate)' }}>
        Data verified {fmtDate(verifiedDate)} · Reviewed by {reviewerName}
        {reviewerCredential ? `, ${reviewerCredential}` : ''} · {productCount} tested ·{' '}
        <a href="#how-we-test" className="underline" style={{ color: 'var(--sfp-navy)' }}>
          How we test
        </a>
      </p>
      {regulators.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {regulators.map((r) => (
            <span
              key={r}
              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: 'rgba(26,107,58,0.08)', color: 'var(--sfp-green)', border: '1px solid rgba(26,107,58,0.2)' }}
            >
              {r}
            </span>
          ))}
          <span className="text-xs italic" style={{ color: 'var(--sfp-slate)' }}>
            {complianceNotice}
          </span>
        </div>
      )}
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
}

/** Tier 3 — depth below the cockpit. */
export function CockpitBody({ label, methodology, buyerGuide, faq, reviewer, verifiedDate }: CockpitBodyProps) {
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
