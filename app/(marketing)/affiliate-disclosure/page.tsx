import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure | SmartFinPro',
  description:
    'SmartFinPro earns affiliate commissions when you sign up through our links. Learn how we maintain editorial independence and transparency in our reviews.',
  openGraph: {
    title: 'Affiliate Disclosure | SmartFinPro',
    description:
      'Learn how SmartFinPro earns revenue and maintains editorial independence.',
  },
};

export default function AffiliateDisclosurePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Header */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Affiliate Disclosure
            </h1>
            <p className="text-xl" style={{ color: 'var(--sfp-slate)' }}>
              Transparency is core to everything we do. Here is how we make
              money and why you can trust our recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div
            className="max-w-3xl mx-auto rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12"
          >
            {/* Intro */}
            <div
              className="rounded-xl border border-gray-200 p-5 mb-10"
              style={{ background: 'var(--sfp-sky)' }}
            >
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                SmartFinPro is a free resource. We earn money through affiliate
                partnerships with the financial products and services we review.
                This page explains exactly how that works and what it means for
                you.
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                How We Make Money
              </h2>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                When you click on certain links on our site and sign up for a
                product or service, we may receive a commission from the
                provider. This is called affiliate marketing, and it is the
                standard revenue model for financial comparison websites.
              </p>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                These commissions come at{' '}
                <strong style={{ color: 'var(--sfp-ink)' }}>no additional cost to you</strong>.
                You pay the same price whether you use our link or go directly
                to the provider. In some cases, we negotiate exclusive deals
                that may actually save you money.
              </p>
            </div>

            {/* Section 2 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                Editorial Independence
              </h2>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                Our affiliate relationships{' '}
                <strong style={{ color: 'var(--sfp-ink)' }}>
                  do not influence our ratings, rankings, or recommendations
                </strong>
                . We evaluate every product using the same consistent
                methodology regardless of whether we have an affiliate
                relationship with the provider.
              </p>
              <ul className="space-y-3 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span>
                  <span>
                    Products with no affiliate relationship can still receive
                    top ratings if they deserve it.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span>
                  <span>
                    Products with affiliate relationships can receive low ratings
                    if they underperform.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span>
                  <span>
                    We apply the same scoring criteria across all products in a
                    given category.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span>
                  <span>
                    Commission rates are never a factor in how we rank products.
                  </span>
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                How Affiliate Links Work
              </h2>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                When you see a link on SmartFinPro that takes you to a
                provider&apos;s website, here is what happens:
              </p>
              <div className="space-y-4">
                <div
                  className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white shadow-sm p-5"
                >
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                    style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                  >
                    1
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-ink)' }}>
                      You click a link
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                      Our affiliate links use{' '}
                      <code style={{ color: 'var(--sfp-navy)' }}>/go/</code> redirect
                      routes. These pass through our server before redirecting
                      you to the partner site.
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white shadow-sm p-5"
                >
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                    style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                  >
                    2
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-ink)' }}>
                      A cookie is set
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                      The partner site may place a tracking cookie so they can
                      attribute any sign-ups to our referral. Cookie durations
                      vary by partner.
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white shadow-sm p-5"
                >
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                    style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                  >
                    3
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-ink)' }}>
                      We earn a commission
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                      If you sign up or make a purchase, we receive a commission
                      from the provider. Commission amounts vary by partner and
                      product type.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm mt-4 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                All affiliate links on our site are marked with{' '}
                <code style={{ color: 'var(--sfp-navy)' }}>rel=&quot;sponsored&quot;</code>{' '}
                in accordance with search engine guidelines.
              </p>
            </div>

            {/* Section 4 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                Our Review Process
              </h2>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                Every review on SmartFinPro follows a rigorous process to ensure
                accuracy and fairness:
              </p>
              <ul className="space-y-3 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span>
                  <span>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Hands-on testing</strong> --
                    we sign up for and test the products we review, evaluating
                    features, usability, pricing, and support.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span>
                  <span>
                    <strong style={{ color: 'var(--sfp-ink)' }}>
                      Consistent scoring criteria
                    </strong>{' '}
                    -- we use standardized rubrics for each product category so
                    comparisons are meaningful and fair.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span>
                  <span>
                    <strong style={{ color: 'var(--sfp-ink)' }}>
                      Expert verification
                    </strong>{' '}
                    -- our content is reviewed by industry professionals with
                    relevant experience in finance, trading, and technology.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span>
                  <span>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Regular updates</strong> --
                    reviews are revisited periodically to ensure pricing,
                    features, and ratings remain accurate.
                  </span>
                </li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                Our Transparency Commitment
              </h2>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                We believe trust is earned through transparency. To that end:
              </p>
              <ul className="space-y-3 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span>
                  <span>
                    All affiliate relationships are disclosed on this page and
                    within relevant content.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span>
                  <span>
                    Our ratings are based on merit, not on the commercial
                    relationship we have with a provider.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span>
                  <span>
                    We clearly indicate when a link is an affiliate link.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span>
                  <span>
                    We welcome questions about our methodology and business
                    model.
                  </span>
                </li>
              </ul>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                Questions?
              </h2>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                If you have questions about our affiliate relationships or how
                we make money, please reach out:
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
      </section>
    </div>
  );
}
