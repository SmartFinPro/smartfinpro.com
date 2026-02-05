import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Calendar,
  Clock,
  User,
  ChevronRight,
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
import { generateReviewSchema } from '@/lib/seo/schema';
import type { ReviewData } from '@/types';

interface ReviewTemplateProps {
  review: ReviewData;
}

export function ReviewTemplate({ review }: ReviewTemplateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateReviewSchema(review)),
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />

        <div className="container relative z-10 mx-auto px-4 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
              <Link href="/" className="hover:text-emerald-400 transition-colors">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link
                href={`/${review.category}`}
                className="hover:text-emerald-400 transition-colors capitalize"
              >
                {review.category.replace('-', ' ')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-slate-300">{review.productName}</span>
            </nav>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="kicker text-slate-300">Expert Review</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
              {review.title} Review{' '}
              <span className="gradient-text">{new Date().getFullYear()}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              We tested {review.productName} for 90 days with real money. Here&apos;s
              what we found.
            </p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 mb-8">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-400" />
                <span>By {review.author}</span>
              </div>
              {review.reviewedBy && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span>Verified by {review.reviewedBy}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-violet-400" />
                <span>
                  Updated{' '}
                  {new Date(review.modifiedDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>12 min read</span>
              </div>
            </div>

            {/* Rating & Trust */}
            <div className="flex flex-wrap items-center gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(review.rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-white">
                  {review.rating}/5
                </span>
                <span className="text-slate-500">
                  ({review.reviewCount} reviews)
                </span>
              </div>
              <TrustBadges rating={review.rating} reviewCount={review.reviewCount} />
            </div>

            {/* Primary CTA */}
            <Button
              asChild
              size="lg"
              className="btn-shimmer h-14 px-8 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25"
            >
              <Link href={review.affiliateUrl}>
                Try {review.productName} Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Verdict Box */}
      <section className="container mx-auto px-4 -mt-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Quick Verdict</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Pros */}
              <div>
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
                  What We Love
                </h3>
                <ul className="space-y-3">
                  {review.pros.slice(0, 4).map((pro, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div>
                <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4">
                  Watch Out For
                </h3>
                <ul className="space-y-3">
                  {review.cons.slice(0, 4).map((con, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Best For & Pricing */}
            <div className="mt-8 pt-6 border-t border-slate-800 grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Best For
                </h3>
                <p className="text-slate-300">{review.bestFor}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Pricing
                </h3>
                <p className="text-2xl font-bold gradient-text">{review.pricing}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      {review.sections && review.sections.length > 0 && (
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-4">Table of Contents</h2>
              <nav className="grid md:grid-cols-2 gap-2">
                {review.sections.map((section, i) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 transition-all"
                  >
                    <span className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-500">
                      {i + 1}
                    </span>
                    <span className="text-sm">{section.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          {/* Content will be rendered via MDX */}
          <div
            className="prose prose-lg prose-invert max-w-none prose-headings:text-white prose-p:text-slate-400 prose-a:text-emerald-400 prose-strong:text-white"
            dangerouslySetInnerHTML={{ __html: review.content }}
          />
        </div>
      </section>

      {/* Comparison Table */}
      {review.competitors && review.competitors.length > 0 && (
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Award className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                How {review.productName} Compares
              </h2>
            </div>
            <div className="glass-card rounded-2xl overflow-hidden">
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
            <h2 className="text-2xl font-bold text-white mb-8">What Users Say</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {review.testimonials.map((testimonial, i) => (
                <div key={i} className="glass-card rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-slate-700">
                      <span className="font-semibold text-emerald-400 text-lg">
                        {testimonial.name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-400 italic leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
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

      {/* Final CTA */}
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to try {review.productName}?
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                {review.guarantee || 'Start your free trial today with no risk.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="btn-shimmer h-14 px-8 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25"
                >
                  <Link href={review.affiliateUrl}>
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-lg border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <Link href={`/${review.category}`}>Compare Alternatives</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-xl p-6 text-sm text-slate-500">
            <p className="mb-3">
              <strong className="text-slate-400">Affiliate Disclosure:</strong>{' '}
              SmartFinPro may earn a commission when you click links and make a
              purchase. This does not affect our editorial independence.{' '}
              <Link
                href="/affiliate-disclosure"
                className="text-emerald-400 hover:underline"
              >
                Learn more
              </Link>
              .
            </p>
            {(review.category === 'trading' || review.category === 'forex') && (
              <p>
                <strong className="text-slate-400">Risk Warning:</strong> CFDs are
                complex instruments and come with a high risk of losing money
                rapidly due to leverage. Between 74-89% of retail investor accounts
                lose money when trading CFDs.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
