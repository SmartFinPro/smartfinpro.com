// app/(marketing)/au/savings/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/marketing/breadcrumb';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';
import { AnswerBlock } from '@/components/ui/answer-block';
import { marketConfig } from '@/lib/i18n/config';

export const metadata: Metadata = {
  title: 'Best Savings Accounts & Investment Vehicles Australia 2026 | SmartFinPro',
  description: 'Compare Australian savings accounts, high-interest accounts, and investment vehicles. Expert reviews to maximise your returns with ASIC-regulated providers.',
  alternates: {
    canonical: 'https://smartfinpro.com/au/savings',
    languages: {
      'en-AU': 'https://smartfinpro.com/au/savings',
      'en-US': 'https://smartfinpro.com/personal-finance',
      'en-GB': 'https://smartfinpro.com/uk/savings',
      'en-CA': 'https://smartfinpro.com/ca/personal-finance',
      'x-default': 'https://smartfinpro.com',
    },
  },
  openGraph: {
    title: 'Best Savings Accounts & Investment Vehicles Australia 2026 | SmartFinPro',
    description: 'Compare Australian savings accounts, high-interest accounts, and investment vehicles with expert reviews.',
    type: 'website',
    locale: 'en_AU',
  },
};

export default function SavingsPage() {
  return (
    <div className="silo-au min-h-screen bg-sfp-gray">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/au' },
              { label: 'Personal Finance', href: '/au/personal-finance' },
              { label: 'Savings & Investment Hub' },
            ]}
          />
          <h1 className="text-4xl font-bold text-sfp-navy mt-6 mb-4">
            Savings Accounts & Investment Vehicles Australia 2026
          </h1>
          <p className="text-lg text-sfp-slate mb-6">
            Find the best place for your savings and investments. Compare high-interest savings accounts, term deposits, investment platforms, and wealth-building vehicles across Australia's top providers.
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
              Build Wealth with Smart Savings
            </h2>
            <p className="text-sfp-slate leading-relaxed mb-4">
              Smart savings strategies start with the right accounts and investment vehicles. Australia offers a diverse range of savings products, from traditional bank accounts to sophisticated self-managed super funds (SMSFs) and investment platforms. Your choice depends on your goals, timeframe, and risk tolerance.
            </p>
            <p className="text-sfp-slate leading-relaxed">
              This hub guides you through available options, helping you optimise returns, minimise fees, and build long-term wealth.
            </p>
          </section>

          {/* Answer Blocks */}
          <div className="space-y-6 mb-8">
            <AnswerBlock
              question="Where should I keep my emergency savings?"
              answer="A high-interest savings account offers safety with competitive rates (currently 4–5% p.a.). Keep 3–6 months of living expenses accessible but separate from spending accounts."
            />
            <AnswerBlock
              question="How do I save for retirement besides superannuation?"
              answer="Consider personal investment platforms (ETFs, LICs), property investment, or managed funds. Combine with maximised super contributions for tax efficiency. Diversification reduces risk."
            />
            <AnswerBlock
              question="What are term deposits, and are they worth it?"
              answer="Term deposits offer fixed interest rates (currently 4–5%) with ASIC protection. Suitable for capital preservation. Rates may be lower than high-interest savings accounts over longer periods."
            />
          </div>

          {/* Savings Types Section */}
          <section className="bg-white rounded-lg p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-sfp-navy mb-6">
              Types of Savings & Investment Vehicles
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-sfp-gold pl-4">
                <h3 className="font-semibold text-sfp-navy mb-2">High-Interest Savings Accounts</h3>
                <p className="text-sfp-slate text-sm mb-2">
                  Earn competitive rates (4–5% p.a.) with instant access to funds. Best for emergency reserves and short-term goals.
                </p>
                <p className="text-xs text-sfp-slate">Pros: Accessible, ASIC protected; Cons: Lower rates in rising interest-rate environments</p>
              </div>
              <div className="border-l-4 border-sfp-gold pl-4">
                <h3 className="font-semibold text-sfp-navy mb-2">Term Deposits</h3>
                <p className="text-sfp-slate text-sm mb-2">
                  Fixed-rate deposits for locked periods (3 months–5 years). ASIC-protected up to A$250,000.
                </p>
                <p className="text-xs text-sfp-slate">Pros: Guaranteed returns; Cons: Funds locked away, penalties for early withdrawal</p>
              </div>
              <div className="border-l-4 border-sfp-gold pl-4">
                <h3 className="font-semibold text-sfp-navy mb-2">Investment Platforms & ETFs</h3>
                <p className="text-sfp-slate text-sm mb-2">
                  Low-cost platforms offering shares, ETFs, and managed funds. Ideal for medium-to-long-term wealth building.
                </p>
                <p className="text-xs text-sfp-slate">Pros: Tax-efficient, low fees (0.1–0.5%); Cons: Market volatility, requires discipline</p>
              </div>
              <div className="border-l-4 border-sfp-gold pl-4">
                <h3 className="font-semibold text-sfp-navy mb-2">Self-Managed Super Funds (SMSF)</h3>
                <p className="text-sfp-slate text-sm mb-2">
                  Control your super with tax-concessional returns. Requires compliance, but powerful for wealth accumulation.
                </p>
                <p className="text-xs text-sfp-slate">Pros: Tax efficiency (15% on earnings), control; Cons: Setup & compliance costs (~$1,500–$3,000 p.a.)</p>
              </div>
              <div className="border-l-4 border-sfp-gold pl-4">
                <h3 className="font-semibold text-sfp-navy mb-2">Managed Funds & LICs</h3>
                <p className="text-sfp-slate text-sm mb-2">
                  Professional fund managers select assets. Listed Investment Companies (LICs) offer diversification with potentially lower fees.
                </p>
                <p className="text-xs text-sfp-slate">Pros: Professional management, diversification; Cons: Higher fees (0.5–1.5% p.a.)</p>
              </div>
            </div>
          </section>

          {/* Strategy Tips Section */}
          <section className="bg-sfp-sky rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-sfp-navy mb-6">
              Savings Strategy Tips
            </h2>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <span className="text-sfp-gold font-bold flex-shrink-0">1.</span>
                <div>
                  <p className="font-semibold text-sfp-navy">Build an emergency fund first</p>
                  <p className="text-sm text-sfp-slate">3–6 months of living expenses in a high-interest account</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-sfp-gold font-bold flex-shrink-0">2.</span>
                <div>
                  <p className="font-semibold text-sfp-navy">Maximise superannuation contributions</p>
                  <p className="text-sm text-sfp-slate">Concessional tax treatment (15%) builds long-term wealth</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-sfp-gold font-bold flex-shrink-0">3.</span>
                <div>
                  <p className="font-semibold text-sfp-navy">Diversify across vehicle types</p>
                  <p className="text-sm text-sfp-slate">Combine super, investment accounts, and property for balanced risk</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-sfp-gold font-bold flex-shrink-0">4.</span>
                <div>
                  <p className="font-semibold text-sfp-navy">Keep fees low</p>
                  <p className="text-sm text-sfp-slate">Choose low-fee ETFs over high-fee managed funds when possible</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Internal Links Section */}
          <section className="bg-white rounded-lg p-8 mb-8 border border-gray-200">
            <h3 className="text-xl font-bold text-sfp-navy mb-4">
              Related Personal Finance Guides
            </h3>
            <div className="space-y-3">
              <Link
                href="/au/personal-finance"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> Personal Finance Hub
              </Link>
              <Link
                href="/au/superannuation"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> Superannuation & SMSF Strategies
              </Link>
              <Link
                href="/au/gold-investing"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> Gold & Precious Metals Investing
              </Link>
              <Link
                href="/au/tools/au-mortgage-calculator"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> Home Loan Calculator
              </Link>
            </div>
          </section>

          {/* Footer CTA */}
          <section className="bg-white rounded-lg p-8 border border-gray-200 text-center">
            <h3 className="text-xl font-bold text-sfp-navy mb-4">
              Ready to Optimise Your Savings?
            </h3>
            <p className="text-sfp-slate mb-6">
              Discover the best accounts, platforms, and strategies to grow your wealth faster.
            </p>
            <button className="bg-sfp-gold hover:bg-sfp-gold-dark text-white font-bold py-3 px-8 rounded-lg transition-colors">
              Compare Savings Products
            </button>
          </section>

          {/* ASIC Disclaimer */}
          <div className="mt-8 p-6 bg-amber-50 border-l-4 border-sfp-gold rounded">
            <p className="text-xs text-sfp-slate">
              <strong>ASIC General Advice Warning:</strong> This information is general in nature and does not constitute personal financial advice. Savings and investment choices depend on your personal circumstances, financial goals, and risk tolerance. Past performance is not a reliable indicator of future results. Before making any investment decision, consult a licensed financial adviser to discuss your specific situation.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
