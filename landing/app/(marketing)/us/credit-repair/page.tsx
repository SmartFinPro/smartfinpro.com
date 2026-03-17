// app/(marketing)/us/credit-repair/page.tsx
import { Metadata } from "next";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { AnswerBlock } from "@/components/ui/answer-block";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Credit Repair Guide 2026 | Fix Your Credit Score Fast",
    description:
      "Complete guide to credit repair in 2026. Learn how to dispute errors, improve your credit score, and choose the best credit repair companies. Expert reviews and step-by-step strategies.",
    openGraph: {
      title: "Credit Repair Guide 2026 | Fix Your Credit Score Fast",
      description:
        "Complete guide to credit repair. Expert reviews of the best credit repair companies and proven strategies to boost your credit score.",
      type: "article",
      locale: "en_US",
    },
  };
}

export default async function CreditRepairPillarPage() {
  return (
    <div className="min-h-screen bg-sfp-gray">
      <body className="silo-us">
        {/* Hero Section */}
        <section className="relative bg-white border-b border-gray-200">
          <div className="light-mesh" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="kicker text-sfp-navy mb-4">
              US Credit Repair Guide
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-sfp-ink mb-6">
              Credit Repair Guide 2026
            </h1>
            <p className="text-xl text-sfp-slate max-w-3xl mb-8">
              Fix credit report errors, remove negative items, and boost your
              credit score with proven strategies and expert guidance.
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
            question="What is credit repair?"
            answer="Credit repair is the process of identifying and disputing errors on your credit report to improve your credit score. It involves reviewing your credit reports from all three bureaus (Equifax, Experian, TransUnion), filing disputes for inaccurate items, and implementing strategies to rebuild positive credit history."
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
                <a href="#what-is-credit-repair" className="text-sfp-navy hover:text-sfp-navy-dark">
                  What is Credit Repair?
                </a>
              </li>
              <li>
                <a href="#best-companies" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Best Credit Repair Companies 2026
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sfp-navy hover:text-sfp-navy-dark">
                  How Credit Repair Works
                </a>
              </li>
              <li>
                <a href="#diy-vs-professional" className="text-sfp-navy hover:text-sfp-navy-dark">
                  DIY vs Professional Credit Repair
                </a>
              </li>
              <li>
                <a href="#cost" className="text-sfp-navy hover:text-sfp-navy-dark">
                  How Much Does Credit Repair Cost?
                </a>
              </li>
            </ul>

            {/* Interactive Tool Embed */}
            <div id="credit-score-tool" className="mt-12 p-8 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-3xl font-bold text-sfp-navy mb-4">
                Free Credit Score Simulator
              </h2>
              <p className="text-sfp-slate mb-6">
                See how different actions could affect your credit score over the next 3-12 months.
              </p>
              <a
                href="/tools/credit-score-simulator/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: 'var(--sfp-gold)' }}
              >
                Launch Credit Score Simulator →
              </a>
            </div>

            {/* Debt Payoff Calculator CTA */}
            <div className="mt-8 p-8 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Debt Payoff Calculator
              </h3>
              <p className="text-sfp-slate mb-6">
                Calculate exactly how long it will take to pay off your debt and how much interest you&apos;ll save with extra payments.
              </p>
              <a
                href="/tools/debt-payoff-calculator/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: 'var(--sfp-navy)' }}
              >
                Calculate Your Payoff Date →
              </a>
            </div>

            {/* Silo Links */}
            <div className="mt-16 p-8 bg-sfp-sky rounded-lg border-l-4 border-sfp-navy">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Credit Repair & Debt Relief Guides
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="/us/credit-repair/best-credit-repair-companies/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Best Credit Repair Companies 2026 →
                  </a>
                </li>
                <li>
                  <a href="/us/credit-repair/the-credit-people-review/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    The Credit People Review →
                  </a>
                </li>
                <li>
                  <a href="/us/credit-repair/lexington-law-review/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Lexington Law Review 2026 →
                  </a>
                </li>
                <li>
                  <a href="/us/credit-repair/how-to-fix-credit-score-fast/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    How to Fix Your Credit Score Fast →
                  </a>
                </li>
                <li>
                  <a href="/us/credit-repair/credit-repair-vs-debt-consolidation/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Credit Repair vs Debt Consolidation →
                  </a>
                </li>
                <li>
                  <a href="/us/debt-relief/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Complete Debt Relief Guide 2026 →
                  </a>
                </li>
                <li>
                  <a href="/us/debt-relief/national-debt-relief-review/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    National Debt Relief Review →
                  </a>
                </li>
                <li>
                  <a href="/us/debt-relief/debt-consolidation-loans-bad-credit/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Debt Consolidation Loans for Bad Credit →
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
