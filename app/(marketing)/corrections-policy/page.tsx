import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Clock, Mail, FileText, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Corrections Policy | SmartFinPro',
  description:
    'How SmartFinPro handles errors, corrections, and updates to financial product reviews. Our transparent process for maintaining accuracy.',
  alternates: {
    canonical: '/corrections-policy',
  },
};

export default function CorrectionsPolicyPage() {
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
              Corrections Policy
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl">
              Accuracy is the foundation of trust. When we get something wrong, we fix it transparently and promptly.
            </p>
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Our Commitment to Accuracy
            </h2>
            <p className="text-lg mb-6" style={{ color: 'var(--sfp-ink)' }}>
              SmartFinPro publishes financial product reviews that influence real decisions. We take this responsibility seriously. When errors occur — and they occasionally do — we believe transparency, not silence, builds trust.
            </p>
            <div
              className="p-6 rounded-lg border-2 mb-8"
              style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
            >
              <p className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                Every correction we publish strengthens our credibility. We never quietly edit away mistakes — we acknowledge them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Types of Corrections */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-12" style={{ color: 'var(--sfp-navy)' }}>
              Types of Corrections
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: FileText,
                  title: 'Minor Updates',
                  description: 'Typographical errors, outdated pricing, minor feature changes, or formatting issues.',
                  action: 'Corrected in-place with a "[Updated YYYY-MM-DD]" note. No separate correction notice required.',
                  color: 'var(--sfp-green)',
                },
                {
                  icon: AlertTriangle,
                  title: 'Material Corrections',
                  description: 'Factual errors affecting our conclusions, incorrect fee structures, or wrong regulatory status.',
                  action: 'Prominent "Correction" banner at top of review. Full explanation of what changed and why.',
                  color: 'var(--sfp-gold)',
                },
                {
                  icon: Shield,
                  title: 'Rating Revisions',
                  description: 'Errors that change a product\'s overall rating or ranking position relative to competitors.',
                  action: 'Revised review with detailed changelog. Previous rating noted for transparency. Affected comparisons updated.',
                  color: 'var(--sfp-red)',
                },
                {
                  icon: Clock,
                  title: 'Freshness Updates',
                  description: 'Information that was accurate at publication but is now outdated due to provider changes.',
                  action: 'Updated with current data and a "Last verified" timestamp. Not treated as an error — this is routine maintenance.',
                  color: 'var(--sfp-navy)',
                },
              ].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-8 rounded-lg border-2 bg-white"
                    style={{ borderColor: item.color }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <IconComponent className="h-6 w-6" style={{ color: item.color }} />
                      <h3 className="text-lg font-bold" style={{ color: 'var(--sfp-navy)' }}>
                        {item.title}
                      </h3>
                    </div>
                    <p className="mb-4" style={{ color: 'var(--sfp-ink)' }}>{item.description}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>
                      <strong>Action:</strong> {item.action}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Correction Process */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-12" style={{ color: 'var(--sfp-navy)' }}>
              How We Handle Corrections
            </h2>

            <div className="space-y-8">
              {[
                {
                  step: 1,
                  title: 'Error Identified',
                  description: 'An error is reported by a reader, identified by our editorial team during routine checks, or flagged by a product provider. All reports are treated equally.',
                },
                {
                  step: 2,
                  title: 'Verification (Within 24 Hours)',
                  description: 'Our editorial team verifies the reported error against primary sources. We confirm whether the information is truly incorrect, outdated, or was accurate at time of publication.',
                },
                {
                  step: 3,
                  title: 'Correction Published',
                  description: 'Once verified, corrections are published immediately. For material corrections, a dated notice is placed at the top of the affected review explaining what changed.',
                },
                {
                  step: 4,
                  title: 'Cascade Check',
                  description: 'We review all related content (comparison tables, category pages, pillar articles) to ensure the same error does not appear elsewhere.',
                },
                {
                  step: 5,
                  title: 'Reporter Notification',
                  description: 'If a reader reported the error, we notify them that the correction has been made. We credit readers who help us maintain accuracy (with permission).',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-6">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold flex-shrink-0 mt-1"
                    style={{ background: 'var(--sfp-navy)' }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                      {item.title}
                    </h3>
                    <p style={{ color: 'var(--sfp-slate)' }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Version History & Audit Trail */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Version History & Audit Trail
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 pl-6 py-4" style={{ borderLeftColor: 'var(--sfp-gold)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                  Every Review Has a History
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Each review displays its original publish date and last updated date. Material corrections are timestamped and visible to readers. We maintain internal version histories for audit purposes.
                </p>
              </div>

              <div className="border-l-4 pl-6 py-4" style={{ borderLeftColor: 'var(--sfp-gold)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                  No Silent Edits on Ratings
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  If a correction changes a product&apos;s rating, the previous rating is noted alongside the new one. We explain why the rating changed so readers can assess the significance.
                </p>
              </div>

              <div className="border-l-4 pl-6 py-4" style={{ borderLeftColor: 'var(--sfp-gold)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                  Provider Disputes
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Product providers may dispute our findings. We evaluate disputes on merit, verify against primary sources, and update reviews if warranted. We do not change reviews based on commercial pressure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Report an Error */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Report an Error
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--sfp-ink)' }}>
              Found something inaccurate? We want to hear from you. Reader reports are one of our most valuable accuracy tools.
            </p>

            <div className="p-8 rounded-lg border-2 bg-white" style={{ borderColor: 'var(--sfp-gold)' }}>
              <div className="flex items-center gap-3 mb-6">
                <Mail className="h-6 w-6" style={{ color: 'var(--sfp-gold)' }} />
                <h3 className="text-xl font-bold" style={{ color: 'var(--sfp-navy)' }}>
                  Email Us
                </h3>
              </div>
              <p className="mb-4" style={{ color: 'var(--sfp-ink)' }}>
                Send corrections to{' '}
                <a href="mailto:editorial@smartfinpro.com" className="font-semibold underline" style={{ color: 'var(--sfp-navy)' }}>
                  editorial@smartfinpro.com
                </a>{' '}
                with:
              </p>
              <ul className="space-y-2 mb-6" style={{ color: 'var(--sfp-ink)', paddingLeft: '1.5rem' }}>
                <li>The URL of the page containing the error</li>
                <li>The specific statement you believe is incorrect</li>
                <li>The correct information (with source, if available)</li>
                <li>Your name (optional — we credit helpful readers)</li>
              </ul>
              <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                We review all reports within 24 hours and respond to every submission.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/editorial-policy"
                className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg border-2 transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--sfp-navy)', color: 'var(--sfp-navy)' }}
              >
                <CheckCircle className="h-4 w-4" />
                Editorial Policy
              </Link>
              <Link
                href="/review-policy"
                className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg border-2 transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--sfp-navy)', color: 'var(--sfp-navy)' }}
              >
                <FileText className="h-4 w-4" />
                Review Policy
              </Link>
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
            name: 'Corrections Policy',
            url: 'https://smartfinpro.com/corrections-policy',
            description:
              'How SmartFinPro handles errors, corrections, and updates to financial product reviews.',
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
