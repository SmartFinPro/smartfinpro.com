// app/(marketing)/au/gold-investing/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/marketing/breadcrumb';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';
import { AnswerBlock } from '@/components/ui/answer-block';
import { marketConfig } from '@/lib/i18n/config';

export const metadata: Metadata = {
  title: 'Gold Investing in Australia 2026 | Best Platforms & Brokers | SmartFinPro',
  description: 'Compare gold investment options in Australia. Expert reviews of ETFs, bullion dealers, CFD brokers, and self-managed funds for precious metals investing.',
  alternates: {
    canonical: 'https://smartfinpro.com/au/gold-investing',
    languages: {
      'en-AU': 'https://smartfinpro.com/au/gold-investing',
      'en-US': 'https://smartfinpro.com/trading',
      'en-GB': 'https://smartfinpro.com/uk/trading',
      'en-CA': 'https://smartfinpro.com/ca/trading',
      'x-default': 'https://smartfinpro.com',
    },
  },
  openGraph: {
    title: 'Gold Investing in Australia 2026 | Best Platforms & Brokers | SmartFinPro',
    description: 'Compare gold investment options in Australia. Expert reviews of ETFs, bullion dealers, CFD brokers, and self-managed funds.',
    type: 'website',
    locale: 'en_AU',
  },
};

export default function GoldInvestingPage() {
  return (
    <div className="silo-au min-h-screen bg-sfp-gray">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/au' },
              { label: 'Trading', href: '/au/trading' },
              { label: 'Gold Investing' },
            ]}
          />
          <h1 className="text-4xl font-bold text-sfp-navy mt-6 mb-4">
            Gold Investing in Australia 2026
          </h1>
          <p className="text-lg text-sfp-slate mb-6">
            Discover the best ways to invest in gold. Compare ETFs, physical bullion, CFD trading, and self-managed super funds (SMSF) options in Australia.
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
              Gold as a Diversification Asset
            </h2>
            <p className="text-sfp-slate leading-relaxed mb-4">
              Gold has served as a store of value for millennia. Modern investors favour gold to diversify portfolios, hedge inflation, and reduce overall portfolio volatility. Australia has several options for gold exposure, from low-cost ETFs to physical bullion.
            </p>
            <p className="text-sfp-slate leading-relaxed">
              This guide compares investment methods, costs, tax implications, and leading providers for gold investing in Australia.
            </p>
          </section>

          {/* Answer Blocks */}
          <div className="space-y-6 mb-8">
            <AnswerBlock
              question="What is the best way to invest in gold in Australia?"
              answer="Gold ETFs offer the lowest fees and highest liquidity. Physical bullion provides direct ownership but incurs storage costs. CFD trading offers leverage but increases risk. SMSF gold investments provide tax-efficient long-term wealth building."
            />
            <AnswerBlock
              question="Are gold ETFs better than physical gold?"
              answer="ETFs are cost-effective and tax-efficient for long-term investors. Physical gold suits those wanting tangible assets or large accumulations. Each has merits depending on your investment horizon and preferences."
            />
            <AnswerBlock
              question="What are the tax implications of gold investing?"
              answer="Capital gains tax applies to profits from selling gold. ETFs generate CGT events; physical gold does not until sold. Bullion held in SMSF gains concessional 15% tax treatment on earnings."
            />
          </div>

          {/* Investment Methods Section */}
          <section className="bg-white rounded-lg p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-sfp-navy mb-6">
              Gold Investment Methods
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-sfp-gold pl-4">
                <h3 className="font-semibold text-sfp-navy mb-2">ETFs & Managed Funds</h3>
                <p className="text-sfp-slate text-sm mb-2">
                  Low-cost exposure via ASX-listed ETFs. No storage required. Tax-efficient for long-term holdings.
                </p>
                <p className="text-xs text-sfp-slate">Typical fees: 0.20–0.40% p.a.</p>
              </div>
              <div className="border-l-4 border-sfp-gold pl-4">
                <h3 className="font-semibold text-sfp-navy mb-2">Physical Gold Bullion</h3>
                <p className="text-sfp-slate text-sm mb-2">
                  Coins, bars, or ingots held directly. Perth Mint and dealers offer certified bullion with markup of 5–10%.
                </p>
                <p className="text-xs text-sfp-slate">Typical costs: Storage ~0.5–1% p.a., insurance, dealer markup</p>
              </div>
              <div className="border-l-4 border-sfp-gold pl-4">
                <h3 className="font-semibold text-sfp-navy mb-2">CFD Trading</h3>
                <p className="text-sfp-slate text-sm mb-2">
                  Leverage-based speculation. Fast execution, tight spreads. High risk; suitable for experienced traders only.
                </p>
                <p className="text-xs text-sfp-slate">Risk level: High | Typical spreads: 0.5–2 pips</p>
              </div>
              <div className="border-l-4 border-sfp-gold pl-4">
                <h3 className="font-semibold text-sfp-navy mb-2">SMSF Bullion Holdings</h3>
                <p className="text-sfp-slate text-sm mb-2">
                  Gold held within a self-managed super fund gains tax-concessional treatment (15% tax).
                </p>
                <p className="text-xs text-sfp-slate">Benefit: Super contributions deductible; investment earnings taxed at 15%</p>
              </div>
            </div>
          </section>

          {/* Internal Links Section */}
          <section className="bg-sfp-sky rounded-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-sfp-navy mb-4">
              Explore More Trading & Investing
            </h3>
            <div className="space-y-3">
              <Link
                href="/au/trading"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> Trading Platforms Comparison
              </Link>
              <Link
                href="/au/forex"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> Forex Brokers Australia
              </Link>
              <Link
                href="/au/superannuation"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> Superannuation Funds & SMSF
              </Link>
              <Link
                href="/au/savings"
                className="flex items-center gap-2 text-sfp-navy hover:text-sfp-navy-dark font-medium"
              >
                <span>→</span> Savings & Investment Vehicles
              </Link>
            </div>
          </section>

          {/* Footer CTA */}
          <section className="bg-white rounded-lg p-8 border border-gray-200 text-center">
            <h3 className="text-xl font-bold text-sfp-navy mb-4">
              Start Gold Investing Today
            </h3>
            <p className="text-sfp-slate mb-6">
              Compare fees, platforms, and strategies to add gold to your investment portfolio with confidence.
            </p>
            <button className="bg-sfp-gold hover:bg-sfp-gold-dark text-white font-bold py-3 px-8 rounded-lg transition-colors">
              Compare Gold Investment Options
            </button>
          </section>

          {/* ASIC Disclaimer */}
          <div className="mt-8 p-6 bg-amber-50 border-l-4 border-sfp-gold rounded">
            <p className="text-xs text-sfp-slate">
              <strong>ASIC General Advice Warning:</strong> This information is general in nature and does not constitute personal financial advice. Gold investing carries risk. Before making any investment decision, consider your personal circumstances, investment objectives, and risk tolerance. Past performance is not a reliable indicator of future results. For personal advice, consult a licensed financial adviser.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
