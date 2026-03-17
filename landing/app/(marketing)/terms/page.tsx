import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | SmartFinPro',
  description:
    'Read the SmartFinPro Terms of Service. Our content is for informational purposes only and does not constitute financial, investment, legal, or tax advice.',
  openGraph: {
    title: 'Terms of Service | SmartFinPro',
    description:
      'Terms governing the use of SmartFinPro and its content.',
  },
};

export default function TermsPage() {
  return (
    <section className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Header */}
      <div className="relative py-20 md:py-28 overflow-hidden">
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Terms of Service
            </h1>
            <p className="text-xl" style={{ color: 'var(--sfp-slate)' }}>
              Please read these terms carefully before using SmartFinPro.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-24">
        <div className="container mx-auto px-4">
          <div
            className="max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12"
          >
            <p className="text-sm mb-10" style={{ color: 'var(--sfp-slate)' }}>
              Last updated: February 2026
            </p>

            {/* Section 1 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                1. Acceptance of Terms
              </h2>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                By accessing or using the SmartFinPro website
                (smartfinpro.com), you agree to be bound by these Terms of
                Service. If you do not agree to these terms, please do not use
                our website. We reserve the right to update or modify these
                terms at any time, and your continued use of the site
                constitutes acceptance of any changes.
              </p>
            </div>

            {/* Section 2 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                2. Description of Service
              </h2>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                SmartFinPro provides educational and informational content about
                financial products and services, including reviews, comparisons,
                calculators, and guides. Our content covers multiple markets
                (United States, United Kingdom, Canada, and Australia) and
                categories including AI tools, cybersecurity, trading, forex,
                and personal finance. SmartFinPro is{' '}
                <strong style={{ color: 'var(--sfp-ink)' }}>
                  not a financial services provider
                </strong>{' '}
                and does not offer financial products directly.
              </p>
            </div>

            {/* Section 3 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                3. No Financial Advice Disclaimer
              </h2>
              <div
                className="rounded-xl border border-amber-200 p-5 mb-4"
                style={{ background: '#FEF5E7' }}
              >
                <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                  <strong style={{ color: 'var(--sfp-gold)' }}>Important:</strong> Content
                  on SmartFinPro is for informational purposes only and does not
                  constitute financial, investment, legal, or tax advice. You
                  should not rely on our content as a substitute for professional
                  advice tailored to your specific circumstances.
                </p>
              </div>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                Any opinions, ratings, or recommendations expressed on this site
                are our own and are based on our independent research and
                analysis. They should not be interpreted as endorsements or
                guarantees of any financial product or service.
              </p>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                Past performance of any financial product does not guarantee
                future results. Always conduct your own research and consult
                with a qualified financial advisor before making any financial
                decisions.
              </p>
            </div>

            {/* Section 4 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                4. Affiliate Links
              </h2>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                SmartFinPro may earn commissions when you click on affiliate
                links and sign up for products or services featured on our site.
                These commissions help fund our operations and allow us to
                continue providing free content.
              </p>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                Affiliate relationships do not influence our ratings or
                recommendations. For full details, please read our{' '}
                <Link
                  href="/affiliate-disclosure"
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--sfp-navy)' }}
                >
                  Affiliate Disclosure
                </Link>
                .
              </p>
            </div>

            {/* Section 5 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                5. Intellectual Property
              </h2>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                All content on SmartFinPro -- including text, graphics, logos,
                images, data, tools, and software -- is the property of
                SmartFinPro or its content suppliers and is protected by
                international copyright, trademark, and other intellectual
                property laws.
              </p>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                You may not reproduce, distribute, modify, create derivative
                works of, publicly display, publicly perform, republish,
                download, store, or transmit any material from our site without
                prior written consent, except for personal, non-commercial use
                with proper attribution.
              </p>
            </div>

            {/* Section 6 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                6. Limitation of Liability
              </h2>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                To the fullest extent permitted by applicable law, SmartFinPro
                and its officers, directors, employees, and agents shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages arising out of or related to your use of or
                inability to use the site.
              </p>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                We make no warranties or representations about the accuracy or
                completeness of our content. While we strive to provide
                up-to-date and accurate information, financial product details
                (including pricing, features, and terms) may change without
                notice. You should always verify current details directly with
                the product provider.
              </p>
            </div>

            {/* Section 7 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                7. Governing Law
              </h2>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                These Terms of Service are governed by and construed in
                accordance with the laws of the United States. Any disputes
                arising under or in connection with these terms shall be subject
                to the exclusive jurisdiction of the courts located in the
                United States. If any provision of these terms is found to be
                invalid or unenforceable, the remaining provisions shall
                continue in full force and effect.
              </p>
            </div>

            {/* Section 8 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                8. Changes to Terms
              </h2>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                We reserve the right to modify these Terms of Service at any
                time. Changes will be posted on this page with an updated
                revision date. Your continued use of SmartFinPro after any
                changes constitutes your acceptance of the new terms. We
                encourage you to review these terms periodically to stay
                informed of any updates.
              </p>
            </div>

            {/* Section 9 */}
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                9. Contact
              </h2>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                If you have questions about these Terms of Service, please
                contact us at:
              </p>
              <p className="mt-4">
                <a
                  href="mailto:support@smartfinpro.com"
                  className="hover:opacity-80 transition-opacity font-medium text-lg"
                  style={{ color: 'var(--sfp-navy)' }}
                >
                  support@smartfinpro.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
