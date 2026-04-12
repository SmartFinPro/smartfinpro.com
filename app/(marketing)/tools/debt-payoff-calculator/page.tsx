// app/(marketing)/tools/debt-payoff-calculator/page.tsx
import { Metadata } from 'next';
import { DebtPayoffCalculator } from '@/components/tools/debt-payoff-calculator';
import { AnswerBlock } from '@/components/ui/answer-block';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';

export const metadata: Metadata = {
  title: 'Debt Payoff Calculator 2026 | Free Debt Paydown Timeline Tool',
  description:
    'Calculate how long it will take to pay off your debt. Free debt payoff calculator shows payment schedules, total interest, and strategies to become debt-free faster.',
  // noindex: "Coming Soon" placeholder — remove once fully built
  robots: { index: false, follow: true },
  alternates: {
    canonical: 'https://smartfinpro.com/tools/debt-payoff-calculator',
    languages: {
      'en-US': 'https://smartfinpro.com/tools/debt-payoff-calculator',
      'en-GB': 'https://smartfinpro.com/tools/debt-payoff-calculator',
      'en-CA': 'https://smartfinpro.com/tools/debt-payoff-calculator',
      'en-AU': 'https://smartfinpro.com/tools/debt-payoff-calculator',
    },
  },
  openGraph: {
    title: 'Debt Payoff Calculator 2026 | SmartFinPro',
    description:
      'Calculate how long it will take to pay off your debt with our free tool. See payment schedules and interest savings.',
    url: 'https://smartfinpro.com/tools/debt-payoff-calculator',
    type: 'website',
  },
};

export default function DebtPayoffCalculatorPage() {
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
            Debt Payoff Calculator
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Calculate how long it will take to pay off your debt and discover strategies to become debt-free faster.
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
          question="How long will it take to pay off my debt?"
          answer="The time to pay off debt depends on your balance, interest rate, and monthly payment. Use our calculator to see your exact payoff timeline, total interest costs, and how increasing payments can save you money."
        />
      </section>

      {/* Calculator */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <DebtPayoffCalculator />
      </section>

      {/* Educational Content */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          <h2 style={{ color: 'var(--sfp-navy)' }}>How to Use This Debt Payoff Calculator</h2>

          <p style={{ color: 'var(--sfp-ink)' }}>
            Our debt payoff calculator helps you create a realistic plan to eliminate your debt. Here's how to use it:
          </p>

          <ol style={{ color: 'var(--sfp-ink)' }}>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Enter Your Total Debt Balance:</strong> Include all the debt you want to pay off (credit cards, personal loans, etc.)
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Input Your Interest Rate:</strong> Find this on your credit card statement or loan agreement (APR)
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Set Your Monthly Payment:</strong> Choose a payment amount you can afford consistently
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Review Your Payoff Timeline:</strong> See exactly when you'll be debt-free and how much interest you'll pay
            </li>
          </ol>

          <h2 style={{ color: 'var(--sfp-navy)' }}>Debt Payoff Strategies</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>1. Pay More Than the Minimum</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            The calculator shows how much interest you save by paying above the minimum. Even an extra $50/month can shave months or years off your payoff timeline.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>2. Avalanche Method (High Interest First)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Focus on debts with the highest interest rates first. This mathematically optimal approach saves the most money on interest.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>3. Snowball Method (Small Balance First)</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Pay off smallest debts first for psychological wins. While you might pay slightly more interest, the motivation from quick wins helps many people stick to their plan.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>4. Debt Consolidation</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            If you have high-interest debt (18%+), consider consolidating to a lower-rate personal loan (6-12%). This can save thousands in interest and simplify payments.
          </p>

          <h2 style={{ color: 'var(--sfp-navy)' }}>When to Consider Debt Relief</h2>

          <p style={{ color: 'var(--sfp-ink)' }}>
            If your calculator shows a payoff timeline longer than 5 years, or if minimum payments consume more than 30% of your income, professional debt relief may help:
          </p>

          <ul style={{ color: 'var(--sfp-ink)' }}>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Debt Consolidation Loans:</strong> Lower interest rate, single monthly payment
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Debt Management Plans:</strong> Negotiate lower rates with creditors through credit counseling
            </li>
            <li>
              <strong style={{ color: 'var(--sfp-navy)' }}>Debt Settlement:</strong> For severe situations where you can't afford minimum payments
            </li>
          </ul>

          <div
            className="rounded-xl p-6 my-8 border"
            style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
          >
            <h3 style={{ color: 'var(--sfp-navy)', marginTop: 0 }}>Get Professional Help</h3>
            <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
              If debt is overwhelming, accredited debt relief companies can negotiate with creditors on your behalf. Many people reduce their total debt by 30-50%.
            </p>
            <a
              href="/go/national-debt-relief"
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
              style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
            >
              Get Free Debt Relief Consultation →
            </a>
          </div>

          <h2 style={{ color: 'var(--sfp-navy)' }}>FAQ: Debt Payoff Calculator</h2>

          <h3 style={{ color: 'var(--sfp-navy)' }}>How accurate is this debt payoff calculator?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            The calculator uses standard amortization formulas and is highly accurate for fixed-rate debt. For variable-rate debt (like credit cards that change APR), results are estimates based on the current rate you enter.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Should I pay off debt or save money first?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Build a small emergency fund ($500-$1,000) first to avoid new debt from unexpected expenses. Then focus on paying off high-interest debt (18%+). Once that's clear, balance debt payoff with retirement savings.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>What happens if I miss a payment?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Missing payments adds late fees, increases your interest rate, and extends your payoff timeline. If you're struggling, contact your creditor immediately — many offer hardship programs.
          </p>

          <h3 style={{ color: 'var(--sfp-navy)' }}>Can I pay off debt early without penalty?</h3>
          <p style={{ color: 'var(--sfp-ink)' }}>
            Most credit cards and personal loans have no prepayment penalty. Some auto loans and mortgages do. Check your loan agreement or contact your lender to confirm.
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
            href="/tools/credit-score-simulator"
            className="block p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Credit Score Simulator
            </h3>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              See how paying off debt affects your credit score
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
              Compare personal loan options
            </p>
          </a>

          <a
            href="/us/debt-relief"
            className="block p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow bg-white"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Debt Relief Guide
            </h3>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              Learn about professional debt relief options
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}
