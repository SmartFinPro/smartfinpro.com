// app/(marketing)/research/page.tsx
// Research Library — US Discovery hub (plan §2/§3/§12). MVP = ONE vertical
// slice: US Trading Platforms, rendered as premium "Research Dossier" cards.
// Fully server-rendered (no 'use client' anywhere in this slice — search,
// filters and the compare tray are a later step per the plan).
//
// This is a literal top-level route (like /methodology, /trading-platforms),
// NOT the [market]/[category] dynamic segment — the Research Library is a
// discovery LAYER over the existing Cockpit/Review system, not a duplicate
// of it (plan §1/§2: no parallel /research/* world). It links OUT to the
// existing Cockpit (`best/[topic]`) and Review routes; it owns no product
// data of its own beyond what getResearchView derives from product_attributes.
//
// Heading hierarchy (2026-07 premium redesign, functional fix #1): H1 ("US
// Trading Platforms") -> H2 "Trading platform rankings" (before the card
// grid) -> H2 "How we score" (methodology, id="methodology" so ResearchCard's
// "Why this score?" link has somewhere real to land) -> H3 per-card names.
// Every hero metric below is COMPUTED from the live `view`, never hardcoded.

import type { Metadata } from 'next';
import Link from 'next/link';
import { getResearchView } from '@/lib/research/data';
import { Breadcrumb } from '@/components/marketing/breadcrumb';
import { ResearchCard } from '@/components/research/ResearchCard';
import { generateComparisonItemListSchema } from '@/lib/seo/schema';
import type { ResearchProduct } from '@/lib/research/adapter';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

// Positioning (locked 2026-07-19): SmartFinPro Research is the evidence-first
// DISCOVERY layer — search & pre-qualify products across categories. The
// Cockpit ("best trading platforms", "broker comparison") owns the comparison/
// conversion intent; this page must NOT compete for "best X" keywords. It owns
// research/evidence intent: "trading platform research", "verified broker
// data", "platform methodology". Title/H1/H2/JSON-LD below reflect that split.
// NB: the root layout's title.template appends " | SmartFinPro" — do NOT
// repeat the brand here, or the tab double-brands. The rendered <title> is
// therefore "US Trading Platform Research & Sources | SmartFinPro" (52 chars,
// inside the 45–60 SERP target); DESCRIPTION is 154 chars (140–160 target).
const TITLE = 'US Trading Platform Research & Sources';
const DESCRIPTION =
  'Evidence-first research on US trading platforms, with dated sources, confidence levels and transparent verification status for every published data point.';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
      canonical: '/research',
    },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      type: 'website',
      url: '/research',
    },
  };
}

/** Single-slug Cockpit compare handoff (§9) — mirrors ResearchCard's own
 *  computation so the JSON-LD item URL for a no-review product (Merrill
 *  Edge) still points somewhere real instead of a dead review link. */
function compareHrefFor(product: ResearchProduct['product']): string {
  return `/${product.market}/${product.category}/best/${product.topic}?compare=${encodeURIComponent(product.slug)}`;
}

/** ISO YYYY-MM-DD -> "Jul 3, 2026" (UTC, manual-safe parse — same idiom as
 *  VerificationStatus.formatVerifiedDate, kept local here since the hero
 *  computes this from the raw view before any single card is rendered). */
function formatUpdatedDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** Max `dataVerifiedAt` across every product in the view, audited or not —
 *  ISO YYYY-MM-DD strings sort correctly with plain string comparison. */
function latestDataVerifiedAt(view: ResearchProduct[]): string | null {
  let max: string | null = null;
  for (const item of view) {
    const dv = item.research.dataVerifiedAt;
    if (dv && (!max || dv > max)) max = dv;
  }
  return max;
}

function HeroMetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'var(--sfp-hairline)', background: 'var(--sfp-gray)' }}>
      <div className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--sfp-slate)' }}>
        {label}
      </div>
    </div>
  );
}

export default async function ResearchPage() {
  const view = await getResearchView('us', 'trading', 'trading-platforms');
  const auditedCount = view.filter((item) => item.research.status === 'audited').length;
  const totalCount = view.length;
  const pendingCount = totalCount - auditedCount;

  // Hero metric tiles — every value computed from the live view, never
  // hardcoded (redesign requirement).
  const verifiedDataPoints = view.reduce((sum, item) => sum + Object.keys(item.research.fieldSources).length, 0);
  const updatedIso = latestDataVerifiedAt(view);
  const updatedLabel = updatedIso ? formatUpdatedDate(updatedIso) : 'Pending';

  // #1 = Featured Dossier — the top-ranked AUDITED product gets its own
  // wider, richer full-width card above the calmer 2-col grid (never a
  // provisional/unavailable product, which never carries a rank at all).
  const featured = view.find((item) => item.research.status === 'audited' && item.rank === 1) ?? null;
  const rest = featured ? view.filter((item) => item.product.slug !== featured.product.slug) : view;

  const itemListSchema = generateComparisonItemListSchema({
    title: 'US Trading Platform Research — verified data',
    description: DESCRIPTION,
    url: `${BASE_URL}/research`,
    id: `${BASE_URL}/research#itemlist`,
    // Only AUDITED products carry a claim worth putting in structured data —
    // a provisional product (eToro) has no published score to assert.
    products: view
      .filter((item) => item.research.status === 'audited')
      .map((item) => ({
        name: item.product.displayName,
        ...(item.product.bestFor && { description: item.product.bestFor }),
        url: `${BASE_URL}${item.reviewHref ?? compareHrefFor(item.product)}`,
        areaServed: ['US'],
      })),
  });

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        // Escape "<" so an editorial field (displayName/bestFor) that ever
        // contained "</script>" or "<" can't break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema).replace(/</g, '\\u003c') }}
      />
      <article className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
        {/* Hero — "Research Briefing" */}
        <section className="bg-white border-b border-gray-200">
          <div className="mx-auto px-6 pt-8 pb-10" style={{ maxWidth: '1280px' }}>
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Research', href: '/research' },
                { label: 'Trading Platforms' },
              ]}
            />

            <p
              className="mt-5 text-xs font-bold uppercase tracking-[0.14em]"
              style={{ color: 'var(--sfp-navy)' }}
            >
              SmartFinPro Research &middot; US Trading
            </p>
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mt-2"
              style={{ color: 'var(--sfp-ink)' }}
            >
              US Trading Platform Research
            </h1>
            <p className="text-base mt-3 max-w-3xl leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
              The evidence-first way to shortlist a US trading platform — not a marketing &ldquo;best&rdquo;
              list. Every audited score below is backed by per-fact sources and a re-verification date, and
              where our data isn&apos;t yet complete enough to publish a confident score, we show the
              verification status instead of guessing.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <HeroMetricTile value={String(totalCount)} label="Platforms" />
              <HeroMetricTile value={String(auditedCount)} label="Audited" />
              <HeroMetricTile value={String(verifiedDataPoints)} label="Verified data points" />
              <HeroMetricTile value={updatedLabel} label="Updated" />
            </div>
          </div>
        </section>

        {/* Research Cards */}
        <section className="mx-auto px-6 py-12" style={{ maxWidth: '1280px' }}>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--sfp-ink)' }}>
            Verified platform research
          </h2>
          <p className="mb-6 text-sm" style={{ color: 'var(--sfp-slate)' }}>
            Audited platforms are ordered by our BEST-X score; platforms still in verification are shown
            separately with their status — never ranked on incomplete data.
          </p>

          {featured && (
            <div className="mb-6">
              <ResearchCard item={featured} variant="featured" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {rest.map((item) => (
              <ResearchCard key={item.product.slug} item={item} />
            ))}
          </div>
        </section>

        {/* Methodology note + affiliate disclosure */}
        <section id="methodology" className="border-t border-gray-200 bg-white scroll-mt-24">
          <div className="mx-auto px-6 py-10" style={{ maxWidth: '1280px' }}>
            <h2 className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>
              How we score
            </h2>
            <p className="mt-2 text-sm leading-relaxed max-w-3xl" style={{ color: 'var(--sfp-slate)' }}>
              {auditedCount} of {totalCount} platforms above carry an audited BEST-X score: an
              editorial 0–10 rating with a documented confidence level, where every key fact shown
              on the card is backed by a dated, named source.
              {pendingCount > 0 && (
                <>
                  {' '}
                  {pendingCount === 1 ? 'The remaining platform is' : `The remaining ${pendingCount} platforms are`}
                  {' '}marked &ldquo;Verification in progress&rdquo; (or &ldquo;Score unavailable&rdquo;) because at
                  least one required fact isn&apos;t yet confirmed to that standard — we&apos;d rather show an
                  honest gap than a fabricated number.
                </>
              )}
              {' '}Commercial relationships never influence a score or a ranking.
            </p>
            <p className="mt-4 text-xs" style={{ color: 'var(--sfp-slate)' }}>
              Advertising disclosure: some links on this page may earn us a commission at no cost to
              you — it never affects our rankings.{' '}
              <Link href="/affiliate-disclosure" className="underline" style={{ color: 'var(--sfp-navy)' }}>
                Details
              </Link>
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
