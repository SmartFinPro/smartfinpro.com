// app/(marketing)/ca/tax-efficient-investing/page.tsx
import { Metadata } from "next";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { AnswerBlock } from "@/components/ui/answer-block";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Tax-Efficient Investing in Canada 2026 | TFSA, RRSP & FHSA Strategies",
    description:
      "Complete guide to tax-efficient investing in Canada. Learn TFSA, RRSP, FHSA, and RESP strategies to maximize retirement savings and minimize taxes. Expert reviews of Canadian investment platforms.",
    openGraph: {
      title: "Tax-Efficient Investing in Canada 2026 | TFSA, RRSP & FHSA Strategies",
      description:
        "Master Canadian tax-efficient investing with TFSA, RRSP, and FHSA accounts. Expert platform reviews and strategies to grow wealth with tax advantages.",
      type: "article",
      locale: "en_CA",
    },
    alternates: {
      canonical: "https://smartfinpro.com/ca/tax-efficient-investing",
      languages: {
        "en-US": "https://smartfinpro.com/personal-finance",
        "en-GB": "https://smartfinpro.com/uk/personal-finance",
        "en-AU": "https://smartfinpro.com/au/personal-finance",
        "en-CA": "https://smartfinpro.com/ca/tax-efficient-investing",
      },
    },
  };
}

export default async function TaxEfficientInvestingPillarPage() {
  return (
    <div className="min-h-screen bg-sfp-gray">
      <body className="silo-ca">
        {/* Hero Section */}
        <section className="relative bg-white border-b border-gray-200">
          <div className="light-mesh" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="kicker text-sfp-navy mb-4">
              Canadian Tax-Efficient Investing
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-sfp-ink mb-6">
              Tax-Efficient Investing in Canada 2026
            </h1>
            <p className="text-xl text-sfp-slate max-w-3xl mb-8">
              Maximize your wealth with TFSA, RRSP, FHSA, and RESP accounts. Expert strategies to grow your investments while minimizing Canadian income taxes.
            </p>
          </div>
        </section>

        {/* Affiliate Disclosure (Above the Fold) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <AffiliateDisclosure market="ca" position="top" />
        </div>

        {/* Quick Answer Block (GEO-optimized) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnswerBlock
            question="What is tax-efficient investing in Canada?"
            answer="Tax-efficient investing uses registered accounts like TFSAs (Tax-Free Savings Accounts), RRSPs (Registered Retirement Savings Plans), and FHSAs (First Home Savings Accounts) to minimize taxes on investment growth. These accounts allow your money to grow tax-free or tax-deferred, helping you keep more of your investment returns."
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
                <a href="#what-is-tax-efficient-investing" className="text-sfp-navy hover:text-sfp-navy-dark">
                  What is Tax-Efficient Investing?
                </a>
              </li>
              <li>
                <a href="#tfsa-guide" className="text-sfp-navy hover:text-sfp-navy-dark">
                  TFSA (Tax-Free Savings Account) Guide
                </a>
              </li>
              <li>
                <a href="#rrsp-strategy" className="text-sfp-navy hover:text-sfp-navy-dark">
                  RRSP Maximization Strategy
                </a>
              </li>
              <li>
                <a href="#fhsa-first-home" className="text-sfp-navy hover:text-sfp-navy-dark">
                  FHSA for First-Time Home Buyers
                </a>
              </li>
              <li>
                <a href="#resp-education" className="text-sfp-navy hover:text-sfp-navy-dark">
                  RESP for Education Planning
                </a>
              </li>
              <li>
                <a href="#best-platforms" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Best Canadian Investment Platforms 2026
                </a>
              </li>
              <li>
                <a href="#tax-savings-calculator" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Tax Savings Potential
                </a>
              </li>
            </ul>

            <div className="mt-16 p-8 bg-sfp-sky rounded-lg border-l-4 border-sfp-navy">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Key Canadian Tax Accounts
              </h3>
              <ul className="space-y-2 text-sfp-ink">
                <li><strong>TFSA:</strong> Contribute up to $7,000/year (2024), tax-free growth and withdrawals</li>
                <li><strong>RRSP:</strong> Deductible contributions, tax-deferred growth, useful for retirement planning</li>
                <li><strong>FHSA:</strong> Up to $8,000/year for first-time home buyers (launched 2023)</li>
                <li><strong>RESP:</strong> Save for education with Government grants (CESG up to 20%)</li>
              </ul>
            </div>

            <div className="mt-16 p-8 bg-sfp-sky rounded-lg border-l-4 border-sfp-navy">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Related Articles in This Silo
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/ca/tax-efficient-investing/tfsa-vs-rrsp"
                    className="text-sfp-navy hover:text-sfp-navy-dark font-semibold"
                  >
                    TFSA vs RRSP 2026 →
                  </a>
                </li>
                <li>
                  <a
                    href="/ca/tax-efficient-investing/fhsa-guide"
                    className="text-sfp-navy hover:text-sfp-navy-dark font-semibold"
                  >
                    FHSA Guide Canada 2026 →
                  </a>
                </li>
                <li>
                  <a
                    href="/ca/tax-efficient-investing/wealthsimple-vs-questrade"
                    className="text-sfp-navy hover:text-sfp-navy-dark font-semibold"
                  >
                    Wealthsimple vs Questrade 2026 →
                  </a>
                </li>
                <li>
                  <a
                    href="/ca/tax-efficient-investing/best-robo-advisors-canada"
                    className="text-sfp-navy hover:text-sfp-navy-dark font-semibold"
                  >
                    Best Robo-Advisors Canada 2026 →
                  </a>
                </li>
                <li>
                  <a
                    href="/ca/housing/first-time-home-buyer-grants-canada"
                    className="text-sfp-navy hover:text-sfp-navy-dark font-semibold"
                  >
                    First-Time Home Buyer Programs Canada →
                  </a>
                </li>
                <li>
                  <a
                    href="/ca/housing/best-mortgage-rates-canada"
                    className="text-sfp-navy hover:text-sfp-navy-dark font-semibold"
                  >
                    Best Mortgage Rates Canada 2026 →
                  </a>
                </li>
              </ul>
            </div>

            {/* Tool Embeds */}
            <div className="mt-16 p-8 bg-white rounded-lg border-2 border-sfp-navy">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Interactive Tools
              </h3>
              <div className="space-y-4">
                <a
                  href="/ca/tools/tfsa-rrsp-calculator"
                  className="flex items-center gap-4 p-4 bg-sfp-sky rounded-lg hover:border-sfp-navy border border-gray-200 transition-colors group"
                >
                  <span className="text-3xl">🧮</span>
                  <div>
                    <span className="font-semibold text-sfp-navy group-hover:text-sfp-navy-dark block text-lg">
                      TFSA/RRSP Room Calculator
                    </span>
                    <span className="text-sfp-slate">
                      Calculate your available contribution room and compare tax savings between TFSA and RRSP accounts
                    </span>
                  </div>
                </a>
                <a
                  href="/tools/broker-comparison"
                  className="flex items-center gap-4 p-4 bg-sfp-sky rounded-lg hover:border-sfp-navy border border-gray-200 transition-colors group"
                >
                  <span className="text-3xl">📊</span>
                  <div>
                    <span className="font-semibold text-sfp-navy group-hover:text-sfp-navy-dark block text-lg">
                      Broker Comparison Tool
                    </span>
                    <span className="text-sfp-slate">
                      Compare Canadian investment platforms side-by-side on fees, features, account types, and investment options
                    </span>
                  </div>
                </a>
              </div>
            </div>

            <div className="mt-16 p-8 bg-amber-50 rounded-lg border-l-4 border-sfp-gold">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Important: Canadian Financial Advice Disclaimer
              </h3>
              <p className="text-sfp-ink mb-4">
                This content is for educational purposes only and does not constitute personal financial advice. Tax laws in Canada change annually and vary by province. Consult with a qualified financial advisor or tax professional before making investment decisions.
              </p>
              <p className="text-sfp-slate italic">
                CIRO compliant | Investing involves risk, including loss of principal
              </p>
            </div>
          </div>
        </article>
      </body>
    </div>
  );
}
