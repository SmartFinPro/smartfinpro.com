import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ExpertVerdictBox } from '@/components/marketing/expert-verdict-box';
import { ComparisonTable } from '@/components/marketing/comparison-table';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Globe,
  LineChart,
  Lock,
  Plane,
  Radio,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { Market, marketConfig, markets } from '@/lib/i18n/config';
import {
  getBrokerReview,
  getRegionalCompliance,
  brokerSlugs,
  brokerReviews,
  comparisonLabels,
  regionText,
  type BrokerSlug,
} from '@/lib/data/broker-reviews';

/* ────────────────────────────────────────────────────────────── */
/*  ICON MAP (for dynamic feature rendering)                     */
/* ────────────────────────────────────────────────────────────── */

const featureIcons: Record<BrokerSlug, React.ElementType[]> = {
  etoro: [Users, Sparkles, Wallet],
  'capital-com': [BrainCircuit, Zap, LineChart],
  ibkr: [BarChart3, Globe, TrendingUp],
  investing: [Star, Calendar, Radio],
  revolut: [Globe, Lock, CreditCard],
  ig: [LineChart, Globe, Shield],
  plus500: [Shield, Smartphone, BarChart3],
};

const featureColors: Record<BrokerSlug, { color: string; bg: string }[]> = {
  etoro: [
    { color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
    { color: 'text-violet-400', bg: 'bg-violet-500/15' },
  ],
  'capital-com': [
    { color: 'text-blue-400', bg: 'bg-blue-500/15' },
    { color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
    { color: 'text-amber-400', bg: 'bg-amber-500/15' },
  ],
  ibkr: [
    { color: 'text-violet-400', bg: 'bg-violet-500/15' },
    { color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  ],
  investing: [
    { color: 'text-amber-400', bg: 'bg-amber-500/15' },
    { color: 'text-blue-400', bg: 'bg-blue-500/15' },
    { color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  ],
  revolut: [
    { color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
    { color: 'text-violet-400', bg: 'bg-violet-500/15' },
    { color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  ],
  ig: [
    { color: 'text-rose-400', bg: 'bg-rose-500/15' },
    { color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
    { color: 'text-amber-400', bg: 'bg-amber-500/15' },
  ],
  plus500: [
    { color: 'text-blue-400', bg: 'bg-blue-500/15' },
    { color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { color: 'text-violet-400', bg: 'bg-violet-500/15' },
  ],
};

/* ────────────────────────────────────────────────────────────── */
/*  STATIC PARAMS & METADATA                                     */
/* ────────────────────────────────────────────────────────────── */

interface PageProps {
  params: Promise<{ market: string; broker: string }>;
}

export function generateStaticParams() {
  return markets.flatMap((market) =>
    brokerSlugs.map((broker) => ({ market, broker }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market, broker } = await params;
  const review = getBrokerReview(broker);
  if (!review) return {};

  const prefix = market === 'us' ? '' : `/${market}`;
  return {
    title: review.seo.title,
    description: review.seo.description,
    alternates: {
      canonical: `${prefix}/reviews/${broker}`,
      languages: Object.fromEntries(
        markets.map((m) => [
          marketConfig[m].hreflang,
          `${m === 'us' ? '' : `/${m}`}/reviews/${broker}`,
        ])
      ),
    },
    openGraph: {
      title: review.seo.title,
      description: review.seo.description,
      type: 'article',
    },
  };
}

/* ────────────────────────────────────────────────────────────── */
/*  PAGE                                                         */
/* ────────────────────────────────────────────────────────────── */

export default async function BrokerReviewPage({ params }: PageProps) {
  const { market: marketStr, broker: brokerStr } = await params;
  const review = getBrokerReview(brokerStr);
  if (!review) notFound();

  const mkt = marketStr as Market;
  const config = marketConfig[mkt];
  const compliance = getRegionalCompliance(mkt);
  const isUS = mkt === 'us';
  const prefix = isUS ? '' : `/${mkt}`;

  // Resolve regional content
  const story = regionText(mkt, review.story, review.storyUs);
  const pros = regionText(mkt, review.pros, review.prosUs);
  const con = regionText(mkt, review.con, review.conUs);
  const icons = featureIcons[review.slug];
  const colors = featureColors[review.slug];

  // Build comparison table products (current broker = recommended)
  const comparisonProducts = brokerSlugs.map((slug) => {
    const b = brokerReviews[slug];
    const features = regionText(mkt, b.comparisonFeatures, b.comparisonFeaturesUs);
    return {
      name: b.name,
      slug: b.slug,
      rating: b.rating,
      reviewCount: b.reviewCount,
      price: b.price,
      affiliateUrl: b.affiliateUrl,
      isRecommended: slug === review.slug,
      features,
    };
  });

  // Schema.org Review structured data
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': review.isDataPlatform ? 'SoftwareApplication' : 'FinancialProduct',
      name: review.name,
      ...(review.isDataPlatform && { applicationCategory: 'FinanceApplication' }),
    },
    author: {
      '@type': 'Organization',
      name: 'SmartFinPro',
      url: 'https://smartfinpro.com',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating.toString(),
      bestRating: '5',
      worstRating: '1',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SmartFinPro',
    },
  };

  return (
    <>
      {/* Schema.org Review Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      {/* ═══════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[70vh] flex items-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-[120px]" />

        <div className="container relative z-10 mx-auto px-4 py-20 md:py-28">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
              <Link href={prefix || '/'} className="hover:text-slate-300 transition-colors">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={`${prefix}/trading`} className="hover:text-slate-300 transition-colors">Trading</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-slate-300">{review.name}</span>
            </nav>

            {/* Broker Logo */}
            <div className="mb-8">
              <Image
                src={review.logo}
                alt={`${review.name} Logo`}
                width={200}
                height={48}
                className="h-12 w-auto"
                priority
              />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2 mb-6">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="kicker text-slate-300">SmartFinPro Expert Review</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white leading-tight">
              {review.name} Review 2026:{' '}
              <span className="gradient-text">{review.tagline}</span>
            </h1>

            <p className="text-xl text-slate-400 mb-8 max-w-2xl leading-relaxed">
              {review.seo.description}
            </p>

            {/* Rating & Region */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(review.rating)
                        ? 'text-amber-400 fill-amber-400'
                        : i < review.rating
                          ? 'text-amber-400 fill-amber-400/50'
                          : 'text-slate-700'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-slate-400 tabular-nums">
                  {review.rating}/5 ({review.reviewCount.toLocaleString('en-US')} reviews)
                </span>
              </div>
              <span className="text-slate-700">|</span>
              <span className="text-sm text-slate-400">
                {config.flag} {config.name} — Regulated by {compliance.regulator}
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="btn-shimmer h-14 px-10 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25"
              >
                <Link href={review.affiliateUrl} target="_blank" rel="noopener sponsored">
                  {review.ctaLabel}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-10 text-lg border-slate-700 text-slate-300 hover:bg-slate-800/50 hover:text-white"
              >
                <Link href="#comparison">
                  Compare Alternatives
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0,60 L0,20 Q360,0 720,20 Q1080,40 1440,20 L1440,60 Z" fill="rgb(2,6,23)" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          EXPERT VERDICT
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 bg-slate-950">
        <div className="container mx-auto px-4 max-w-4xl">
          <ExpertVerdictBox
            name={review.name}
            verdict={review.verdict}
            pros={pros}
            con={con}
            rating={review.rating}
            affiliateUrl={review.affiliateUrl}
            ctaLabel={review.ctaLabel}
            accentColor={review.accentColor}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          THE STORY — Narrative Introduction
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -translate-y-1/2" />

        <div className="container relative z-10 mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-5 mb-6">
            <Image
              src={review.logo}
              alt={`${review.name} Logo`}
              width={140}
              height={34}
              className="h-9 w-auto opacity-60"
            />
            <div className="h-8 w-px bg-slate-700/50" />
            <div className="inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="kicker text-slate-300">The Story</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">
            What Makes {review.name}{' '}
            <span className="gradient-text">Different</span>?
          </h2>

          <div className="space-y-6">
            {story.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-slate-400 text-lg leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          KEY FEATURES — 3 Deep-Dive Cards
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px]" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2 mb-6">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="kicker text-slate-300">Core Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Why Traders Choose{' '}
              <span className="gradient-text">{review.name}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {review.features.map((feature, i) => {
              const Icon = icons[i];
              const style = colors[i];
              const desc = regionText(mkt, feature.description, feature.descriptionUs);
              return (
                <div
                  key={feature.title}
                  className="glass-card rounded-2xl p-8 group hover:scale-[1.02] transition-all duration-500"
                >
                  <div className={`w-14 h-14 rounded-xl ${style.bg} flex items-center justify-center mb-6 icon-glow`}>
                    <Icon className={`h-7 w-7 ${style.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SPECS TABLE — Multi-Column Matrix
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="container relative z-10 mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-10">
            {review.specsTitle}
          </h2>

          {(() => {
            const table = review.specsTable;
            const rows = regionText(mkt, table.rows, table.rowsUs);
            return (
              <div className="rounded-2xl overflow-hidden border border-slate-700/40">
                {/* Gradient Header */}
                <div className="grid grid-cols-4 bg-gradient-to-r from-violet-600 to-violet-500">
                  {table.columns.map((col) => (
                    <div key={col} className="px-5 py-4 md:px-6 md:py-5">
                      <span className="text-sm md:text-base font-bold text-white">{col}</span>
                    </div>
                  ))}
                </div>

                {/* Body Rows */}
                {rows.map((row, ri) => (
                  <div
                    key={ri}
                    className={`grid grid-cols-4 border-t border-slate-700/30 transition-colors hover:bg-violet-500/[0.08] ${
                      ri % 2 === 0 ? '' : ''
                    }`}
                    style={ri % 2 === 0 ? { background: 'rgba(139,92,246,0.06)' } : undefined}
                  >
                    {row.map((cell, ci) => (
                      <div key={ci} className="px-5 py-4 md:px-6 md:py-5">
                        <span className={`text-sm ${
                          ci === 0 ? 'font-semibold text-white' : 'text-slate-300'
                        }`}>
                          {cell}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          COMPARISON TABLE
          ═══════════════════════════════════════════════════════ */}
      <section id="comparison" className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]" />

        <div className="container relative z-10 mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-4">
            <div className="inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2 mb-6">
              <BarChart3 className="h-4 w-4 text-violet-400" />
              <span className="kicker text-slate-300">Side-by-Side</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              How {review.name} <span className="gradient-text">Compares</span>
            </h2>
            <p className="text-slate-400 text-lg">
              Transparent feature comparison across the top trading platforms reviewed by SmartFinPro.
            </p>
          </div>

          <ComparisonTable
            products={comparisonProducts}
            featureLabels={comparisonLabels}
            title=""
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          REGIONAL COMPLIANCE / INFORMATION DISCLOSURE
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                {review.isDataPlatform ? (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Information Disclosure — {config.name} {config.flag}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {review.name} is a financial data and research platform, not a broker or investment advisor.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Regulatory Information — {config.name} {config.flag}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Regulated by the <strong className="text-slate-300">{compliance.regulatorFull}</strong> ({compliance.regulator})
                    </p>
                  </>
                )}
              </div>
            </div>

            {review.isDataPlatform ? (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-blue-400">Disclosure:</strong>{' '}
                  {review.name} provides financial data, news, and analysis for informational purposes only.
                  It does not provide investment advice, broker services, or execute trades. Any investment
                  decisions should be based on your own research and, where appropriate, professional financial
                  advice. Past performance of any security or financial instrument is not indicative of future
                  results. SmartFinPro may receive compensation through affiliate links.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-amber-400">Risk Warning:</strong>{' '}
                    {compliance.riskWarning}
                  </p>
                </div>

                {isUS && (
                  <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <strong className="text-blue-400">US Regulation Note:</strong>{' '}
                      CFD trading is not available to US residents. This review covers
                      stocks, ETFs, forex, and other instruments available in the United States.
                      Always verify product availability with your broker.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl mx-auto glass-card rounded-2xl p-10 md:p-14 text-center border-t-2 border-emerald-500/30">
            <div className="mx-auto mb-8">
              <Image
                src={review.logo}
                alt={`${review.name} Logo`}
                width={180}
                height={44}
                className="h-11 w-auto mx-auto"
              />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started with {review.name}?
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              Open your free account today and experience why{' '}
              {review.reviewCount.toLocaleString('en-US')}+ traders trust {review.name}.
              No commitment, cancel anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="btn-shimmer h-14 px-10 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25"
              >
                <Link href={review.affiliateUrl} target="_blank" rel="noopener sponsored">
                  {review.ctaLabel}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-10 text-lg border-slate-700 text-slate-300 hover:bg-slate-800/50 hover:text-white"
              >
                <Link href={`${prefix}/trading`}>
                  View All Trading Reviews
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="text-xs text-slate-600 mt-6">
              {config.currencySymbol} pricing. {compliance.regulator} regulated.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
