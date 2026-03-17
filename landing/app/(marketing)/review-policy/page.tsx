import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, Clock, Shield, Target, BookOpen, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Review Policy & Standards | SmartFinPro',
  description:
    'SmartFinPro review standards: how we select, test, score, and maintain financial product reviews. Independence, primary sources, and quarterly re-evaluation.',
  alternates: {
    canonical: '/review-policy',
  },
};

export default function ReviewPolicyPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative py-20 sm:py-24 lg:py-32 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--sfp-navy) 0%, var(--sfp-navy-dark) 100%)' }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 50%, var(--sfp-gold) 0%, transparent 50%), radial-gradient(circle at 80% 80%, var(--sfp-green) 0%, transparent 50%)',
            }}
          />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Review Policy & Standards
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl">
              How we select, test, and evaluate every financial product — and why our reviews stay accurate over time.
            </p>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-12" style={{ color: 'var(--sfp-navy)' }}>
              Core Review Principles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Scale,
                  title: 'Independence',
                  description: 'Editorial decisions are made independently from affiliate relationships. Commission amounts never influence product selection, ratings, or rankings.',
                },
                {
                  icon: Target,
                  title: 'Primary Sources Only',
                  description: 'Every factual claim is verified against primary sources: regulator databases, provider terms, official pricing pages, and direct product testing.',
                },
                {
                  icon: Clock,
                  title: 'Quarterly Re-Evaluation',
                  description: 'All reviews are re-evaluated at least every 90 days. Critical categories (trading, lending) are checked monthly for pricing and regulatory changes.',
                },
              ].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div key={idx} className="p-6 rounded-lg border-2 bg-white text-center" style={{ borderColor: 'var(--sfp-gold)' }}>
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: 'var(--sfp-sky)' }}>
                      <IconComponent className="h-7 w-7" style={{ color: 'var(--sfp-navy)' }} />
                    </div>
                    <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>{item.title}</h3>
                    <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Product Selection */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              How We Select Products to Review
            </h2>

            <p className="text-lg mb-8" style={{ color: 'var(--sfp-ink)' }}>
              Not every product qualifies for a SmartFinPro review. We apply strict eligibility criteria:
            </p>

            <div className="space-y-6">
              <div className="border-l-4 pl-6 py-4" style={{ borderLeftColor: 'var(--sfp-green)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                  Regulatory Status
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Financial products must be properly regulated in their target market. We verify FCA (UK), ASIC (AU), CIRO (CA), and SEC/FINRA (US) registrations before inclusion. Unregulated products are excluded.
                </p>
              </div>

              <div className="border-l-4 pl-6 py-4" style={{ borderLeftColor: 'var(--sfp-green)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                  Market Viability
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Products must have a minimum 12-month operating history, verifiable user base, and active development. We do not review pre-launch products, beta services, or platforms with no track record.
                </p>
              </div>

              <div className="border-l-4 pl-6 py-4" style={{ borderLeftColor: 'var(--sfp-green)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                  Reader Relevance
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  We prioritize products our readers search for and ask about. Category demand is assessed through search volume analysis, reader requests, and market coverage gaps.
                </p>
              </div>

              <div className="border-l-4 pl-6 py-4" style={{ borderLeftColor: 'var(--sfp-green)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                  What We Exclude
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Products with unresolved regulatory actions, documented fraud, or persistent consumer complaints (CFPB, FCA warnings) are excluded regardless of affiliate availability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testing Process */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Testing & Evaluation Period
            </h2>

            <div className="space-y-8">
              <div className="p-6 rounded-lg" style={{ background: 'var(--sfp-gray)', border: '1px solid #e5e5e5' }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  30–90 Day Hands-On Testing
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Our reviewers create real accounts and use products during normal conditions. Testing duration depends on product complexity — a trading platform requires longer evaluation (60-90 days) than a budgeting app (30 days).
                </p>
              </div>

              <div className="p-6 rounded-lg" style={{ background: 'var(--sfp-gray)', border: '1px solid #e5e5e5' }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Multi-Source Data Collection
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  We combine direct testing with data from official documentation, regulatory filings, and independent review platforms (Trustpilot, G2, BBB). No single source determines our rating.
                </p>
              </div>

              <div className="p-6 rounded-lg" style={{ background: 'var(--sfp-gray)', border: '1px solid #e5e5e5' }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Peer Review Before Publication
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Every review is checked by a second qualified analyst before publication. The peer reviewer verifies methodology, checks calculations, and confirms that conclusions follow from the evidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rating Scale */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              What Our Ratings Mean
            </h2>

            <p className="text-lg mb-8" style={{ color: 'var(--sfp-ink)' }}>
              Our 5-star scale reflects weighted scores across five criteria. Here is what each tier means:
            </p>

            <div className="space-y-4">
              {[
                { stars: '4.5–5.0', label: 'Outstanding', description: 'Best-in-class across most criteria. Minor drawbacks only. Strong recommendation for target audience.' },
                { stars: '4.0–4.4', label: 'Very Good', description: 'Excels in core areas with competitive pricing. Some room for improvement in secondary features.' },
                { stars: '3.5–3.9', label: 'Good', description: 'Solid choice for specific use cases. Meaningful trade-offs compared to top-rated alternatives.' },
                { stars: '3.0–3.4', label: 'Adequate', description: 'Meets basic needs but falls short in important areas. Better options typically exist.' },
                { stars: 'Below 3.0', label: 'Not Recommended', description: 'Significant concerns about value, security, or reliability. We advise exploring alternatives.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-white border" style={{ borderColor: '#e5e5e5' }}>
                  <div className="flex-shrink-0 w-20 text-center">
                    <span className="text-lg font-bold" style={{ color: 'var(--sfp-gold)' }}>{item.stars}</span>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1" style={{ color: 'var(--sfp-navy)' }}>{item.label}</h3>
                    <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/methodology"
                className="inline-flex items-center gap-2 text-sm font-semibold underline"
                style={{ color: 'var(--sfp-navy)' }}
              >
                <BookOpen className="h-4 w-4" />
                See full rating criteria and weightings →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Source Standards */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Source Standards
            </h2>

            <p className="text-lg mb-8" style={{ color: 'var(--sfp-ink)' }}>
              We cite primary and authoritative sources. Our reviews reference:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                'Consumer Financial Protection Bureau (CFPB)',
                'Financial Conduct Authority (FCA)',
                'Australian Securities & Investments Commission (ASIC)',
                'Canadian Investment Regulatory Organization (CIRO)',
                'Securities and Exchange Commission (SEC)',
                'Federal Reserve Economic Data (FRED)',
                'Internal Revenue Service (IRS)',
                'National Foundation for Credit Counseling (NFCC)',
                'Official provider pricing pages & terms',
                'Regulatory complaint databases',
              ].map((source, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'var(--sfp-gray)' }}>
                  <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--sfp-green)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>{source}</span>
                </div>
              ))}
            </div>

            <div
              className="p-6 rounded-lg border-2"
              style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
            >
              <p style={{ color: 'var(--sfp-ink)' }}>
                <strong>What we do not cite:</strong> Other affiliate review sites, unverified social media claims, or marketing materials without independent verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Policies */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: 'var(--sfp-navy)' }}>
              Related Policies
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--sfp-slate)' }}>
              Our review standards are part of a broader editorial framework.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { label: 'Methodology', href: '/methodology', icon: Target },
                { label: 'Editorial Policy', href: '/editorial-policy', icon: BookOpen },
                { label: 'Corrections Policy', href: '/corrections-policy', icon: Users },
                { label: 'Affiliate Disclosure', href: '/affiliate-disclosure', icon: Scale },
              ].map((link) => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg border-2 transition-colors hover:bg-gray-50"
                    style={{ borderColor: 'var(--sfp-navy)', color: 'var(--sfp-navy)' }}
                  >
                    <IconComponent className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Review Policy & Standards',
            url: 'https://smartfinpro.com/review-policy',
            description:
              'SmartFinPro review standards: how we select, test, score, and maintain financial product reviews.',
            author: {
              '@type': 'Organization',
              name: 'SmartFinPro',
              url: 'https://smartfinpro.com',
            },
            datePublished: '2024-01-01',
            dateModified: new Date().toISOString().split('T')[0],
          }),
        }}
      />
    </main>
  );
}
