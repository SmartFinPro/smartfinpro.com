import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calculator, Lightbulb, Shield, TrendingUp } from 'lucide-react';
import { DynamicWealthsimpleCalculator } from '@/components/tools/dynamic-calculators';
import { ToolRelatedReviews } from '@/components/marketing/tool-related-reviews';

export const metadata: Metadata = {
  title: 'Wealthsimple Fee Calculator — How Much Could You Save? | SmartFinPro',
  description:
    'Calculate how much you could save by switching from traditional bank mutual funds to Wealthsimple. Compare fee drag over 10, 20, and 30 years with our free calculator.',
  alternates: {
    canonical: 'https://smartfinpro.com/ca/tools/wealthsimple-calculator',
  },
  openGraph: {
    title: 'Wealthsimple Fee Calculator — How Much Could You Save?',
    description:
      'Free calculator to estimate investment fee savings with Wealthsimple vs traditional banks.',
    url: 'https://smartfinpro.com/ca/tools/wealthsimple-calculator',
  },
};

export default function WealthsimpleCalculatorPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/ca/tools"
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
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
              style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-green)' }}
            >
              <Calculator className="h-4 w-4" />
              Free Calculator
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
              Wealthsimple Fee Savings Calculator
            </h1>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              See how much investment fees are really costing you. Compare your current
              provider against Wealthsimple&apos;s low-fee plans and discover your potential
              savings over 10, 20, and 30 years.
            </p>
          </div>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <div className="container mx-auto mb-8 px-4 py-2.5 rounded-lg border border-gray-200 text-xs bg-white shadow-sm" style={{ color: 'var(--sfp-slate)' }}>
        <strong style={{ color: 'var(--sfp-ink)' }}>Disclosure:</strong> SmartFinPro may earn a commission when you sign up through links on this page. This does not affect our tool results or editorial independence.{' '}
        <Link href="/affiliate-disclosure" className="hover:underline" style={{ color: 'var(--sfp-navy)' }}>Learn more</Link>
      </div>

      {/* Calculator */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <DynamicWealthsimpleCalculator />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--sfp-sky)' }}
              >
                <Lightbulb className="h-6 w-6" style={{ color: 'var(--sfp-green)' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>
                  Understanding Investment Fee Drag
                </h2>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Investment fees compound against you over time, just like returns compound in
                  your favour. Even a small difference in annual fees can result in tens of
                  thousands of dollars lost over a long investment horizon. This is known as
                  &quot;fee drag&quot; and it&apos;s one of the biggest factors within your
                  control when investing.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                  How Investment Fees Work
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>MER (Management Expense Ratio):</strong>{' '}
                    Annual fee charged by the fund, deducted from returns
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Management Fee:</strong> Fee charged by
                    the platform for portfolio management
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Fee Drag:</strong> The compounding
                    effect of fees reducing your long-term returns
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Total Cost:</strong> MER + management
                    fee = your true annual cost of investing
                  </li>
                </ul>
              </div>
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <Calculator className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                  The Wealthsimple Advantage
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Self-Directed:</strong> 0% management
                    fee — only pay ETF MERs (~0.20%)
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Managed Core:</strong> 0.5% management
                    fee with automated portfolio rebalancing
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Managed Premium:</strong> 0.4%
                    management fee for balances over C$100K
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>No minimums:</strong> Start investing
                    with any amount, no account minimum required
                  </li>
                </ul>
              </div>
            </div>

            <div
              className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm"
              style={{ borderLeftWidth: '4px', borderLeftColor: 'var(--sfp-green)' }}
            >
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-green)' }}>
                    Your Privacy Matters
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    This calculator runs entirely in your browser. No personal information is
                    collected, stored, or transmitted. Your financial data stays on your
                    device.
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
            title="Wealthsimple Reviews"
            subtitle="Explore our in-depth analysis of Wealthsimple's product lineup."
            reviews={[
              { name: 'Wealthsimple Review', href: '/ca/personal-finance/wealthsimple-review', rating: 4.8, badge: 'Top Pick' },
              { name: 'Wealthsimple Cash', href: '/ca/personal-finance/wealthsimple-cash', rating: 4.5 },
              { name: 'Wealthsimple Crypto', href: '/ca/personal-finance/wealthsimple-crypto', rating: 4.3 },
              { name: 'Wealthsimple Tax', href: '/ca/personal-finance/wealthsimple-tax', rating: 4.7, badge: 'Free' },
              { name: 'Wealthsimple vs Questrade', href: '/ca/personal-finance/wealthsimple-vs-questrade', badge: 'Comparison' },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
