import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getPillarContent, getContentByMarketAndCategory } from '@/lib/mdx';
import { mdxComponents } from '@/lib/mdx/components';
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
import { NetworkAnimation } from '@/components/marketing/network-animation';
import { Breadcrumb } from '@/components/marketing/breadcrumb';


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
};

// Category header images
// Category header images and overlay configuration
const categoryHeaderImages: Record<string, string> = {
  'ai-tools': '/images/ai-tools-header.jpg',
  'trading': '/images/Forex_Trading_header.jpg',
  'cybersecurity': '/images/Cybersecurity_Tools_header.jpg',
  'personal-finance': '/images/Personal_Loans_header.jpg',
};

const categoryOverlays: Record<string, { base: number; brandFrom: number; brandVia: number; brandTo: number; bottomFrom: number; bottomVia: number; topFrom: number }> = {
  'ai-tools':         { base: 0.56, brandFrom: 0.66, brandVia: 0.36, brandTo: 0.46, bottomFrom: 0.83, bottomVia: 0.16, topFrom: 0.46 },
  'trading':          { base: 0.56, brandFrom: 0.66, brandVia: 0.36, brandTo: 0.46, bottomFrom: 0.83, bottomVia: 0.16, topFrom: 0.46 },
  'cybersecurity':    { base: 0.56, brandFrom: 0.66, brandVia: 0.36, brandTo: 0.46, bottomFrom: 0.83, bottomVia: 0.16, topFrom: 0.46 },
  'personal-finance': { base: 0.56, brandFrom: 0.66, brandVia: 0.36, brandTo: 0.46, bottomFrom: 0.83, bottomVia: 0.16, topFrom: 0.46 },
};

const defaultOverlay = { base: 0.60, brandFrom: 0.70, brandVia: 0.40, brandTo: 0.50, bottomFrom: 0.87, bottomVia: 0.20, topFrom: 0.50 };

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

  const [pillarContent, allContent] = await Promise.all([
    getPillarContent(market as Market, category as Category),
    getContentByMarketAndCategory(market as Market, category as Category),
  ]);

  const categoryInfo = categoryConfig[category as Category];
  // For US market, use clean URLs without /us prefix
  const marketPrefix = market === 'us' ? '' : `/${market}`;

  const overlay = categoryOverlays[category] || defaultOverlay;
  const imgPosition = categoryImagePosition[category] || 'center center';

  // If we have a pillar page (index.mdx), render it with MDX
  if (pillarContent) {
    const canonicalUrl = getCanonicalUrl(market as Market, `/${category}`);

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
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

        {/* Hero Header with Network Animation */}
        <section className="relative overflow-hidden bg-[#0f0a1a]">
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
              {/* Multi-layer gradient overlay */}
              <div className="absolute inset-0" style={{ backgroundColor: `rgba(15, 10, 26, ${overlay.base})` }} />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom right, rgba(26, 15, 46, ${overlay.brandFrom}), rgba(15, 10, 26, ${overlay.brandVia}), rgba(26, 15, 46, ${overlay.brandTo}))` }} />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(15, 10, 26, ${overlay.bottomFrom}), rgba(15, 10, 26, ${overlay.bottomVia}), transparent)` }} />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(15, 10, 26, ${overlay.topFrom}), transparent, transparent)` }} />
            </div>
          )}

          {/* Network Animation Background */}
          <NetworkAnimation className={categoryHeaderImages[category] ? 'opacity-20' : 'opacity-40'} />

          {/* Aurora Background Glows */}
          <div className="aurora-bg" aria-hidden="true">
            <div className={`absolute top-1/4 left-1/3 w-[600px] h-[600px] glow-emerald ${categoryHeaderImages[category] ? 'opacity-30' : ''}`} />
            <div className={`absolute top-1/3 right-1/4 w-[500px] h-[500px] glow-blue ${categoryHeaderImages[category] ? 'opacity-25' : ''}`} />
            <div className={`absolute bottom-0 left-1/2 w-[400px] h-[400px] glow-purple ${categoryHeaderImages[category] ? 'opacity-20' : ''}`} />
          </div>

          <div className="container relative z-10 mx-auto px-4 py-16 lg:py-24">
            {/* Breadcrumb */}
            <Breadcrumb
              items={[
                { label: 'Home', href: marketPrefix || '/' },
                { label: categoryInfo.name },
              ]}
            />

            <div className="max-w-3xl">
              {/* Kicker Badge with Scarcity */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span className="kicker text-slate-300">Expert Guide 2026</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-amber-400 font-medium">2026 Edition - Updated February</span>
                </div>
              </div>

              {/* Page Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
                {pillarContent.meta.title?.split(':')[0] || `Best ${categoryInfo.name}`}
                {pillarContent.meta.title?.includes(':') && (
                  <>
                    <br className="hidden sm:inline" />
                    <span className="gradient-text">{pillarContent.meta.title.split(':').slice(1).join(':').trim()}</span>
                  </>
                )}
              </h1>

              {pillarContent.meta.description && (
                <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                  {pillarContent.meta.description}
                </p>
              )}

              {/* Meta Info & Expert Badge */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-8">
                <time dateTime={pillarContent.meta.modifiedDate || new Date().toISOString()} className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  Updated {new Date(pillarContent.meta.modifiedDate || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </time>
                {pillarContent.readingTime && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    {pillarContent.readingTime.text}
                  </span>
                )}
                {/* CFO-Approved Badge */}
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                  <Shield className="h-3.5 w-3.5" />
                  CFO-Approved
                </span>
              </div>

              {/* Quick Jump CTA */}
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25 gap-2"
                >
                  <a href="#top-picks">
                    See Top 5 Tools
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600"
                >
                  <a href="#comparison">
                    Compare All
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent" />
        </section>

        {/* Market Overview CTA Banner */}
        <div className="relative -mt-[110px] pt-0 pb-10 bg-transparent overflow-hidden z-20">
          {/* Background glow effects */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(6, 182, 212, 0.15), transparent 70%)' }} />
            <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[400px] h-[200px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.1), transparent 70%)' }} />
          </div>

          <div className="container relative z-10 mx-auto px-4 flex justify-center">
            <Link
              href={`${marketPrefix}/${category}/overview`}
              className="group relative inline-flex items-center gap-4 rounded-2xl px-10 py-5 text-lg font-bold text-white overflow-hidden transition-all duration-500 hover:scale-105 border border-violet-500/30 hover:border-violet-400/60"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.25), rgba(59, 130, 246, 0.15))',
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.15), 0 0 60px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              {/* Animated shimmer */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {/* Outer glow on hover - purple/blue */}
              <span
                className="absolute -inset-[3px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #3b82f6)', filter: 'blur(18px)' }}
              />
              {/* Inner intensified glow on hover */}
              <span
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.35), rgba(59, 130, 246, 0.25))' }}
              />
              <TrendingUp className="h-6 w-6 text-violet-400 group-hover:text-violet-300 transition-colors relative z-10" />
              <span className="relative z-10">
                <span className="block text-lg">{categoryInfo.name} Market Overview 2026</span>
                <span className="block text-xs font-normal text-slate-400 group-hover:text-slate-300 transition-colors">Comprehensive market analysis, trends &amp; insights</span>
              </span>
              <ArrowRight className="h-5 w-5 text-violet-400 group-hover:text-blue-300 group-hover:translate-x-2 transition-all duration-300 relative z-10" />
            </Link>
          </div>
        </div>

        {/* MDX Content with dark prose styling */}
        <div className="container mx-auto px-4 pb-20">
          <article className="max-w-4xl mx-auto">
            <MDXRemote source={pillarContent.content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
          </article>
        </div>
      </div>
    );
  }

  // Fallback: Generate a premium category listing page
  const reviews = allContent.filter((item) => item.slug !== 'index');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Header */}
      <section className="relative overflow-hidden">
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
            {/* Multi-layer gradient overlay */}
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(15, 10, 26, ${overlay.base})` }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom right, rgba(26, 15, 46, ${overlay.brandFrom}), rgba(15, 10, 26, ${overlay.brandVia}), rgba(26, 15, 46, ${overlay.brandTo}))` }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(15, 10, 26, ${overlay.bottomFrom}), rgba(15, 10, 26, ${overlay.bottomVia}), transparent)` }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(15, 10, 26, ${overlay.topFrom}), transparent, transparent)` }} />
          </div>
        )}

        {/* Background glows */}
        <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] ${categoryHeaderImages[category] ? 'opacity-30' : ''}`} />
        <div className={`absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] ${categoryHeaderImages[category] ? 'opacity-25' : ''}`} />

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
            <div className="inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="kicker text-slate-300">Updated {new Date().getFullYear()}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Best <span className="gradient-text">{categoryInfo.name}</span> 2026
            </h1>

            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              {categoryInfo.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                {reviews.length} expert reviews
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews List */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {reviews.map((review, index) => (
            <div
              key={review.slug}
              className={`glass-card rounded-2xl p-6 md:p-8 transition-all duration-300 hover:border-emerald-500/30 ${
                index === 0 ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' : ''
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex-1">
                  {/* Badges */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 text-sm font-bold">
                      #{index + 1}
                    </span>
                    {index === 0 && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium">
                        <Trophy className="h-3 w-3" />
                        Top Pick
                      </span>
                    )}
                    {index === 1 && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 text-xs font-medium">
                        Runner Up
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                    {review.meta.title}
                  </h2>
                  <p className="text-slate-400 mb-4 leading-relaxed">
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
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-slate-500">
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
                          className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full"
                        >
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
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
                      <div className="text-2xl md:text-3xl font-bold gradient-text">
                        {review.meta.pricing}
                      </div>
                      <div className="text-xs text-slate-500">per month</div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto">
                    <Button
                      asChild
                      variant="outline"
                      className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600"
                    >
                      <Link href={`${marketPrefix}/${category}/${review.slug}`}>
                        Read Review
                      </Link>
                    </Button>
                    {review.meta.affiliateUrl && (
                      <Button
                        asChild
                        className="btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25"
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

        {/* Useful Tools */}
        {categoryTools[category] && categoryTools[category].length > 0 && (
          <div className="max-w-4xl mx-auto mt-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
                <Wrench className="h-4 w-4 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Useful Tools</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {categoryTools[category].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="glass-card rounded-xl p-4 transition-all duration-300 hover:border-violet-500/30 group flex items-center gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-violet-400 transition-colors">{tool.name}</p>
                    <p className="text-xs text-slate-500">{tool.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-violet-400 ml-auto shrink-0 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <aside className="max-w-4xl mx-auto mt-12 glass-card rounded-xl p-5 text-sm text-slate-500">
          <p>
            <strong className="text-slate-400">Affiliate Disclosure:</strong> SmartFinPro may earn a commission
            when you click links and make a purchase. This does not affect our
            editorial independence.{' '}
            <Link href="/affiliate-disclosure" className="text-emerald-400 hover:underline">
              Learn more
            </Link>
          </p>
        </aside>
      </section>
    </div>
  );
}

export async function generateStaticParams() {
  // Generate params for all market/category combinations
  const params: { market: string; category: string }[] = [];

  // All markets including US (US is accessed via middleware rewrite)
  const markets = ['us', 'uk', 'ca', 'au'];
  const categories = ['ai-tools', 'cybersecurity', 'trading', 'forex', 'personal-finance', 'business-banking'];

  for (const market of markets) {
    for (const category of categories) {
      params.push({ market, category });
    }
  }

  return params;
}
