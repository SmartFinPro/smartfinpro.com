// app/(marketing)/tools/gold-roi-calculator/page.tsx
import { Metadata } from 'next';
import { GoldROICalculator } from '@/components/tools/gold-roi-calculator';
import { AnswerBlock } from '@/components/ui/answer-block';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';

export const metadata: Metadata = {
  title: 'Gold ROI Calculator Australia 2026 | Investment Returns Analysis',
  description:
    'Calculate your gold investment returns with our free calculator. Project growth, compare against inflation and other assets, and analyse gold as a hedge against market volatility.',
  alternates: {
    canonical: 'https://smartfinpro.com/au/tools/gold-roi-calculator',
    languages: {
      'en-US': 'https://smartfinpro.com/tools/debt-payoff-calculator',
      'en-GB': 'https://smartfinpro.com/uk/tools/remortgage-calculator',
      'en-CA': 'https://smartfinpro.com/ca/tools/tfsa-rrsp-calculator',
      'en-AU': 'https://smartfinpro.com/au/tools/gold-roi-calculator',
    },
  },
  openGraph: {
    title: 'Gold ROI Calculator Australia 2026 | SmartFinPro',
    description:
      'Analyse your gold investment returns. See how gold performs against inflation and compare with other asset classes.',
    url: 'https://smartfinpro.com/au/tools/gold-roi-calculator',
    type: 'website',
  },
};

export default function GoldRoiCalculatorPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="relative py-20 px-6"
        style={{
          background: `linear-gradient(135deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Gold ROI Calculator
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Project your gold investment returns and analyse how physical gold performs as a hedge against inflation and market volatility in Australia.
          </p>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <AffiliateDisclosure market="au" position="top" />
      </div>

      {/* Answer Block */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <AnswerBlock
          question="Is gold a good investment in Australia?"
          answer="Gold offers portfolio diversification and inflation protection, but has no yield (dividends, interest). Our calculator compares gold returns against inflation, equities, and bonds to help you decide if gold fits your investment strategy."
        />
      </section>

      {/* Calculator */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <GoldROICalculator />
      </section>

      {/* Educational Content */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          <h2 style={{ color: 'var(--sfp-navy)' }}>How to Use This Gold ROI Calculator</h2>

          <p style={{ color: 'var(--sfp-ink)' }}>
            Our gold ROI calculator helps you project the value of your physical gold investment and analyse its performance over time:
          </p>

          <ol style={{ color: 'var(--sfp-ink)' }}>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Enter Your Purchase Details:</strong> Amount invested, purchase price per gram, and date of purchase
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Set Your Assumptions:</strong> Expected annual gold price growth (3-7%) and inflation rate (2-3%)
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Input Time Horizon:</strong> How many years you plan to hold the gold
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Review Results:</strong> See projected value, real (inflation-adjusted) returns, and comparison to alternatives
            </li>
          </ol>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Why Australians Invest in Gold</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>1. Portfolio Diversification</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Gold has a low correlation with stocks and bonds. When equities crash, gold often rises as investors seek safe-haven assets. A 5-10% gold allocation reduces overall portfolio volatility without sacrificing long-term returns.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>2. Inflation Hedge</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Over decades, gold generally keeps pace with inflation. During inflationary periods (like 2021-2023), gold outperforms cash savings. If inflation averages 3% and gold grows 4-5%, your real purchasing power increases.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>3. Currency Devaluation Protection</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Gold is globally traded in USD. When the Australian dollar weakens, gold in AUD terms becomes more expensive (and your holdings are worth more). Gold provides a natural hedge against currency risk.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>4. No Counterparty Risk</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Physical gold you own directly doesn't depend on any bank, company, or government. Unlike bonds (which depend on issuer creditworthiness), gold has intrinsic value recognised worldwide. During financial crises, this matters.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>5. Tax Efficiency (Capital Gains)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Gains on gold held over 12 months qualify for the 50% capital gains tax discount in Australia. If gold rises AUD $1,000, only $500 is counted as taxable income (assuming 12+ month holding period).
          </p>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Types of Gold Investments in Australia</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Physical Gold Bullion</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Gold bars, coins (Australian Nuggets, Sovereigns). Advantages: direct ownership, no counterparty risk. Disadvantages: storage costs, insurance, not easily divisible, spread between buy/sell prices.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Gold ETFs</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            ASX-listed funds (GOLD, GLD, GLDM) that track gold price. Advantages: low fees (0.17-0.40%), easy to buy/sell, no storage hassle. Disadvantages: not physical ownership, electronic counterparty risk.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Gold Mining Stocks</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Companies like Newcrest, Northern Star, Resolute. Advantages: leverage to gold price, potential dividends, no storage costs. Disadvantages: higher volatility, company-specific risk, not pure gold exposure.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Allocated Gold Accounts</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Purchase gold stored by Perth Mint or other custodians. Advantages: direct ownership, no tax on storage, flexible buying/selling. Disadvantages: custodial risk (though Perth Mint is government-backed), fees.
          </p>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Gold Price Drivers & Outlook</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Supply Factors</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>Mining production (relatively stable year-to-year)</li>
            <li>Recycled gold from jewellery and electronic waste</li>
            <li>Central bank buying/selling (recent surge in CB purchases)</li>
          </ul>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Demand Factors</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>Investment demand (varies with interest rates and uncertainty)</li>
            <li>Jewellery demand (stable, especially in Asia)</li>
            <li>Industrial demand (electronics, dentistry, etc.)</li>
          </ul>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Price Influence Factors</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li><strong style={{ color: 'var(--sfp-navy)' }}>Interest Rates:</strong> Higher rates reduce gold's appeal (gold doesn't yield interest); lower rates increase demand</li>
            <li><strong style={{ color: 'var(--sfp-navy)' }}>USD Strength:</strong> Strong USD makes gold expensive internationally; weak USD boosts gold demand</li>
            <li><strong style={{ color: 'var(--sfp-navy)' }}>Inflation Expectations:</strong> Rising inflation boosts gold demand as a real store of value</li>
            <li><strong style={{ color: 'var(--sfp-navy)' }}>Geopolitical Risk:</strong> Wars, political instability drive safe-haven demand</li>
            <li><strong style={{ color: 'var(--sfp-navy)' }}>Equity Market Volatility:</strong> Stock crashes often trigger gold rallies</li>
          </ul>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Gold vs Other Assets: Long-Term Performance</h2>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--sfp-navy)' }}>
                <th style={{ padding: '10px', textAlign: 'left', color: 'var(--sfp-navy)', fontWeight: 'bold' }}>Asset Class</th>
                <th style={{ padding: '10px', textAlign: 'left', color: 'var(--sfp-navy)', fontWeight: 'bold' }}>10-Year Avg Return</th>
                <th style={{ padding: '10px', textAlign: 'left', color: 'var(--sfp-navy)', fontWeight: 'bold' }}>Volatility</th>
                <th style={{ padding: '10px', textAlign: 'left', color: 'var(--sfp-navy)', fontWeight: 'bold' }}>Correlation to Equities</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Gold</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>6-8%</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>High (15-20%)</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Low (0.0 to 0.3)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Equities (ASX200)</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>9-11%</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>High (15-18%)</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>1.0 (by definition)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Bonds (AGBs)</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>3-4%</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Low (5-8%)</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>-0.2 to 0.0</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Cash (Term Deposits)</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>2-3%</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Very Low (0-1%)</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>0.0</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Inflation (CPI)</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>2-3%</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Moderate (2-4%)</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>N/A</td>
              </tr>
            </tbody>
          </table>

          <div
            className="rounded-xl p-6 my-8 border"
            style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
          >
            <h3 style={{ color: 'var(--sfp-navy)', marginTop: 0 }}>Buy Gold Online in Australia</h3>
            <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
              Perth Mint offers secure allocated gold accounts in Australia with competitive pricing, government backing, and no storage hassles. Perfect for both first-time and experienced gold investors.
            </p>
            <a
              href="/go/perth-mint"
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
              style={{ background: 'var(--sfp-gold)' }}
            >
              Open Your Gold Account Today →
            </a>
          </div>

          <h2 style={{ color: 'var(--sfp-navy)' }}>How Much Gold Should You Own?</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Conservative (Risk-Averse)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            <strong style={{ color: 'var(--sfp-navy)' }}>5-10% in gold.</strong> Provides inflation protection and diversification without reducing equity exposure too much. Suitable for retirees or those near retirement.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Moderate</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            <strong style={{ color: 'var(--sfp-navy)' }}>10-15% in gold.</strong> Balances diversification with growth. Typical for investors with 10-30 year horizons managing volatility concerns.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Aggressive (Growth-Focused)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            <strong style={{ color: 'var(--sfp-navy)' }}>0-5% in gold.</strong> Focus on equities for long-term growth. Gold allocation minimal since you can tolerate market volatility. Suitable for young investors with 30+ year horizons.
          </p>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Gold Investment Costs & Considerations</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Allocated Gold Account Costs</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>Typically 0.15-0.30% annually (Perth Mint averages 0.08%)</li>
            <li>No GST on gold (unlike jewellery at 10%)</li>
            <li>Buy/sell spread: 0.5-2% depending on provider</li>
          </ul>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Physical Gold Costs</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>Premiums over spot price: 5-20% for coins, 1-3% for bars</li>
            <li>Insurance: 0.2-0.5% annually</li>
            <li>Storage: AUD $200-500+ annually depending on quantity</li>
            <li>Sell spread: Expect 2-5% lower price than spot</li>
          </ul>

          <h3 style={{ color: 'var(--sfp-navy)' }}>ETF Costs</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>Annual management fees: 0.17-0.40%</li>
            <li>Brokerage: Minimal if using low-cost brokers</li>
            <li>No storage or insurance costs</li>
          </ul>

          <h2 style={{ color: 'var(--sfp-navy)' }}>FAQ: Gold ROI Calculator</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Should I buy gold at current prices?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Timing the gold market is difficult. If you believe in gold's long-term inflation-hedging role, buy consistent amounts over time (dollar-cost averaging) rather than trying to time the market. Start with 5-10% allocation.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Is allocated gold the same as owning physical gold?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Allocated gold is held in your name but stored by a custodian (Perth Mint). You have direct ownership but not physical possession. This is actually safer than storing gold yourself and costs less than private vaults.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>How accurate is this gold ROI calculator?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            This calculator uses standard return projections based on historical averages. Gold returns are volatile and unpredictable year-to-year. Results are illustrative — actual returns may differ significantly, especially over shorter time periods.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>What about gold mining stocks instead of physical gold?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Gold mining stocks have leveraged exposure to gold prices (stock moves 1.5-2x gold) but carry company-specific risk. Better for trading/speculation. Physical gold or ETFs are simpler for core portfolio allocation.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Tax on gold in Australia?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Capital gains tax applies to gold held 12+ months (50% discount). No GST on bullion. Allocated accounts don't trigger CGT until sold. Consult a tax accountant for your specific situation.
          </p>
        </div>
      </section>

      {/* Related Tools */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--sfp-navy)' }}>
          Related Financial Tools
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <a
            href="/au/tools/superannuation-calculator"
            className="block p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Superannuation Calculator
            </h3>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              Project your retirement savings from super contributions
            </p>
          </a>

          <a
            href="/au/personal-finance"
            className="block p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              AU Personal Finance Guide
            </h3>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              Strategies for investing, super, and wealth building in Australia
            </p>
          </a>

          <a
            href="/tools/loan-calculator"
            className="block p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Loan Calculator
            </h3>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              Calculate mortgage and personal loan payments
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}
