// app/(marketing)/us/debt-relief/page.tsx
import { Metadata } from "next";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { AnswerBlock } from "@/components/ui/answer-block";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Debt Relief Guide 2026 | Best Debt Solutions & Programs",
    description:
      "Complete guide to debt relief in 2026. Compare debt consolidation, debt settlement, and bankruptcy alternatives. Expert reviews of top debt relief companies and strategies to eliminate debt.",
    openGraph: {
      title: "Debt Relief Guide 2026 | Best Debt Solutions & Programs",
      description:
        "Compare debt relief options, consolidation programs, and expert-reviewed debt relief companies. Find the best solution for your financial situation.",
      type: "article",
      locale: "en_US",
    },
  };
}

export default async function DebtReliefPillarPage() {
  return (
    <div className="min-h-screen bg-sfp-gray">
      <body className="silo-us">
        {/* Hero Section */}
        <section className="relative bg-white border-b border-gray-200">
          <div className="light-mesh" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="kicker text-sfp-navy mb-4">
              US Debt Relief Guide
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-sfp-ink mb-6">
              Debt Relief Guide 2026
            </h1>
            <p className="text-xl text-sfp-slate max-w-3xl mb-8">
              Explore debt consolidation, settlement programs, and relief strategies to eliminate debt faster. Expert-reviewed companies and solutions for every situation.
            </p>
          </div>
        </section>

        {/* Affiliate Disclosure (Above the Fold) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <AffiliateDisclosure market="us" position="top" />
        </div>

        {/* Quick Answer Block (GEO-optimized) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnswerBlock
            question="What is debt relief?"
            answer="Debt relief refers to the various options available to reduce, consolidate, or eliminate unsecured debt. Common strategies include debt consolidation loans, debt settlement programs, balance transfers, and debt management plans. The best option depends on your financial situation, total debt amount, and credit score."
          />
        </div>

        {/* Main Content */}
        <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-sfp-navy mt-12 mb-6">
              Table of Contents
            </h2>
            <ul className="list-disc pl-6 text-sfp-ink space-y-2">
              <li>
                <a href="#what-is-debt-relief" className="text-sfp-navy hover:text-sfp-navy-dark">
                  What is Debt Relief?
                </a>
              </li>
              <li>
                <a href="#debt-relief-options" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Types of Debt Relief Programs
                </a>
              </li>
              <li>
                <a href="#best-companies" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Best Debt Relief Companies 2026
                </a>
              </li>
              <li>
                <a href="#consolidation-vs-settlement" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Debt Consolidation vs Settlement
                </a>
              </li>
              <li>
                <a href="#how-to-choose" className="text-sfp-navy hover:text-sfp-navy-dark">
                  How to Choose a Debt Relief Program
                </a>
              </li>
            </ul>

            {/* Interactive Tools */}
            <div id="debt-payoff-tool" className="mt-12 p-8 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-3xl font-bold text-sfp-navy mb-4">
                Debt Payoff Calculator
              </h2>
              <p className="text-sfp-slate mb-6">
                Calculate exactly how long it will take to become debt-free and see how extra payments can save you thousands in interest.
              </p>
              <a
                href="/tools/debt-payoff-calculator/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: 'var(--sfp-gold)' }}
              >
                Launch Debt Payoff Calculator →
              </a>
            </div>

            <div className="mt-8 p-8 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Loan Calculator
              </h3>
              <p className="text-sfp-slate mb-6">
                Compare consolidation loan options by entering your loan amount, interest rate, and term. See monthly payments and total interest costs side by side.
              </p>
              <a
                href="/tools/loan-calculator/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: 'var(--sfp-navy)' }}
              >
                Open Loan Calculator →
              </a>
            </div>

            {/* Silo Links */}
            <div className="mt-16 p-8 bg-sfp-sky rounded-lg border-l-4 border-sfp-navy">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Debt Relief & Credit Repair Guides
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="/us/debt-relief/national-debt-relief-review/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    National Debt Relief Review 2026 →
                  </a>
                </li>
                <li>
                  <a href="/us/debt-relief/debt-consolidation-loans-bad-credit/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Debt Consolidation Loans for Bad Credit →
                  </a>
                </li>
                <li>
                  <a href="/us/credit-repair/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Complete Credit Repair Guide 2026 →
                  </a>
                </li>
                <li>
                  <a href="/us/credit-repair/best-credit-repair-companies/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Best Credit Repair Companies 2026 →
                  </a>
                </li>
                <li>
                  <a href="/us/credit-repair/credit-repair-vs-debt-consolidation/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Credit Repair vs Debt Consolidation →
                  </a>
                </li>
                <li>
                  <a href="/us/credit-score/free-credit-score-check/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Free Credit Score Check →
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </article>
      </body>
    </div>
  );
}
