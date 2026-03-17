import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serializeMDX } from '@/lib/mdx/serialize';
import Link from 'next/link';
import { getPillarContent, getContentByMarketAndCategory } from '@/lib/mdx';
import { SafeMDX } from '@/components/content/SafeMDX';
import {
  isValidMarket,
  isValidCategory,
  Market,
  Category,
  marketConfig,
  categoryConfig,
} from '@/lib/i18n/config';
import { generateAlternates, getCanonicalUrl } from '@/lib/seo/hreflang';
import { generateArticleSchema } from '@/lib/seo/schema';
import { Calendar, FileText, BarChart3, Star, Wrench, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '@/components/marketing/breadcrumb';
import { PortalSidebar } from '@/components/marketing/portal-sidebar';
import { ReportCard } from '@/components/marketing/report-card';
import { ExpertVerifier } from '@/components/marketing/expert-verifier';
import { getMarketExpert } from '@/lib/actions/experts';
import { getFirstMondayOfMonth } from '@/lib/utils/date-helpers';

const categoryTools: Record<string, { name: string; href: string; description: string }[]> = {
  trading: [
    { name: 'Trading Cost Calculator', href: '/tools/trading-cost-calculator', description: 'Compare broker fees' },
    { name: 'Broker Finder Quiz', href: '/tools/broker-finder', description: 'Find your ideal broker' },
  ],
  forex: [
    { name: 'Trading Cost Calculator', href: '/tools/trading-cost-calculator', description: 'Compare forex spreads' },
    { name: 'Broker Comparison', href: '/tools/broker-comparison', description: 'Side-by-side comparison' },
  ],
  'ai-tools': [
    { name: 'AI ROI Calculator', href: '/tools/ai-roi-calculator', description: 'Calculate AI investment returns' },
  ],
  'personal-finance': [
    { name: 'Loan Calculator', href: '/tools/loan-calculator', description: 'Monthly payments & amortization' },
  ],
  'business-banking': [
    { name: 'Broker Comparison', href: '/tools/broker-comparison', description: 'Compare banking options' },
  ],
  cybersecurity: [
    { name: 'AI ROI Calculator', href: '/tools/ai-roi-calculator', description: 'Calculate cybersecurity ROI' },
    { name: 'Broker Comparison', href: '/tools/broker-comparison', description: 'Compare security providers' },
  ],
};

interface CategoryPageProps {
  params: Promise<{
    market: string;
    category: string;
  }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { market, category } = await params;

  if (!isValidMarket(market) || !isValidCategory(category)) {
    return {};
  }

  const pillarContent = await getPillarContent(market as Market, category as Category);
  const categoryInfo = categoryConfig[category as Category];

  const title = pillarContent?.meta.title || `Best ${categoryInfo.name} 2026 | SmartFinPro`;
  const description =
    pillarContent?.meta.description ||
    `Compare the best ${categoryInfo.name.toLowerCase()} for finance professionals. Expert reviews, pricing, and recommendations.`;

  const canonicalUrl = getCanonicalUrl(market as Market, `/${category}`);
  const alternates = generateAlternates(`/${category}`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: alternates,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: marketConfig[market as Market].locale.replace('-', '_'),
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { market, category } = await params;

  if (!isValidMarket(market) || !isValidCategory(category)) {
    notFound();
  }

  const categoryInfo = categoryConfig[category as Category];
  const config = marketConfig[market as Market];
  const marketPrefix = `/${market}`;

  // Graceful degradation: any single failure won't crash the page
  const [pillarResult, allContentResult, expertResult] = await Promise.allSettled([
    getPillarContent(market as Market, category as Category),
    getContentByMarketAndCategory(market as Market, category as Category),
    getMarketExpert(market, category),
  ]);

  const pillarContent = pillarResult.status === 'fulfilled' ? pillarResult.value : null;
  const allContent = allContentResult.status === 'fulfilled' ? (allContentResult.value || []) : [];
  const expert = expertResult.status === 'fulfilled' && expertResult.value
    ? expertResult.value
    : { name: 'SmartFinPro Team', role: 'Editorial Team', bio: null, image_url: null, linkedin_url: null, credentials: ['Expert Reviewer'] as string[], market_slug: market as Market, category: (category as Category) || null, id: '', verified: true, created_at: '', updated_at: '' };

  // Filter reviews (exclude pillar index pages)
  const reviews = allContent
    .filter((item) => item.slug !== 'index')
    .sort(
      (a, b) =>
        new Date(b.meta.modifiedDate || b.meta.publishDate).getTime() -
        new Date(a.meta.modifiedDate || a.meta.publishDate).getTime()
    );

  // Compute average rating
  const ratedReviews = reviews.filter((r) => r.meta.rating);
  const avgRating = ratedReviews.length > 0
    ? (ratedReviews.reduce((sum, r) => sum + (r.meta.rating || 0), 0) / ratedReviews.length).toFixed(1)
    : null;

  // Serialize pillar MDX if available
  const mdxSource = pillarContent
    ? await serializeMDX(pillarContent.content)
    : null;

  const canonicalUrl = getCanonicalUrl(market as Market, `/${category}`);

  return (
    <article className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Schema.org JSON-LD */}
      {pillarContent && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateArticleSchema({
              title: pillarContent.meta.title || `Best ${categoryInfo.name} 2026`,
              description: pillarContent.meta.description || categoryInfo.description,
              publishDate: pillarContent.meta.publishDate || new Date().toISOString(),
              modifiedDate: pillarContent.meta.modifiedDate || new Date().toISOString(),
              author: pillarContent.meta.author || 'SmartFinPro',
              url: canonicalUrl,
            })),
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          1. REPORT-STYLE HERO (compact, white bg, border-b)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 pt-6 pb-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: config.name, href: marketPrefix || '/' },
              { label: categoryInfo.name },
            ]}
          />

          {/* Title */}
          <h1
            className="text-2xl md:text-3xl lg:text-4xl font-bold mt-4"
            style={{ color: 'var(--sfp-ink)' }}
          >
            {pillarContent?.meta.title || `${categoryInfo.name}: Expert Research Reports`}
          </h1>
          <p className="text-base mt-2 max-w-3xl" style={{ color: 'var(--sfp-slate)' }}>
            {pillarContent?.meta.description || categoryInfo.description}
          </p>

          {/* Meta-Bar */}
          <div
            className="flex flex-wrap items-center gap-4 mt-6 px-5 py-3 rounded-xl text-sm"
            style={{ background: 'var(--sfp-gray)' }}
          >
            <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
              <FileText className="h-3.5 w-3.5" />
              {ratedReviews.length} Expert Reports
            </span>
            {avgRating && (
              <>
                <span className="text-gray-300">|</span>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" style={{ color: '#F5A623', fill: '#F5A623' }} />
                  <span style={{ color: 'var(--sfp-slate)' }}>Avg. Rating {avgRating}/5</span>
                </span>
              </>
            )}
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
              <BarChart3 className="h-3.5 w-3.5" />
              {config.currency} Pricing
            </span>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
              <Calendar className="h-3.5 w-3.5" />
              Updated {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          2. TWO-COLUMN LAYOUT (Sidebar LEFT + Report Feed RIGHT)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">

          {/* LEFT: Sidebar (~25%) — Sticky Category Navigation */}
          <PortalSidebar market={market as Market} activeCategory={category as Category} />

          {/* RIGHT: Main Content (~75%) — Report Feed */}
          <div className="flex-1 min-w-0">

            {/* Section Title */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                {ratedReviews.length > 0 ? 'Latest Reports' : 'All Reports'}
              </h2>
              <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                {reviews.length} {reviews.length === 1 ? 'report' : 'reports'} available
              </span>
            </div>

            {/* Report Cards */}
            <div className="space-y-4">
              {reviews.map((item) => (
                <ReportCard
                  key={item.slug}
                  title={item.meta.seoTitle || item.meta.title}
                  description={item.meta.description}
                  slug={item.slug}
                  market={market as Market}
                  category={category as Category}
                  rating={item.meta.rating}
                  reviewCount={item.meta.reviewCount}
                  publishDate={item.meta.modifiedDate || item.meta.publishDate}
                  pricing={item.meta.pricing}
                />
              ))}
            </div>

            {/* Empty State */}
            {reviews.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--sfp-slate)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>
                  Reports Coming Soon
                </h3>
                <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  Our expert team is preparing {categoryInfo.name} reports for {config.name}. Check back soon.
                </p>
              </div>
            )}

            {/* Pillar MDX Content (wenn index.mdx existiert) */}
            {mdxSource && (
              <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
                <article className="prose prose-lg max-w-none">
                  <SafeMDX source={mdxSource} />
                </article>
              </div>
            )}

            {/* Expert Verifier */}
            <div className="mt-8">
              <ExpertVerifier
                name={expert.name}
                title={expert.role}
                credentials={expert.credentials.length > 0 ? expert.credentials : ['Expert Reviewer']}
                lastFactChecked={getFirstMondayOfMonth()}
                bio={expert.bio || undefined}
                image={expert.image_url || undefined}
                linkedInUrl={expert.linkedin_url || undefined}
                variant="compact"
              />
            </div>

            {/* Useful Tools */}
            {categoryTools[category] && categoryTools[category].length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <Wrench className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                  Useful Tools
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {categoryTools[category].map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md group flex items-center gap-3 shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>{tool.name}</p>
                        <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{tool.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--sfp-gold)' }} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <aside className="mt-8 rounded-xl border border-gray-200 bg-white p-5 text-sm shadow-sm" style={{ color: 'var(--sfp-slate)' }}>
              <p>
                <strong style={{ color: 'var(--sfp-ink)' }}>Affiliate Disclosure:</strong> SmartFinPro may earn a commission
                when you click links and make a purchase. This does not affect our
                editorial independence.{' '}
                <Link href="/affiliate-disclosure" className="hover:underline" style={{ color: 'var(--sfp-navy)' }}>
                  Learn more
                </Link>
              </p>
            </aside>

          </div>
        </div>
      </section>
    </article>
  );
}

export async function generateStaticParams() {
  const params: { market: string; category: string }[] = [];

  const allMarketCategories: Record<string, string[]> = {
    us: ['ai-tools', 'cybersecurity', 'personal-finance', 'trading', 'business-banking', 'credit-repair', 'debt-relief', 'credit-score'],
    uk: ['ai-tools', 'cybersecurity', 'trading', 'personal-finance', 'business-banking', 'remortgaging', 'cost-of-living', 'savings'],
    ca: ['ai-tools', 'cybersecurity', 'forex', 'personal-finance', 'business-banking', 'tax-efficient-investing', 'housing'],
    au: ['ai-tools', 'cybersecurity', 'trading', 'forex', 'personal-finance', 'business-banking', 'superannuation', 'gold-investing', 'savings'],
  };

  for (const [market, categories] of Object.entries(allMarketCategories)) {
    for (const category of categories) {
      params.push({ market, category });
    }
  }

  return params;
}
