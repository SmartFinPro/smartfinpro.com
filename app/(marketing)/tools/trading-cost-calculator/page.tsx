import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Lightbulb, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { DynamicTradingCostCalculator } from '@/components/tools/dynamic-calculators';
import { ToolRelatedReviews } from '@/components/marketing/tool-related-reviews';

export const metadata: Metadata = {
  title: 'Trading Cost Calculator - Compare Broker Fees | SmartFinPro',
  description: 'Free trading cost calculator. Compare spreads, commissions, and overnight fees across top brokers. See exactly how much you could save.',
  openGraph: {
    title: 'Trading Cost Calculator - Compare Broker Fees',
    description: 'Compare real trading costs across eToro, Capital.com, IBKR, and more. Free calculator.',
  },
};

export default function TradingCostCalculatorPage() {
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
              <BarChart3 className="h-4 w-4" />
              Free Calculator
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
              Trading Cost Calculator
            </h1>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Compare real trading costs across top brokers. Adjust your trade size,
              frequency, and instruments to see exactly how much you could save.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <DynamicTradingCostCalculator />
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
                  Understanding Trading Costs
                </h2>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Trading costs can significantly impact your returns over time. Our calculator
                  breaks down the three main cost components to help you make an informed decision.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--sfp-sky)' }}>
                  <DollarSign className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>Spreads</h3>
                <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  The difference between buy and sell price. This is the primary cost for most retail traders.
                </p>
              </div>
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--sfp-sky)' }}>
                  <TrendingUp className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>Commissions</h3>
                <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  Fixed fees per trade. Some brokers offer zero commissions but compensate with wider spreads.
                </p>
              </div>
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--sfp-sky)' }}>
                  <Clock className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>Overnight Fees</h3>
                <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  Swap fees for holding positions overnight. These add up significantly for longer-term positions.
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
            subtitle="Read our in-depth reviews of the brokers featured in this calculator."
            reviews={[
              { name: 'eToro Review', href: '/reviews/etoro', rating: 4.8, badge: 'Popular' },
              { name: 'Capital.com Review', href: '/reviews/capital-com', rating: 4.7 },
              { name: 'Interactive Brokers Review', href: '/reviews/ibkr', rating: 4.9, badge: 'Pro' },
              { name: 'IG Group Review', href: '/reviews/ig', rating: 4.8 },
              { name: 'Plus500 Review', href: '/reviews/plus500', rating: 4.5 },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
