import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
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
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight, CheckCircle, Sparkles, Star, Trophy, Shield, TrendingUp, Wrench } from 'lucide-react';
import Link from 'next/link';
import { StarRating } from '@/components/marketing/trust-badges';
import { Breadcrumb } from '@/components/marketing/breadcrumb';
import { RegionalHeroImage } from '@/components/marketing/regional-hero-image';
import { buildBreadcrumbs } from '@/lib/breadcrumbs';
import { WinnerAtGlance } from '@/components/marketing/winner-at-glance';
import { StickyTableOfContents } from '@/components/marketing/sticky-toc';
import { StickyFooterCTA } from '@/components/marketing/sticky-footer-cta';
import { ExpertVerifier } from '@/components/marketing/expert-verifier';
import { ComparisonHub } from '@/components/marketing/comparison-hub';
import { FeaturedPartnerOffer } from '@/components/marketing/featured-partner-offer';
import { FrictionlessCTA } from '@/components/marketing/frictionless-cta';
import { buildHubFunnel, getComponentsForZone } from '@/lib/mdx/layout-builder';
import { getMarketExpert } from '@/lib/actions/experts';
import { getTopPartnersForHub } from '@/lib/actions/genesis';
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

// Category header images
// Category header images and overlay configuration
const categoryHeaderImages: Record<string, string> = {
  'ai-tools': '/images/ai-tools-header.webp',
  'trading': '/images/Forex_Trading_header.webp',
  'cybersecurity': '/images/Cybersecurity_Tools_header.webp',
  'personal-finance': '/images/Personal_Loans_header.webp',
};

const categoryImagePosition: Record<string, string> = {
  'trading': 'calc(50% + 300px) calc(50% - 200px)',
  'cybersecurity': 'calc(50% + 350px) center',
  'ai-tools': 'calc(50% + 200px) center',
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

  // Graceful degradation: any single failure won't crash the entire page
  const [pillarResult, allContentResult, expertResult, topPartnersResult] = await Promise.allSettled([
    getPillarContent(market as Market, category as Category),
    getContentByMarketAndCategory(market as Market, category as Category),
    getMarketExpert(market, category),
    getTopPartnersForHub(market as Market, category, 5, 'cpa'),
  ]);

  const pillarContent = pillarResult.status === 'fulfilled' ? pillarResult.value : null;
  const allContent = allContentResult.status === 'fulfilled' ? (allContentResult.value || []) : [];
  const expert = expertResult.status === 'fulfilled' && expertResult.value
    ? expertResult.value
    : { name: 'SmartFinPro Team', role: 'Editorial Team', bio: null, image_url: null, linkedin_url: null, credentials: ['Expert Reviewer'] as string[], market_slug: market as Market, category: (category as Category) || null, id: '', verified: true, created_at: '', updated_at: '' };
  const topPartners = topPartnersResult.status === 'fulfilled' ? (topPartnersResult.value || []) : [];

  const categoryInfo = categoryConfig[category as Category];
  // For US market, use clean URLs without /us prefix
  const marketPrefix = market === 'us' ? '' : `/${market}`;

  const imgPosition = categoryImagePosition[category] || 'center center';

  // If we have a pillar page (index.mdx), render it with MDX
  if (pillarContent) {
    const canonicalUrl = getCanonicalUrl(market as Market, `/${category}`);
    const mdxSource = await serialize(pillarContent.content, {
      mdxOptions: { remarkPlugins: [remarkGfm] },
    });

    return (
      <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
        {/* Article Schema for pillar page */}
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

        {/* Hero Header */}
        <section className="relative overflow-hidden" style={{ background: 'var(--sfp-sky)' }}>
          {/* Header Background Image (if available for category) */}
          {categoryHeaderImages[category] && (
            <div className="absolute inset-0 z-0" aria-hidden="true">
              <Image
                src={categoryHeaderImages[category]}
                alt={`${categoryInfo.name} category header`}
                fill
                priority
                className="object-cover"
                style={{ objectPosition: imgPosition }}
                sizes="100vw"
              />
              {/* Light overlay for readability */}
              <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(232, 240, 251, 0.9), rgba(242, 244, 248, 0.95))' }} />
            </div>
          )}

          <div className="container relative z-10 mx-auto px-4 py-16 lg:py-24">
            {/* Breadcrumb */}
            <Breadcrumb
              items={buildBreadcrumbs(market as Market, category as Category)}
            />

            <div className="max-w-3xl">
              {/* Kicker Badge with Scarcity */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
                  <Sparkles className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--sfp-navy)' }}>Expert Guide 2026</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--sfp-green)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--sfp-green)' }}>2026 Edition - Updated February</span>
                </div>
              </div>

              {/* Page Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: 'var(--sfp-ink)' }}>
                {pillarContent.meta.title?.split(':')[0] || `Best ${categoryInfo.name}`}
                {pillarContent.meta.title?.includes(':') && (
                  <>
                    <br className="hidden sm:inline" />
                    <span style={{ color: 'var(--sfp-navy)' }}>{pillarContent.meta.title.split(':').slice(1).join(':').trim()}</span>
                  </>
                )}
              </h1>

              {pillarContent.meta.description && (
                <p className="text-xl mb-8 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                  {pillarContent.meta.description}
                </p>
              )}

              {/* Meta Info & Expert Badge */}
              <div className="flex flex-wrap items-center gap-4 text-sm mb-8" style={{ color: 'var(--sfp-slate)' }}>
                <time dateTime={pillarContent.meta.modifiedDate || new Date().toISOString()} className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                  Updated {new Date(pillarContent.meta.modifiedDate || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </time>
                {pillarContent.readingTime && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                    {pillarContent.readingTime.text}
                  </span>
                )}
                {/* CFO-Approved Badge */}
                <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 bg-white text-xs font-medium shadow-sm" style={{ color: 'var(--sfp-navy)' }}>
                  <Shield className="h-3.5 w-3.5" />
                  CFO-Approved
                </span>
              </div>

              {/* Quick Jump CTA */}
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="border-0 shadow-md gap-2 text-white"
                  style={{ background: 'var(--sfp-gold)' }}
                >
                  <a href="#top-picks">
                    See Top 5 Tools
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-gray-300 bg-white hover:bg-gray-50"
                  style={{ color: 'var(--sfp-navy)' }}
                >
                  <a href="#comparison">
                    Compare All
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to top, var(--sfp-gray), transparent)' }} />
        </section>

        {/* Market Overview CTA Banner */}
        <div className="relative pb-10 overflow-hidden z-20">
          <div className="container relative z-10 mx-auto px-4 flex justify-center">
            <Link
              href={`${marketPrefix}/${category}/overview`}
              className="group relative inline-flex items-center gap-4 rounded-2xl px-10 py-5 text-lg font-bold overflow-hidden transition-all duration-500 hover:scale-105 border border-gray-200 bg-white shadow-md hover:shadow-lg"
              style={{ color: 'var(--sfp-navy)' }}
            >
              {/* Animated shimmer */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" style={{ background: 'linear-gradient(to right, transparent, rgba(27, 79, 140, 0.05), transparent)' }} />
              <TrendingUp className="h-6 w-6 relative z-10" style={{ color: 'var(--sfp-navy)' }} />
              <span className="relative z-10">
                <span className="block text-lg">{categoryInfo.name} Market Overview 2026</span>
                <span className="block text-xs font-normal transition-colors" style={{ color: 'var(--sfp-slate)' }}>Comprehensive market analysis, trends &amp; insights</span>
              </span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-all duration-300 relative z-10" style={{ color: 'var(--sfp-gold)' }} />
            </Link>
          </div>
        </div>

        {/* ── Conversion Pyramide: Winner-at-a-Glance ── */}
        {allContent.filter(i => i.slug !== 'index' && i.meta.rating).length >= 3 && (() => {
          const rated = allContent
            .filter(i => i.slug !== 'index' && i.meta.rating)
            .sort((a, b) => (b.meta.rating || 0) - (a.meta.rating || 0));
          const funnel = buildHubFunnel(market as Market, category as Category, rated, pillarContent.meta);
          const heroComps = getComponentsForZone(funnel, 'hero-above');
          return heroComps.length > 0 ? (
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <WinnerAtGlance {...(heroComps[0].props as any)} />
              </div>
            </div>
          ) : null;
        })()}

        {/* ── Conversion Pyramide: Featured Partner Offer (SSR) ── */}
        {topPartners[0]?.isFeatured && (
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <FeaturedPartnerOffer partner={topPartners[0]} />
            </div>
          </div>
        )}

        {/* ── Conversion Pyramide: Sticky TOC ── */}
        <StickyTableOfContents
          items={[
            { id: 'top-picks', label: 'Top Picks' },
            { id: 'comparison', label: 'Comparison' },
            { id: 'guide', label: 'Guide' },
            { id: 'faq', label: 'FAQ' },
          ]}
        />

        {/* MDX Content */}
        <div className="container mx-auto px-4 pb-20">
          <article className="max-w-4xl mx-auto">
            <SafeMDX source={mdxSource} />

            {/* ── Conversion Pyramide: ExpertVerifier (Supabase-backed) ── */}
            <ExpertVerifier
              name={expert.name}
              title={expert.role}
              credentials={expert.credentials.length > 0 ? expert.credentials : ['Expert Reviewer']}
              lastFactChecked={getFirstMondayOfMonth()}
              bio={expert.bio || undefined}
              image={expert.image_url || undefined}
              linkedInUrl={expert.linkedin_url || undefined}
            />
          </article>
        </div>

        {/* ── Conversion Pyramide: Sticky Footer CTA ── */}
        {(() => {
          const topReview = allContent.find(i => i.slug !== 'index' && i.meta.affiliateUrl && i.meta.rating);
          if (!topReview) return null;
          const name = topReview.meta.title.replace(/\s*Review\s*\d{4}.*$/i, '').replace(/\s*:\s*.+$/, '');
          return (
            <StickyFooterCTA
              productName={name}
              affiliateUrl={topReview.meta.affiliateUrl!}
              ctaText="Get Started Free"
              secondaryText={topReview.meta.rating ? `${topReview.meta.rating}/5 Rating` : undefined}
              market={market}
            />
          );
        })()}
      </div>
    );
  }

  // Fallback: Generate a premium category listing page
  const reviews = allContent.filter((item) => item.slug !== 'index');

  return (
    <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Hero Header */}
      <section className="relative overflow-hidden" style={{ background: 'var(--sfp-sky)' }}>
        {/* Header Background Image (if available for category) */}
        {categoryHeaderImages[category] && (
          <div className="absolute inset-0" aria-hidden="true">
            <Image
              src={categoryHeaderImages[category]}
              alt={`${categoryInfo.name} category header`}
              fill
              priority
              className="object-cover"
              style={{ objectPosition: imgPosition }}
              sizes="100vw"
            />
            {/* Light overlay for readability */}
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(232, 240, 251, 0.9), rgba(242, 244, 248, 0.95))' }} />
          </div>
        )}

        <div className="container relative z-10 mx-auto px-4 py-16 lg:py-24">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Home', href: marketPrefix || '/' },
              { label: categoryInfo.name },
            ]}
          />

          {/* Header */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 mb-6 shadow-sm">
              <Sparkles className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--sfp-navy)' }}>Updated {new Date().getFullYear()}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Best <span style={{ color: 'var(--sfp-navy)' }}>{categoryInfo.name}</span> 2026
            </h1>

            <p className="text-xl mb-8 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
              {categoryInfo.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm" style={{ color: 'var(--sfp-slate)' }}>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                {reviews.length} expert reviews
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Conversion Pyramide: Winner-at-a-Glance (Fallback) ── */}
      {reviews.filter(r => r.meta.rating).length >= 3 && (() => {
        const rated = reviews
          .filter(r => r.meta.rating)
          .sort((a, b) => (b.meta.rating || 0) - (a.meta.rating || 0));
        const taglines = ['Best Overall', 'Runner Up', 'Best Value'];
        return (
          <div className="container mx-auto px-4 -mt-4 mb-8">
            <div className="max-w-4xl mx-auto">
              <WinnerAtGlance
                picks={rated.slice(0, 3).map((r, i) => ({
                  rank: (i + 1) as 1 | 2 | 3,
                  name: (r.meta.title || 'Unknown').replace(/\s*Review\s*\d{4}.*$/i, '').replace(/\s*:\s*.+$/, ''),
                  tagline: taglines[i],
                  rating: r.meta.rating || 4.5,
                  highlight: r.meta.bestFor || (r.meta.description ? r.meta.description.slice(0, 80) : 'Expert-reviewed platform'),
                  affiliateUrl: r.meta.affiliateUrl || `${marketPrefix}/${category}/${r.slug}`,
                  badge: i === 0 ? "Editor's Choice" : undefined,
                })) as [any, any, any]}
                title={`Top 3 ${categoryInfo.name} Picks`}
                subtitle={`Based on ${reviews.length} expert reviews`}
              />
            </div>
          </div>
        );
      })()}

      {/* ── Conversion Pyramide: Sticky TOC (Fallback) ── */}
      <StickyTableOfContents
        items={[
          { id: 'top-picks', label: 'Top Picks' },
          { id: 'all-reviews', label: 'All Reviews' },
          { id: 'tools', label: 'Tools' },
        ]}
      />

      {/* Reviews List */}
      <section id="all-reviews" className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {reviews.map((review, index) => (
            <div
              key={review.slug}
              className={`rounded-2xl border bg-white p-6 md:p-8 transition-all duration-300 shadow-sm hover:shadow-md ${
                index === 0 ? 'border-2 shadow-md' : 'border-gray-200'
              }`}
              style={index === 0 ? { borderColor: 'var(--sfp-gold)' } : undefined}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex-1">
                  {/* Badges */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold text-white" style={{ background: 'var(--sfp-navy)' }}>
                      #{index + 1}
                    </span>
                    {index === 0 && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium" style={{ background: 'rgba(245, 166, 35, 0.1)', borderColor: 'var(--sfp-gold)', color: 'var(--sfp-gold-dark)' }}>
                        <Trophy className="h-3 w-3" />
                        Top Pick
                      </span>
                    )}
                    {index === 1 && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 text-xs font-medium" style={{ color: 'var(--sfp-slate)' }}>
                        Runner Up
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: 'var(--sfp-ink)' }}>
                    {review.meta.title}
                  </h2>
                  <p className="mb-4 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                    {review.meta.description}
                  </p>

                  {/* Rating */}
                  {review.meta.rating && (
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(review.meta.rating || 0)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                        {review.meta.rating}/5 ({review.meta.reviewCount || 0} reviews)
                      </span>
                    </div>
                  )}

                  {/* Pros */}
                  {review.meta.pros && (
                    <div className="flex flex-wrap gap-2">
                      {review.meta.pros.slice(0, 3).map((pro) => (
                        <span
                          key={pro}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                          style={{ color: 'var(--sfp-slate)', background: 'var(--sfp-sky)' }}
                        >
                          <CheckCircle className="h-3 w-3" style={{ color: 'var(--sfp-green)' }} />
                          {pro.length > 35 ? pro.substring(0, 35) + '...' : pro}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA Column */}
                <div className="flex flex-col items-start lg:items-end gap-4 lg:min-w-[180px]">
                  {review.meta.pricing && (
                    <div className="text-right">
                      <div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--sfp-navy)' }}>
                        {review.meta.pricing}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>per month</div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto">
                    <Button
                      asChild
                      variant="outline"
                      className="border-gray-300 bg-white hover:bg-gray-50"
                      style={{ color: 'var(--sfp-navy)' }}
                    >
                      <Link href={`${marketPrefix}/${category}/${review.slug}`}>
                        Read Review
                      </Link>
                    </Button>
                    {review.meta.affiliateUrl && (
                      <Button
                        asChild
                        className="border-0 shadow-md text-white"
                        style={{ background: 'var(--sfp-gold)' }}
                      >
                        <Link
                          href={review.meta.affiliateUrl}
                          target="_blank"
                          rel="noopener sponsored"
                        >
                          Try Free
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Conversion Pyramide: ComparisonHub ── */}
        <div id="comparison" className="max-w-4xl mx-auto mt-12">
          <ComparisonHub category={category} market={market} initialPartners={topPartners} />
        </div>

        {/* ── Conversion Pyramide: FrictionlessCTA for #1 ── */}
        {reviews[0]?.meta.affiliateUrl && (
          <div className="max-w-4xl mx-auto mt-8">
            <FrictionlessCTA
              productName={(reviews[0]?.meta?.title || 'Top Pick').replace(/\s*Review\s*\d{4}.*$/i, '').replace(/\s*:\s*.+$/, '')}
              affiliateUrl={reviews[0]?.meta?.affiliateUrl}
              headline="Ready to Get Started?"
              socialProof="Join 500K+ professionals"
              market={market}
            />
          </div>
        )}

        {/* Regional Hero Image — visual break before tools */}
        <div className="max-w-4xl mx-auto mt-12">
          <RegionalHeroImage market={market} category={category} className="my-8" />
        </div>

        {/* Useful Tools */}
        {categoryTools[category] && categoryTools[category].length > 0 && (
          <div className="max-w-4xl mx-auto mt-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
                <Wrench className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--sfp-ink)' }}>Useful Tools</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {categoryTools[category].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:shadow-md hover:border-gray-300 group flex items-center gap-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium transition-colors" style={{ color: 'var(--sfp-ink)' }}>{tool.name}</p>
                    <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{tool.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto shrink-0 group-hover:translate-x-1 transition-all" style={{ color: 'var(--sfp-gold)' }} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <aside className="max-w-4xl mx-auto mt-12 rounded-xl border border-gray-200 bg-white p-5 text-sm shadow-sm" style={{ color: 'var(--sfp-slate)' }}>
          <p>
            <strong style={{ color: 'var(--sfp-ink)' }}>Affiliate Disclosure:</strong> SmartFinPro may earn a commission
            when you click links and make a purchase. This does not affect our
            editorial independence.{' '}
            <Link href="/affiliate-disclosure" className="hover:underline" style={{ color: 'var(--sfp-navy)' }}>
              Learn more
            </Link>
          </p>
        </aside>
      </section>

      {/* ── Conversion Pyramide: Sticky Footer CTA (Fallback) ── */}
      {reviews[0]?.meta.affiliateUrl && (
        <StickyFooterCTA
          productName={(reviews[0]?.meta?.title || 'Top Pick').replace(/\s*Review\s*\d{4}.*$/i, '').replace(/\s*:\s*.+$/, '')}
          affiliateUrl={reviews[0]?.meta?.affiliateUrl}
          ctaText="Get Started Free"
          secondaryText={reviews[0]?.meta?.rating ? `${reviews[0].meta.rating}/5 Rating` : undefined}
          market={market}
        />
      )}
    </div>
  );
}

export async function generateStaticParams() {
  // Generate params for all valid market/category combinations
  // Uses marketCategories from config to ensure only valid combos are pre-rendered
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
