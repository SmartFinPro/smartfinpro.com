// app/(marketing)/uk/tools/remortgage-calculator/page.tsx
import { Metadata } from 'next';
import { RemortgageCalculator } from '@/components/tools/remortgage-calculator';
import { AnswerBlock } from '@/components/ui/answer-block';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';

export const metadata: Metadata = {
  title: 'Remortgage Calculator UK 2026 | Calculate Interest Savings',
  description:
    'Use our free remortgage calculator to see if remortgaging your home will save you money. Compare rates, calculate savings, and find the best remortgage deal for your situation.',
  alternates: {
    canonical: 'https://smartfinpro.com/uk/tools/remortgage-calculator',
    languages: {
      'en-US': 'https://smartfinpro.com/tools/debt-payoff-calculator',
      'en-GB': 'https://smartfinpro.com/uk/tools/remortgage-calculator',
      'en-CA': 'https://smartfinpro.com/ca/tools/debt-payoff-calculator',
      'en-AU': 'https://smartfinpro.com/au/tools/debt-payoff-calculator',
    },
  },
  openGraph: {
    title: 'Remortgage Calculator UK 2026 | SmartFinPro',
    description:
      'Calculate your remortgage savings with our free tool. See if switching to a better rate will save you money.',
    url: 'https://smartfinpro.com/uk/tools/remortgage-calculator',
    type: 'website',
  },
};

export default function RemortgageCalculatorPage() {
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
            Remortgage Calculator
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Discover how much you could save by remortgaging to a better rate. Compare your current mortgage with new remortgage deals and see your savings instantly.
          </p>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <AffiliateDisclosure market="uk" position="top" />
      </div>

      {/* Answer Block */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <AnswerBlock
          question="Should I remortgage my home?"
          answer="Remortgaging makes sense when you can access a significantly lower interest rate, even after accounting for fees. Our calculator shows your potential savings over time and helps you decide whether remortgaging is worth the upfront costs."
        />
      </section>

      {/* Calculator */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <RemortgageCalculator />
      </section>

      {/* Educational Content */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          <h2 style={{ color: 'var(--sfp-navy)' }}>How to Use This Remortgage Calculator</h2>

          <p style={{ color: 'var(--sfp-ink)' }}>
            Our remortgage calculator helps you evaluate whether switching to a new mortgage deal will save you money. Use it to compare your current rate with new lender offers:
          </p>

          <ol style={{ color: 'var(--sfp-ink)' }}>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Enter Your Current Mortgage Details:</strong> Input your outstanding balance, current interest rate, and remaining years on your term
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Add New Rate & Fees:</strong> Enter the new remortgage rate you've been offered, including any arrangement fees (typically £500–£3,000)
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Choose Your New Term:</strong> Decide how long you want the new mortgage to run (5-30 years)
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Review Your Savings:</strong> See your monthly payment change, total interest saved, and break-even point
            </li>
          </ol>

          <h2 style={{ color: 'var(--sfp-navy)' }}>When Is Remortgaging Worth It?</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>1. Your Fixed Rate Is About to Expire</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Most homeowners remortgage within 6 months of their fixed-rate ending. Your current lender may automatically move you to their "standard variable rate" (SVR), which is typically 2-3% higher. Shopping around is essential.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>2. Interest Rates Have Fallen Significantly</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            If rates have dropped 1% or more since you got your mortgage, remortgaging usually makes financial sense. Even a 0.5% reduction saves hundreds per year on a £200,000 mortgage.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>3. Your Credit Score Has Improved</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            If you've improved your credit since taking out your mortgage, you may now qualify for better rates. Lenders offer their best rates to customers with credit scores above 750.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>4. You Want to Borrow More (Equity Release)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            If your property has increased in value, remortgaging lets you release equity for home improvements, debt consolidation, or other uses. This is only worth it if you use the money productively.
          </p>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Understanding Remortgage Costs</h2>

          <p style={{ color: 'var(--sfp-ink)' }}>
            Remortgaging isn't free. Before switching, understand all the costs involved:
          </p>

          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Arrangement Fee:</strong> £500–£3,000 (sometimes higher) charged by the new lender
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Early Repayment Charge (ERC):</strong> Penalty from your current lender if you're still on their fixed rate (typically 1-5% of your balance)
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Legal Fees:</strong> £200–£500 for solicitor or conveyancer
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Valuation Fee:</strong> Some lenders charge £150–£400 to survey your property
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Survey Fee:</strong> Optional but recommended (£300–£800) to ensure property value
            </li>
          </ul>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Types of Remortgage Deals</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Fixed-Rate Mortgages</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Your interest rate stays the same for 2, 3, 5, or 10 years. Most popular option for stability and budget certainty. Current fixed rates typically range from 4-5% depending on LTV (loan-to-value).
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Variable-Rate Mortgages</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Your rate can change, moving with the Bank of England base rate. Tracker and discount mortgages typically offer lower rates but more risk.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Cashback Mortgages</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Some lenders offer 1-5% cashback to offset arrangement fees. Check the interest rate carefully — high cashback often comes with slightly higher rates.
          </p>

          <div
            className="rounded-xl p-6 my-8 border"
            style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
          >
            <h3 style={{ color: 'var(--sfp-navy)', marginTop: 0 }}>Find Your Best Remortgage Deal</h3>
            <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
              Specialist remortgage brokers search 1000s of deals to find your best rate. Many lenders offer exclusive rates through brokers, and there's no extra cost to you — the lender pays the broker's commission.
            </p>
            <a
              href="/go/habito"
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
              style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
            >
              Get Free Remortgage Quote →
            </a>
          </div>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Remortgage Timing & Strategy</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Plan Ahead (6 Months Before Term Expires)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Most mortgages let you apply for a remortgage deal 6 months before your current fixed rate ends. Starting early gives you time to compare options and lock in a rate before your term expires.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Avoid the SVR Trap</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Standard variable rates are the most expensive option — typically 2-3% above fixed rates. Never let your mortgage roll onto the SVR when a better deal exists.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Consider Extending Your Term</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            If rates are high, extending to a longer term (e.g., 30 years instead of 25) keeps monthly payments manageable. You'll pay more total interest but have lower payments during expensive times.
          </p>

          <h2 style={{ color: 'var(--sfp-navy)' }}>FAQ: Remortgage Calculator</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>How accurate is this remortgage calculator?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            This calculator uses standard amortisation formulas and is accurate for illustrative purposes. Actual monthly payments may vary slightly depending on your lender and exact terms. Always request a formal illustration before committing.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Can I remortgage while in a fixed-rate period?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Yes, but you'll pay an early repayment charge (ERC), typically 1-5% of your balance. This fee often outweighs the savings from a better rate unless you're remortgaging significantly lower.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Will remortgaging affect my credit score?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            A remortgage requires a hard credit check, which may temporarily lower your score by 5-10 points. However, the impact is minimal and recovers within weeks. Multiple applications for different lenders count as one search if done within 14 days.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>How long does remortgaging take?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Typically 4-8 weeks from application to completion. Start the process at least 6 weeks before your current term expires to avoid the SVR.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Can I get a remortgage with bad credit?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Most remortgages require credit scores above 650-700. If your score is lower, focus on improving it for 6-12 months before remortgaging. Checking your score with Experian or Equifax is free.
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
            href="/uk/tools/isa-tax-savings-calculator"
            className="block p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              ISA Tax Savings Calculator
            </h3>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              See how much you save with a Stocks & Shares ISA
            </p>
          </a>

          <a
            href="/uk/personal-finance"
            className="block p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              UK Personal Finance Guide
            </h3>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              Complete strategies for savings, mortgages, and investments
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
              Calculate personal loan payments and total interest
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}
