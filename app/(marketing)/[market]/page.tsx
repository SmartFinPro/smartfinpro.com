import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, FileText, Globe, BarChart3 } from 'lucide-react';
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
import { Hero } from '@/components/marketing/hero';
import { PortalSidebar } from '@/components/marketing/portal-sidebar';
import { ReportCard } from '@/components/marketing/report-card';
import { UKBrokerHeroSlider } from '@/components/home/uk-broker-hero-slider';
import type { Category } from '@/lib/i18n/config';

/* Per-market Hero content */
const marketHeroContent: Record<string, {
  title: string;
  subtitle: string;
  primaryCta: { text: string; href: string };
  secondaryCta: { text: string; href: string };
}> = {
  us: {
    title: 'Financial Intelligence for Modern Professionals.',
    subtitle: 'Discover AI-powered tools, cybersecurity solutions, and financial products — expert reviews, comparisons, and guides across 4 global markets.',
    primaryCta: { text: 'Explore Reports', href: '/us/trading' },
    secondaryCta: { text: 'Browse Tools', href: '/tools' },
  },
  uk: {
    title: 'UK Financial Intelligence. Delivered.',
    subtitle: 'FCA-regulated broker reviews, cybersecurity solutions, and AI-powered tools — expert-reviewed for UK professionals.',
    primaryCta: { text: 'Explore UK Reports', href: '/uk/trading' },
    secondaryCta: { text: 'Browse Tools', href: '/tools' },
  },
  ca: {
    title: 'Canadian Finance. Simplified.',
    subtitle: 'CIRO-compliant broker reviews, AI tools, and financial products — expert-reviewed for Canadian professionals.',
    primaryCta: { text: 'Explore CA Reports', href: '/ca/forex' },
    secondaryCta: { text: 'Browse Tools', href: '/tools' },
  },
  au: {
    title: 'Australian Finance. Mastered.',
    subtitle: 'ASIC-licensed broker reviews, cybersecurity solutions, and AI tools — expert-reviewed for Australian professionals.',
    primaryCta: { text: 'Explore AU Reports', href: '/au/trading' },
    secondaryCta: { text: 'Browse Tools', href: '/tools' },
  },
};

interface MarketPageProps {
  params: Promise<{ market: string }>;
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

export default async function MarketHomePage({ params }: MarketPageProps) {
  const { market } = await params;

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

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          1. HERO SECTION (same premium style as US homepage)
      ═══════════════════════════════════════════════════════════════ */}
      <Hero
        title={heroContent.title}
        subtitle={heroContent.subtitle}
        primaryCta={heroContent.primaryCta}
        secondaryCta={heroContent.secondaryCta}
      />

      {/* Trust Ticker — E-E-A-T Signal */}
      <div className="border-y border-gray-200 overflow-hidden py-3" style={{ background: 'var(--sfp-sky)' }}>
        <div className="trust-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 shrink-0">
              {[
                'WE REVIEW FCA-REGULATED BROKERS',
                'ASIC-LICENSED PARTNERS',
                'REAL-TIME MARKET DATA',
                'CIRO-COMPLIANT PARTNERS',
                'EXPERT-REVIEWED',
                'SECURE & ENCRYPTED',
              ].map((item) => (
                <span key={`${i}-${item}`} className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: 'var(--sfp-slate)' }}>
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--sfp-green)' }} />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. META-BAR (transition between Hero and Report Feed)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div
            className="flex flex-wrap items-center gap-4 px-5 py-3 rounded-xl text-sm"
            style={{ background: 'var(--sfp-gray)' }}
          >
            <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
              <Globe className="h-3.5 w-3.5" />
              {config.flag} {config.name}
            </span>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
              <BarChart3 className="h-3.5 w-3.5" />
              {categories.length} Market Sectors
            </span>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
              <FileText className="h-3.5 w-3.5" />
              {allReviews.length}+ Expert Reports
            </span>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
              <Calendar className="h-3.5 w-3.5" />
              Updated {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* UK Broker Hero Slider — Exclusive to UK Market */}
      {marketData === 'uk' && (
        <section className="py-10" style={{ background: 'var(--sfp-gray)' }}>
          <div className="container mx-auto px-4">
            <UKBrokerHeroSlider />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          3. TWO-COLUMN LAYOUT (Sidebar LEFT + Report Feed RIGHT)
      ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--sfp-gray)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">

            {/* LEFT: Sidebar (~25%) — Sticky Category Navigation */}
            <PortalSidebar market={marketData} />

            {/* RIGHT: Main Content (~75%) — Report Feed */}
            <div className="flex-1 min-w-0">

              {/* Section Title */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                  Latest Reports
                </h2>
                <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  {allReviews.length} reports available
                </span>
              </div>

              {/* Report Cards */}
              <div className="space-y-4">
                {allReviews.map((item) => (
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

              {/* Global Markets Links */}
              <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                  Explore All Markets
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { flag: '🇺🇸', name: 'United States', href: '/us' },
                    { flag: '🇬🇧', name: 'United Kingdom', href: '/uk' },
                    { flag: '🇨🇦', name: 'Canada', href: '/ca' },
                    { flag: '🇦🇺', name: 'Australia', href: '/au' },
                  ].map((m) => (
                    <Link
                      key={m.name}
                      href={m.href}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm hover:shadow-md transition-shadow"
                      style={{ color: 'var(--sfp-ink)' }}
                    >
                      <span className="text-lg">{m.flag}</span>
                      <span className="font-medium">{m.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Trust Section (compact) */}
              <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>
                  Trusted by {config.name} Professionals
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {[`${config.currency} Pricing`, 'Expert-Reviewed', 'Compliant Reviews', 'Local Support'].map((badge) => (
                    <span
                      key={badge}
                      className="text-xs py-1.5 px-4 rounded-full font-medium text-white"
                      style={{ background: 'var(--sfp-navy)' }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

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
