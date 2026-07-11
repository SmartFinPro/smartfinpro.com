import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { notFound } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import {
  isValidMarket,
  Market,
  marketConfig,
  marketCategories,
  categoryConfig,
} from '@/lib/i18n/config';
import { generateAlternates } from '@/lib/seo/hreflang';
import { getContentByMarketAndCategory } from '@/lib/mdx';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

// Cache the MDX filesystem scan per market — avoids re-reading 74+ files on every request.
// Static pages are pre-rendered at build time anyway; this helps ISR and dev mode warm reqs.
// NOTE: content field is intentionally excluded — it can be 30KB+ per file (3.5MB total for US),
//       which exceeds Next.js unstable_cache's 2MB hard limit. The homepage only needs meta+slug.
const getMarketReviews = unstable_cache(
  async (market: Market) => {
    const categories = marketCategories[market];
    const allCategoryContent = await Promise.all(
      categories.map((cat) => getContentByMarketAndCategory(market, cat))
    );
    return allCategoryContent
      .flat()
      .filter((item) => item.slug !== 'index' && item.meta.rating)
      .sort(
        (a, b) =>
          new Date(b.meta.modifiedDate || b.meta.publishDate).getTime() -
          new Date(a.meta.modifiedDate || a.meta.publishDate).getTime()
      )
      // Strip full MDX body before caching — meta+slug is all the homepage needs.
      .map(({ slug, meta, readingTime }) => ({ slug, meta, readingTime }));
  },
  ['market-homepage-reviews'],
  { revalidate: 300, tags: ['market-reviews'] } // 5 min cache, bust via revalidateTag
);
import Hero from '@/components/marketing/hero';
import { PortalSidebar } from '@/components/marketing/portal-sidebar';
import { ReportCard } from '@/components/marketing/report-card';
import { ReportPagination } from '@/components/marketing/report-pagination';
import UKBrokerHeroSlider from '@/components/home/uk-broker-hero-slider';
import {
  BestXIndex,
  CategoryShowcase,
  EditorsPicks,
  MethodologySection,
  PlatformStats,
  ComplianceBar,
  GlobalTrustSection,
  HomepageFAQSection,
} from '@/components/marketing/homepage-sections';
import { getBestXIndex } from '@/lib/comparison/loader';
import { buildBestXItemListSchema } from '@/lib/seo/best-x-item-list';

import type { Category } from '@/lib/i18n/config';

/* Per-market Hero content */
const marketHeroContent: Record<string, {
  title: string;
  subtitle: string;
  primaryCta: { text: string; href: string };
  secondaryCta: { text: string; href: string };
}> = {
  us: {
    title: 'Find and compare the\nBest Financial Products',
    subtitle: 'Compare smarter with Best-X Compare. Make confident financial decisions backed by deep research and build a stronger financial future.',
    primaryCta: { text: 'Start now', href: '#best-x-compare' },
    secondaryCta: { text: 'How We Review', href: '/integrity' },
  },
  uk: {
    title: 'UK Financial\nIntelligence, Delivered.',
    subtitle: 'FCA-regulated broker reviews, cybersecurity solutions, and AI-powered tools — expert-reviewed for UK professionals.',
    primaryCta: { text: 'Explore UK Reports', href: '/uk/trading' },
    secondaryCta: { text: 'How We Review', href: '/tools' },
  },
  ca: {
    title: 'Canadian Finance\nResearch, Simplified.',
    subtitle: 'CIRO-compliant broker reviews, AI tools, and financial products — expert-reviewed for Canadian professionals.',
    // Mirrors the US hero: primary CTA anchors to the Best-X tile grid now that
    // CA has live cockpit tiles (Stage 2 slice 1).
    primaryCta: { text: 'Start now', href: '#best-x-compare' },
    secondaryCta: { text: 'How We Review', href: '/integrity' },
  },
  au: {
    title: 'Australian Finance\nResearch, Mastered.',
    subtitle: 'ASIC-licensed broker reviews, cybersecurity solutions, and AI tools — expert-reviewed for Australian professionals.',
    // Mirrors the US hero: primary CTA anchors to the Best-X tile grid now that
    // AU has live cockpit tiles (Stage 1 slice 1).
    primaryCta: { text: 'Start now', href: '#best-x-compare' },
    secondaryCta: { text: 'How We Review', href: '/integrity' },
  },
};

const REPORTS_PER_PAGE = 8;

interface MarketPageProps {
  params: Promise<{ market: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: MarketPageProps): Promise<Metadata> {
  const { market } = await params;
  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page || '1', 10) || 1);

  if (!isValidMarket(market)) {
    return {};
  }

  const config = marketConfig[market as Market];
  const alternates = generateAlternates('/');

  // US gets the primary brand title, other markets get localized titles
  const isUS = market === 'us';

  // US canonical is / (no market prefix) — avoids canonical chain via /us redirect.
  // Other markets use /{market} as canonical.
  const canonicalBase = isUS ? '/' : `/${market}`;
  const canonicalUrl = isUS ? `${BASE_URL}/` : `${BASE_URL}/${market}`;

  const title = isUS
    ? 'SmartFinPro — Financial Product Reviews & Comparisons'
    : `${config.name} Financial Intelligence Hub — Expert Research Reports | SmartFinPro`;
  const description = isUS
    ? 'Discover AI-powered tools, cybersecurity solutions, and financial products for modern professionals. Expert reviews and comparisons across 4 global markets.'
    : `Discover AI-powered tools, cybersecurity solutions, and financial products for ${config.name} professionals. ${marketCategories[market as Market].length} market sectors with expert reviews.`;

  return {
    // `title: { absolute }` bypasses the root layout's `%s | SmartFinPro` template.
    // Both branches already contain the brand name once — the template would double it.
    title: { absolute: title },
    description,
    // Paginated pages (?page=2+) must not be indexed — canonical already points to the
    // base page, and noindex removes them from GSC's "Alternative with correct canonical" report.
    ...(currentPage > 1 && { robots: { index: false, follow: true } }),
    alternates: {
      canonical: canonicalBase,
      languages: alternates,
    },
    // Page-level `openGraph` fully replaces (not merges with) the layout's openGraph
    // object in Next.js metadata resolution — every field needed must be repeated here.
    openGraph: {
      type: 'website',
      locale: config.locale.replace('-', '_'),
      url: canonicalUrl,
      siteName: 'SmartFinPro',
      title,
      description,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'SmartFinPro',
        },
      ],
    },
    // Kept identical to `openGraph` so the messaging layer doesn't fork across
    // Facebook/LinkedIn (OG) vs. X (Twitter) previews.
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
      creator: '@smartfinpro',
    },
  };
}

export default async function MarketHomePage({ params, searchParams }: MarketPageProps) {
  const { market } = await params;
  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page || '1', 10) || 1);

  if (!isValidMarket(market)) {
    notFound();
  }

  const marketData = market as Market;
  const config = marketConfig[marketData];
  const categories = marketCategories[marketData];
  const marketPrefix = `/${marketData}`;

  // Fetch all reviews via cached MDX scan (fast in dev + ISR; pre-rendered at build in prod)
  const allReviews = await getMarketReviews(marketData);

  const heroContent = marketHeroContent[marketData] || marketHeroContent['uk'];

  // Pagination
  const totalPages = Math.max(1, Math.ceil(allReviews.length / REPORTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedReviews = allReviews.slice((safePage - 1) * REPORTS_PER_PAGE, safePage * REPORTS_PER_PAGE);

  // ── Compute data for new landing page sections ──

  // Category counts (reviews per category)
  const categoryCounts: Record<string, number> = {};
  for (const item of allReviews) {
    const cat = item.meta.category;
    if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  // Best-X Compare Index (homepage): live winners + coming-soon tiles, per market.
  const bestX = await getBestXIndex(marketData);

  // ItemList JSON-LD for non-US market homepages. The US copy is emitted by the
  // root wrapper (app/(marketing)/page.tsx) which composes this component — the
  // guard prevents a duplicate ItemList on '/'.
  const bestXItemList = marketData !== 'us' ? buildBestXItemListSchema(marketData, bestX) : null;

  // Editor's Picks — top 6 rated reviews (different categories preferred)
  // 6 picks (up from 3) = stronger Hub→Leaf signal from homepage to leaf review pages.
  // Diversity filter: max 2 per category to ensure broad coverage across 6 categories.
  const categoryPickCount = new Map<string, number>();
  const editorsPicks = allReviews
    .filter((item) => item.meta.rating && item.meta.rating >= 4.0)
    .sort((a, b) => (b.meta.rating || 0) - (a.meta.rating || 0))
    .filter((item) => {
      // Allow max 2 per category (ensures diversity across 6 picks)
      const count = categoryPickCount.get(item.meta.category) || 0;
      if (count >= 2) return false;
      categoryPickCount.set(item.meta.category, count + 1);
      return true;
    })
    .slice(0, 6)
    .map((item) => ({
      title: item.meta.seoTitle || item.meta.title,
      description: item.meta.description,
      slug: item.slug,
      category: item.meta.category as Category,
      rating: item.meta.rating,
      reviewCount: item.meta.reviewCount,
    }));

  return (
    // The `<main id="main-content">` landmark is already provided by the shared
    // MarketingLayout (app/(marketing)/layout.tsx) — a second one here would
    // duplicate both the element and the id (invalid HTML, confuses a11y tree).
    <>
      {bestXItemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(bestXItemList.schema) }}
        />
      )}
      {/* ═══════════════════════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <Hero
        title={heroContent.title}
        subtitle={heroContent.subtitle}
        primaryCta={heroContent.primaryCta}
        secondaryCta={heroContent.secondaryCta}
      />

      {/* ═══════════════════════════════════════════════════════════════
          2. PLATFORM STATS — Key numbers bar
      ═══════════════════════════════════════════════════════════════ */}
      <PlatformStats totalReviews={allReviews.length} />

      {/* ═══════════════════════════════════════════════════════════════
          3. COMPLIANCE BAR — Regulatory trust signals
      ═══════════════════════════════════════════════════════════════ */}
      <ComplianceBar />

      {/* ═══════════════════════════════════════════════════════════════
          4. CATEGORY SHOWCASE — 6 sectors with icons + counts
      ═══════════════════════════════════════════════════════════════ */}
      {bestX.some((t) => t.status !== 'coming_soon') ? (
        <BestXIndex market={marketData} items={bestX} />
      ) : (
        <CategoryShowcase market={marketData} categoryCounts={categoryCounts} />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          5. REPORT FEED — Two-Column Layout (Sidebar + Reports)
      ═══════════════════════════════════════════════════════════════ */}
      <section id="reports" style={{ background: '#fff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '80px 40px' }}>
          <div className="flex flex-col lg:flex-row gap-8">

            {/* LEFT: Sidebar (~25%) — Sticky Category Navigation */}
            <PortalSidebar market={marketData} categoryCounts={categoryCounts} />

            {/* RIGHT: Main Content (~75%) — Report Feed */}
            <div className="flex-1 min-w-0">

              {/* Section Title */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-[2px] mb-2" style={{ color: 'var(--sfp-slate)' }}>
                    Research Library
                  </span>
                  <h2 className="text-2xl font-extrabold" style={{ color: 'var(--sfp-ink)', letterSpacing: '-0.6px', lineHeight: 1.2 }}>
                    Expert Reviews &amp; Ratings for Financial Products
                  </h2>
                </div>
                <span className="text-sm font-medium shrink-0" style={{ color: 'var(--sfp-slate)' }}>
                  {allReviews.length} reports available
                </span>
              </div>

              {/* Report Cards */}
              <div className="space-y-4">
                {paginatedReviews.map((item) => (
                  <ReportCard
                    key={`${item.meta.category}-${item.slug}`}
                    title={item.meta.seoTitle || item.meta.title}
                    description={item.meta.description}
                    slug={item.slug}
                    market={marketData}
                    category={item.meta.category as Category}
                    rating={item.meta.rating}
                    reviewCount={item.meta.reviewCount}
                    publishDate={item.meta.modifiedDate || item.meta.publishDate}
                    pricing={item.meta.pricing}
                  />
                ))}
              </div>

              {/* Pagination */}
              <ReportPagination
                currentPage={safePage}
                totalPages={totalPages}
                basePath={marketPrefix}
              />

              {/* Empty State */}
              {allReviews.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--sfp-slate)' }} />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>
                    Reports Coming Soon
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    Our expert team is preparing research reports for {config.name}. Check back soon.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          6. GLOBAL TRUST — Markets + Regulators
      ═══════════════════════════════════════════════════════════════ */}
      <GlobalTrustSection />

      {/* ═══════════════════════════════════════════════════════════════
          6. METHODOLOGY — How We Review
      ═══════════════════════════════════════════════════════════════ */}
      <MethodologySection />

      {/* ═══════════════════════════════════════════════════════════════
          7b. FAQ — Visible Q&A + FAQPage schema (AEO)
      ═══════════════════════════════════════════════════════════════ */}
      <HomepageFAQSection market={marketData} marketName={config.name} categoryCount={categories.length} />

      {/* ═══════════════════════════════════════════════════════════════
          8. EDITOR'S PICKS — Top-rated this month
      ═══════════════════════════════════════════════════════════════ */}
      <EditorsPicks market={marketData} picks={editorsPicks} />

      {/* UK Broker Hero Slider — Exclusive to UK Market */}
      {marketData === 'uk' && (
        <section className="py-10" style={{ background: 'var(--sfp-gray)' }}>
          <div className="container mx-auto px-4">
            <UKBrokerHeroSlider />
          </div>
        </section>
      )}

    </>
  );
}

export function generateStaticParams() {
  return [{ market: 'us' }, { market: 'uk' }, { market: 'ca' }, { market: 'au' }];
}
