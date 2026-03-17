import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Calendar, Clock, ArrowRight, Shield, PiggyBank, Lock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';

export const metadata: Metadata = {
  title: 'UK Savings & ISA Reviews: Best Rates & Tax-Free Accounts 2026 | SmartFinPro',
  description: 'Compare UK savings accounts, ISAs, and cash products. Expert reviews of interest rates, best accounts, and tax-free savings strategies for 2026.',
  alternates: {
    canonical: 'https://smartfinpro.com/uk/savings',
    languages: {
      'en': 'https://smartfinpro.com/uk/savings',
      'en-US': 'https://smartfinpro.com/savings',
      'en-CA': 'https://smartfinpro.com/ca/savings',
      'en-AU': 'https://smartfinpro.com/au/savings',
    },
  },
  openGraph: {
    title: 'UK Savings & ISA Reviews: Best Rates & Tax-Free Accounts 2026 | SmartFinPro',
    description: 'Compare UK savings accounts, ISAs, and cash products. Expert reviews of interest rates, best accounts, and tax-free savings strategies for 2026.',
    type: 'website',
    locale: 'en_GB',
  },
};

export default function UKSavingsPage() {
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
              UK Savings & ISAs <span className="text-var(--sfp-gold)">Hub</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-var(--sfp-slate) mb-8 leading-relaxed">
              Explore the best UK savings accounts, ISAs, and fixed-term bonds. Expert comparisons of interest rates, tax-free accounts, and strategies to maximise your savings in 2026.
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-var(--sfp-slate) mb-8">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-var(--sfp-gold)" />
                Last updated: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-var(--sfp-navy)" />
                15 min read
              </span>
            </div>

            {/* Primary CTA */}
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-var(--sfp-gold) hover:bg-var(--sfp-gold-dark) text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Link href="/uk/savings#accounts">
                  Compare Accounts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-2 border-var(--sfp-navy) text-var(--sfp-navy) hover:bg-var(--sfp-sky) px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Link href="#isa-guide">ISA Guide</Link>
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
            What Is an ISA (Individual Savings Account)?
          </h2>
          <p className="text-var(--sfp-ink) leading-relaxed mb-4">
            An ISA is a UK-government-backed savings account that allows you to save money and earn interest completely tax-free. There are several types of ISAs: Cash ISAs, Stocks & Shares ISAs, Innovative Finance ISAs, and Lifetime ISAs. Each has different rules about what you can save and how much.
          </p>
          <p className="text-var(--sfp-ink) leading-relaxed">
            For the 2026/27 tax year, you can save up to £20,000 across all ISA types combined, with interest earned completely free from income tax. This makes ISAs one of the best tax-efficient savings vehicles available to UK residents.
          </p>
        </div>
      </section>

      {/* Placeholder Content Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl space-y-12">
          {/* Savings Accounts Overview */}
          <div id="accounts">
            <h2 className="text-2xl font-bold text-var(--sfp-ink) mb-6">
              Top Savings Account Types
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Easy Access Accounts',
                  rate: '4.5–5.1%',
                  description: 'Withdraw money anytime without penalty. Ideal for emergency funds and short-term savings.',
                  icon: <PiggyBank className="h-6 w-6 text-var(--sfp-gold)" />,
                },
                {
                  title: 'Fixed-Rate Bonds',
                  rate: '4.7–5.4%',
                  description: 'Lock in your money for a fixed term (1-5 years) to earn guaranteed interest.',
                  icon: <Lock className="h-6 w-6 text-var(--sfp-navy)" />,
                },
                {
                  title: 'Cash ISAs',
                  rate: '4.4–5.2%',
                  description: 'Tax-free savings account. Earn interest with no tax liability. Up to £20,000/year allowance.',
                  icon: <TrendingUp className="h-6 w-6 text-var(--sfp-green)" />,
                },
                {
                  title: 'Notice Accounts',
                  rate: '4.6–5.3%',
                  description: 'Access your money with 30–90 days notice. Higher rates than easy access accounts.',
                  icon: <Clock className="h-6 w-6 text-var(--sfp-slate)" />,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-slate-200 rounded-lg p-6 hover:border-var(--sfp-gold) transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-var(--sfp-gray) rounded-lg">{item.icon}</div>
                    <div>
                      <h3 className="font-bold text-var(--sfp-navy)">{item.title}</h3>
                      <p className="text-sm text-var(--sfp-gold) font-bold mt-1">{item.rate} APY</p>
                    </div>
                  </div>
                  <p className="text-var(--sfp-slate) text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ISA Guide */}
          <div id="isa-guide">
            <h2 className="text-2xl font-bold text-var(--sfp-ink) mb-6">
              Complete ISA Guide
            </h2>
            <div className="space-y-6">
              {[
                {
                  type: 'Cash ISA',
                  features: [
                    'Tax-free interest',
                    'Full flexibility or fixed terms available',
                    'No credit check required',
                    'FSCS protection up to £85,000',
                  ],
                },
                {
                  type: 'Stocks & Shares ISA',
                  features: [
                    'Invest in stocks, bonds, funds',
                    'Tax-free growth and dividends',
                    'Flexible investment options',
                    'Suitable for medium to long-term growth',
                  ],
                },
                {
                  type: 'Lifetime ISA (LISA)',
                  features: [
                    '25% government bonus (£1 for every £4 saved)',
                    'For age 18–39 savers',
                    'Maximum £4,000/year = £1,000 bonus',
                    'Can use for first home or retirement',
                  ],
                },
              ].map((isa, idx) => (
                <div
                  key={idx}
                  className="bg-var(--sfp-gray) rounded-lg border border-slate-200 p-6"
                >
                  <h3 className="text-lg font-bold text-var(--sfp-navy) mb-4">
                    {isa.type}
                  </h3>
                  <ul className="space-y-2">
                    {isa.features.map((feature, fidx) => (
                      <li
                        key={fidx}
                        className="flex items-start gap-3 text-var(--sfp-ink) text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-var(--sfp-green) shrink-0 mt-1" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Top Savings Providers Table */}
          <div>
            <h2 className="text-2xl font-bold text-var(--sfp-ink) mb-6">
              Featured Savings Providers
            </h2>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-var(--sfp-sky) border-b-2 border-var(--sfp-navy)">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold text-var(--sfp-navy)">Provider</th>
                      <th className="text-left px-4 py-3 font-bold text-var(--sfp-navy)">Easy Access Rate</th>
                      <th className="text-left px-4 py-3 font-bold text-var(--sfp-navy)">1-Year Fixed</th>
                      <th className="text-left px-4 py-3 font-bold text-var(--sfp-navy)">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      { provider: 'Placeholder Bank A', easyAccess: '5.1%', fixed: '5.4%', type: 'Cash ISA' },
                      { provider: 'Placeholder Bank B', easyAccess: '4.9%', fixed: '5.2%', type: 'Easy Access' },
                      { provider: 'Placeholder Bank C', easyAccess: '4.8%', fixed: '5.3%', type: 'Fixed Bond' },
                      { provider: 'Placeholder Bank D', easyAccess: '5.0%', fixed: '5.1%', type: 'Notice Account' },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-var(--sfp-gray) transition-colors">
                        <td className="px-4 py-3 font-medium text-var(--sfp-ink)">{row.provider}</td>
                        <td className="px-4 py-3 font-bold text-var(--sfp-gold)">{row.easyAccess}</td>
                        <td className="px-4 py-3 font-bold text-var(--sfp-gold)">{row.fixed}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-var(--sfp-green) text-white text-xs font-medium">
                            {row.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Savings Strategies */}
          <div>
            <h2 className="text-2xl font-bold text-var(--sfp-ink) mb-6">
              Savings Strategies
            </h2>
            <div className="bg-white border-2 border-var(--sfp-green) rounded-lg p-6 md:p-8">
              <div className="space-y-4">
                {[
                  'Maximise your ISA allowance (£20,000/year) to earn tax-free interest',
                  'Use laddered fixed-rate bonds to balance accessibility and higher returns',
                  'Consider a Lifetime ISA if buying your first home within 10 years',
                  'Build an emergency fund in an easy-access savings account (3–6 months expenses)',
                  'Combine Cash ISAs with Stocks & Shares ISAs for balanced tax-free growth',
                  'Switch to higher-rate accounts when your current deal expires',
                ].map((strategy, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-var(--sfp-green) shrink-0 mt-0.5" />
                    <p className="text-var(--sfp-ink) text-sm font-medium">{strategy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related Silos */}
          <div>
            <h2 className="text-2xl font-bold text-var(--sfp-ink) mb-6">
              Explore More Financial Topics
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/uk/remortgaging"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  UK Remortgaging Hub
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  Find better mortgage rates and save thousands
                </p>
              </Link>
              <Link
                href="/uk/cost-of-living"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  Cost of Living Guide
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  Money-saving tips and budgeting strategies
                </p>
              </Link>
              <Link
                href="/uk/personal-finance"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  Personal Finance Hub
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  Comprehensive money management guide
                </p>
              </Link>
              <Link
                href="/uk"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  UK Market Hub
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  All UK financial resources
                </p>
              </Link>
            </div>
          </div>

          {/* Final CTA */}
          <div className="bg-var(--sfp-sky) rounded-lg p-8 border-l-4 border-var(--sfp-gold) text-center">
            <h3 className="text-xl font-bold text-var(--sfp-navy) mb-3">
              Start Saving More Today
            </h3>
            <p className="text-var(--sfp-slate) mb-6 max-w-2xl mx-auto">
              Compare tax-free ISAs and high-interest savings accounts. Make your money work harder in 2026 with expert recommendations and current rates.
            </p>
            <Button
              asChild
              className="bg-var(--sfp-gold) hover:bg-var(--sfp-gold-dark) text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              <Link href="#accounts">View Account Comparison</Link>
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
                FSCS Protection & FCA Compliance
              </h4>
              <p className="text-sm text-var(--sfp-slate) leading-relaxed">
                All featured savings providers are FSCS-registered, protecting deposits up to £85,000 per bank per person. Our information is based on current rates and product details. Past performance does not guarantee future results.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Import CheckCircle icon
import { CheckCircle } from 'lucide-react';
