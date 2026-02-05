import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
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
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight, CheckCircle, Sparkles, ChevronRight, Star, Trophy } from 'lucide-react';
import Link from 'next/link';
import { StarRating } from '@/components/marketing/trust-badges';

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

  // If we have a pillar page (index.mdx), render it with MDX
  if (pillarContent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Hero Header */}
        <section className="relative overflow-hidden">
          {/* Aurora Background */}
          <div className="aurora-bg" aria-hidden="true">
            <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] glow-emerald" />
            <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] glow-blue" />
            <div className="absolute bottom-0 left-1/2 w-[400px] h-[400px] glow-purple" />
          </div>

          <div className="container relative z-10 mx-auto px-4 py-16 lg:py-24">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
              <Link href={marketPrefix || '/'} className="hover:text-emerald-400 transition-colors">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-slate-300">{categoryInfo.name}</span>
            </nav>

            <div className="max-w-3xl">
              {/* Kicker Badge */}
              <div className="inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2 mb-6">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="kicker text-slate-300">Expert Guide {new Date().getFullYear()}</span>
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

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  Updated {new Date(pillarContent.meta.modifiedDate || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                {pillarContent.readingTime && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    {pillarContent.readingTime.text}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent" />
        </section>

        {/* MDX Content with dark prose styling */}
        <div className="container mx-auto px-4 pb-20">
          <article className="prose prose-lg prose-invert max-w-4xl mx-auto prose-headings:text-white prose-headings:scroll-mt-20 prose-p:text-slate-300 prose-a:text-emerald-400 prose-strong:text-white prose-code:text-emerald-400 prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-slate-800 prose-li:text-slate-300 prose-blockquote:text-slate-400 prose-blockquote:border-emerald-500/50">
            <MDXRemote source={pillarContent.content} components={mdxComponents} />
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
        {/* Background glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />

        <div className="container relative z-10 mx-auto px-4 py-16 lg:py-24">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
            <Link href={marketPrefix || '/'} className="hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-300">{categoryInfo.name}</span>
          </nav>

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
