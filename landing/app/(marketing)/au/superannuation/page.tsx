// app/(marketing)/au/superannuation/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/marketing/breadcrumb';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';
import { AnswerBlock } from '@/components/ui/answer-block';
import { marketConfig } from '@/lib/i18n/config';

export const metadata: Metadata = {
  title: 'Best Superannuation Funds Australia 2026 | SmartFinPro',
  description: 'Compare Australian superannuation funds, investment options, and retirement strategies. Expert reviews for maximising your super balance.',
  alternates: {
    canonical: 'https://smartfinpro.com/au/superannuation',
    languages: {
      'en-AU': 'https://smartfinpro.com/au/superannuation',
      'en-US': 'https://smartfinpro.com/personal-finance',
      'en-GB': 'https://smartfinpro.com/uk/personal-finance',
      'en-CA': 'https://smartfinpro.com/ca/personal-finance',
      'x-default': 'https://smartfinpro.com',
    },
  },
  openGraph: {
    title: 'Best Superannuation Funds Australia 2026 | SmartFinPro',
    description: 'Compare Australian superannuation funds, investment options, and retirement strategies.',
    type: 'website',
    locale: 'en_AU',
  },
};

export default function SuperannuationPage() {
  return (
    <div className="silo-au min-h-screen bg-sfp-gray">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/au' },
              { label: 'Personal Finance', href: '/au/personal-finance' },
              { label: 'Superannuation' },
            ]}
          />
          <h1 className="text-4xl font-bold text-sfp-navy mt-6 mb-4">
            Best Superannuation Funds Australia 2026
          </h1>
          <p className="text-lg text-sfp-slate mb-6">
            Compare top-performing superannuation funds, minimise fees, and optimise your retirement savings with expert-reviewed recommendations.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Affiliate Disclosure */}
          <AffiliateDisclosure market="au" position="top" />

          {/* Introduction Section */}
          <section className="bg-white rounded-lg p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-sfp-navy mb-4">
              Optimise Your Superannuation Strategy
            </h2>
            <p className="text-sfp-slate leading-relaxed mb-4">
              Your superannuation is one of Australia's most powerful wealth-building tools. With the right fund selection and regular contributions, you can build substantial retirement savings whilst benefiting from concessional tax treatment.
            </p>
            <p className="text-sfp-slate leading-relaxed">
              This guide compares leading Australian superannuation funds based on performance, fees, investment options, and member services.
            </p>
          </section>

          {/* Answer Blocks */}
          <div className="space-y-6 mb-8">
            <AnswerBlock
              question="What is superannuation?"
              answer="Superannuation is Australia's mandatory retirement savings system. Employers contribute 11.5% of your wages into a super fund, and you can make voluntary contributions. Earnings are taxed at just 15%, making it tax-effective."
            />
            <AnswerBlock
              question="How do I choose a super fund?"
              answer="Consider fees, investment returns, asset allocation options, and member services. Consolidating multiple super accounts into one fund can reduce fees and simplify management."
            />
            <AnswerBlock
              question="Can I access my super early?"
              answer="In most cases, you cannot access super until age 60. Exceptions exist for hardship claims, serious medical conditions, or compassionate grounds. Seek professional advice before withdrawing."
            />
          </div>

          {/* Key Comparison Section */}
          <section className="bg-white rounded-lg p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-sfp-navy mb-6">
              Key Comparison Factors
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-l-4 border-sfp-gold pl-4">
                <h3 className="font-semibold text-sfp-navy mb-2">Administration Fees</h3>
                <p className="text-sfp-slate text-sm">
                  Flat annual fees vary from $100–$300. Lower fees mean more wealth accumulation over decades.
                </p>
              </div>
              <div className="border-l-4 border-sfp-gold pl-4">
                <h3 className="font-semibold text-sfp-navy mb-2">Investment Performance</h3>
                <p className="text-sfp-slate text-sm">
                  Historical returns matter, but past performance doesn't guarantee future results. Check 5-year and 10-year returns.
                </p>
              </div>
              <div className="border-l-4 border-sfp-gold pl-4">
                <h3 className="font-semibold text-sfp-navy mb-2">Asset Allocation Options</h3>
                <p className="text-sfp-slate text-sm">
                  Choose from growth, balanced, defensive, or diversified portfolios depending on your age and risk tolerance.
                </p>
              </div>
              <div className="border-l-4 border-sfp-gold pl-4">
                <h3 className="font-semibold text-sfp-navy mb-2">Insurance Options</h3>
                <p className="text-sfp-slate text-sm">
                  Death and disability insurance can protect your family. Compare default and optional coverage.
                </p>
              </div>
            </div>
          </section>

          {/* Internal Links Section */}
          <section className="bg-sfp-sky rounded-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-sfp-navy mb-4">
              Related Articles
            </h3>
            <div className="space-y-3">
              <Link
                href="/au/superannuation/division-296-tax-explained"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> Division 296 Super Tax Explained
              </Link>
              <Link
                href="/au/superannuation/best-super-funds-australia"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> Best Super Funds Australia 2026
              </Link>
              <Link
                href="/au/superannuation/self-managed-super-fund-setup"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> How to Set Up an SMSF
              </Link>
              <Link
                href="/au/gold-investing/perth-mint-review"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> Perth Mint Review 2026
              </Link>
              <Link
                href="/au/gold-investing/how-to-buy-gold-australia"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> How to Buy Gold in Australia
              </Link>
              <Link
                href="/au/savings/high-yield-savings-accounts-au"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> Best Savings Accounts Australia
              </Link>
            </div>
          </section>

          {/* Tool Embeds */}
          <section className="bg-white rounded-lg p-8 mb-8 border border-gray-200">
            <h3 className="text-xl font-bold text-sfp-navy mb-4">
              Interactive Tools
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/au/tools/superannuation-calculator"
                className="flex items-center gap-3 p-4 bg-sfp-sky rounded-lg border border-gray-200 hover:border-sfp-navy transition-colors group"
              >
                <span className="text-2xl">📊</span>
                <div>
                  <span className="font-semibold text-sfp-navy group-hover:text-sfp-navy-dark block">
                    Superannuation Projection Calculator
                  </span>
                  <span className="text-sm text-sfp-slate">
                    Project your super balance at retirement
                  </span>
                </div>
              </Link>
              <Link
                href="/tools/gold-roi-calculator"
                className="flex items-center gap-3 p-4 bg-sfp-sky rounded-lg border border-gray-200 hover:border-sfp-navy transition-colors group"
              >
                <span className="text-2xl">🥇</span>
                <div>
                  <span className="font-semibold text-sfp-navy group-hover:text-sfp-navy-dark block">
                    Gold ROI Calculator
                  </span>
                  <span className="text-sm text-sfp-slate">
                    Calculate potential returns on gold investments
                  </span>
                </div>
              </Link>
              <Link
                href="/au/tools/au-mortgage-calculator"
                className="flex items-center gap-3 p-4 bg-sfp-sky rounded-lg border border-gray-200 hover:border-sfp-navy transition-colors group"
              >
                <span className="text-2xl">🏠</span>
                <div>
                  <span className="font-semibold text-sfp-navy group-hover:text-sfp-navy-dark block">
                    AU Mortgage Calculator
                  </span>
                  <span className="text-sm text-sfp-slate">
                    Model repayments on Australian home loans
                  </span>
                </div>
              </Link>
            </div>
          </section>

          {/* Footer CTA */}
          <section className="bg-white rounded-lg p-8 border border-gray-200 text-center">
            <h3 className="text-xl font-bold text-sfp-navy mb-4">
              Ready to Optimise Your Super?
            </h3>
            <p className="text-sfp-slate mb-6">
              Review fund performance, consolidate accounts, and increase contributions to accelerate your retirement savings.
            </p>
            <button className="bg-sfp-gold hover:bg-sfp-gold-dark text-white font-bold py-3 px-8 rounded-lg transition-colors">
              Explore Superannuation Options
            </button>
          </section>

          {/* ASIC Disclaimer */}
          <div className="mt-8 p-6 bg-amber-50 border-l-4 border-sfp-gold rounded">
            <p className="text-xs text-sfp-slate">
              <strong>ASIC General Advice Warning:</strong> This information is general in nature and does not constitute personal financial advice. Your personal circumstances, investment objectives, and risk tolerance vary. Before making any superannuation decisions, consider seeking advice from a licensed financial adviser. Past performance is not a reliable indicator of future results.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
