// app/(marketing)/ca/housing/page.tsx
import { Metadata } from "next";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { AnswerBlock } from "@/components/ui/answer-block";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Canadian Housing Guide 2026 | Mortgages, FHSA & Home Buying",
    description:
      "Complete guide to Canadian housing. Learn about mortgages, First Home Savings Accounts (FHSA), down payment strategies, and home buying in Canada. Expert reviews and comparisons.",
    openGraph: {
      title: "Canadian Housing Guide 2026 | Mortgages, FHSA & Home Buying",
      description:
        "Navigate Canadian home buying with expert mortgage guides, FHSA strategies, and lender comparisons. Learn down payment assistance and CMHC insurance requirements.",
      type: "article",
      locale: "en_CA",
    },
    alternates: {
      canonical: "https://smartfinpro.com/ca/housing",
      languages: {
        "en-US": "https://smartfinpro.com/personal-finance",
        "en-GB": "https://smartfinpro.com/uk/personal-finance",
        "en-AU": "https://smartfinpro.com/au/personal-finance",
        "en-CA": "https://smartfinpro.com/ca/housing",
      },
    },
  };
}

export default async function HousingPillarPage() {
  return (
    <div className="min-h-screen bg-sfp-gray">
      <body className="silo-ca">
        {/* Hero Section */}
        <section className="relative bg-white border-b border-gray-200">
          <div className="light-mesh" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="kicker text-sfp-navy mb-4">
              Canadian Housing & Mortgages
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-sfp-ink mb-6">
              Canadian Housing Guide 2026
            </h1>
            <p className="text-xl text-sfp-slate max-w-3xl mb-8">
              Master Canadian home buying with FHSA strategies, mortgage comparisons, and expert guidance on down payments, CMHC insurance, and property financing.
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
            question="What is the FHSA and how does it help first-time home buyers?"
            answer="The First Home Savings Account (FHSA) is a registered account that lets first-time home buyers contribute up to $8,000 per year (2024) with tax deductions. You can accumulate funds tax-free and withdraw up to $40,000 tax-free for your first home purchase, making it a powerful tool for down payment savings."
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
                <a href="#canadian-housing-market" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Canadian Housing Market Overview
                </a>
              </li>
              <li>
                <a href="#fhsa-first-home-savings" className="text-sfp-navy hover:text-sfp-navy-dark">
                  FHSA Strategy for First-Time Buyers
                </a>
              </li>
              <li>
                <a href="#mortgage-basics" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Canadian Mortgage Basics
                </a>
              </li>
              <li>
                <a href="#down-payment-strategies" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Down Payment & CMHC Insurance Guide
                </a>
              </li>
              <li>
                <a href="#mortgage-lenders" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Best Canadian Mortgage Lenders 2026
                </a>
              </li>
              <li>
                <a href="#mortgage-calculator" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Mortgage Calculator & Affordability Tool
                </a>
              </li>
              <li>
                <a href="#home-affordability" className="text-sfp-navy hover:text-sfp-navy-dark">
                  Home Affordability by Province
                </a>
              </li>
            </ul>

            <p className="text-center text-sfp-slate italic py-12">
              [Pillar content will be generated in next phase]
            </p>

            <div className="mt-16 p-8 bg-sfp-sky rounded-lg border-l-4 border-sfp-navy">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Key Canadian Housing Concepts
              </h3>
              <ul className="space-y-2 text-sfp-ink">
                <li><strong>FHSA:</strong> First Home Savings Account - up to $8,000/year contribution room with tax deduction</li>
                <li><strong>CMHC Insurance:</strong> Mortgage default insurance required for down payments under 20%</li>
                <li><strong>Mortgage Pre-Approval:</strong> Proof of borrowing capacity for home shopping</li>
                <li><strong>Stress Test:</strong> Rate qualification requirement on insured mortgages (5.25% minimum as of 2024)</li>
                <li><strong>Amortization:</strong> Typical 25-30 years in Canada (vs. 30 years in US)</li>
              </ul>
            </div>

            <div className="mt-16 p-8 bg-sfp-sky rounded-lg border-l-4 border-sfp-navy">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Related Articles
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/ca/housing/best-mortgage-rates-canada/"
                    className="text-sfp-navy hover:text-sfp-navy-dark font-semibold"
                  >
                    Best Mortgage Rates Canada 2026 →
                  </a>
                </li>
                <li>
                  <a
                    href="/ca/housing/first-time-home-buyer-grants-canada/"
                    className="text-sfp-navy hover:text-sfp-navy-dark font-semibold"
                  >
                    First-Time Home Buyer Grants & Programs in Canada →
                  </a>
                </li>
              </ul>
            </div>

            {/* Mortgage Affordability Calculator Embed */}
            <div className="mt-16 p-8 bg-white rounded-lg border-2 border-sfp-navy">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Interactive Tools
              </h3>
              <div className="space-y-4">
                <a
                  href="/ca/tools/ca-mortgage-affordability-calculator"
                  className="flex items-center gap-4 p-4 bg-sfp-sky rounded-lg hover:border-sfp-navy border border-gray-200 transition-colors group"
                >
                  <span className="text-3xl">🏠</span>
                  <div>
                    <span className="font-semibold text-sfp-navy group-hover:text-sfp-navy-dark block text-lg">
                      CA Mortgage Affordability Calculator
                    </span>
                    <span className="text-sfp-slate">
                      Find out how much home you can afford — GDS/TDS ratios, OSFI stress test, CMHC insurance, and first-time buyer incentives
                    </span>
                  </div>
                </a>
              </div>
            </div>

            <div className="mt-16 p-8 bg-amber-50 rounded-lg border-l-4 border-sfp-gold">
              <h3 className="text-2xl font-bold text-sfp-navy mb-4">
                Important: Canadian Mortgage Disclaimer
              </h3>
              <p className="text-sfp-ink mb-4">
                This content is for educational purposes only and does not constitute mortgage or legal advice. Housing market conditions, interest rates, and mortgage regulations vary by province and change frequently. Consult with a qualified mortgage broker, financial advisor, or real estate lawyer before making housing purchase decisions.
              </p>
              <p className="text-sfp-slate italic">
                CIRO compliant | Real estate investments carry risk, including loss of principal
              </p>
            </div>
          </div>
        </article>
      </body>
    </div>
  );
}
