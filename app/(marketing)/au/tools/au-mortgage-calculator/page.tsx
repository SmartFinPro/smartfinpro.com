import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Home, Lightbulb, Shield } from 'lucide-react';
import { DynamicAUMortgageCalculator } from '@/components/tools/dynamic-calculators';
import { ToolRelatedReviews } from '@/components/marketing/tool-related-reviews';

export const metadata: Metadata = {
  title: 'Australian Home Loan Calculator 2026: Repayments, LVR & Offset | SmartFinPro',
  description:
    'Free AU mortgage calculator. Calculate monthly repayments, LVR, offset savings, and stamp duty estimates for Australian home loans. Compare rates from 25+ lenders.',
  alternates: {
    canonical: 'https://smartfinpro.com/au/tools/au-mortgage-calculator',
    languages: {
      'en-AU': 'https://smartfinpro.com/au/tools/au-mortgage-calculator',
    },
  },
  openGraph: {
    title: 'Australian Home Loan Calculator — Repayments, LVR & Offset',
    description:
      'Free calculator for Australian home loan repayments with LVR analysis and offset account savings.',
    url: 'https://smartfinpro.com/au/tools/au-mortgage-calculator',
  },
};

export default function AUMortgageCalculatorPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/au/tools"
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
              <Home className="h-4 w-4" />
              Australian Home Loans
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
              AU Home Loan Repayment Calculator
            </h1>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Calculate your monthly mortgage repayments, see your LVR, estimate offset account
              savings, and understand stamp duty obligations across Australian states.
            </p>
            <p className="text-sm mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Join 15,000+ Australians who compared and saved this year
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <DynamicAUMortgageCalculator />
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
                  Understanding Australian Home Loan Calculations
                </h2>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Our calculator uses the standard amortisation formula to compute your monthly
                  repayments. The LVR calculation helps you understand whether Lenders Mortgage
                  Insurance may apply, and the offset simulator shows how maintaining savings can
                  reduce your interest costs over time.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>What This Calculator Shows</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>Monthly repayment amount (P&I or Interest Only)</li>
                  <li>Loan-to-Value Ratio (LVR) with LMI warning</li>
                  <li>Total interest paid over the loan term</li>
                  <li>Offset account savings estimate</li>
                  <li>12-month amortisation schedule</li>
                  <li>Stamp duty guidance by state</li>
                </ul>
              </div>
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>Key Australian Home Loan Terms</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>LVR:</strong> Loan-to-Value Ratio — your
                    loan as a percentage of the property value
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>LMI:</strong> Lenders Mortgage Insurance —
                    required if LVR exceeds 80%
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Offset:</strong> A linked transaction account
                    that reduces your loan interest
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Comparison Rate:</strong> ASIC-mandated rate
                    including fees for true cost comparison
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>APRA:</strong> Australian Prudential
                    Regulation Authority — supervises banks
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>P&I vs IO:</strong> Principal & Interest
                    (build equity) vs Interest Only (lower repayments)
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
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-green)' }}>Your Privacy Matters</h3>
                  <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    This calculator runs entirely in your browser. No personal or financial
                    information is collected, stored, or transmitted. Your data stays on your device.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm mt-6">
              <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                <strong style={{ color: 'var(--sfp-ink)' }}>Disclaimer:</strong> This calculator provides
                estimates only and should not be considered financial advice. Actual rates, fees,
                LMI costs, and stamp duty vary by lender and state. Always confirm figures directly
                with your chosen lender before making borrowing decisions. SmartFinPro provides
                general financial information — we recommend consulting a licensed financial adviser
                for personal advice. All Australian lenders referenced are APRA-regulated or hold
                appropriate ASIC licences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related AU Home Loan Reviews */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <ToolRelatedReviews
            title="Home Loan Reviews"
            subtitle="Compare Australia's top home loan providers side by side."
            reviews={[
              { name: 'Athena Home Loans', href: '/au/personal-finance/athena-home-loans-review', rating: 4.7, badge: 'Lowest Rate' },
              { name: 'ubank Home Loan', href: '/au/personal-finance/ubank-home-loan-review', rating: 4.5 },
              { name: 'CommBank Home Loan', href: '/au/personal-finance/commbank-home-loan-review', rating: 4.4 },
              { name: 'NAB Home Loan', href: '/au/personal-finance/nab-home-loan-review', rating: 4.3 },
              { name: 'Westpac Home Loan', href: '/au/personal-finance/westpac-home-loan-review', rating: 4.3 },
              { name: 'ANZ Home Loan', href: '/au/personal-finance/anz-home-loan-review', rating: 4.2 },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
