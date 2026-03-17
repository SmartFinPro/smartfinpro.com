import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Clock, Search, FileCheck, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Editorial Policy & Review Methodology | SmartFinPro',
  description:
    'Explore SmartFinPro\'s transparent review methodology, rating criteria, independence policy, and fact-checking process for financial product reviews.',
  alternates: {
    canonical: '/editorial-policy',
  },
};

export default function EditorialPolicyPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative py-20 sm:py-24 lg:py-32 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--sfp-navy) 0%, var(--sfp-navy-dark) 100%)' }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 50%, var(--sfp-gold) 0%, transparent 50%), radial-gradient(circle at 80% 80%, var(--sfp-green) 0%, transparent 50%)',
            }}
          />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Editorial Policy & Review Methodology
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl">
              Our commitment to transparency, independence, and rigorous evaluation standards that guide every SmartFinPro review.
            </p>
            <Link href="/about">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Learn About Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Review Process Overview */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-12" style={{ color: 'var(--sfp-navy)' }}>
              How We Review Products
            </h2>

            {/* 6-Step Process Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {[
                {
                  step: 1,
                  icon: Search,
                  title: 'Research & Eligibility',
                  description:
                    'We identify products meeting our quality threshold with demonstrated market viability. Products must be currently available, properly regulated, and serve our target markets. We assess whether a product fills a gap in our coverage or provides updated insights into an existing category.',
                },
                {
                  step: 2,
                  icon: FileCheck,
                  title: 'Feature & Specification Analysis',
                  description:
                    'Our team conducts hands-on product testing, benchmarks features against industry standards, and verifies all claims against documentation. We create detailed feature matrices comparing the product to competitors.',
                },
                {
                  step: 3,
                  icon: AlertCircle,
                  title: 'Fee & Cost Evaluation',
                  description:
                    'We perform detailed cost modeling across multiple use cases, analyzing hidden fees, tiered pricing, and total cost of ownership. We calculate real-world expense scenarios to illustrate true costs to users.',
                },
                {
                  step: 4,
                  icon: Eye,
                  title: 'Customer Support Assessment',
                  description:
                    'We test support responsiveness via email, chat, and phone during normal business hours. We document average response times and verify support quality claims from customer reviews and official documentation.',
                },
                {
                  step: 5,
                  icon: CheckCircle,
                  title: 'Security & Compliance Review',
                  description:
                    'We verify regulatory status (FCA, ASIC, CIRO, SEC), confirm data security certifications (SSL, encryption), and review insurance policies. Compliance violations are grounds for exclusion regardless of other merits.',
                },
                {
                  step: 6,
                  icon: Clock,
                  title: 'Scoring & Publication',
                  description:
                    'We assign weighted numerical ratings based on our transparent criteria, create comprehensive reviews with full methodology disclosure, and prepare reviews for publication with proper documentation.',
                },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.step}
                    className="p-8 rounded-lg border-2 bg-white"
                    style={{ borderColor: 'var(--sfp-gold)' }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-full text-white flex-shrink-0"
                        style={{ background: 'var(--sfp-navy)' }}
                      >
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold" style={{ color: 'var(--sfp-navy)' }}>
                          {item.title}
                        </h3>
                      </div>
                    </div>
                    <p style={{ color: 'var(--sfp-slate)' }}>{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Rating Criteria Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Rating Criteria & Weighting
            </h2>

            <p className="text-lg mb-12" style={{ color: 'var(--sfp-ink)' }}>
              SmartFinPro assigns numerical ratings (0–5 stars) based on these weighted criteria. The specific breakdown varies by product category, but follows this general framework:
            </p>

            {/* Criteria Grid */}
            <div className="space-y-6 mb-12">
              {[
                {
                  criterion: 'Features & Functionality',
                  weight: '30%',
                  description:
                    'Does the product deliver on its core promise? We evaluate feature completeness, usability, integration capabilities, and how well it solves the customer problem.',
                },
                {
                  criterion: 'Fees & Pricing',
                  weight: '25%',
                  description:
                    'Is the pricing competitive and transparent? We assess upfront costs, hidden fees, scalability pricing, and overall value for money compared to alternatives.',
                },
                {
                  criterion: 'Customer Support',
                  weight: '20%',
                  description:
                    'Can users get help when they need it? We evaluate support availability (24/7 vs. business hours), response times, and customer satisfaction indicators.',
                },
                {
                  criterion: 'Security & Compliance',
                  weight: '15%',
                  description:
                    'Is user data protected? We verify regulatory compliance, data encryption, security certifications, insurance coverage, and compliance with relevant laws.',
                },
                {
                  criterion: 'Ease of Use',
                  weight: '10%',
                  description:
                    'Is the product accessible to its intended audience? We assess user interface design, onboarding process, documentation quality, and learning curve.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-lg border-l-4 bg-white"
                  style={{
                    borderLeftColor: 'var(--sfp-gold)',
                    borderColor: '#e5e5e5',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold" style={{ color: 'var(--sfp-navy)' }}>
                      {item.criterion}
                    </h3>
                    <span
                      className="px-4 py-2 rounded-full font-bold text-white"
                      style={{ background: 'var(--sfp-green)' }}
                    >
                      {item.weight}
                    </span>
                  </div>
                  <p style={{ color: 'var(--sfp-slate)' }}>{item.description}</p>
                </div>
              ))}
            </div>

            {/* Methodology Note */}
            <div
              className="p-6 rounded-lg border-2 mb-12"
              style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
            >
              <p style={{ color: 'var(--sfp-ink)' }}>
                <strong>Category Variations:</strong> Some product categories may weight criteria differently. For example, security is weighted more heavily for cybersecurity products (35%) than for calculators (5%). Each review clearly states its specific weighting in the methodology section.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Independence Policy */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Independence Policy
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
                  Affiliate Relationships
                </h3>
                <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
                  SmartFinPro earns affiliate commissions when users complete qualifying actions (account opening, purchases, subscriptions). This revenue model enables us to provide free reviews while maintaining our editorial team.
                </p>
                <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
                  <strong>How we maintain independence:</strong>
                </p>
                <ul style={{ color: 'var(--sfp-ink)', paddingLeft: '1.5rem' }}>
                  <li className="mb-2">Commission amounts do not influence product selection or ratings</li>
                  <li className="mb-2">Products are reviewed on merit, not affiliate potential</li>
                  <li className="mb-2">We exclude products if they don't meet quality standards, regardless of commission size</li>
                  <li className="mb-2">Editorial team has no visibility into affiliate earnings during review process</li>
                  <li className="mb-2">We disclose all affiliate relationships transparently on every review</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
                  What We Do Not Accept
                </h3>
                <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
                  To maintain editorial integrity, SmartFinPro explicitly does not accept:
                </p>
                <ul style={{ color: 'var(--sfp-ink)', paddingLeft: '1.5rem' }}>
                  <li className="mb-2">Sponsored reviews or "promoted" content</li>
                  <li className="mb-2">Payment for positive reviews or higher ratings</li>
                  <li className="mb-2">Exclusion payments (payments to exclude competitors)</li>
                  <li className="mb-2">Branded content or advertorial partnerships</li>
                  <li className="mb-2">Equity stakes or ownership in reviewed companies</li>
                  <li className="mb-2">Free products in exchange for coverage (though we may request products for testing)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
                  Conflict of Interest Management
                </h3>
                <p style={{ color: 'var(--sfp-ink)' }}>
                  If a reviewer has a personal or financial relationship with a company (ownership, employment, consulting), they recuse themselves from the review. We document all conflicts of interest and disclose material conflicts to readers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Update Schedule & Maintenance */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Review Update Schedule
            </h2>

            <p className="text-lg mb-8" style={{ color: 'var(--sfp-ink)' }}>
              SmartFinPro maintains current reviews through systematic updates and breaking news coverage:
            </p>

            <div className="space-y-6">
              <div className="p-6 rounded-lg" style={{ background: 'var(--sfp-gray)', borderColor: '#e5e5e5', border: '1px solid' }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Quarterly Full Reviews
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  All major product reviews are re-evaluated at least quarterly. We refresh pricing data, verify feature claims, test support quality, and confirm regulatory status. Significant changes trigger updates.
                </p>
              </div>

              <div className="p-6 rounded-lg" style={{ background: 'var(--sfp-gray)', borderColor: '#e5e5e5', border: '1px solid' }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Monthly Spot Checks
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Between full reviews, we perform monthly spot checks to verify pricing accuracy, check for major feature launches, and monitor customer reviews for emerging issues.
                </p>
              </div>

              <div className="p-6 rounded-lg" style={{ background: 'var(--sfp-gray)', borderColor: '#e5e5e5', border: '1px solid' }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Breaking News Updates
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Regulatory changes, security breaches, major fee increases, or significant product changes trigger immediate reviews and updates. We flag breaking news prominently on affected reviews.
                </p>
              </div>

              <div className="p-6 rounded-lg" style={{ background: 'var(--sfp-gray)', borderColor: '#e5e5e5', border: '1px solid' }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Version Control & Transparency
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Every review displays its publish date and last update date. Major updates are documented in a changelog section showing what changed and why. Users can see exactly when information was last verified.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fact-Checking & Verification */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Fact-Checking & Verification Process
            </h2>

            <p className="text-lg mb-8" style={{ color: 'var(--sfp-ink)' }}>
              Every factual claim in a SmartFinPro review is verified through multiple sources before publication:
            </p>

            <div className="space-y-6">
              <div className="border-l-4 pl-6 py-4" style={{ borderLeftColor: 'var(--sfp-gold)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                  Primary Source Documentation
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  We review official documentation: terms of service, privacy policies, regulatory filings, press releases, and company websites. We quote directly from primary sources rather than other reviews.
                </p>
              </div>

              <div className="border-l-4 pl-6 py-4" style={{ borderLeftColor: 'var(--sfp-gold)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                  Direct Product Testing
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  We create test accounts and actively use products to verify features, test integrations, and confirm claims about functionality. We document test results with screenshots and data.
                </p>
              </div>

              <div className="border-l-4 pl-6 py-4" style={{ borderLeftColor: 'var(--sfp-gold)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                  Regulatory Verification
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  For regulated products, we verify status directly with regulators. We confirm FCA numbers, ASIC licenses, CIRO registration, and SEC filings. We do not rely on company claims alone.
                </p>
              </div>

              <div className="border-l-4 pl-6 py-4" style={{ borderLeftColor: 'var(--sfp-gold)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                  Expert Peer Review
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Before publication, reviews are reviewed by at least one other certified professional in the relevant field. This provides a second set of eyes on methodology and conclusions.
                </p>
              </div>

              <div className="border-l-4 pl-6 py-4" style={{ borderLeftColor: 'var(--sfp-gold)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                  Third-Party Verification
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  For subjective claims (customer satisfaction, support quality), we cross-reference independent sources: Trustpilot, SiteJabber, G2, Capterra, and regulatory complaint databases. We weight recent reviews more heavily.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regulatory Compliance */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Regulatory Compliance
            </h2>

            <p className="text-lg mb-8" style={{ color: 'var(--sfp-ink)' }}>
              SmartFinPro operates under the regulatory requirements of the jurisdictions we serve:
            </p>

            <div className="space-y-8">
              {[
                {
                  jurisdiction: 'United States (FTC)',
                  rules: 'FTC Act Section 5 (unfair/deceptive practices), Endorsements Guides (16 CFR § 255)',
                  compliance: [
                    'All affiliate relationships disclosed clearly and conspicuously',
                    'Endorsements reflect genuine opinions and experiences',
                    'Material connections disclosed (including affiliate commissions)',
                    'No false or misleading claims about product capabilities',
                  ],
                },
                {
                  jurisdiction: 'United Kingdom (FCA)',
                  rules: 'Financial Services and Markets Act, ICOBS (Conduct of Business Rules)',
                  compliance: [
                    'FCA-regulated financial advice clearly labeled',
                    'Non-regulated reviews disclaim lack of FCA authorization',
                    'Compliance warnings on investment product reviews',
                    'Affiliate relationships disclosed on financial product reviews',
                  ],
                },
                {
                  jurisdiction: 'Australia (ASIC)',
                  rules: 'Corporations Act 2001, ASIC Regulatory Guide 181',
                  compliance: [
                    'Australian Financial Services Licensee status disclosed',
                    'General advice warnings on financial products',
                    'No personal financial advice without authorization',
                    'Affiliate disclosures on financial product reviews',
                  ],
                },
                {
                  jurisdiction: 'Canada (CIRO & OSC)',
                  rules: 'Securities Act, CIRO Rules, Provincial Securities Laws',
                  compliance: [
                    'Investment product reviews include regulatory disclaimers',
                    'No unauthorized investment advice',
                    'Affiliate relationships disclosed',
                    'Compliance with provincial securities requirements',
                  ],
                },
              ].map((item, idx) => (
                <div key={idx}>
                  <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                    {item.jurisdiction}
                  </h3>
                  <p style={{ color: 'var(--sfp-slate)', marginBottom: '0.5rem' }}>
                    <strong>Key Rules:</strong> {item.rules}
                  </p>
                  <p style={{ color: 'var(--sfp-slate)', marginBottom: '0.5rem' }}>
                    <strong>Our Compliance:</strong>
                  </p>
                  <ul style={{ color: 'var(--sfp-slate)', paddingLeft: '1.5rem' }}>
                    {item.compliance.map((comp, idx2) => (
                      <li key={idx2} className="mb-2">
                        {comp}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Affiliate Disclosure Details */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Affiliate Disclosure Details
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
                  Where We Disclose Affiliate Relationships
                </h3>
                <ul style={{ color: 'var(--sfp-ink)', paddingLeft: '1.5rem' }}>
                  <li className="mb-2">Top of every review (above the first paragraph)</li>
                  <li className="mb-2">Bottom of every review (below the conclusion)</li>
                  <li className="mb-2">On every affiliate link (clearly marked "Go to..." with disclosure)</li>
                  <li className="mb-2">In comparison tables and sidebar recommendations</li>
                  <li className="mb-2">In our /affiliate-disclosure page with full disclosure statement</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
                  What Affiliate Links Mean
                </h3>
                <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
                  When you click an affiliate link and complete a qualifying action (opening an account, making a purchase), SmartFinPro earns a commission from the partner company. This occurs at no additional cost to you—your pricing and terms are identical whether you click our affiliate link or go directly to the company.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
                  Commission Structure
                </h3>
                <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
                  Commission amounts vary by partner and product type:
                </p>
                <ul style={{ color: 'var(--sfp-ink)', paddingLeft: '1.5rem' }}>
                  <li className="mb-2">Brokerage accounts: typically 0.5–3% of account funding</li>
                  <li className="mb-2">Credit card reviews: typically $25–$150 per approved application</li>
                  <li className="mb-2">Software/tools: typically $15–$500 per qualified referral</li>
                  <li className="mb-2">Loans: typically 1–5% of loan amount</li>
                </ul>
                <p style={{ color: 'var(--sfp-slate)', marginTop: '1rem', fontStyle: 'italic' }}>
                  These ranges are illustrative. Specific commission amounts vary by partner agreement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corrections Policy */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Corrections & Amendments Policy
            </h2>

            <p className="text-lg mb-8" style={{ color: 'var(--sfp-ink)' }}>
              When we publish information that is inaccurate, we take swift corrective action:
            </p>

            <div className="space-y-6">
              <div className="p-6 rounded-lg" style={{ background: 'var(--sfp-gray)', borderColor: '#e5e5e5', border: '1px solid' }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Minor Corrections
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Typographical errors, outdated pricing, or feature updates are corrected silently with a small "[Updated YYYY-MM-DD]" note. Readers who view the updated page see the accurate information.
                </p>
              </div>

              <div className="p-6 rounded-lg" style={{ background: 'var(--sfp-gray)', borderColor: '#e5e5e5', border: '1px solid' }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Material Corrections
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Factual errors affecting ratings or recommendations are corrected with a prominent "Correction [Date]" notice at the top of the review. We clearly explain what was wrong and what the correct information is.
                </p>
              </div>

              <div className="p-6 rounded-lg" style={{ background: 'var(--sfp-gray)', borderColor: '#e5e5e5', border: '1px solid' }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Rating Changes
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  If a correction changes a product's rating, we publish a revised review explaining the change. We keep previous versions available for audit purposes and note the change date prominently.
                </p>
              </div>

              <div className="p-6 rounded-lg" style={{ background: 'var(--sfp-gray)', borderColor: '#e5e5e5', border: '1px solid' }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  How to Report Errors
                </h3>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  If you find an error in any review, please email us at{' '}
                  <a href="mailto:editorial@smartfinpro.com" style={{ color: 'var(--sfp-navy)', fontWeight: '500' }}>
                    editorial@smartfinpro.com
                  </a>{' '}
                  with:
                </p>
                <ul style={{ color: 'var(--sfp-slate)', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li className="mb-2">The review URL</li>
                  <li className="mb-2">The specific error</li>
                  <li className="mb-2">Correct information with sources</li>
                </ul>
                <p style={{ color: 'var(--sfp-slate)', marginTop: '0.5rem' }}>
                  We review all error reports within 24 hours and publish corrections promptly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: 'var(--sfp-navy)' }}>
              Questions About Our Methodology?
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--sfp-slate)' }}>
              We're committed to transparency. Contact our editorial team with any questions about our review process, methodology, or editorial standards.
            </p>
            <a href="mailto:editorial@smartfinpro.com">
              <Button
                size="lg"
                style={{
                  background: 'var(--sfp-gold)',
                  color: 'white',
                }}
                className="hover:opacity-90"
              >
                Contact Editorial Team
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Editorial Policy & Review Methodology',
            url: 'https://smartfinpro.com/editorial-policy',
            description:
              'SmartFinPro\'s transparent review methodology, rating criteria, independence policy, and fact-checking process.',
            author: {
              '@type': 'Organization',
              name: 'SmartFinPro',
              url: 'https://smartfinpro.com',
            },
            datePublished: '2024-01-01',
            dateModified: new Date().toISOString().split('T')[0],
          }),
        }}
      />
    </main>
  );
}
