// app/(marketing)/us/credit-score/page.tsx
import { Metadata } from "next";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { AnswerBlock } from "@/components/ui/answer-block";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Credit Score Guide 2026 | Improve & Monitor Your Credit",
    description:
      "Complete guide to understanding and improving your credit score. Learn credit score ranges, monitoring tools, and strategies to build excellent credit. Expert reviews and free tools.",
    openGraph: {
      title: "Credit Score Guide 2026 | Improve & Monitor Your Credit",
      description:
        "Master your credit score with expert guides on monitoring, factors that affect your score, and proven strategies to improve credit health.",
      type: "article",
      locale: "en_US",
    },
  };
}

export default async function CreditScorePillarPage() {
  return (
    <div className="min-h-screen bg-sfp-gray">
      <body className="silo-us">
        {/* Hero Section */}
        <section className="relative bg-white border-b border-gray-200">
          <div className="light-mesh" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="kicker text-sfp-navy mb-4">
              US Credit Score Guide
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-sfp-ink mb-6">
              Credit Score Guide 2026
            </h1>
            <p className="text-xl text-sfp-slate max-w-3xl mb-8">
              Understand credit scores, learn what factors affect your rating, and discover proven strategies to improve and maintain excellent credit health.
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
            question="What is a credit score?"
            answer="A credit score is a three-digit number (typically between 300–850) that represents your creditworthiness based on your credit history. It's calculated from factors like payment history (35%), amounts owed (30%), length of credit history (15%), credit mix (10%), and new credit inquiries (10%). Lenders use it to determine loan eligibility and interest rates."
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
                <a href="#what-is-credit-score" className="text-sfp-navy hover:text-sfp-navy-dark">
                  What is a Credit Score?
                </a>
              </li>
              <li>
                <a href="#credit-score-ranges" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Credit Score Ranges & What They Mean
                </a>
              </li>
              <li>
                <a href="#factors-affecting-score" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Factors Affecting Your Credit Score
                </a>
              </li>
              <li>
                <a href="#monitoring-tools" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Best Credit Monitoring Services
                </a>
              </li>
              <li>
                <a href="#improve-credit-score" className="text-sfp-navy hover:text-sfp-navy-dark">
                  How to Improve Your Credit Score
                </a>
              </li>
            </ul>

            {/* Interactive Tools */}
            <div id="credit-score-tool" className="mt-12 p-8 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-3xl font-bold text-sfp-navy mb-4">
                Credit Score Simulator
              </h2>
              <p className="text-sfp-slate mb-6">
                See how different financial actions could affect your credit score over the next 3–12 months. Model the impact of paying down debt, opening new accounts, or disputing errors.
              </p>
              <a
                href="/tools/credit-score-simulator/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: 'var(--sfp-gold)' }}
              >
                Launch Credit Score Simulator →
              </a>
            </div>

            <div className="mt-8 p-8 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Credit Card Rewards Calculator
              </h3>
              <p className="text-sfp-slate mb-6">
                Compare rewards credit cards based on your spending habits. See which card maximizes your cashback, points, or miles earning potential.
              </p>
              <a
                href="/tools/credit-card-rewards-calculator/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: 'var(--sfp-navy)' }}
              >
                Open Rewards Calculator →
              </a>
            </div>

            {/* Silo Links */}
            <div className="mt-16 p-8 bg-sfp-sky rounded-lg border-l-4 border-sfp-navy">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Credit Score & Credit Repair Guides
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="/us/credit-score/free-credit-score-check/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Free Credit Score Check →
                  </a>
                </li>
                <li>
                  <a href="/us/credit-repair/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Complete Credit Repair Guide 2026 →
                  </a>
                </li>
                <li>
                  <a href="/us/credit-repair/how-to-fix-credit-score-fast/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    How to Fix Your Credit Score Fast →
                  </a>
                </li>
                <li>
                  <a href="/us/credit-repair/best-credit-repair-companies/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Best Credit Repair Companies 2026 →
                  </a>
                </li>
                <li>
                  <a href="/us/debt-relief/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    Complete Debt Relief Guide 2026 →
                  </a>
                </li>
                <li>
                  <a href="/us/credit-repair/the-credit-people-review/" className="text-sfp-navy hover:text-sfp-navy-dark font-semibold">
                    The Credit People Review →
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
