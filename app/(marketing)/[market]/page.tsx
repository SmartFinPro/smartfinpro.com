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
  CategoryShowcase,
  EditorsPicks,
  MethodologySection,
  PlatformStats,
  ComplianceBar,
  GlobalTrustSection,
} from '@/components/marketing/homepage-sections';

import type { Category } from '@/lib/i18n/config';

/* Per-market Hero content */
const marketHeroContent: Record<string, {
  title: string;
  subtitle: string;
  primaryCta: { text: string; href: string };
  secondaryCta: { text: string; href: string };
}> = {
  us: {
    title: 'Financial Product\nResearch, Simplified.',
    subtitle: '108+ expert-reviewed products across trading, AI, cybersecurity, and personal finance. Independent analysis. 4 regulated markets.',
    primaryCta: { text: 'Explore Reports', href: '/us/trading' },
    secondaryCta: { text: 'How We Review', href: '/tools' },
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
    primaryCta: { text: 'Explore CA Reports', href: '/ca/forex' },
    secondaryCta: { text: 'How We Review', href: '/tools' },
  },
  au: {
    title: 'Australian Finance\nResearch, Mastered.',
    subtitle: 'ASIC-licensed broker reviews, cybersecurity solutions, and AI tools — expert-reviewed for Australian professionals.',
    primaryCta: { text: 'Explore AU Reports', href: '/au/trading' },
    secondaryCta: { text: 'How We Review', href: '/tools' },
  },
};

const REPORTS_PER_PAGE = 10;

interface MarketPageProps {
  params: Promise<{ market: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: MarketPageProps): Promise<Metadata> {
  const { market } = await params;

  if (!isValidMarket(market)) {
    return {};
  }

  const config = marketConfig[market as Market];
  const alternates = generateAlternates('/');

  // US gets the primary brand title, other markets get localized titles
  const isUS = market === 'us';

  return {
    title: isUS
      ? 'SmartFinPro - Financial Intelligence for Modern Professionals'
      : `${config.name} Financial Intelligence Hub — Expert Research Reports | SmartFinPro`,
    description: isUS
      ? 'Discover AI-powered tools, cybersecurity solutions, and financial products for modern professionals. Expert reviews, comparisons, and guides across 4 global markets.'
      : `Discover AI-powered tools, cybersecurity solutions, and financial products for ${config.name} professionals. ${marketCategories[market as Market].length} market sectors with expert reviews.`,
    alternates: {
      canonical: `/${market}`,
      languages: alternates,
    },
    openGraph: {
      locale: config.locale.replace('-', '_'),
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

  // Editor's Picks — top 3 rated reviews (different categories preferred)
  const seenCategories = new Set<string>();
  const editorsPicks = allReviews
    .filter((item) => item.meta.rating && item.meta.rating >= 4.0)
    .sort((a, b) => (b.meta.rating || 0) - (a.meta.rating || 0))
    .filter((item) => {
      // Prefer diversity — one per category
      if (seenCategories.has(item.meta.category)) return false;
      seenCategories.add(item.meta.category);
      return true;
    })
    .slice(0, 3)
    .map((item) => ({
      title: item.meta.seoTitle || item.meta.title,
      description: item.meta.description,
      slug: item.slug,
      category: item.meta.category as Category,
      rating: item.meta.rating,
      reviewCount: item.meta.reviewCount,
    }));

  return (
    <>
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
      <CategoryShowcase market={marketData} categoryCounts={categoryCounts} />

      {/* ═══════════════════════════════════════════════════════════════
          5. GLOBAL TRUST — Markets + Regulators
      ═══════════════════════════════════════════════════════════════ */}
      <GlobalTrustSection />

      {/* ═══════════════════════════════════════════════════════════════
          6. METHODOLOGY — How We Review
      ═══════════════════════════════════════════════════════════════ */}
      <MethodologySection />

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

      {/* ═══════════════════════════════════════════════════════════════
          9. REPORT FEED — Two-Column Layout (Sidebar + Reports)
      ═══════════════════════════════════════════════════════════════ */}
      <section id="reports" style={{ background: '#fff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '80px 40px' }}>
          <div className="flex flex-col lg:flex-row gap-8">

            {/* LEFT: Sidebar (~25%) — Sticky Category Navigation */}
            <PortalSidebar market={marketData} categoryCounts={categoryCounts} />

            {/* RIGHT: Main Content (~75%) — Report Feed */}
            <div className="flex-1 min-w-0">

              {/* Section Title */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-[2px] mb-2" style={{ color: 'var(--sfp-slate)' }}>
                    Research Library
                  </span>
                  <h2 className="text-2xl font-extrabold" style={{ color: 'var(--sfp-ink)', letterSpacing: '-0.6px' }}>
                    Latest Reports
                  </h2>
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>
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
    </>
  );
}

export function generateStaticParams() {
  return [{ market: 'us' }, { market: 'uk' }, { market: 'ca' }, { market: 'au' }];
}
