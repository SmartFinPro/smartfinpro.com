import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calculator, Lightbulb, Shield } from 'lucide-react';
import { DynamicLoanCalculator } from '@/components/tools/dynamic-calculators';
import { ToolRelatedReviews } from '@/components/marketing/tool-related-reviews';

export const metadata: Metadata = {
  title: 'Loan Calculator - Calculate Monthly Payments & Interest | SmartFinPro',
  description: 'Free loan calculator with amortization schedule. Calculate monthly payments, total interest, and payoff date for personal loans, debt consolidation, and more.',
  openGraph: {
    title: 'Loan Calculator - Calculate Monthly Payments & Interest',
    description: 'Free calculator to estimate loan payments and see full amortization schedule.',
  },
};

export default function LoanCalculatorPage() {
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
              <Calculator className="h-4 w-4" />
              Free Calculator
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
              Loan Calculator
            </h1>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Calculate your monthly payments, total interest, and see a detailed
              amortization schedule for any loan amount.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <DynamicLoanCalculator />
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
                  Understanding Loan Calculations
                </h2>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Our calculator uses the standard amortization formula to compute your monthly payments.
                  This gives you an accurate estimate of what you'll pay each month and over the life of the loan.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>Loan Types Supported</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>Personal loans (6.99% - 35.99% APR)</li>
                  <li>Debt consolidation (5.99% - 29.99% APR)</li>
                  <li>Home improvement (6.49% - 24.99% APR)</li>
                  <li>Emergency loans (8.99% - 35.99% APR)</li>
                </ul>
              </div>
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>What You&apos;ll See</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>Monthly payment amount</li>
                  <li>Total interest paid</li>
                  <li>Full amortization schedule</li>
                  <li>Payoff date estimate</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm" style={{ borderLeftWidth: '4px', borderLeftColor: 'var(--sfp-green)' }}>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-green)' }}>Your Privacy Matters</h3>
                  <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    This calculator runs entirely in your browser. No personal information is collected,
                    stored, or transmitted. Your financial data stays on your device.
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
            title="Loan Provider Reviews"
            subtitle="Compare personal loan providers and find the best rates."
            reviews={[
              { name: 'SoFi Personal Loans', href: '/personal-finance/sofi-personal-loans-review', rating: 4.7, badge: 'Best Overall' },
              { name: 'Credit Cards Comparison', href: '/personal-finance/credit-cards-comparison', badge: '2026 Rankings' },
              { name: 'UK: Zopa Loans', href: '/uk/personal-finance/zopa-personal-loans-review', rating: 4.5 },
              { name: 'UK: Marcus Savings', href: '/uk/personal-finance/marcus-uk-review', rating: 4.4 },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
