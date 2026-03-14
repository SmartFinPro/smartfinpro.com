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
import { Calendar, FileText, BarChart3, Star, Wrench, ArrowRight, Shield, CheckCircle, Edit3 } from 'lucide-react';
import { Breadcrumb } from '@/components/marketing/breadcrumb';
import { PortalSidebar } from '@/components/marketing/portal-sidebar';
import { ReportCard } from '@/components/marketing/report-card';
import { CategorySummary } from '@/components/marketing/category-summary';
import { ReportPagination } from '@/components/marketing/report-pagination';
import { ExpertVerifier } from '@/components/marketing/expert-verifier';
import { NewsletterBox } from '@/components/marketing/newsletter-box';
import { getMarketExpert } from '@/lib/actions/experts';
import { getFirstMondayOfMonth } from '@/lib/utils/date-helpers';
import { RegionalHeroImage } from '@/components/marketing/regional-hero-image';

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

const REPORTS_PER_PAGE = 8;

interface CategoryPageProps {
  params: Promise<{
    market: string;
    category: string;
  }>;
  searchParams: Promise<{ page?: string }>;
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

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { market, category } = await params;
  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page || '1', 10) || 1);

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
  const allReviews = allContent
    .filter((item) => item.slug !== 'index')
    .sort(
      (a, b) =>
        new Date(b.meta.modifiedDate || b.meta.publishDate).getTime() -
        new Date(a.meta.modifiedDate || a.meta.publishDate).getTime()
    );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(allReviews.length / REPORTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const reviews = allReviews.slice((safePage - 1) * REPORTS_PER_PAGE, safePage * REPORTS_PER_PAGE);

  // Compute average rating (across ALL reviews, not just current page)
  const ratedReviews = allReviews.filter((r) => r.meta.rating);
  const avgRating = ratedReviews.length > 0
    ? (ratedReviews.reduce((sum, r) => sum + (r.meta.rating || 0), 0) / ratedReviews.length).toFixed(1)
    : null;

  // Serialize pillar MDX if available.
  // Pass frontmatter as scope so MDX can reference frontmatter.faqs, etc.
  // gray-matter already stripped the YAML block from pillarContent.content,
  // so parseFrontmatter: true would find nothing — we inject it manually here.
  const mdxSource = pillarContent
    ? await serializeMDX(pillarContent.content, { frontmatter: pillarContent.meta })
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
        <div className="mx-auto px-6 pt-8 pb-10" style={{ maxWidth: '1200px' }}>
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
            className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mt-5"
            style={{ color: 'var(--sfp-ink)' }}
          >
            {pillarContent?.meta.title || `${categoryInfo.name}: Expert Research Reports`}
          </h1>
          <p className="text-base mt-3 max-w-3xl leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
            {pillarContent?.meta.description || categoryInfo.description}
          </p>

          {/* Meta-Bar */}
          <div
            className="flex flex-wrap items-center gap-4 mt-6 px-5 py-3 rounded-2xl text-sm border border-[#E2E8F0]"
            style={{ background: 'var(--sfp-gray)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
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
          1b. HERO IMAGE (category pillar)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto px-6 py-4" style={{ maxWidth: '1200px' }}>
          <RegionalHeroImage
            market={market}
            category={category}
            className="w-full"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. TWO-COLUMN LAYOUT (Sidebar LEFT + Report Feed RIGHT)
      ═══════════════════════════════════════════════════════════════ */}
      <section id="reports" className="mx-auto px-6 py-24" style={{ maxWidth: '1200px' }}>
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT: Sidebar (~25%) — Sticky Category Navigation */}
          <PortalSidebar market={market as Market} activeCategory={category as Category} />

          {/* RIGHT: Main Content (~75%) — Report Feed */}
          <div className="flex-1 min-w-0">

            {/* Section Title */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--sfp-ink)' }}>
                {ratedReviews.length > 0 ? 'Latest Reports' : 'All Reports'}
              </h2>
              <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                {allReviews.length} {allReviews.length === 1 ? 'report' : 'reports'} available
              </span>
            </div>

            {/* Category Summary (collapsible) */}
            {categoryInfo.summaryText && (
              <CategorySummary
                categoryName={categoryInfo.name}
                summary={categoryInfo.summaryText}
                details={categoryInfo.detailsText}
              />
            )}

            {/* Report Cards */}
            <div className="flex flex-col gap-5">
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

            {/* Pagination */}
            <ReportPagination
              currentPage={safePage}
              totalPages={totalPages}
              basePath={`${marketPrefix}/${category}`}
            />

            {/* Empty State */}
            {reviews.length === 0 && (
              <div
                className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <BarChart3 className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--sfp-slate)' }} />
                <h3 className="text-lg font-black tracking-tight mb-2" style={{ color: 'var(--sfp-ink)' }}>
                  Reports Coming Soon
                </h3>
                <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  Our expert team is preparing {categoryInfo.name} reports for {config.name}. Check back soon.
                </p>
              </div>
            )}

            {/* Pillar MDX Content (wenn index.mdx existiert) */}
            {mdxSource && (
              <div
                className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6 md:p-8"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <article className="prose prose-lg max-w-none">
                  <SafeMDX source={mdxSource} />
                </article>
              </div>
            )}

            {/* ─── Editorial Transparency Block ─── */}
            <div
              className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              {/* Gradient accent bar */}
              <div style={{ height: 4, background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />
              <div className="flex flex-col sm:flex-row">
                {/* Left panel */}
                <div className="flex items-center gap-3 px-5 py-4 sm:w-52 shrink-0" style={{ background: 'var(--sfp-sky)' }}>
                  <Edit3 className="h-5 w-5 shrink-0" style={{ color: 'var(--sfp-navy)' }} />
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--sfp-navy)' }}>
                    Editorial Info
                  </span>
                </div>
                {/* Right — meta stats */}
                <div className="flex flex-wrap divide-x divide-gray-100 flex-1">
                  <div className="flex flex-col justify-center px-5 py-3 min-w-[120px]">
                    <span className="text-xs font-bold" style={{ color: 'var(--sfp-ink)' }}>Published</span>
                    <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                      {pillarContent?.meta.publishDate
                        ? new Date(pillarContent.meta.publishDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Jan 2026'}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center px-5 py-3 min-w-[120px]">
                    <span className="text-xs font-bold" style={{ color: 'var(--sfp-ink)' }}>Last Updated</span>
                    <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                      {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center px-5 py-3 min-w-[140px]">
                    <span className="text-xs font-bold" style={{ color: 'var(--sfp-ink)' }}>Reviewed By</span>
                    <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{expert.name}</span>
                  </div>
                  <div className="flex flex-col justify-center px-5 py-3 min-w-[130px]">
                    <span className="text-xs font-bold" style={{ color: 'var(--sfp-ink)' }}>Fact-Checked</span>
                    <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{getFirstMondayOfMonth()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expert Verifier */}
            <div className="mt-6">
              <ExpertVerifier
                name={expert.name}
                title={expert.role}
                credentials={expert.credentials.length > 0 ? expert.credentials : ['Expert Reviewer']}
                lastFactChecked={getFirstMondayOfMonth()}
                bio={expert.bio || undefined}
                image={expert.image_url || undefined}
                linkedInUrl={expert.linkedin_url || undefined}
              />
            </div>

            {/* Useful Tools */}
            {categoryTools[category] && categoryTools[category].length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <Wrench className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                  Useful Tools
                </h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  {categoryTools[category].map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="card-hover-lift rounded-2xl border border-[#E2E8F0] bg-white p-4 group flex items-center gap-3 transition-all duration-200"
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>{tool.name}</p>
                        <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{tool.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--sfp-gold)' }} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter */}
            <div className="mt-8">
              <NewsletterBox />
            </div>

            {/* Disclaimer */}
            <aside
              className="mt-6 rounded-2xl border border-[#E2E8F0] bg-white p-5 text-sm"
              style={{ color: 'var(--sfp-slate)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--sfp-navy)' }} />
                <div>
                  <p className="font-semibold mb-1" style={{ color: 'var(--sfp-ink)' }}>Affiliate Disclosure &amp; Editorial Independence</p>
                  <p>
                    SmartFinPro may earn a commission when you click links and make a purchase. Our editorial team operates independently — commission relationships do not influence ratings, rankings, or recommendations.
                    All scores reflect our expert testing methodology.{' '}
                    <Link href="/affiliate-disclosure" className="hover:underline font-medium" style={{ color: 'var(--sfp-navy)' }}>
                      Read our full disclosure policy →
                    </Link>
                  </p>
                </div>
              </div>
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
