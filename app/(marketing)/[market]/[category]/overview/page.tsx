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
} from 'lucide-react';
import { Breadcrumb } from '@/components/marketing/breadcrumb';

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
  const alternates = generateAlternates(`/${category}/overview`);

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
  const marketPrefix = market === 'us' ? '' : `/${market}`;
  const categoryHref = `${marketPrefix}/${category}`;

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />

        <div className="container relative z-10 mx-auto px-4 py-16 lg:py-24">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Home', href: marketPrefix || '/' },
              { label: categoryInfo.name, href: categoryHref },
              { label: 'Overview' },
            ]}
          />

          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 mb-6">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-cyan-300">Market Report 2026</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
              {content.heroTitle}
            </h1>
            <p className="text-xl md:text-2xl text-cyan-400 mb-8">
              {content.heroSubtitle}
            </p>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {content.keyStats.map((stat, idx) => (
                <div key={idx} className={`rounded-xl p-4 text-center ${stat.highlight ? 'bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30' : 'glass-card'}`}>
                  <div className={`text-2xl md:text-3xl font-bold mb-1 ${stat.highlight ? 'text-cyan-400' : 'text-white'}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button asChild className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 border-0">
                <Link href={categoryHref}>
                  View All {categoryInfo.name}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700">
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
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
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
    </div>
  );
}

export async function generateStaticParams() {
  const markets = ['us', 'uk', 'ca', 'au'];
  const categories = ['ai-tools', 'cybersecurity', 'trading', 'personal-finance', 'forex', 'business-banking'];

  const params: { market: string; category: string }[] = [];
  for (const market of markets) {
    for (const category of categories) {
      params.push({ market, category });
    }
  }
  return params;
}
