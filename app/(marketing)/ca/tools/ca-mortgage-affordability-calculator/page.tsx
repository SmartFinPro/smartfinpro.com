import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Home, Lightbulb, Shield } from 'lucide-react';
import { DynamicCAMortgageAffordabilityCalculator } from '@/components/tools/dynamic-calculators';
import { ToolRelatedReviews } from '@/components/marketing/tool-related-reviews';

export const metadata: Metadata = {
  title: 'Canadian Mortgage Affordability Calculator 2026: GDS, TDS & Stress Test | SmartFinPro',
  description:
    'Free Canadian mortgage affordability calculator for first-time home buyers. Calculate GDS/TDS ratios, CMHC insurance, stress test qualification, and first-time buyer incentives (FHSA, HBP).',
  alternates: {
    canonical: 'https://smartfinpro.com/ca/tools/ca-mortgage-affordability-calculator',
  },
  openGraph: {
    title: 'Canadian Mortgage Affordability Calculator — GDS, TDS & Stress Test',
    description:
      'Free calculator for Canadian first-time home buyers. GDS/TDS ratios, CMHC insurance, OSFI stress test, and buyer incentives.',
    url: 'https://smartfinpro.com/ca/tools/ca-mortgage-affordability-calculator',
  },
};

export default function CAMortgageAffordabilityCalculatorPage() {
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
              <Home className="h-4 w-4" />
              Canadian Mortgages
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
              Canadian Mortgage Affordability Calculator
            </h1>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Find out how much home you can afford in Canada. This calculator applies the OSFI B-20
              stress test, calculates your GDS and TDS ratios, estimates CMHC insurance, and shows
              first-time home buyer incentives.
            </p>
            <p className="text-sm mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Built for first-time home buyers across Canada
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <DynamicCAMortgageAffordabilityCalculator />
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
                  Understanding Canadian Mortgage Affordability
                </h2>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Canadian lenders use two key ratios to determine how much you can borrow: the Gross
                  Debt Service (GDS) ratio and the Total Debt Service (TDS) ratio. On top of that,
                  the OSFI B-20 stress test requires you to qualify at a rate higher than your actual
                  contract rate, ensuring you can handle potential rate increases. This calculator
                  applies all of these rules to show your true maximum affordable home price.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>What This Calculator Shows</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>Maximum affordable home price based on your income</li>
                  <li>GDS ratio with visual gauge (must be 39% or below)</li>
                  <li>TDS ratio with visual gauge (must be 44% or below)</li>
                  <li>CMHC insurance amount if down payment is under 20%</li>
                  <li>Monthly payment breakdown (mortgage, tax, heating)</li>
                  <li>OSFI B-20 stress test qualifying rate</li>
                  <li>First-time home buyer incentives (FHSA, HBP, Tax Credit)</li>
                </ul>
              </div>
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>Key Canadian Mortgage Terms</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>GDS:</strong> Gross Debt Service ratio —
                    housing costs as a percentage of gross income (max 39%)
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>TDS:</strong> Total Debt Service ratio —
                    all debt payments as a percentage of gross income (max 44%)
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>CMHC:</strong> Canada Mortgage and Housing
                    Corporation — provides mortgage default insurance when down payment is below 20%
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Stress Test:</strong> OSFI B-20 rule requiring
                    qualification at the higher of contract rate + 2% or 5.25%
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>FHSA:</strong> First Home Savings Account —
                    tax-advantaged savings for your first home (up to C$40,000 lifetime)
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>HBP:</strong> Home Buyers&apos; Plan — withdraw
                    up to C$60,000 from your RRSP tax-free for a first home purchase
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
                estimates only and should not be considered financial advice. Actual mortgage approval
                depends on your credit score, employment history, property type, lender policies, and
                other factors. CMHC insurance premiums and stress test rules are subject to change by
                OSFI and CMHC. Always confirm figures directly with your chosen lender or a licensed
                mortgage broker before making borrowing decisions. SmartFinPro provides general
                financial information — we recommend consulting a licensed mortgage professional for
                personalized advice. This tool does not constitute an offer of credit or a
                pre-approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Canadian Personal Finance Reviews */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <ToolRelatedReviews
            title="Canadian Personal Finance Reviews"
            subtitle="Compare Canada's top financial products for first-time home buyers."
            reviews={[
              { name: 'Wealthsimple Cash', href: '/ca/personal-finance/wealthsimple-cash', rating: 4.6, badge: 'Top Pick' },
              { name: 'Wealthsimple Crypto', href: '/ca/personal-finance/wealthsimple-crypto', rating: 4.5 },
              { name: 'Wealthsimple Tax', href: '/ca/personal-finance/wealthsimple-tax', rating: 4.7 },
              { name: 'Questrade Review', href: '/ca/forex/questrade-review', rating: 4.4 },
              { name: 'Interactive Brokers CA', href: '/ca/forex/interactive-brokers-review', rating: 4.5 },
              { name: 'Revolut Business CA', href: '/ca/business-banking/revolut-business-review', rating: 4.3 },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
