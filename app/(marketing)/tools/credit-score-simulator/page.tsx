// app/(marketing)/tools/credit-score-simulator/page.tsx
import { Metadata } from 'next';
import { CreditScoreSimulator } from '@/components/tools/credit-score-simulator';
import { AnswerBlock } from '@/components/ui/answer-block';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';

export const metadata: Metadata = {
  title: 'Credit Score Simulator 2026 | See How Actions Affect Your Score',
  description:
    'Simulate how different financial actions affect your credit score. Understand what helps and hurts your score, and see the impact of paying down debt, on-time payments, and credit inquiries.',
  alternates: {
    canonical: 'https://smartfinpro.com/tools/credit-score-simulator',
    languages: {
      'en-US': 'https://smartfinpro.com/tools/credit-score-simulator',
      'en-GB': 'https://smartfinpro.com/uk/tools/debt-payoff-calculator',
      'en-CA': 'https://smartfinpro.com/ca/tools/debt-payoff-calculator',
      'en-AU': 'https://smartfinpro.com/au/tools/debt-payoff-calculator',
    },
  },
  openGraph: {
    title: 'Credit Score Simulator 2026 | SmartFinPro',
    description:
      'See how your financial decisions impact your credit score in real-time with our free simulator tool.',
    url: 'https://smartfinpro.com/tools/credit-score-simulator',
    type: 'website',
  },
};

export default function CreditScoreSimulatorPage() {
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
            Credit Score Simulator
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Understand how your financial decisions affect your credit score. Simulate different scenarios and see what actions help or hurt your credit rating.
          </p>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <AffiliateDisclosure market="us" position="top" />
      </div>

      {/* Answer Block */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <AnswerBlock
          question="How can I improve my credit score?"
          answer="Your credit score is built on five factors: payment history (35%), credit utilization (30%), length of credit history (15%), credit mix (10%), and new inquiries (10%). Our simulator shows exactly how different actions impact your score."
        />
      </section>

      {/* Calculator */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <CreditScoreSimulator />
      </section>

      {/* Educational Content */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          <h2 style={{ color: 'var(--sfp-navy)' }}>How to Use This Credit Score Simulator</h2>

          <p style={{ color: 'var(--sfp-ink)' }}>
            Our credit score simulator helps you understand what drives your credit rating. See how different financial actions — from paying bills on time to reducing credit card debt — impact your score:
          </p>

          <ol style={{ color: 'var(--sfp-ink)' }}>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Enter Your Current Score:</strong> Start with your FICO score (typically 300-850). Not sure? Check for free at AnnualCreditReport.com
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Select a Financial Action:</strong> Choose what you want to simulate — paying off debt, getting a new credit card, missing a payment, etc.
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Enter Details:</strong> Provide amounts and details specific to your situation
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>See Your New Score:</strong> The simulator shows your projected score and explains the impact
            </li>
          </ol>

          <h2 style={{ color: 'var(--sfp-navy)' }}>The Five Factors of Your Credit Score</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>1. Payment History (35%)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            This is the biggest factor in your credit score. Making all payments on time builds credit, while even one 30-day late payment can drop your score by 100+ points. Late payments stay on your credit report for 7 years but have less impact over time.
          </p>
          <p style={{ color: 'var(--sfp-ink)' }}>
            <strong style={{ color: 'var(--sfp-navy)' }}>How to improve:</strong> Set up automatic bill payments for at least the minimum due. If you have late payments, start a streak of on-time payments now.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>2. Credit Utilization (30%)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            This measures how much of your available credit you're using. If you have $5,000 in credit limits and $4,500 in balances, your utilization is 90% — very high and bad for your score. Optimal utilization is under 30%.
          </p>
          <p style={{ color: 'var(--sfp-ink)' }}>
            <strong style={{ color: 'var(--sfp-navy)' }}>How to improve:</strong> Pay down credit card balances, especially high-utilization cards. If you just opened a new card, that additional credit limit immediately lowers your overall utilization.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>3. Length of Credit History (15%)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Credit scores reward longevity. The longer your oldest account has been open, the better for your score. Average age also matters — closing old accounts shortens your average age and can hurt.
          </p>
          <p style={{ color: 'var(--sfp-ink)' }}>
            <strong style={{ color: 'var(--sfp-navy)' }}>How to improve:</strong> Keep old credit cards open even if you're not using them (especially cards with no annual fee). Never close your oldest account.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>4. Credit Mix (10%)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Lenders like to see that you can handle different types of credit: revolving (credit cards, lines of credit) and installment (auto loans, mortgages, personal loans). A mix of both types shows you can manage different credit responsibilities.
          </p>
          <p style={{ color: 'var(--sfp-ink)' }}>
            <strong style={{ color: 'var(--sfp-navy)' }}>How to improve:</strong> If you only have credit cards, diversify with a small personal loan or auto loan. However, don't take on unnecessary debt just for this factor.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>5. New Inquiries & Accounts (10%)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Each time you apply for credit, a "hard inquiry" appears on your report and temporarily lowers your score. Multiple inquiries in a short period signal you're desperately seeking credit, which looks risky to lenders.
          </p>
          <p style={{ color: 'var(--sfp-ink)' }}>
            <strong style={{ color: 'var(--sfp-navy)' }}>How to improve:</strong> Avoid applying for multiple new credit accounts in a short period. Multiple auto or mortgage applications within 14 days count as one inquiry.
          </p>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Actions That Hurt Your Credit Score</h2>

          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Late Payments (30+ days):</strong> Drop 60-110 points immediately; impact lasts 7 years
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Collections or Charge-Off:</strong> Drop 130-200 points; most serious negative factor
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Bankruptcy:</strong> Drop 200-350 points; stays 7-10 years on your report
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>High Credit Utilization:</strong> Using more than 30% of available credit drops score 10-30 points
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Closing Old Accounts:</strong> Reduces average age and utilization benefit; drops 5-20 points
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Hard Inquiries:</strong> Each inquiry drops score 5-10 points for about 12 months
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Maxed-Out Cards:</strong> 100% utilization is very harmful; even one maxed card hurts overall score
            </li>
          </ul>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Actions That Help Your Credit Score</h2>

          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>On-Time Payments:</strong> Consistent on-time payments build positive history; most impactful factor
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Paying Down Debt:</strong> Reducing utilization to under 30% increases score 20-50+ points
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Paying Off Collections:</strong> Removes negative impact; settled collections still hurt but less than unpaid
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Becoming an Authorized User:</strong> If added to an account with perfect payment history, can gain 10-40 points
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Opening a New Card (long-term):</strong> Initial hard inquiry hurts, but new utilization benefit helps long-term
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Disputing Errors:</strong> Removing false negatives from your report can add 10-100+ points
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Diversifying Credit Mix:</strong> Adding installment loans to revolving credit can add 5-15 points
            </li>
          </ul>

          <div
            className="rounded-xl p-6 my-8 border"
            style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
          >
            <h3 style={{ color: 'var(--sfp-navy)', marginTop: 0 }}>Get Professional Credit Repair Help</h3>
            <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
              If you have serious credit damage (collections, bankruptcy, late payments), credit repair services can help dispute errors and negotiate with creditors. Some consumers see 50-100 point improvements within 3-6 months.
            </p>
            <a
              href="/go/the-credit-people"
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
              style={{ background: 'var(--sfp-gold)' }}
            >
              Get Free Credit Repair Consultation →
            </a>
          </div>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Credit Score Ranges & What They Mean</h2>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--sfp-navy)' }}>
                <th style={{ padding: '10px', textAlign: 'left', color: 'var(--sfp-navy)', fontWeight: 'bold' }}>Score Range</th>
                <th style={{ padding: '10px', textAlign: 'left', color: 'var(--sfp-navy)', fontWeight: 'bold' }}>Rating</th>
                <th style={{ padding: '10px', textAlign: 'left', color: 'var(--sfp-navy)', fontWeight: 'bold' }}>Loan Approval Likelihood</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>300–579</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Poor</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Unlikely; may need specialized lenders</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>580–669</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Fair</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Possible; expect higher interest rates</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>670–739</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Good</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Likely; qualifying rates available</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>740–799</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Very Good</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Very likely; competitive rates</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>800+</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Excellent</td>
                <td style={{ padding: '10px', color: 'var(--sfp-ink)' }}>Virtually guaranteed; best available rates</td>
              </tr>
            </tbody>
          </table>

          <h2 style={{ color: 'var(--sfp-navy)' }}>FAQ: Credit Score Simulator</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>How accurate is this credit score simulator?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            This simulator uses credit industry standard models based on published FICO factor weights. However, credit scoring is complex with non-linear adjustments. Your actual score change may vary by 5-20 points. Always check your real FICO score at MyFICO.com for accuracy.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>How long does it take to improve my credit score?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            It depends on your starting point. On-time payments start building immediately but take 3-6 months to show significant movement. Paying down debt shows impact within 1-2 months. Old negatives take 7 years to fall off, but their impact decreases after 2-3 years.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Will checking my credit score hurt it?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            No. Checking your own score is a "soft inquiry" and doesn't affect your score. Only hard inquiries (when you apply for credit) impact your score.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>How often should I check my credit score?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Check at least annually and before major financial decisions (buying a home, getting a car loan). You can check for free at AnnualCreditReport.com once per year. CreditKarma.com and other services offer free score monitoring year-round.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>What's the difference between FICO and Vantage Score?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            FICO is used by 90% of lenders; Vantage Score is used primarily by lenders and credit monitoring services. FICO scores range 300-850; Vantage Scores range 300-850. FICO is more widely recognized and used for credit decisions.
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
            href="/tools/debt-payoff-calculator"
            className="block p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Debt Payoff Calculator
            </h3>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              Create a realistic timeline to eliminate your debt
            </p>
          </a>

          <a
            href="/us/personal-finance"
            className="block p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Personal Finance Guide
            </h3>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              Complete strategies for credit, loans, and wealth building
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
              Compare personal loan payments and find the best rates
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}
