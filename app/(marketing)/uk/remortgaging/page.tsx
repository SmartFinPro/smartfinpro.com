import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Calendar, Clock, ArrowRight, Shield, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';

export const metadata: Metadata = {
  title: 'UK Remortgaging: Expert Guide 2026 | SmartFinPro',
  description: 'Compare the best remortgage deals, lenders, and strategies for UK homeowners. Expert reviews, interest rates, and broker recommendations for switching mortgages.',
  alternates: {
    canonical: 'https://smartfinpro.com/uk/remortgaging',
    languages: {
      'en': 'https://smartfinpro.com/uk/remortgaging',
      'en-US': 'https://smartfinpro.com/remortgaging',
      'en-CA': 'https://smartfinpro.com/ca/remortgaging',
      'en-AU': 'https://smartfinpro.com/au/remortgaging',
    },
  },
  openGraph: {
    title: 'UK Remortgaging: Expert Guide 2026 | SmartFinPro',
    description: 'Compare the best remortgage deals, lenders, and strategies for UK homeowners. Expert reviews, interest rates, and broker recommendations for switching mortgages.',
    type: 'website',
    locale: 'en_GB',
  },
};

export default function UKRemortgagingPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white body silo-uk">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-var(--sfp-sky) px-4 py-2 border border-blue-200">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Updated February {currentYear}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-var(--sfp-ink) leading-tight">
              UK Remortgaging Guide <span className="text-var(--sfp-gold)">2026</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-var(--sfp-slate) mb-8 leading-relaxed">
              Find the best remortgage deals and lenders. Expert comparisons, switching strategies, and cost savings for UK homeowners securing their next mortgage.
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-var(--sfp-slate) mb-8">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-var(--sfp-gold)" />
                Last updated: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-var(--sfp-navy)" />
                10 min read
              </span>
            </div>

            {/* Primary CTA */}
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-var(--sfp-gold) hover:bg-var(--sfp-gold-dark) text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Link href="/uk/remortgaging#comparison">
                  Compare Lenders
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-2 border-var(--sfp-navy) text-var(--sfp-navy) hover:bg-var(--sfp-sky) px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Link href="#calculator">Savings Calculator</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <section className="container mx-auto px-4 py-8">
        <AffiliateDisclosure market="uk" position="top" />
      </section>

      {/* Answer Block - Common Question */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl bg-var(--sfp-sky) border-l-4 border-var(--sfp-navy) rounded-lg p-6 md:p-8">
          <h2 className="text-xl font-bold text-var(--sfp-navy) mb-3">
            What Is Remortgaging?
          </h2>
          <p className="text-var(--sfp-ink) leading-relaxed mb-4">
            Remortgaging is the process of refinancing your existing mortgage with a new lender or negotiating new terms with your current lender. This typically happens when your initial fixed-rate mortgage ends and you need to switch to a new deal.
          </p>
          <p className="text-var(--sfp-ink) leading-relaxed">
            Many UK homeowners remortgage to secure a better interest rate, reduce monthly payments, or access equity in their property. It's a common strategy for managing long-term mortgage costs and can lead to significant savings over the life of your loan.
          </p>
        </div>
      </section>

      {/* Placeholder Content Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl space-y-12">
          {/* Key Considerations */}
          <div>
            <h2 className="text-2xl font-bold text-var(--sfp-ink) mb-6">
              Key Considerations When Remortgaging
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Interest Rates',
                  description: 'Compare fixed-rate and variable options. Current rates, lender offerings, and how to lock in the best deal for your situation.',
                },
                {
                  title: 'Early Repayment Charges',
                  description: 'Check if your current mortgage has ERCs. Calculate whether savings from remortgaging outweigh any penalties.',
                },
                {
                  title: 'Legal & Valuation Costs',
                  description: 'Budget for surveyor fees, legal fees, and valuation costs. Some lenders cover these; others charge the borrower.',
                },
                {
                  title: 'Switching Timeline',
                  description: 'Understand how long the process takes. Planning ahead ensures your new mortgage starts when your current deal expires.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-slate-200 rounded-lg p-6 hover:border-var(--sfp-gold) transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle className="h-5 w-5 text-var(--sfp-green) shrink-0 mt-0.5" />
                    <h3 className="font-bold text-var(--sfp-navy)">{item.title}</h3>
                  </div>
                  <p className="text-var(--sfp-slate) text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Section */}
          <div id="comparison">
            <h2 className="text-2xl font-bold text-var(--sfp-ink) mb-6">
              Top Remortgage Lenders
            </h2>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-var(--sfp-sky) border-b-2 border-var(--sfp-navy)">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold text-var(--sfp-navy)">Lender</th>
                      <th className="text-left px-4 py-3 font-bold text-var(--sfp-navy)">Rate</th>
                      <th className="text-left px-4 py-3 font-bold text-var(--sfp-navy)">Terms</th>
                      <th className="text-center px-4 py-3 font-bold text-var(--sfp-navy)">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      { lender: 'Habito', rate: 'Whole-of-market', terms: 'Free online broker, 2-10 yr fixed', rating: 4.6 },
                      { lender: 'Trussle', rate: 'Whole-of-market', terms: 'Free online broker, 2-5 yr fixed', rating: 4.5 },
                      { lender: 'London & Country', rate: 'Whole-of-market', terms: 'Free broker, phone & online', rating: 4.4 },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-var(--sfp-gray) transition-colors">
                        <td className="px-4 py-3 font-medium text-var(--sfp-ink)">{row.lender}</td>
                        <td className="px-4 py-3 text-var(--sfp-ink) font-bold text-var(--sfp-gold)">
                          {row.rate}
                        </td>
                        <td className="px-4 py-3 text-var(--sfp-slate)">{row.terms}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(row.rating)
                                      ? 'text-var(--sfp-gold) fill-var(--sfp-gold)'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tool Embed — Remortgage Calculator */}
          <div id="calculator" className="bg-var(--sfp-sky) rounded-lg border border-slate-200 p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-var(--sfp-navy) text-white shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-var(--sfp-navy)">
                  Remortgage Savings Calculator
                </h2>
                <p className="text-sm text-var(--sfp-slate) mt-1">
                  See how much you could save by switching to a new mortgage deal. Enter your current balance, rate, and remaining term to get an instant estimate.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="bg-var(--sfp-gold) hover:bg-var(--sfp-gold-dark) text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Link href="/uk/tools/remortgage-calculator/">
                Open Remortgage Calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Resources & Silo Links */}
          <div>
            <h2 className="text-2xl font-bold text-var(--sfp-ink) mb-6">
              Related Resources
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/uk/remortgaging/best-mortgage-brokers-uk/"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  Best Mortgage Brokers UK 2026
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  Compare top-rated free and fee-based brokers
                </p>
              </Link>
              <Link
                href="/uk/remortgaging/habito-review/"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  Habito Review 2026
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  In-depth review of the UK's leading digital mortgage broker
                </p>
              </Link>
              <Link
                href="/uk/remortgaging/fixed-rate-ending-what-to-do/"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  Fixed Rate Ending? Your Options
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  What to do when your fixed-rate mortgage deal expires
                </p>
              </Link>
              <Link
                href="/uk/remortgaging/habito-vs-trussle/"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  Habito vs Trussle 2026
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  Side-by-side comparison of two leading online brokers
                </p>
              </Link>
              <Link
                href="/uk/cost-of-living/"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  UK Cost of Living Guide
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  Strategies to manage rising household costs
                </p>
              </Link>
              <Link
                href="/uk/savings/best-high-yield-savings-uk/"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  Best Savings Accounts UK
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  Top high-yield savings accounts for UK savers
                </p>
              </Link>
              <Link
                href="/uk/cost-of-living/how-to-reduce-energy-bills-uk/"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  How to Reduce Energy Bills
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  Practical tips to cut your energy costs in 2026
                </p>
              </Link>
            </div>
          </div>

          {/* ISA Tax Savings Calculator Embed */}
          <div className="bg-white border-2 border-slate-200 rounded-lg p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-var(--sfp-green) text-white shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-var(--sfp-navy)">
                  ISA Tax Savings Calculator
                </h2>
                <p className="text-sm text-var(--sfp-slate) mt-1">
                  Calculate how much tax you could save by moving savings into an ISA. Compare Cash ISAs, Stocks &amp; Shares ISAs, and Lifetime ISAs to find the best option.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="bg-var(--sfp-navy) hover:bg-var(--sfp-navy-dark) text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Link href="/uk/tools/isa-tax-savings-calculator/">
                Open ISA Calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Final CTA */}
          <div className="bg-var(--sfp-sky) rounded-lg p-8 border-l-4 border-var(--sfp-gold) text-center">
            <h3 className="text-xl font-bold text-var(--sfp-navy) mb-3">
              Ready to Compare Remortgage Deals?
            </h3>
            <p className="text-var(--sfp-slate) mb-6 max-w-2xl mx-auto">
              Get free quotes from multiple lenders and find the remortgage deal that saves you the most money. No obligation, no credit impact.
            </p>
            <Button
              asChild
              className="bg-var(--sfp-gold) hover:bg-var(--sfp-gold-dark) text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              <Link href="#comparison">View Lender Comparison</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust & Credibility Footer */}
      <section className="container mx-auto px-4 py-12 border-t border-slate-200">
        <div className="max-w-3xl mx-auto bg-white rounded-lg p-6 border border-var(--sfp-green)">
          <div className="flex items-start gap-3 mb-3">
            <Shield className="h-5 w-5 text-var(--sfp-green) shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-var(--sfp-navy) mb-2">
                FCA-Regulated Advisors
              </h4>
              <p className="text-sm text-var(--sfp-slate) leading-relaxed">
                All recommended lenders and advisors meet FCA standards. We only feature firms regulated to provide mortgage advice in the UK. Capital at risk with property-backed lending.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
