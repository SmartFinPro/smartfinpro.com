// app/(marketing)/au/tools/superannuation-calculator/page.tsx
import { Metadata } from 'next';
import { SuperannuationCalculator } from '@/components/tools/superannuation-calculator';
import { AnswerBlock } from '@/components/ui/answer-block';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';

export const metadata: Metadata = {
  title: 'Superannuation Calculator AU 2026 | Retirement Savings Projection',
  description:
    'Use our free superannuation calculator to project your retirement savings. See how contributions, returns, and time affect your super balance and retirement income.',
  alternates: {
    canonical: 'https://smartfinpro.com/au/tools/superannuation-calculator',
    languages: {
      'en-US': 'https://smartfinpro.com/tools/debt-payoff-calculator',
      'en-GB': 'https://smartfinpro.com/uk/tools/remortgage-calculator',
      'en-CA': 'https://smartfinpro.com/ca/tools/debt-payoff-calculator',
      'en-AU': 'https://smartfinpro.com/au/tools/superannuation-calculator',
    },
  },
  openGraph: {
    title: 'Superannuation Calculator AU 2026 | SmartFinPro',
    description:
      'Project your retirement savings with our free super calculator. See how contributions and investment returns build your nest egg.',
    url: 'https://smartfinpro.com/au/tools/superannuation-calculator',
    type: 'website',
  },
};

export default function SuperannuationCalculatorPage() {
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
            Superannuation Calculator
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Project your superannuation balance at retirement. See how employer contributions, salary sacrifice, investment returns, and fees impact your retirement income.
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
          question="How much super will I have at retirement?"
          answer="Your superannuation balance depends on your current balance, annual contributions, investment returns, and fees. Our calculator projects your retirement savings based on realistic assumptions about investment growth and inflation."
        />
      </section>

      {/* Calculator */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <SuperannuationCalculator />
      </section>

      {/* Educational Content */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          <h2 style={{ color: 'var(--sfp-navy)' }}>How to Use This Superannuation Calculator</h2>

          <p style={{ color: 'var(--sfp-ink)' }}>
            Our superannuation calculator helps you forecast your retirement savings. It factors in employer contributions, your salary sacrifice contributions, investment growth, and inflation:
          </p>

          <ol style={{ color: 'var(--sfp-ink)' }}>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Enter Your Current Super Balance:</strong> Find this on your latest super statement or login to your provider's portal
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Input Your Current Age & Retirement Age:</strong> Typically 67 for current workers, but you can retire from 60 if you meet requirements
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Add Your Annual Salary:</strong> This determines employer contributions (currently 11.5% of ordinary time earnings)
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Include Salary Sacrifice Contributions:</strong> Pre-tax contributions save up to 32% in taxes versus post-tax contributions
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Set Investment Return & Fees:</strong> Conservative (4-5%), Balanced (6-7%), Growth (7-8%) portfolios have different risk/return profiles
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Review Your Projected Balance:</strong> See your estimated super at retirement and withdrawal options available
            </li>
          </ol>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Understanding Superannuation Contributions</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Compulsory Employer Contributions (Super Guarantee)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Since 1 July 2025, employers must contribute 11.5% of ordinary time earnings into your super. This rate is legislated to increase to 12% in 2025-26. This is compulsory and separate from your salary — employers pay it directly to your super fund.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Salary Sacrifice Contributions</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Salary sacrifice lets you contribute part of your salary to super before tax. Since super contributions are taxed at only 15% (versus up to 47% income tax), you keep more of the money. Maximum annual non-concessional contributions are limited.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Personal Contributions (After-Tax)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            You can contribute your own money after tax, though this is less tax-efficient than salary sacrifice. Personal contributions don't receive employer matching in Australia, unlike some overseas retirement plans.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Co-contributions (Low-Income Earners)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            If you earn under AUD $58,445, the government may contribute dollar-for-dollar (up to a limit) for personal contributions you make. This effectively doubles your contribution power if eligible.
          </p>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Investment Options & Risk Profiles</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Capital Stable / Conservative (4-5% returns)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Heavy allocation to bonds and cash. Minimal volatility but low growth. Suitable if you're retiring within 5 years or cannot tolerate large portfolio swings.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Balanced / Moderate (6-7% returns)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Mix of shares (40-50%), bonds, and property. Moderate risk and return. Suitable for most workers aged 40-60 with a reasonable risk tolerance.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Growth (7-8% returns)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Heavy allocation to shares (80%+) and alternative assets. Higher volatility but stronger long-term growth. Suitable for younger workers (under 45) or those comfortable with market fluctuations.
          </p>

          <p style={{ color: 'var(--sfp-ink)' }}>
            <strong style={{ color: 'var(--sfp-navy)' }}>Important:</strong> Past performance doesn't guarantee future returns. Actual returns vary by year and market conditions.
          </p>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Maximising Your Super</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>1. Use Salary Sacrifice</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Contributing via salary sacrifice saves 32% in taxes compared to post-tax contributions. If you earn AUD $100,000 and salary sacrifice AUD $10,000 annually, you save AUD $3,200 in taxes.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>2. Review Your Investment Strategy</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Your risk tolerance should decrease as you approach retirement. Young workers (25-45) can afford growth portfolios. Mid-career (45-55) should consider balanced growth. Pre-retirement (55+) should shift toward conservative assets.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>3. Consolidate Multiple Super Accounts</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            If you've changed jobs, you may have multiple super accounts. Consolidating into one account reduces fees and simplifies management. Check for lost super at ASIC's MoneySmart website.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>4. Monitor Fees & Insurance</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Super fees (typically 0.5-1.5% annually) significantly impact long-term growth. A 1% fee difference costs tens of thousands over 30 years. Review your insurance (life, TPD, income protection) — you may have duplicate policies from multiple accounts.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>5. Claim the Tax Deduction</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Personal contributions (non-salary sacrifice) can be tax-deducted if you're not claiming the benefits as an employee. Claim on your tax return to recover the difference between 47% and 15% tax.
          </p>

          <div
            className="rounded-xl p-6 my-8 border"
            style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
          >
            <h3 style={{ color: 'var(--sfp-navy)', marginTop: 0 }}>Optimise Your Super Strategy</h3>
            <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
              Australian Super and other major providers offer free guidance on maximising your retirement savings. Work with a financial adviser to optimise your contributions, investment mix, and insurance within your super.
            </p>
            <a
              href="/go/australiansuper"
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
              style={{ background: 'var(--sfp-gold)' }}
            >
              Get Free Super Review →
            </a>
          </div>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Retirement Income & Access Rules</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Preservation Age & Retirement Age</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Most workers reach preservation age at 60. You can access super in limited circumstances (hardship, disability) from preservation age. Full access requires reaching your retirement age (currently 67) or later.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Pension vs Lump Sum</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            At retirement, you can take a lump sum, pension, or combination. Pensions provide regular income and tax benefits (no tax on earnings for over-60s). Lump sums provide immediate flexibility but require careful budgeting.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Minimum Pension Withdrawals</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Once you start a super pension, you must withdraw a minimum percentage annually (age-based). For example, at age 70 you must withdraw at least 7% annually. This ensures super funds don't grow indefinitely tax-free.
          </p>

          <h2 style={{ color: 'var(--sfp-navy)' }}>FAQ: Superannuation Calculator</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>How accurate is this superannuation calculator?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            This calculator uses standard retirement projection models with published assumptions for investment returns and inflation. Results are estimates and depend heavily on your actual investment performance. Consult a licensed financial adviser for personalised advice.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Can I access my super early?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Limited circumstances allow early access: severe financial hardship, permanent incapacity, and a few others. Generally, super is locked in until you reach preservation age (60) or retirement age (67+). First Home Super Saver Scheme allows limited withdrawals for home purchases.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Do I need to worry about super fees?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Absolutely. Over 30 years, a difference of 0.5% in annual fees can reduce your super balance by 15-20%. Compare your provider's fees (admin fee + investment fee + insurance fees). Many public sector super schemes have very low fees.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>What happens to my super when I change jobs?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Your super remains in your existing fund unless you choose to move it. You'll get a new employer account when you start a new job. Most people consolidate into one fund, but don't auto-consolidate without reviewing fees and performance first.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Is super income-tested in retirement?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Super pensions are not income-tested for Age Pension purposes (after reaching age 60), but lump sums and earnings are. Work with a financial planner to structure your retirement income tax-efficiently.
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
            href="/au/tools/au-mortgage-calculator"
            className="block p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Australian Mortgage Calculator
            </h3>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              Calculate home loan payments and total interest costs
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
              Complete strategies for savings, tax, and retirement planning
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
              Calculate personal loan payments across different terms
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}
