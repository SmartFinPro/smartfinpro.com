// app/(marketing)/ca/tools/tfsa-rrsp-calculator/page.tsx
import { Metadata } from 'next';
import { TfsaRrspCalculator } from '@/components/tools/tfsa-rrsp-calculator';
import { AnswerBlock } from '@/components/ui/answer-block';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';

export const metadata: Metadata = {
  title: 'TFSA vs RRSP Calculator Canada 2026 | Tax-Efficient Savings',
  description:
    'Compare TFSA and RRSP savings strategies with our free calculator. Determine which account structure maximises your after-tax wealth in Canada.',
  alternates: {
    canonical: 'https://smartfinpro.com/ca/tools/tfsa-rrsp-calculator',
    languages: {
      'en-US': 'https://smartfinpro.com/tools/debt-payoff-calculator',
      'en-GB': 'https://smartfinpro.com/uk/tools/remortgage-calculator',
      'en-CA': 'https://smartfinpro.com/ca/tools/tfsa-rrsp-calculator',
      'en-AU': 'https://smartfinpro.com/au/tools/superannuation-calculator',
    },
  },
  openGraph: {
    title: 'TFSA vs RRSP Calculator Canada 2026 | SmartFinPro',
    description:
      'Find the optimal TFSA and RRSP strategy for your situation. See which account structure maximises your wealth accumulation.',
    url: 'https://smartfinpro.com/ca/tools/tfsa-rrsp-calculator',
    type: 'website',
  },
};

export default function TfsaRrspCalculatorPage() {
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
            TFSA vs RRSP Calculator
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Compare TFSA and RRSP savings strategies. Discover which account type maximises your after-tax wealth and retirement income in Canada.
          </p>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <AffiliateDisclosure market="ca" position="top" />
      </div>

      {/* Answer Block */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <AnswerBlock
          question="Should I prioritise TFSA or RRSP?"
          answer="Both are valuable — the optimal strategy depends on your current income, future tax rate, and time horizon. Our calculator compares the after-tax results of different TFSA and RRSP contribution strategies."
        />
      </section>

      {/* Calculator */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <TfsaRrspCalculator />
      </section>

      {/* Educational Content */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          <h2 style={{ color: 'var(--sfp-navy)' }}>How to Use This TFSA vs RRSP Calculator</h2>

          <p style={{ color: 'var(--sfp-ink)' }}>
            Our TFSA vs RRSP calculator helps you determine the optimal strategy for maximising your savings. It factors in your income, tax rate, contribution amounts, and investment growth:
          </p>

          <ol style={{ color: 'var(--sfp-ink)' }}>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Enter Your Current Income & Tax Rate:</strong> Your combined federal and provincial tax rate determines how much RRSP contributions save
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Input Your Annual Contribution Capacity:</strong> Total amount you can afford to save annually
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Set Your Time Horizon:</strong> Years until retirement or when you'll need the money
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Estimate Expected Retirement Tax Rate:</strong> The marginal tax rate you expect in retirement
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Set Investment Return Rate:</strong> Conservative (4%), balanced (6%), or growth (7-8%)
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Review Results:</strong> See projected balances and after-tax outcomes for each strategy
            </li>
          </ol>

          <h2 style={{ color: 'var(--sfp-navy)' }}>TFSA (Tax-Free Savings Account) Explained</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>What Is a TFSA?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            The TFSA is a registered account where you can save any amount without paying income tax on growth or withdrawals. Introduced in 2009, it's a uniquely Canadian advantage for tax-efficient wealth building.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>2024-2025 TFSA Contribution Limits</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>2024 annual limit: CAD $7,000</li>
            <li>Unused contribution room carries forward indefinitely</li>
            <li>Withdrawals add back to your contribution limit the next year</li>
            <li>Lifetime room for those 18+ since 2009: CAD $95,000 (as of 2024)</li>
          </ul>

          <h3 style={{ color: 'var(--sfp-navy)' }}>TFSA Key Advantages</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>Tax-free growth on all investments (stocks, bonds, GICs)</li>
            <li>Tax-free withdrawals anytime without restrictions</li>
            <li>Withdrawals don't affect government benefits (GIS, CCB, etc.)</li>
            <li>No income splitting rules — can gift to spouse tax-free</li>
            <li>More flexible than RRSP — can withdraw whenever needed</li>
          </ul>

          <h3 style={{ color: 'var(--sfp-navy)' }}>TFSA Limitations</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>Contributions don't reduce your taxable income (no immediate tax refund)</li>
            <li>Excess contributions are penalised at 1% per month</li>
            <li>Non-residents can't contribute</li>
            <li>Over-contributions can happen if you don't track carefully</li>
          </ul>

          <h2 style={{ color: 'var(--sfp-navy)' }}>RRSP (Registered Retirement Savings Plan) Explained</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>What Is an RRSP?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            The RRSP is a registered savings account that provides an immediate tax deduction. Contributions reduce your taxable income, giving you a tax refund. Withdrawals in retirement are taxed as income, usually at a lower rate.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>2024-2025 RRSP Contribution Limits</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>18% of previous year's earned income, up to CAD $31,560 (2024)</li>
            <li>Unused contribution room carries forward indefinitely</li>
            <li>Spousal RRSPs allow income splitting in retirement</li>
            <li>Home Buyers' Plan allows up to CAD $35,000 withdrawal for first home</li>
            <li>Lifelong Learning Plan allows withdrawals for education (up to CAD $16,000)</li>
          </ul>

          <h3 style={{ color: 'var(--sfp-navy)' }}>RRSP Key Advantages</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>Immediate tax deduction — often get 30-50% tax refund on contributions</li>
            <li>Tax-deferred growth — no tax on growth until withdrawal</li>
            <li>Access Home Buyers' Plan for first-time home purchases</li>
            <li>Spousal RRSP for income splitting in retirement</li>
            <li>Tax refund can be reinvested immediately (compound growth advantage)</li>
          </ul>

          <h3 style={{ color: 'var(--sfp-navy)' }}>RRSP Limitations</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>Withdrawals are taxed as income (at highest marginal rate)</li>
            <li>Withdrawal restrictions — withholding tax (20-30%) applies</li>
            <li>Forced withdrawals through RRIF at age 71</li>
            <li>Withdrawals reduce government benefits (CCB, GIS)</li>
            <li>Less flexible than TFSA — harder to access early</li>
          </ul>

          <h2 style={{ color: 'var(--sfp-navy)' }}>TFSA vs RRSP: The Decision Framework</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Choose RRSP If:</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>You're in a high tax bracket (40%+) and expect lower tax in retirement</li>
            <li>You have a significant tax refund (use it to fund TFSA or invest more)</li>
            <li>You're a first-time home buyer (Home Buyers' Plan)</li>
            <li>You need immediate tax relief from high income</li>
            <li>You want to do income splitting with a spouse in retirement</li>
            <li>You expect your tax rate to drop significantly in retirement (likely if retiring early or with pension income)</li>
          </ul>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Choose TFSA If:</h3>
          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>You're in a lower tax bracket (under 30%) with low current tax deduction benefit</li>
            <li>You don't expect a significant drop in tax rates at retirement (government employee, etc.)</li>
            <li>You need flexibility to withdraw without tax consequences</li>
            <li>You want to avoid affecting government benefits (CCB, GIS)</li>
            <li>You're maxed out on RRSP contribution room but have more TFSA room</li>
            <li>You're under 18 or have low income with limited contribution room</li>
          </ul>

          <h2 style={{ color: 'var(--sfp-navy)' }}>The Optimal Strategy for Most Canadians</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Step 1: Maximise RRSP for Tax Refund</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Contribute to RRSP until you get a significant tax refund (typically CAD $5,000+ for middle-income earners). The refund is essentially "free" money from the government.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Step 2: Use Tax Refund to Fund TFSA</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Rather than spending your RRSP tax refund, immediately contribute it to your TFSA. This creates a tax-efficient combination: RRSP deduction plus TFSA growth.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Step 3: Max Out Both</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            If you have surplus income after these steps, max out both TFSA and RRSP. For high earners, this might mean CAD $38,500+ annually (RRSP + TFSA combined).
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Step 4: Use Spousal Strategy If Applicable</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            If your spouse has lower income, use a Spousal RRSP to split income in retirement. Contribute to their RRSP (you get the deduction) so that in retirement, they withdraw lower-taxed funds.
          </p>

          <div
            className="rounded-xl p-6 my-8 border"
            style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
          >
            <h3 style={{ color: 'var(--sfp-navy)', marginTop: 0 }}>Optimise Your Tax Strategy</h3>
            <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
              Wealthsimple and other Canadian investment platforms offer free TFSA and RRSP account opening with zero fees. Get expert guidance on your optimal account structure and investment allocation.
            </p>
            <a
              href="/go/wealthsimple"
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
              style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
            >
              Open Your TFSA & RRSP Today →
            </a>
          </div>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Investment Options in TFSA & RRSP</h2>

          <p style={{ color: 'var(--sfp-ink)' }}>
            Both TFSA and RRSP allow you to invest in:
          </p>

          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>ETFs and mutual funds (stocks, bonds, balanced)</li>
            <li>Individual stocks</li>
            <li>Bonds and GICs</li>
            <li>Savings accounts and money market funds</li>
            <li>Prohibited: Commodities like gold bullion, artwork, collectibles</li>
          </ul>

          <h2 style={{ color: 'var(--sfp-navy)' }}>FAQ: TFSA vs RRSP Calculator</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>What if my tax rate doesn't change in retirement?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            If your tax rate stays roughly the same, TFSA becomes more attractive because you get tax-free growth forever and no forced withdrawals. RRSP only defers tax, not avoids it. Government employees often fall into this category.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Can I have both TFSA and RRSP?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Yes! Most Canadians benefit from maximising both. They serve different purposes: RRSP defers tax and gives immediate refunds; TFSA provides tax-free growth and flexibility. The calculator shows the combined benefit.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>What happens to my TFSA if I leave Canada?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            You cannot contribute to a TFSA as a non-resident, but existing balances remain tax-free. Investment growth continues untaxed. Withdraw before leaving to avoid non-resident withholding taxes.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>How accurate is this calculator?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            This calculator uses standard tax assumptions and projection models. Provincial tax rates vary, and future tax law changes aren't predicted. Consult a Canadian tax accountant for personalised advice specific to your situation.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Should I withdraw from RRSP to pay off debt?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Generally no. RRSP withdrawals trigger withholding tax (30%+) plus income tax on withdrawal. It's usually better to take a low-interest loan and keep your RRSP growing tax-deferred. Exception: extremely high-interest debt (credit cards at 20%+).
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
            href="/ca/personal-finance"
            className="block p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Canadian Personal Finance Guide
            </h3>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              Complete strategies for savings, tax planning, and investing
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
              Compare personal loan and mortgage payments
            </p>
          </a>

          <a
            href="/tools/debt-payoff-calculator"
            className="block p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Debt Payoff Calculator
            </h3>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              Create a realistic timeline to become debt-free
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}
