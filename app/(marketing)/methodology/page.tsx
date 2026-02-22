import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Review Methodology | SmartFinPro',
  description:
    'Learn how SmartFinPro evaluates financial products. Our rigorous methodology covers features, usability, pricing, security, and support across 30-90 day testing periods.',
  openGraph: {
    title: 'Our Review Methodology | SmartFinPro',
    description:
      'Rigorous, multi-step evaluation process for every financial product we review.',
  },
};

const ratingCriteria = [
  {
    name: 'Features & Functionality',
    weight: '30%',
    desc: 'Depth and breadth of core features, unique capabilities, integrations, and how well the product delivers on its promises.',
  },
  {
    name: 'Ease of Use',
    weight: '20%',
    desc: 'Onboarding experience, interface design, learning curve, documentation quality, and overall user experience.',
  },
  {
    name: 'Pricing & Value',
    weight: '20%',
    desc: 'Transparency of pricing, value for money compared to competitors, hidden fees, and availability of free tiers or trials.',
  },
  {
    name: 'Security & Regulation',
    weight: '15%',
    desc: 'Regulatory compliance, data protection measures, encryption standards, and adherence to industry security frameworks.',
  },
  {
    name: 'Customer Support',
    weight: '15%',
    desc: 'Support channel availability, response times, quality of help documentation, and resolution effectiveness.',
  },
];

export default function MethodologyPage() {
  return (
    <section className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Header */}
      <div className="relative py-20 md:py-28 overflow-hidden">
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Our Review Methodology
            </h1>
            <p className="text-xl" style={{ color: 'var(--sfp-slate)' }}>
              Every product we review undergoes a rigorous, multi-step
              evaluation process.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Overview */}
            <div
              className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12"
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>Overview</h2>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                At SmartFinPro, we believe financial product reviews should be
                grounded in real-world testing and objective criteria. Every
                product we review undergoes a rigorous, multi-step evaluation
                process designed to give you an accurate, unbiased assessment.
                Our methodology is consistent across all markets and product
                categories, ensuring that our ratings are fair and comparable.
              </p>
            </div>

            {/* Rating System */}
            <div
              className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12"
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                Rating System
              </h2>
              <p className="mb-6 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                We use a weighted 1-5 star rating system. Each product is scored
                across five key criteria, with the final rating calculated as a
                weighted average.
              </p>
              <div className="space-y-4">
                {ratingCriteria.map((criteria) => (
                  <div
                    key={criteria.name}
                    className="rounded-xl border border-gray-200 bg-white shadow-sm p-5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                        {criteria.name}
                      </h3>
                      <span className="font-bold text-sm" style={{ color: 'var(--sfp-navy)' }}>
                        {criteria.weight}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                      {criteria.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Testing Process */}
            <div
              className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12"
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                Testing Process
              </h2>
              <p className="mb-6 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                We go beyond marketing materials. Our analysts test products in
                real-world conditions over extended periods to provide you with
                reliable, experience-based assessments.
              </p>
              <div className="space-y-4">
                {[
                  {
                    step: '1',
                    title: 'Account Setup',
                    desc: 'We create real accounts on every platform we review, going through the same sign-up and verification process that any customer would experience.',
                  },
                  {
                    step: '2',
                    title: 'Extended Testing',
                    desc: 'Each product is tested for 30 to 90 days depending on the category. This allows us to evaluate performance over time, not just first impressions.',
                  },
                  {
                    step: '3',
                    title: 'Real Transactions',
                    desc: 'Where applicable, we conduct real transactions to test execution speed, fee accuracy, and the overall reliability of the platform under real conditions.',
                  },
                  {
                    step: '4',
                    title: 'Support Testing',
                    desc: 'We contact customer support through all available channels to evaluate response times, knowledge, and problem-resolution capabilities.',
                  },
                  {
                    step: '5',
                    title: 'Comparative Analysis',
                    desc: 'We compare each product against its direct competitors to provide context and help you understand where it stands in the market.',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white shadow-sm p-5"
                  >
                    <span
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                      style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                    >
                      {item.step}
                    </span>
                    <div>
                      <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-ink)' }}>
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Independence */}
            <div
              className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12"
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                Independence
              </h2>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                Our affiliate relationships{' '}
                <strong style={{ color: 'var(--sfp-ink)' }}>
                  never influence our scores
                </strong>
                . The editorial team operates independently from the business
                team. Reviewers do not know the commission structure for any
                product they evaluate.
              </p>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                Products that do not meet our minimum quality standards are not
                recommended, regardless of any potential commission. We would
                rather forgo revenue than compromise the trust our readers place
                in us.
              </p>
            </div>

            {/* Updates */}
            <div
              className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12"
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                Review Updates
              </h2>
              <p className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                Financial products evolve, and so do our reviews. We update our
                reviews on a quarterly basis, or sooner when significant changes
                occur -- such as major pricing updates, new feature releases,
                regulatory changes, or security incidents. Each review displays
                the date it was last updated so you always know how current the
                information is.
              </p>
            </div>

            {/* Regulatory Compliance */}
            <div
              className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12"
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
                Regulatory Compliance
              </h2>
              <p className="mb-6 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                For all financial product reviews, we verify the regulatory
                status of each provider with the relevant authorities. This
                ensures that we only recommend products from properly licensed
                and regulated entities.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    region: 'United States',
                    bodies: 'CFTC, NFA, SEC, FINRA',
                  },
                  {
                    region: 'United Kingdom',
                    bodies: 'FCA (Financial Conduct Authority)',
                  },
                  {
                    region: 'Canada',
                    bodies: 'CIPF, CDIC, IIROC',
                  },
                  {
                    region: 'Australia',
                    bodies: 'ASIC (Australian Securities and Investments Commission)',
                  },
                ].map((reg) => (
                  <div
                    key={reg.region}
                    className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
                  >
                    <h3 className="font-semibold mb-1 text-sm" style={{ color: 'var(--sfp-ink)' }}>
                      {reg.region}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>{reg.bodies}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
