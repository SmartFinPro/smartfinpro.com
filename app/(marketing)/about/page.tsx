// app/(marketing)/about/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2,
  Shield,
  Award,
  Mail,
} from 'lucide-react';
import { AuthorProfile } from '@/components/ui/author-profile';
import { authors } from '@/lib/authors';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About SmartFinPro | Expert Financial Guidance Since 2024',
  description:
    'Meet the expert team behind SmartFinPro. Learn our commitment to transparency, independence, and evidence-based financial reviews.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  const allAuthors = [
    authors['sarah-mitchell'],
    authors['james-thornton'],
    authors['elena-rodriguez'],
  ];

  return (
    <main className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
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

        <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1200px' }}>
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center mb-6 px-2 py-0.5 rounded"
              style={{ background: 'rgba(232,240,251,0.15)' }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                About SmartFinPro
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Expert Financial Reviews Built on Trust
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl">
              Since 2024, SmartFinPro has been the trusted voice for independent, evidence-based financial product reviews across 4 global markets.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="#methodology">
                <Button
                  variant="default"
                  size="lg"
                  style={{
                    background: 'var(--sfp-gold)',
                    color: 'white',
                  }}
                  className="hover:opacity-90"
                >
                  Our Methodology
                </Button>
              </Link>
              <Link href="/editorial-policy">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10"
                >
                  Editorial Standards
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-24 bg-white border-b border-[#E2E8F0]">
        <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1200px' }}>
          <div className="max-w-3xl mx-auto">
            <div
              className="inline-flex items-center mb-4 px-2 py-0.5 rounded"
              style={{ background: '#E8F0FB' }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#1B4F8C',
                }}
              >
                Our Mission
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Why We Exist
            </h2>
            <div className="prose prose-lg max-w-none" style={{ color: 'var(--sfp-ink)' }}>
              <p>
                SmartFinPro exists to empower financial professionals and consumers with honest, independent reviews of financial products and services. In a market saturated with biased recommendations and pay-to-play endorsements, we stand apart by maintaining strict editorial independence, rigorous fact-checking, and transparent methodologies.
              </p>
              <p>
                Our team of certified financial professionals—including CFP®, CFA®, and FCA-regulated advisers—evaluates products against standardized criteria, not affiliate commissions. We believe financial decisions deserve better than sales pitches. They deserve expert analysis backed by evidence, regulatory compliance, and real-world testing.
              </p>
            </div>

            {/* Mission Values Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div
                className="p-8 rounded-2xl border"
                style={{ background: 'var(--sfp-gray)', borderColor: '#E2E8F0' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Shield style={{ color: 'var(--sfp-navy)', width: '24px', height: '24px' }} />
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      color: '#555',
                    }}
                  >
                    Independence
                  </span>
                </div>
                <h3 className="font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Independence
                </h3>
                <p style={{ color: 'var(--sfp-slate)', fontSize: '0.95rem' }}>
                  We are not influenced by affiliate fees. Our reviews are driven by product quality and consumer benefit, not commission size.
                </p>
              </div>

              <div
                className="p-8 rounded-2xl border"
                style={{ background: 'var(--sfp-gray)', borderColor: '#E2E8F0' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Award style={{ color: 'var(--sfp-green)', width: '24px', height: '24px' }} />
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      color: '#555',
                    }}
                  >
                    Expertise
                  </span>
                </div>
                <h3 className="font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Expertise
                </h3>
                <p style={{ color: 'var(--sfp-slate)', fontSize: '0.95rem' }}>
                  Our reviews are written by certified professionals with decades of combined experience in finance, investing, and financial services.
                </p>
              </div>

              <div
                className="p-8 rounded-2xl border"
                style={{ background: 'var(--sfp-gray)', borderColor: '#E2E8F0' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 style={{ color: 'var(--sfp-gold)', width: '24px', height: '24px' }} />
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      color: '#555',
                    }}
                  >
                    Transparency
                  </span>
                </div>
                <h3 className="font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Transparency
                </h3>
                <p style={{ color: 'var(--sfp-slate)', fontSize: '0.95rem' }}>
                  We disclose all affiliate relationships, explain our methodology, and publish corrections promptly when we get something wrong.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-24 border-b border-[#E2E8F0]" style={{ background: 'var(--sfp-gray)' }}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1200px' }}>
          <div className="max-w-4xl mx-auto">
            <div
              className="inline-flex items-center mb-4 px-2 py-0.5 rounded"
              style={{ background: '#E8F0FB' }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#1B4F8C',
                }}
              >
                Expert Team
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
              Meet Our Expert Team
            </h2>
            <p className="text-lg mb-12" style={{ color: 'var(--sfp-slate)' }}>
              Our reviews are authored by certified financial professionals with decades of combined expertise across global markets.
            </p>

            <div className="space-y-8">
              {allAuthors.map((author) => (
                <AuthorProfile key={author.id} author={author} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="py-24 bg-white border-b border-[#E2E8F0]">
        <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1200px' }}>
          <div className="max-w-3xl mx-auto">
            <div
              className="inline-flex items-center mb-4 px-2 py-0.5 rounded"
              style={{ background: '#E8F0FB' }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#1B4F8C',
                }}
              >
                Methodology
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              How We Review Products
            </h2>

            <div className="prose prose-lg max-w-none" style={{ color: 'var(--sfp-ink)' }}>
              <p>
                Every SmartFinPro review follows a rigorous six-step evaluation process designed to ensure fairness, accuracy, and comprehensiveness.
              </p>
            </div>

            {/* 6-Step Process */}
            <div className="mt-12 space-y-6">
              {[
                {
                  step: 1,
                  title: 'Research & Eligibility',
                  description:
                    'We identify products that meet our quality threshold and have demonstrated market viability. We only review products that are currently available, properly regulated, and serve our target markets.',
                },
                {
                  step: 2,
                  title: 'Feature Analysis',
                  description:
                    'Our team conducts hands-on testing and benchmarks key features against industry standards. We verify claims made by providers and document real functionality.',
                },
                {
                  step: 3,
                  title: 'Fee & Cost Evaluation',
                  description:
                    'We perform detailed cost modeling across multiple use cases. Hidden fees, tiered pricing, and total cost of ownership are calculated transparently.',
                },
                {
                  step: 4,
                  title: 'Customer Support Assessment',
                  description:
                    'We test support responsiveness via email, chat, and phone. We verify average response times and resolution rates from customer data when available.',
                },
                {
                  step: 5,
                  title: 'Security & Compliance Review',
                  description:
                    'We verify regulatory status (FCA, ASIC, CIRO, SEC), data security certifications, and insurance/protection policies. Compliance is non-negotiable.',
                },
                {
                  step: 6,
                  title: 'Scoring & Publication',
                  description:
                    'We assign a weighted numerical rating and publish the full review with transparent scoring methodology. Reviews are documented for audit purposes.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex gap-6 p-6 rounded-2xl border"
                  style={{ background: 'var(--sfp-gray)', borderColor: '#E2E8F0' }}
                >
                  <div className="flex-shrink-0">
                    <div
                      className="flex items-center justify-center h-10 w-10 rounded-full font-bold text-white"
                      style={{ background: 'var(--sfp-navy)' }}
                    >
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                      {item.title}
                    </h3>
                    <p style={{ color: 'var(--sfp-slate)' }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Standards */}
      <section className="py-24 border-b border-[#E2E8F0]" style={{ background: 'var(--sfp-gray)' }}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1200px' }}>
          <div className="max-w-3xl mx-auto">
            <div
              className="inline-flex items-center mb-4 px-2 py-0.5 rounded"
              style={{ background: '#E8F0FB' }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#1B4F8C',
                }}
              >
                Editorial Standards
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Editorial Standards
            </h2>

            <div className="space-y-8">
              {/* Independence */}
              <div
                className="p-8 rounded-2xl border"
                style={{ background: 'white', borderColor: '#E2E8F0' }}
              >
                <span
                  className="inline-flex items-center mb-3 px-2 py-0.5 rounded"
                  style={{ background: '#E8F0FB' }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      color: '#1B4F8C',
                    }}
                  >
                    Independence
                  </span>
                </span>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
                  Editorial Independence
                </h3>
                <p style={{ color: 'var(--sfp-ink)' }}>
                  SmartFinPro maintains strict editorial independence from all commercial interests. While we earn affiliate commissions on some products we review, commission amounts do not influence which products we review, how we review them, or what rating they receive. Products are selected based on market relevance, quality, and consumer interest—not affiliate potential.
                </p>
              </div>

              {/* Regulatory Compliance */}
              <div
                className="p-8 rounded-2xl border"
                style={{ background: 'white', borderColor: '#E2E8F0' }}
              >
                <span
                  className="inline-flex items-center mb-3 px-2 py-0.5 rounded"
                  style={{ background: '#E8F0FB' }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      color: '#1B4F8C',
                    }}
                  >
                    Compliance
                  </span>
                </span>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
                  Regulatory Compliance
                </h3>
                <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
                  SmartFinPro adheres to regulatory requirements across all markets we serve:
                </p>
                <ul style={{ color: 'var(--sfp-ink)', paddingLeft: '1.5rem' }}>
                  <li className="mb-2">
                    <strong>United States (FTC):</strong> All affiliate relationships are clearly disclosed per FTC guidelines. Endorsements reflect genuine opinions.
                  </li>
                  <li className="mb-2">
                    <strong>United Kingdom (FCA):</strong> Financial product reviews comply with FCA ICOBS requirements. Regulated advisers are clearly identified.
                  </li>
                  <li className="mb-2">
                    <strong>Australia (ASIC):</strong> Reviews of financial products include ASIC warnings. We comply with ASIC's financial services laws.
                  </li>
                  <li className="mb-2">
                    <strong>Canada (CIRO):</strong> Reviews of securities and investment products note applicable CIRO/provincial regulator rules.
                  </li>
                </ul>
              </div>

              {/* Update Schedule */}
              <div
                className="p-8 rounded-2xl border"
                style={{ background: 'white', borderColor: '#E2E8F0' }}
              >
                <span
                  className="inline-flex items-center mb-3 px-2 py-0.5 rounded"
                  style={{ background: '#E8F0FB' }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      color: '#1B4F8C',
                    }}
                  >
                    Updates
                  </span>
                </span>
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
                  Review Update Schedule
                </h3>
                <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
                  We maintain current reviews through a rolling update schedule:
                </p>
                <ul style={{ color: 'var(--sfp-ink)', paddingLeft: '1.5rem' }}>
                  <li className="mb-2">
                    <strong>Quarterly Reviews:</strong> All major product reviews are re-evaluated at least quarterly for accuracy, pricing updates, and new features.
                  </li>
                  <li className="mb-2">
                    <strong>Breaking News:</strong> Regulatory changes, security incidents, or major product updates trigger immediate reviews.
                  </li>
                  <li className="mb-2">
                    <strong>Version Control:</strong> Review update dates are clearly marked. Users can see when a review was last updated.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="py-24 bg-white border-b border-[#E2E8F0]">
        <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1200px' }}>
          <div className="max-w-3xl mx-auto">
            <div
              className="inline-flex items-center mb-4 px-2 py-0.5 rounded"
              style={{ background: '#E8F0FB' }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#1B4F8C',
                }}
              >
                Trust & Transparency
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-8" style={{ color: 'var(--sfp-navy)' }}>
              Trust & Transparency
            </h2>

            <div className="space-y-6">
              {/* Affiliate Disclosure */}
              <div
                className="p-8 rounded-2xl border-2"
                style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
              >
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Affiliate Disclosure
                </h3>
                <p style={{ color: 'var(--sfp-ink)' }}>
                  SmartFinPro earns affiliate commissions when users click affiliate links and take actions (e.g., opening an account, purchasing). This is clearly disclosed at the top and bottom of every review page. Affiliate relationships do not influence editorial decisions. We review products because they're relevant to our audience, not because they offer affiliate programs.
                </p>
              </div>

              {/* No Pay-to-Play */}
              <div
                className="p-8 rounded-2xl border"
                style={{ background: 'var(--sfp-gray)', borderColor: '#E2E8F0' }}
              >
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  No Pay-to-Play
                </h3>
                <p style={{ color: 'var(--sfp-ink)' }}>
                  Companies cannot pay SmartFinPro for positive reviews or higher rankings. We do not accept sponsorships that would compromise our editorial integrity. Our review scores are based exclusively on product quality and consumer value, determined through our documented methodology.
                </p>
              </div>

              {/* Fact-Checking */}
              <div
                className="p-8 rounded-2xl border"
                style={{ background: 'var(--sfp-gray)', borderColor: '#E2E8F0' }}
              >
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Fact-Checking & Accuracy
                </h3>
                <p style={{ color: 'var(--sfp-ink)', marginBottom: '1rem' }}>
                  Every claim in a SmartFinPro review is verified through:
                </p>
                <ul style={{ color: 'var(--sfp-ink)', paddingLeft: '1.5rem' }}>
                  <li className="mb-2">Primary source documentation (regulatory filings, terms of service)</li>
                  <li className="mb-2">Direct testing of products and features</li>
                  <li className="mb-2">Third-party verification from industry databases</li>
                  <li className="mb-2">Peer review by other certified professionals</li>
                </ul>
              </div>

              {/* Corrections */}
              <div
                className="p-8 rounded-2xl border"
                style={{ background: 'white', borderColor: '#E2E8F0' }}
              >
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Corrections Policy
                </h3>
                <p style={{ color: 'var(--sfp-ink)' }}>
                  When we publish information that is inaccurate, we correct it promptly. Corrections are clearly marked with a datestamp and explanation. Significant corrections may trigger a full review update. If you believe information in a review is incorrect, please contact us at{' '}
                  <a href="mailto:editorial@smartfinpro.com" style={{ color: 'var(--sfp-navy)', fontWeight: '500' }}>
                    editorial@smartfinpro.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24" style={{ background: 'var(--sfp-gray)' }}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1200px' }}>
          <div className="max-w-3xl mx-auto text-center">
            <div
              className="inline-flex items-center mb-4 px-2 py-0.5 rounded"
              style={{ background: '#E8F0FB' }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#1B4F8C',
                }}
              >
                Contact
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: 'var(--sfp-navy)' }}>
              Get in Touch
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--sfp-slate)' }}>
              Have questions about our reviews, methodology, or editorial standards? We'd love to hear from you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <a
                href="mailto:editorial@smartfinpro.com"
                className="flex items-center justify-center gap-3 p-6 rounded-2xl border hover:bg-white transition-colors"
                style={{ borderColor: '#E2E8F0', background: 'white' }}
              >
                <Mail style={{ color: 'var(--sfp-navy)', width: '24px', height: '24px' }} />
                <div className="text-left">
                  <div className="font-semibold" style={{ color: 'var(--sfp-navy)' }}>
                    Editorial Questions
                  </div>
                  <div style={{ color: 'var(--sfp-slate)', fontSize: '0.9rem' }}>
                    editorial@smartfinpro.com
                  </div>
                </div>
              </a>

              <a
                href="mailto:hello@smartfinpro.com"
                className="flex items-center justify-center gap-3 p-6 rounded-2xl border hover:bg-white transition-colors"
                style={{ borderColor: '#E2E8F0', background: 'white' }}
              >
                <Mail style={{ color: 'var(--sfp-navy)', width: '24px', height: '24px' }} />
                <div className="text-left">
                  <div className="font-semibold" style={{ color: 'var(--sfp-navy)' }}>
                    General Inquiries
                  </div>
                  <div style={{ color: 'var(--sfp-slate)', fontSize: '0.9rem' }}>
                    hello@smartfinpro.com
                  </div>
                </div>
              </a>
            </div>

            <Link href="/contact">
              <Button
                size="lg"
                style={{
                  background: 'var(--sfp-gold)',
                  color: 'white',
                }}
                className="hover:opacity-90"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'SmartFinPro',
            url: 'https://smartfinpro.com',
            about: {
              '@type': 'Thing',
              name: 'Financial Product Reviews and Comparisons',
              description:
                'Independent expert reviews of financial products across AI tools, cybersecurity, trading, forex, personal finance, and business banking.',
            },
            founders: allAuthors.map((author) => ({
              '@type': 'Person',
              name: author.name,
              url: `https://smartfinpro.com/authors/${author.slug}`,
            })),
            knowsAbout: [
              'Financial Services',
              'Personal Finance',
              'Investment Products',
              'Cybersecurity',
              'AI Tools',
              'Trading Platforms',
            ],
            sameAs: ['https://twitter.com/smartfinpro', 'https://linkedin.com/company/smartfinpro'],
          }),
        }}
      />
    </main>
  );
}
