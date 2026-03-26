import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  isValidMarket,
  isValidCategory,
  Market,
  Category,
  marketConfig,
  categoryConfig,
  markets,
  marketCategories,
} from '@/lib/i18n/config';
import { generateAlternates, getCanonicalUrl } from '@/lib/seo/hreflang';
import { overviewContent } from '@/lib/data/overview-content';
import { Button } from '@/components/ui/button';
import { OverviewReadMore } from '@/components/marketing/overview-read-more';
import { OverviewSidebar } from '@/components/marketing/overview-sidebar';
import { OverviewTabs } from '@/components/marketing/overview-tabs';
import {
  BarChart3,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Breadcrumb } from '@/components/marketing/breadcrumb';
import { getContentByMarketAndCategory } from '@/lib/mdx';

interface OverviewPageProps {
  params: Promise<{
    market: string;
    category: string;
  }>;
}

export async function generateMetadata({ params }: OverviewPageProps): Promise<Metadata> {
  const { market, category } = await params;

  if (!isValidMarket(market) || !isValidCategory(category)) {
    return {};
  }

  const content = overviewContent[category];
  const categoryInfo = categoryConfig[category as Category];
  const title = content?.pageTitle || `${categoryInfo.name} Market Overview | SmartFinPro`;
  const description = content?.introText?.slice(0, 160) || `Comprehensive market analysis and industry insights for ${categoryInfo.name.toLowerCase()}.`;

  const canonicalUrl = getCanonicalUrl(market as Market, `/${category}/overview`);
  // Only emit hreflang for markets that actually have this category AND have overview content
  const availableMarkets = markets.filter(
    (m) =>
      marketCategories[m as Market].includes(category as Category) &&
      !!overviewContent[category]
  );
  const alternates = generateAlternates(`/${category}/overview`, availableMarkets);

  return {
    title: `${title} | SmartFinPro`,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: alternates,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      locale: marketConfig[market as Market].locale.replace('-', '_'),
    },
  };
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const { market, category } = await params;

  if (!isValidMarket(market) || !isValidCategory(category)) {
    notFound();
  }

  const content = overviewContent[category];
  const categoryInfo = categoryConfig[category as Category];
  const marketPrefix = `/${market}`;
  const categoryHref = `${marketPrefix}/${category}`;

  if (!content) {
    notFound();
  }

  // Fetch reviews for this market/category (exclude pillar page index)
  const allContent = await getContentByMarketAndCategory(market as Market, category as Category);
  const reviews = allContent.filter((item) => item.slug !== 'index');

  return (
    <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'var(--sfp-sky)' }}>

        <div className="container relative z-10 mx-auto px-4 pt-12 pb-16 lg:pt-16 lg:pb-24">
          {/* Breadcrumb */}
          <div className="max-w-4xl mx-auto mb-8">
            <Breadcrumb
              items={[
                { label: 'Home', href: marketPrefix || '/' },
                { label: categoryInfo.name, href: categoryHref },
                { label: 'Overview' },
              ]}
            />
          </div>

          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 border border-gray-200 bg-white shadow-sm">
              <BarChart3 className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
              <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Market Report 2026</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-[1.1] tracking-tight" style={{ color: 'var(--sfp-ink)' }}>
              {content.heroTitle}
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'var(--sfp-slate)' }}>
              {content.heroSubtitle}
            </p>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 max-w-3xl mx-auto">
              {content.keyStats.map((stat, idx) => (
                <div
                  key={idx}
                  className="rounded-xl p-4 text-center border border-gray-200 bg-white shadow-sm"
                >
                  <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: stat.highlight ? 'var(--sfp-navy)' : 'var(--sfp-ink)' }}>
                    {stat.value}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild className="rounded-xl border-0 h-11 px-8 text-white" style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}>
                <Link href={categoryHref}>
                  View All {categoryInfo.name}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-gray-300 h-11 px-8 hover:bg-gray-50" style={{ color: 'var(--sfp-navy)' }}>
                <a href="#overview-content">Read Full Report</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Read More Intro */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <OverviewReadMore text={content.introText} />
        </div>
      </section>

      {/* Mobile category pills */}
      <section className="container mx-auto px-4 py-4 lg:hidden">
        <OverviewSidebar market={market as Market} activeCategory={category} />
      </section>

      {/* Main two-column layout */}
      <section id="overview-content" className="container mx-auto px-4 py-8 scroll-mt-20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-[280px] flex-shrink-0 hidden lg:block">
            <div className="lg:sticky lg:top-24">
              <OverviewSidebar market={market as Market} activeCategory={category} />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              {categoryInfo.name} Market Research Reports
            </h2>
            <OverviewTabs
              content={content}
              categoryName={categoryInfo.name}
              categoryHref={categoryHref}
            />
          </div>
        </div>
      </section>

      {/* Featured Reviews */}
      {reviews.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>Featured Reviews</h2>
            <p className="mb-6" style={{ color: 'var(--sfp-slate)' }}>
              In-depth expert reviews for {categoryInfo.name.toLowerCase()} in {marketConfig[market as Market].name}.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((review) => (
                <Link
                  key={review.slug}
                  href={`${marketPrefix}/${category}/${review.slug}`}
                  className="group rounded-xl border border-gray-200 bg-white shadow-sm p-5 transition-all hover:shadow-md hover:border-gray-300"
                >
                  <h3 className="font-semibold transition-colors mb-1" style={{ color: 'var(--sfp-ink)' }}>
                    {review.meta.title}
                  </h3>
                  {review.meta.rating && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-3.5 w-3.5 fill-amber-400" style={{ color: 'var(--sfp-gold)' }} />
                      <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>{review.meta.rating}/5</span>
                    </div>
                  )}
                  <p className="text-sm line-clamp-2" style={{ color: 'var(--sfp-slate)' }}>{review.meta.description}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: 'var(--sfp-navy)' }}>
                    Read Review <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export async function generateStaticParams() {
  // Uses marketCategories to ensure only valid market/category combos are pre-rendered
  const allMarketCategories: Record<string, string[]> = {
    us: ['ai-tools', 'cybersecurity', 'personal-finance', 'trading', 'business-banking', 'credit-repair', 'debt-relief', 'credit-score'],
    uk: ['ai-tools', 'cybersecurity', 'trading', 'personal-finance', 'business-banking', 'remortgaging', 'cost-of-living', 'savings'],
    ca: ['ai-tools', 'cybersecurity', 'forex', 'personal-finance', 'business-banking', 'tax-efficient-investing', 'housing'],
    au: ['ai-tools', 'cybersecurity', 'trading', 'forex', 'personal-finance', 'business-banking', 'superannuation', 'gold-investing', 'savings'],
  };

  const params: { market: string; category: string }[] = [];
  for (const [market, categories] of Object.entries(allMarketCategories)) {
    for (const category of categories) {
      params.push({ market, category });
    }
  }
  return params;
}
