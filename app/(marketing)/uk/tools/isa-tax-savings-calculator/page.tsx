import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Lightbulb, AlertTriangle } from 'lucide-react';
import { DynamicISATaxSavingsCalculator } from '@/components/tools/dynamic-calculators';
import { ToolRelatedReviews } from '@/components/marketing/tool-related-reviews';

export const metadata: Metadata = {
  title: 'ISA Tax Savings Calculator 2026: See Your Tax Shield | SmartFinPro',
  description:
    'Free ISA tax savings calculator. See how much you could save in capital gains tax and dividend tax by investing inside a Stocks and Shares ISA vs a General Investment Account.',
  alternates: {
    canonical: 'https://smartfinpro.com/uk/tools/isa-tax-savings-calculator',
  },
  openGraph: {
    title: 'ISA Tax Savings Calculator — Visualise Your Tax Shield',
    description:
      'Calculate the tax advantage of investing inside a Stocks and Shares ISA over 5, 10, and 20 years.',
    url: 'https://smartfinpro.com/uk/tools/isa-tax-savings-calculator',
  },
};

export default function ISATaxSavingsCalculatorPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/uk/tools"
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
              style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
            >
              <Shield className="h-4 w-4" />
              UK Stocks &amp; Shares ISA
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
              ISA Tax Savings Calculator
            </h1>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              See exactly how much you could save in capital gains tax and dividend tax by investing
              inside a Stocks &amp; Shares ISA compared to a General Investment Account. Visualise
              the power of your ISA tax shield over 5, 10, and 20 years.
            </p>
            <p className="text-sm mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Join millions of UK investors who use ISAs to grow their wealth tax-free
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <DynamicISATaxSavingsCalculator />
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
                <Lightbulb className="h-6 w-6" style={{ color: 'var(--sfp-navy)' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>
                  Understanding the ISA Tax Shield
                </h2>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  A Stocks &amp; Shares ISA shelters your investments from both capital gains tax
                  and dividend tax. This calculator models the cumulative benefit of tax-free
                  compounding over time, showing you the true cost of investing outside an ISA.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>Taxes Sheltered by an ISA</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Capital Gains Tax:</strong> 10% (basic) or
                    24% (higher/additional) on profits above £3,000 annual allowance
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Dividend Tax:</strong> 8.75% (basic), 33.75%
                    (higher), or 39.35% (additional) above £500 annual allowance
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Income Tax:</strong> No tax on interest from
                    bonds or cash within the ISA
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Withdrawal Tax:</strong> Withdrawals from an
                    ISA are entirely tax-free at any time
                  </li>
                </ul>
              </div>
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>Key ISA Rules (2025/26)</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Annual Allowance:</strong> £20,000 across all
                    ISA types combined
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Tax Year:</strong> 6 April to 5 April —
                    unused allowance cannot be carried forward
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Eligibility:</strong> UK residents aged 18+
                    (16+ for Cash ISA)
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>FSCS Protection:</strong> Up to £85,000 per
                    provider if the firm fails
                  </li>
                </ul>
              </div>
            </div>

            {/* FCA Warning */}
            <div
              className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm mb-6"
              style={{ borderLeftWidth: '4px', borderLeftColor: 'var(--sfp-gold)' }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-gold)' }}>Important Information</h3>
                  <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    Capital at risk. The value of investments and the income from them can go down as
                    well as up and you may get back less than you invest. Tax treatment depends on
                    your individual circumstances and may be subject to change in future. This
                    calculator provides estimates based on the assumptions entered and should not be
                    considered personal financial advice. Past performance is not a guide to future
                    returns.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm"
              style={{ borderLeftWidth: '4px', borderLeftColor: 'var(--sfp-green)' }}
            >
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-green)' }}>Your Privacy Matters</h3>
                  <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    This calculator runs entirely in your browser. No personal or financial
                    information is collected, stored, or transmitted. Your data stays on your device.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related UK ISA Reviews */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <ToolRelatedReviews
            title="ISA Provider Reviews"
            subtitle="Compare ISA providers and find the best match for your investment goals."
            reviews={[
              { name: 'Vanguard ISA Review', href: '/uk/personal-finance/vanguard-isa-review', rating: 4.8, badge: 'Best Value' },
              { name: 'Hargreaves Lansdown ISA', href: '/uk/personal-finance/hargreaves-lansdown-isa-review', rating: 4.7, badge: 'Most Popular' },
              { name: 'AJ Bell ISA Review', href: '/uk/personal-finance/aj-bell-isa-review', rating: 4.6 },
              { name: 'Fidelity ISA Review', href: '/uk/personal-finance/fidelity-isa-review', rating: 4.6 },
              { name: 'Trading 212 ISA', href: '/uk/personal-finance/trading-212-isa-review', rating: 4.5, badge: 'Free' },
              { name: 'Nutmeg ISA Review', href: '/uk/personal-finance/nutmeg-isa-review', rating: 4.4 },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
