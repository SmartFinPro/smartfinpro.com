import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Scale, Lightbulb, Shield } from 'lucide-react';
import { DynamicBrokerComparison } from '@/components/tools/dynamic-calculators';
import { ToolRelatedReviews } from '@/components/marketing/tool-related-reviews';

export const metadata: Metadata = {
  title: 'Broker Comparison Tool - Compare Forex & CFD Brokers | SmartFinPro',
  description: 'Compare forex and CFD brokers side by side. Filter by regulation, features, minimum deposit, and spreads to find the best broker for your trading needs.',
  openGraph: {
    title: 'Broker Comparison Tool - Compare Forex & CFD Brokers',
    description: 'Free tool to compare trading brokers by features, regulation, and costs.',
  },
};

export default function BrokerComparisonPage() {
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

      {/* Hero Section */}
      <section className="relative py-8 md:py-12 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
              <Scale className="h-4 w-4" />
              Comparison Tool
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
              Broker Comparison
            </h1>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Compare top forex and CFD brokers side by side. Filter by your
              market, features, and find the best broker for your needs.
            </p>
          </div>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <div className="container mx-auto mb-8 px-4 py-2.5 rounded-lg border border-gray-200 text-xs bg-white shadow-sm" style={{ color: 'var(--sfp-slate)' }}>
        <strong style={{ color: 'var(--sfp-ink)' }}>Disclosure:</strong> SmartFinPro may earn a commission when you sign up through links on this page. This does not affect our tool results or editorial independence.{' '}
        <Link href="/affiliate-disclosure" className="hover:underline" style={{ color: 'var(--sfp-navy)' }}>Learn more</Link>
      </div>

      {/* Comparison Tool */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <DynamicBrokerComparison />
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
                  How We Compare Brokers
                </h2>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  We evaluate brokers based on regulation, trading costs, platform features,
                  and user experience. Our comparisons are updated regularly to reflect
                  current offerings.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>What We Consider</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>Regulatory status and licenses</li>
                  <li>Spreads and trading costs</li>
                  <li>Available trading platforms</li>
                  <li>Minimum deposit requirements</li>
                  <li>Additional features (copy trading, etc.)</li>
                </ul>
              </div>
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>Regulation Bodies</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>ASIC (Australia)</li>
                  <li>FCA (United Kingdom)</li>
                  <li>CySEC (Cyprus/EU)</li>
                  <li>CIMA (Cayman Islands)</li>
                  <li>FSA (Seychelles)</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm" style={{ borderLeftWidth: '4px', borderLeftColor: 'var(--sfp-navy)' }}>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-navy)' }} />
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-navy)' }}>Important Notice</h3>
                  <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    Trading CFDs and forex involves significant risk. Only trade with money you can
                    afford to lose. This comparison is for informational purposes only and does not
                    constitute financial advice. Always do your own research before choosing a broker.
                  </p>
                </div>
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
            subtitle="Deep-dive into individual broker reviews for detailed analysis."
            reviews={[
              { name: 'eToro Review', href: '/reviews/etoro', rating: 4.8, badge: 'Popular' },
              { name: 'Capital.com Review', href: '/reviews/capital-com', rating: 4.7 },
              { name: 'Interactive Brokers', href: '/reviews/ibkr', rating: 4.9, badge: 'Pro' },
              { name: 'IG Group Review', href: '/reviews/ig', rating: 4.8 },
              { name: 'Plus500 Review', href: '/reviews/plus500', rating: 4.5 },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
