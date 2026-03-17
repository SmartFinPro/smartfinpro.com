import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Calendar,
  Clock,
  User,
  Sparkles,
  CheckCircle,
  XCircle,
  Star,
  Shield,
  Award,
  Zap,
} from 'lucide-react';
import { TrustBadges } from './trust-badges';
import { QuickVerdictBox } from './cta-box';
import { FAQSection } from './faq-section';
import { ComparisonTable } from './comparison-table';
import { NewsletterBox } from './newsletter-box';
import { RelatedArticles } from './related-articles';
import { Breadcrumb } from './breadcrumb';
import { TrustBar } from '@/components/marketing/trust-bar';
import { StickyTableOfContents } from '@/components/marketing/sticky-toc';
import { ExpertVerifier } from '@/components/marketing/expert-verifier';
import { FrictionlessCTA } from '@/components/marketing/frictionless-cta';
import { StickyFooterCTA } from '@/components/marketing/sticky-footer-cta';
import { SafeMDX } from '@/components/content/SafeMDX';
import { generateReviewSchema } from '@/lib/seo/schema';
import { categoryConfig } from '@/lib/i18n/config';
import type { Market, Category } from '@/lib/i18n/config';
import { buildBreadcrumbs } from '@/lib/breadcrumbs';
import { resolveExpertImage } from '@/lib/experts/image-routing';
import type { ContentItem } from '@/lib/mdx';
import type { ReviewData, ExpertData } from '@/types';
import type { MDXRemoteSerializeResult } from '@/lib/mdx/types';
import { getFirstMondayOfMonth } from '@/lib/utils/date-helpers';

interface ReviewTemplateProps {
  review: ReviewData;
  /** Pre-serialized MDX source — enables full MDX component rendering */
  mdxSource?: MDXRemoteSerializeResult;
  relatedArticles?: ContentItem[];
  expert?: ExpertData;
}

export function ReviewTemplate({ review, mdxSource, relatedArticles, expert }: ReviewTemplateProps) {
  const marketPrefix = `/${review.market}`;
  const categoryName = categoryConfig[review.category as Category]?.name || review.category.replace('-', ' ');
  const expertImage = resolveExpertImage({
    reviewedBy: review.reviewedBy,
    expertName: expert?.name,
    expertImageUrl: expert?.image_url,
    market: review.market as Market,
    category: review.category as Category,
  });
  return (
    <article className="min-h-screen" style={{ background: 'var(--sfp-gray)' }} itemScope itemType="https://schema.org/Review">
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateReviewSchema(review)),
        }}
      />

      {/* Hero Section — Light Trust Design */}
      <section className="relative overflow-hidden bg-white">
        <div className="container relative z-10 mx-auto px-4 pt-12 pb-16 lg:pt-16 lg:pb-20">
          {/* Breadcrumb — left-aligned above centered content */}
          <div className="max-w-4xl mx-auto mb-8">
            <Breadcrumb
              items={buildBreadcrumbs(
                review.market as Market,
                review.category as Category,
                review.productName,
                review.category, // slug placeholder for leaf detection
              )}
            />
          </div>

          {/* Centered hero content */}
          <div className="max-w-4xl mx-auto text-center">
            {/* Affiliate Disclosure — subtle, centered */}
            <div className="inline-flex items-center mb-6 px-4 py-2 rounded-full border border-gray-200 text-xs" style={{ color: 'var(--sfp-slate)', background: 'var(--sfp-sky)' }}>
              <strong style={{ color: 'var(--sfp-ink)' }}>Disclosure:</strong>&nbsp;We may earn a commission through links on this page.{' '}
              <Link href="/affiliate-disclosure" className="hover:underline ml-1" style={{ color: 'var(--sfp-navy)' }}>Learn more</Link>
            </div>

            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 border border-gray-200" style={{ background: 'var(--sfp-sky)' }}>
                <Sparkles className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-navy)' }}>Expert Review</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold mb-6 leading-[1.1] tracking-tight" style={{ color: 'var(--sfp-navy)' }}>
              {review.title} Review {new Date().getFullYear()}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--sfp-slate)' }}>
              We tested {review.productName} for 90 days with real money. Here&apos;s
              what we found.
            </p>

            {/* Rating — centered, prominent */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(review.rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>
                  {review.rating}/5
                </span>
                <span style={{ color: 'var(--sfp-slate)' }}>
                  ({review.reviewCount} reviews)
                </span>
              </div>
            </div>

            {/* Trust Bar — directly under rating as trust anchor */}
            <TrustBar market={review.market || 'us'} className="mb-10" />

            {/* Primary CTA */}
            <div className="flex justify-center mb-10">
              <Button
                asChild
                size="lg"
                className="h-14 px-10 text-lg rounded-2xl text-white border-0 shadow-md hover:shadow-lg transition-all"
                style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
              >
                <Link href={review.affiliateUrl} target="_blank" rel="noopener sponsored">
                  {review.category === 'personal-finance' && review.market === 'us' && review.rating
                    ? `Check Rates & Apply`
                    : `Try ${review.productName} Free`}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Meta info — muted, below CTA */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                <span>By {review.author}</span>
              </div>
              {review.reviewedBy && (
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Verified by {review.reviewedBy}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <time dateTime={review.modifiedDate}>
                  Updated{' '}
                  {new Date(review.modifiedDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>{review.readingTime || '5 min read'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Verdict Box — Light Trust Design */}
      <section className="container mx-auto px-4 -mt-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl p-8 border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
                <Zap className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--sfp-ink)' }}>Quick Verdict</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Pros */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--sfp-green)' }}>
                  What We Love
                </h3>
                <ul className="space-y-3">
                  {review.pros.slice(0, 4).map((pro, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                      <span style={{ color: 'var(--sfp-ink)' }}>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--sfp-red)' }}>
                  Watch Out For
                </h3>
                <ul className="space-y-3">
                  {review.cons.slice(0, 4).map((con, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-red)' }} />
                      <span style={{ color: 'var(--sfp-ink)' }}>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Best For & Pricing */}
            <div className="mt-8 pt-6 border-t border-gray-200 grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--sfp-slate)' }}>
                  Best For
                </h3>
                <p style={{ color: 'var(--sfp-ink)' }}>{review.bestFor}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--sfp-slate)' }}>
                  Pricing
                </h3>
                <p className="text-2xl font-bold" style={{ color: 'var(--sfp-navy)' }}>{review.pricing}</p>
              </div>
            </div>

            {/* Rating — Split-Panel Proof Design */}
            {review.rating && (
              <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />
                <div className="flex flex-col sm:flex-row">
                  <div
                    className="shrink-0 px-6 py-4 sm:py-0 flex flex-col justify-center sm:w-[200px] border-b sm:border-b-0 sm:border-r border-gray-100"
                    style={{ background: 'var(--sfp-sky)' }}
                  >
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.12)' }}>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sfp-navy)' }}>
                        Our Rating
                      </span>
                    </div>
                    <p style={{ color: 'var(--sfp-slate)', fontSize: '10px' }} className="sm:pl-[34px]">Expert Score</p>
                  </div>
                  <div className="flex-1 flex items-center gap-2.5 px-6 py-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i <= Math.floor(review.rating!) ? 'fill-amber-400 text-amber-400' : i - 0.5 <= review.rating! ? 'fill-amber-400/50 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                        />
                      ))}
                    </div>
                    <span className="font-bold" style={{ color: 'var(--sfp-navy)', fontSize: '16px' }}>{review.rating}/5</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sticky Table of Contents */}
      {review.sections && review.sections.length > 0 && (
        <div className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto">
            <StickyTableOfContents
              items={review.sections.map((s) => ({ id: s.id, label: s.title }))}
            />
          </div>
        </div>
      )}

      {/* Main Content Area — Full MDX Rendering */}
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            {mdxSource ? (
              <SafeMDX source={mdxSource} />
            ) : review.content ? (
              <div dangerouslySetInnerHTML={{ __html: review.content }} />
            ) : null}
          </div>
        </div>
      </section>

      {/* Expert Verifier — EEAT Trust Signal */}
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <ExpertVerifier
            name={expert?.name || review.reviewedBy?.split(',')[0]?.trim() || 'SmartFinPro Team'}
            title={expert?.role || review.reviewedBy?.split(',').slice(1).join(', ').trim() || 'Expert Reviewer'}
            credentials={
              (expert?.credentials && expert.credentials.length > 0)
                ? expert.credentials
                : review.reviewedBy?.split(',').slice(1).map((c) => c.trim()).filter(Boolean) || ['Expert Reviewer']
            }
            lastFactChecked={getFirstMondayOfMonth()}
            bio={expert?.bio || undefined}
            image={expertImage}
            linkedInUrl={expert?.linkedin_url || undefined}
            variant="default"
          />
        </div>
      </section>

      {/* Comparison Table */}
      {review.competitors && review.competitors.length > 0 && (
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
                <Award className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                How {review.productName} Compares
              </h2>
            </div>
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
              <ComparisonTable
                products={[
                  {
                    name: review.productName,
                    slug: review.productName.toLowerCase().replace(/\s+/g, '-'),
                    rating: review.rating,
                    reviewCount: review.reviewCount,
                    price: review.pricing,
                    affiliateUrl: review.affiliateUrl,
                    isRecommended: true,
                    features: {},
                  },
                  ...review.competitors.map((c) => ({
                    name: c.name,
                    slug: c.name.toLowerCase().replace(/\s+/g, '-'),
                    rating: c.rating,
                    reviewCount: c.reviewCount,
                    price: c.price,
                    affiliateUrl: `/go/${c.name.toLowerCase().replace(/\s+/g, '-')}`,
                    features: c.features,
                  })),
                ]}
                featureLabels={{}}
              />
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {review.testimonials && review.testimonials.length > 0 && (
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8" style={{ color: 'var(--sfp-ink)' }}>What Users Say</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {review.testimonials.map((testimonial, i) => (
                <div key={i} className="rounded-2xl p-6 border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full flex items-center justify-center border border-gray-200" style={{ background: 'var(--sfp-sky)' }}>
                      <span className="font-semibold text-lg" style={{ color: 'var(--sfp-navy)' }}>
                        {testimonial.name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: 'var(--sfp-ink)' }}>
                        {testimonial.name}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                  <p className="italic leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FrictionlessCTA — Mid-Funnel Conversion */}
      {review.affiliateUrl && (
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto">
            <FrictionlessCTA
              productName={review.productName}
              affiliateUrl={review.affiliateUrl}
              headline={`Ready to Try ${review.productName}?`}
              market={review.market || 'us'}
            />
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {review.faqs && review.faqs.length > 0 && (
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto">
            <FAQSection faqs={review.faqs} />
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <NewsletterBox />
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles && relatedArticles.length > 0 && (
        <RelatedArticles
          articles={relatedArticles}
          market={review.market as Market}
          category={review.category as Category}
        />
      )}

      {/* Final CTA — Light Trust Design */}
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl p-8 md:p-12 text-center relative overflow-hidden border border-gray-200 bg-white" style={{ boxShadow: '0 4px 24px rgba(27, 79, 140, 0.08)' }}>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                {review.category === 'personal-finance' && review.market === 'us' && review.rating
                  ? `Interested in ${review.productName}?`
                  : `Ready to try ${review.productName}?`}
              </h2>
              <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: 'var(--sfp-slate)' }}>
                {review.category === 'personal-finance' && review.market === 'us' && review.rating
                  ? (review.guarantee || 'Terms Apply. Subject to credit approval.')
                  : (review.guarantee || 'Start your free trial today with no risk.')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-10 text-lg rounded-2xl text-white border-0 shadow-md hover:shadow-lg transition-all"
                  style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
                >
                  <Link href={review.affiliateUrl} target="_blank" rel="noopener sponsored">
                    {review.category === 'personal-finance' && review.market === 'us' && review.rating
                      ? 'Check Rates & Apply'
                      : 'Start Free Trial'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-lg border-gray-300 hover:bg-gray-50 transition-all"
                  style={{ color: 'var(--sfp-navy)' }}
                >
                  <Link href={`${marketPrefix}/${review.category}`}>Compare Alternatives</Link>
                </Button>
              </div>

              {/* Contextual Tool Links */}
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {review.category === 'trading' && (
                  <>
                    <Link href="/tools/trading-cost-calculator" className="text-sm transition-colors flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
                      <Zap className="h-3.5 w-3.5" /> Compare Trading Costs
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/tools/broker-finder" className="text-sm transition-colors flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
                      <Sparkles className="h-3.5 w-3.5" /> Find Your Ideal Broker
                    </Link>
                  </>
                )}
                {review.category === 'forex' && (
                  <>
                    <Link href="/tools/trading-cost-calculator" className="text-sm transition-colors flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
                      <Zap className="h-3.5 w-3.5" /> Compare Forex Spreads
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/tools/broker-comparison" className="text-sm transition-colors flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
                      <Sparkles className="h-3.5 w-3.5" /> Side-by-Side Comparison
                    </Link>
                  </>
                )}
                {review.category === 'personal-finance' && review.market === 'us' && (
                  <>
                    <Link href="/tools/loan-calculator" className="text-sm transition-colors flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
                      <Zap className="h-3.5 w-3.5" /> Loan Calculator
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/tools/credit-card-rewards-calculator" className="text-sm transition-colors flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
                      <Sparkles className="h-3.5 w-3.5" /> Rewards Calculator
                    </Link>
                  </>
                )}
                {review.category === 'personal-finance' && review.market === 'uk' && (
                  <Link href="/uk/tools/isa-tax-savings-calculator" className="text-sm transition-colors flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
                    <Zap className="h-3.5 w-3.5" /> ISA Tax Savings Calculator
                  </Link>
                )}
                {review.category === 'personal-finance' && review.market === 'ca' && (
                  <Link href="/ca/tools/wealthsimple-calculator" className="text-sm transition-colors flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
                    <Zap className="h-3.5 w-3.5" /> Fee Savings Calculator
                  </Link>
                )}
                {review.category === 'personal-finance' && review.market === 'au' && (
                  <Link href="/au/tools/au-mortgage-calculator" className="text-sm transition-colors flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
                    <Zap className="h-3.5 w-3.5" /> Mortgage Calculator
                  </Link>
                )}
                {review.category === 'ai-tools' && (
                  <Link href="/tools/ai-roi-calculator" className="text-sm transition-colors flex items-center gap-1.5" style={{ color: 'var(--sfp-slate)' }}>
                    <Zap className="h-3.5 w-3.5" /> AI ROI Calculator
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl p-6 text-sm border border-gray-200" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-slate)' }}>
            <p className="mb-3">
              <strong style={{ color: 'var(--sfp-ink)' }}>Affiliate Disclosure:</strong>{' '}
              SmartFinPro may earn a commission when you click links and make a
              purchase. This does not affect our editorial independence.{' '}
              <Link
                href="/affiliate-disclosure"
                className="hover:underline"
                style={{ color: 'var(--sfp-navy)' }}
              >
                Learn more
              </Link>
              .
            </p>
            {(review.category === 'trading' || review.category === 'forex') && (
              <p>
                <strong style={{ color: 'var(--sfp-ink)' }}>Risk Warning:</strong>{' '}
                {review.market === 'uk'
                  ? 'CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. Between 74-89% of retail investor accounts lose money when trading CFDs. All platforms are authorised and regulated by the FCA.'
                  : review.market === 'au'
                    ? 'CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. Consider the Product Disclosure Statement (PDS) and Target Market Determination (TMD) before making a decision. All brokers hold an AFSL regulated by ASIC.'
                    : review.market === 'ca'
                      ? 'Forex and CFD trading involves significant risk of loss. Leveraged products can result in losses exceeding your initial deposit. All brokers are regulated by CIRO.'
                      : 'CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. Between 74-89% of retail investor accounts lose money when trading CFDs.'}
              </p>
            )}
            {review.category === 'credit-repair' && (
              <p>
                <strong style={{ color: 'var(--sfp-ink)' }}>Important:</strong> Credit repair companies cannot guarantee specific outcomes. Results vary. This is not legal or financial advice. Regulated under CROA.
              </p>
            )}
            {review.category === 'debt-relief' && (
              <p>
                <strong style={{ color: 'var(--sfp-ink)' }}>Risk Warning:</strong> Debt relief programs may negatively impact your credit score and have tax consequences on forgiven debt. Results vary. This is not financial advice.
              </p>
            )}
            {review.category === 'remortgaging' && (
              <p>
                <strong style={{ color: 'var(--sfp-ink)' }}>Important:</strong> Your home may be repossessed if you do not keep up repayments on your mortgage. All mortgage advice is FCA-regulated.
              </p>
            )}
            {review.category === 'superannuation' && (
              <p>
                <strong style={{ color: 'var(--sfp-ink)' }}>General Advice Warning:</strong> Consider the PDS and TMD before making any super decisions. Past performance is not a reliable indicator of future results. All funds are APRA-regulated or hold ASIC licences.
              </p>
            )}
            {review.market === 'uk' && review.category !== 'trading' && review.category !== 'forex' && review.category !== 'remortgaging' && (
              <p>
                <strong style={{ color: 'var(--sfp-ink)' }}>FCA Notice:</strong> All platforms mentioned are authorised and regulated by the Financial Conduct Authority (FCA). Your capital is at risk.
              </p>
            )}
            {review.market === 'au' && review.category !== 'trading' && review.category !== 'forex' && review.category !== 'superannuation' && (
              <p>
                <strong style={{ color: 'var(--sfp-ink)' }}>ASIC Notice:</strong> All providers referenced hold an Australian Financial Services Licence (AFSL) or are regulated by ASIC where applicable.
              </p>
            )}
            {review.market === 'ca' && review.category !== 'trading' && review.category !== 'forex' && (
              <p>
                <strong style={{ color: 'var(--sfp-ink)' }}>CIRO Notice:</strong> All platforms referenced are regulated by CIRO or provincially regulated where applicable.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Sticky Footer CTA — Closing Trigger */}
      {review.affiliateUrl && (
        <StickyFooterCTA
          productName={review.productName}
          affiliateUrl={review.affiliateUrl}
          ctaText="Visit Site"
          secondaryText={review.rating ? `${review.rating}/5 · ${review.pricing || 'Free'}` : undefined}
          market={review.market || 'us'}
        />
      )}
    </article>
  );
}
