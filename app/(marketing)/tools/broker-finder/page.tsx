import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Target, Lightbulb, Shield, Zap, Users } from 'lucide-react';
import { DynamicBrokerFinderQuiz } from '@/components/tools/dynamic-calculators';
import { ToolRelatedReviews } from '@/components/marketing/tool-related-reviews';

export const metadata: Metadata = {
  title: 'Broker Finder Quiz - Find Your Perfect Trading Platform | SmartFinPro',
  description: 'Answer 4 quick questions and get personalized broker recommendations with match scores. Compare eToro, Capital.com, IBKR, and more.',
  openGraph: {
    title: 'Broker Finder Quiz - Find Your Perfect Trading Platform',
    description: 'Personalized broker recommendations in under a minute. Free quiz, no sign-up required.',
  },
};

export default function BrokerFinderPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'var(--sfp-slate)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tools
        </Link>
      </div>

      {/* Hero */}
      <section className="relative py-8 md:py-12 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
              <Target className="h-4 w-4" />
              4 Questions, 45 Seconds
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
              Find Your Perfect Broker
            </h1>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Answer 4 quick questions about your trading style and goals.
              We&apos;ll match you with the best platform from our tested selection.
            </p>
          </div>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <div className="container mx-auto mb-8 px-4 py-2.5 rounded-lg border border-gray-200 text-xs bg-white shadow-sm" style={{ color: 'var(--sfp-slate)' }}>
        <strong style={{ color: 'var(--sfp-ink)' }}>Disclosure:</strong> SmartFinPro may earn a commission when you sign up through links on this page. This does not affect our tool results or editorial independence.{' '}
        <Link href="/affiliate-disclosure" className="hover:underline" style={{ color: 'var(--sfp-navy)' }}>Learn more</Link>
      </div>

      {/* Quiz */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <DynamicBrokerFinderQuiz />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--sfp-sky)' }}>
                <Lightbulb className="h-6 w-6" style={{ color: 'var(--sfp-navy)' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>
                  How Our Matching Works
                </h2>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Our algorithm scores each broker across 4 dimensions based on your answers,
                  then ranks them by overall fit. All brokers are independently reviewed by our team.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--sfp-sky)' }}>
                  <Shield className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>All Regulated</h3>
                <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  Every broker in our selection is regulated by tier-1 authorities (FCA, SEC, ASIC, CIRO).
                </p>
              </div>
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--sfp-sky)' }}>
                  <Zap className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>Independently Tested</h3>
                <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  Our team opens live accounts and tests each platform before recommending it.
                </p>
              </div>
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--sfp-sky)' }}>
                  <Users className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>Personalized Results</h3>
                <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  Results are tailored to your experience, goals, budget, and risk tolerance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Reviews */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <ToolRelatedReviews
            title="Broker Reviews"
            subtitle="Read our expert reviews of the brokers in our matching algorithm."
            reviews={[
              { name: 'eToro Review', href: '/reviews/etoro', rating: 4.8, badge: 'Popular' },
              { name: 'Capital.com Review', href: '/reviews/capital-com', rating: 4.7, badge: 'Best App' },
              { name: 'Interactive Brokers', href: '/reviews/ibkr', rating: 4.9, badge: 'Pro' },
              { name: 'IG Group Review', href: '/reviews/ig', rating: 4.8 },
              { name: 'Plus500 Review', href: '/reviews/plus500', rating: 4.5 },
              { name: 'Revolut Review', href: '/reviews/revolut', rating: 4.3 },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
