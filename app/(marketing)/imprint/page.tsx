// app/(marketing)/imprint/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Legal Imprint & Regulatory Disclosures | SmartFinPro',
  description:
    'Legal imprint, company information, and regulatory disclosures for SmartFinPro across the United States, United Kingdom, Canada, and Australia. FCA, AFSL, IIROC, and FTC compliance information.',
  openGraph: {
    title: 'Legal Imprint & Regulatory Disclosures | SmartFinPro',
    description:
      'Company information, regulatory disclosures, and contact details for SmartFinPro across all four markets.',
  },
};

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-4 mb-8">
        <span className="h-px flex-1" style={{ background: '#E2E8F0' }} />
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#555',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
        <span className="h-px flex-1" style={{ background: '#E2E8F0' }} />
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Disclosure card                                                    */
/* ------------------------------------------------------------------ */
function DisclosureCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border bg-white shadow-sm p-6"
      style={{ borderColor: '#E2E8F0' }}
    >
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
        <span>{icon}</span>
        <span>{title}</span>
      </h3>
      <div className="text-sm leading-relaxed space-y-3" style={{ color: 'var(--sfp-slate)' }}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Region block                                                       */
/* ------------------------------------------------------------------ */
function RegionBlock({
  id,
  flag,
  region,
  children,
}: {
  id: string;
  flag: string;
  region: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{flag}</span>
        <h3 className="text-xl font-bold" style={{ color: 'var(--sfp-ink)' }}>{region}</h3>
      </div>
      <div className="grid gap-5">{children}</div>
    </div>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */
export default function ImprintPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section
        className="relative py-20 md:py-28 overflow-hidden"
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
          <div className="max-w-3xl mx-auto text-center">
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
                Legal & Compliance
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Legal Imprint &amp; Regulatory Disclosures
            </h1>
            <p className="text-xl mb-4 text-blue-100">
              Company information, regulatory compliance notices, and contact
              details for all SmartFinPro markets.
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Last updated: February 11, 2026
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CONTENT                                                     */}
      {/* ============================================================ */}
      <section className="py-16 pb-24">
        <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1200px' }}>
          <div className="max-w-4xl mx-auto">
            {/* ------------------------------------------------------ */}
            {/*  Quick Navigation                                       */}
            {/* ------------------------------------------------------ */}
            <nav
              className="rounded-3xl border bg-white shadow-sm p-6 md:p-8 mb-12 overflow-hidden"
              style={{ borderColor: '#E2E8F0' }}
            >
              <div
                className="h-1 -mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-6"
                style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }}
              />
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
                  Quick Navigation
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { href: '#company-information', label: 'Company Information' },
                  { href: '#affiliate-disclosure', label: 'Affiliate Disclosure Summary' },
                  { href: '#us-regulatory', label: '🇺🇸 United States — FTC Disclosure' },
                  { href: '#uk-regulatory', label: '🇬🇧 United Kingdom — FCA Notice' },
                  { href: '#ca-regulatory', label: '🇨🇦 Canada — IIROC / CIPF Notice' },
                  { href: '#au-regulatory', label: '🇦🇺 Australia — AFSL Compliance' },
                  { href: '#contact', label: 'Contact Us' },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity py-1"
                    style={{ color: 'var(--sfp-navy)' }}
                  >
                    <span style={{ color: 'var(--sfp-navy)' }}>→</span>
                    {link.label}
                  </a>
                ))}
              </div>
            </nav>

            {/* Main content card */}
            <div
              className="rounded-3xl border bg-white shadow-sm overflow-hidden"
              style={{ borderColor: '#E2E8F0' }}
            >
              {/* Gradient accent bar */}
              <div
                className="h-1"
                style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }}
              />

              <div className="p-8 md:p-12 space-y-16">
                {/* ================================================== */}
                {/*  1. COMPANY INFORMATION                             */}
                {/* ================================================== */}
                <Section id="company-information" title="Company Information">
                  <DisclosureCard title="About SmartFinPro" icon="🏢">
                    <p>
                      SmartFinPro is an independent financial technology publisher that
                      provides reviews, comparisons, and educational content about
                      financial products and services. We operate as an affiliate
                      publisher — we do not provide financial advice, manage client funds,
                      or hold any financial services licences.
                    </p>
                    <div
                      className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4 pt-4 border-t"
                      style={{ borderColor: '#E2E8F0', background: 'var(--sfp-gray)', borderRadius: '12px', padding: '24px' }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            color: '#555',
                            marginBottom: '4px',
                          }}
                        >
                          Legal Entity
                        </p>
                        <p style={{ color: 'var(--sfp-ink)', fontWeight: 500 }}>SmartFinPro Media</p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            color: '#555',
                            marginBottom: '4px',
                          }}
                        >
                          Website
                        </p>
                        <p style={{ color: 'var(--sfp-ink)', fontWeight: 500 }}>smartfinpro.com</p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            color: '#555',
                            marginBottom: '4px',
                          }}
                        >
                          Markets Served
                        </p>
                        <p style={{ color: 'var(--sfp-ink)', fontWeight: 500 }}>US, UK, Canada, Australia</p>
                      </div>
                    </div>
                  </DisclosureCard>

                  <DisclosureCard title="Editorial Independence" icon="✍️">
                    <p>
                      Our editorial team operates independently from our commercial
                      partnerships. Affiliate relationships never influence our ratings,
                      rankings, or editorial conclusions. Our{' '}
                      <Link href="/methodology" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                        review methodology
                      </Link>{' '}
                      is publicly documented and applied uniformly to all products we evaluate.
                    </p>
                    <p>
                      For full details on how we earn revenue, see our{' '}
                      <Link href="/affiliate-disclosure" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                        Affiliate Disclosure
                      </Link>.
                    </p>
                  </DisclosureCard>
                </Section>

                {/* ================================================== */}
                {/*  2. AFFILIATE DISCLOSURE SUMMARY                    */}
                {/* ================================================== */}
                <Section id="affiliate-disclosure" title="Affiliate Disclosure Summary">
                  <div
                    className="rounded-2xl border p-6"
                    style={{ background: 'var(--sfp-sky)', borderColor: '#E2E8F0' }}
                  >
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--sfp-ink)' }}>
                      <strong style={{ color: 'var(--sfp-ink)' }}>Disclosure:</strong> SmartFinPro
                      earns affiliate commissions when visitors click our links and sign
                      up for or purchase financial products. This includes, but is not
                      limited to, trading platforms, credit cards, banking products,
                      insurance, and software subscriptions.
                    </p>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--sfp-slate)' }}>
                      We partner with the following types of providers:
                    </p>
                    <ul className="text-sm space-y-2 mb-4" style={{ color: 'var(--sfp-slate)' }}>
                      <li className="flex items-start gap-2">
                        <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                        <span><strong style={{ color: 'var(--sfp-ink)' }}>Trading &amp; Brokerage:</strong> eToro, Capital.com, Interactive Brokers, Plus500, IG, Trading 212</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                        <span><strong style={{ color: 'var(--sfp-ink)' }}>Credit Cards (US):</strong> American Express, Chase (via affiliate networks)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                        <span><strong style={{ color: 'var(--sfp-ink)' }}>ISA &amp; Investment (UK):</strong> Vanguard, Hargreaves Lansdown, AJ Bell, Fidelity, Nutmeg, Trading 212</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                        <span><strong style={{ color: 'var(--sfp-ink)' }}>Personal Finance (CA):</strong> Wealthsimple, Questrade</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                        <span><strong style={{ color: 'var(--sfp-ink)' }}>Home Loans (AU):</strong> Athena Home Loans, ubank, various mortgage providers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                        <span><strong style={{ color: 'var(--sfp-ink)' }}>Software &amp; AI Tools:</strong> Jasper AI, NordVPN, Surfshark, Norton, and others</span>
                      </li>
                    </ul>
                    <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                      For the complete disclosure, see our{' '}
                      <Link href="/affiliate-disclosure" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                        full Affiliate Disclosure page
                      </Link>.
                    </p>
                  </div>
                </Section>

                {/* ================================================== */}
                {/*  3. REGULATORY DISCLOSURES — BY REGION              */}
                {/* ================================================== */}
                <Section id="regulatory-disclosures" title="Regulatory Disclosures by Region">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                    The following regulatory notices apply to SmartFinPro content
                    tailored for each of our four core markets. These disclosures are
                    provided for transparency and do not constitute financial advice.
                  </p>

                  {/* ------------------------------------------------ */}
                  {/*  US UNITED STATES                                  */}
                  {/* ------------------------------------------------ */}
                  <RegionBlock id="us-regulatory" flag="🇺🇸" region="United States">
                    <DisclosureCard title="FTC Affiliate Disclosure" icon="📋">
                      <p>
                        In compliance with the Federal Trade Commission (FTC) guidelines
                        on endorsements and testimonials (16 CFR Part 255), SmartFinPro
                        discloses: <strong style={{ color: 'var(--sfp-ink)' }}>We have a material
                        financial relationship with the companies whose products we
                        review and recommend.</strong>
                      </p>
                      <p>
                        When you click on links to American Express, Chase, or other
                        financial product providers and subsequently apply for or
                        purchase their products, SmartFinPro may receive compensation.
                        This compensation may impact how and where products appear on our
                        site, but it does not influence our editorial evaluations or
                        ratings.
                      </p>
                      <div
                        className="rounded-xl border border-amber-200 p-4 mt-2"
                        style={{ background: '#FEF5E7' }}
                      >
                        <p className="text-xs" style={{ color: 'var(--sfp-ink)' }}>
                          <strong style={{ color: 'var(--sfp-gold)' }}>Clear &amp; Conspicuous Notice:</strong> Compensation
                          from affiliate partners does not determine our reviews or
                          ratings. Not all products available in the market are featured
                          on SmartFinPro. Terms apply to all credit card offers. See the
                          issuer&apos;s website for current terms, conditions, and APR
                          information.
                        </p>
                      </div>
                    </DisclosureCard>

                    <DisclosureCard title="Credit Card Disclaimer" icon="💳">
                      <p>
                        Credit card information on SmartFinPro is independently gathered
                        and has not been reviewed or provided by the card issuer.
                        Responses are not provided or commissioned by the card issuer.
                        SmartFinPro has not reviewed all available credit card offers in
                        the marketplace. Credit card terms, fees, and rewards are subject
                        to change at any time. Always verify terms directly with the
                        issuer before applying.
                      </p>
                    </DisclosureCard>

                    <DisclosureCard title="Investment Disclaimer" icon="📊">
                      <p>
                        All investments involve risk, including the possible loss of
                        principal. Past performance does not guarantee future results.
                        SmartFinPro does not provide personalized investment advice and is
                        not a registered investment advisor. Content is for informational
                        purposes only. Consult a qualified financial professional before
                        making investment decisions.
                      </p>
                    </DisclosureCard>

                    <DisclosureCard title="US Contact" icon="📬">
                      <p style={{ color: 'var(--sfp-ink)' }}>
                        SmartFinPro Media<br />
                        Email:{' '}
                        <a href="mailto:legal@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                          legal@smartfinpro.com
                        </a>
                      </p>
                    </DisclosureCard>
                  </RegionBlock>

                  {/* ------------------------------------------------ */}
                  {/*  UK UNITED KINGDOM                                 */}
                  {/* ------------------------------------------------ */}
                  <RegionBlock id="uk-regulatory" flag="🇬🇧" region="United Kingdom">
                    <DisclosureCard title="FCA Regulatory Notice" icon="🏛️">
                      <p>
                        SmartFinPro is <strong style={{ color: 'var(--sfp-ink)' }}>not</strong>{' '}
                        authorised or regulated by the Financial Conduct Authority (FCA).
                        We are an independent affiliate publisher. The financial products
                        and brokers we review and link to may be authorised and regulated
                        by the FCA. Specifically:
                      </p>
                      <ul className="space-y-2 mt-3">
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                          <span><strong style={{ color: 'var(--sfp-ink)' }}>IG</strong> is authorised and regulated by the FCA (FRN: 195355).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                          <span><strong style={{ color: 'var(--sfp-ink)' }}>Plus500 UK Ltd</strong> is authorised and regulated by the FCA (FRN: 509909).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                          <span><strong style={{ color: 'var(--sfp-ink)' }}>eToro (UK) Ltd</strong> is authorised and regulated by the FCA (FRN: 583263).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                          <span><strong style={{ color: 'var(--sfp-ink)' }}>Capital.com (UK) Ltd</strong> is authorised and regulated by the FCA (FRN: 793714).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                          <span><strong style={{ color: 'var(--sfp-ink)' }}>Interactive Brokers (U.K.) Ltd</strong> is authorised and regulated by the FCA (FRN: 208159).</span>
                        </li>
                      </ul>
                      <div
                        className="rounded-xl border border-amber-200 p-4 mt-3"
                        style={{ background: '#FEF5E7' }}
                      >
                        <p className="text-xs" style={{ color: 'var(--sfp-ink)' }}>
                          <strong style={{ color: 'var(--sfp-gold)' }}>CFD Risk Warning:</strong> CFDs are complex instruments
                          and come with a high risk of losing money rapidly due to
                          leverage. Between 51% and 82% of retail investor accounts lose
                          money when trading CFDs. You should consider whether you
                          understand how CFDs work and whether you can afford to take the
                          high risk of losing your money.
                        </p>
                      </div>
                    </DisclosureCard>

                    <DisclosureCard title="ISA & Investment Notice" icon="🏦">
                      <p>
                        Capital at risk. The value of investments and the income from them
                        can go down as well as up, and you may get back less than you
                        invest. Tax treatment depends on your individual circumstances and
                        may be subject to change in the future. ISA tax benefits apply to
                        UK tax residents only. Always verify current ISA allowances with
                        HMRC.
                      </p>
                      <p>
                        ISA providers featured on SmartFinPro (including Vanguard,
                        Hargreaves Lansdown, AJ Bell, Fidelity, Nutmeg, and Trading 212)
                        are authorised and regulated by the FCA. SmartFinPro may earn
                        affiliate commission when you open an account through our links.
                      </p>
                    </DisclosureCard>

                    <DisclosureCard title="UK Contact" icon="📬">
                      <p style={{ color: 'var(--sfp-ink)' }}>
                        SmartFinPro Media<br />
                        Email:{' '}
                        <a href="mailto:legal@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                          legal@smartfinpro.com
                        </a><br />
                        For regulatory queries:{' '}
                        <a href="mailto:compliance@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                          compliance@smartfinpro.com
                        </a>
                      </p>
                    </DisclosureCard>
                  </RegionBlock>

                  {/* ------------------------------------------------ */}
                  {/*  CA CANADA                                         */}
                  {/* ------------------------------------------------ */}
                  <RegionBlock id="ca-regulatory" flag="🇨🇦" region="Canada">
                    <DisclosureCard title="IIROC & CIPF Notice" icon="🛡️">
                      <p>
                        SmartFinPro is an independent publisher and is not a member of the
                        Canadian Investment Regulatory Organization (CIRO, formerly IIROC)
                        nor the Canadian Investor Protection Fund (CIPF). The investment
                        platforms and financial services we review may be regulated by
                        these bodies.
                      </p>
                      <ul className="space-y-2 mt-3">
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                          <span>
                            <strong style={{ color: 'var(--sfp-ink)' }}>Wealthsimple Investments Inc.</strong> is
                            a member of CIRO and a member of CIPF, meaning eligible
                            client accounts are protected up to $1,000,000 in
                            the event of member insolvency.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                          <span>
                            <strong style={{ color: 'var(--sfp-ink)' }}>Questrade Inc.</strong> is a member
                            of CIRO and CIPF.
                          </span>
                        </li>
                      </ul>
                      <p className="mt-3">
                        Investing involves risk. The value of your investments can go up
                        or down. Past performance does not guarantee future results.
                      </p>
                    </DisclosureCard>

                    <DisclosureCard title="Canadian Tax Disclaimer" icon="📄">
                      <p>
                        Information about TFSA, RRSP, and other registered account types
                        on SmartFinPro is provided for general informational purposes
                        only. Tax rules are subject to change. Contribution limits,
                        eligibility, and tax implications depend on your individual
                        circumstances. Consult a qualified Canadian tax professional for
                        advice specific to your situation.
                      </p>
                    </DisclosureCard>

                    <DisclosureCard title="Canada Contact" icon="📬">
                      <p style={{ color: 'var(--sfp-ink)' }}>
                        SmartFinPro Media<br />
                        Email:{' '}
                        <a href="mailto:legal@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                          legal@smartfinpro.com
                        </a><br />
                        For Canadian compliance inquiries:{' '}
                        <a href="mailto:compliance@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                          compliance@smartfinpro.com
                        </a>
                      </p>
                    </DisclosureCard>
                  </RegionBlock>

                  {/* ------------------------------------------------ */}
                  {/*  AU AUSTRALIA                                       */}
                  {/* ------------------------------------------------ */}
                  <RegionBlock id="au-regulatory" flag="🇦🇺" region="Australia">
                    <DisclosureCard title="AFSL Compliance Notice" icon="📜">
                      <p>
                        SmartFinPro does not hold an Australian Financial Services Licence
                        (AFSL) and does not provide financial product advice. We are an
                        independent comparison and review platform. The brokers and
                        financial services providers we feature may hold an AFSL. Users
                        should verify the AFSL status of any provider directly with ASIC
                        at{' '}
                        <a
                          href="https://connectonline.asic.gov.au/RegistrySearch/faces/landing/SearchRegisters.jspx"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:opacity-80"
                          style={{ color: 'var(--sfp-navy)' }}
                        >
                          ASIC Connect
                        </a>.
                      </p>
                      <ul className="space-y-2 mt-3">
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                          <span>
                            <strong style={{ color: 'var(--sfp-ink)' }}>eToro AUS Capital Ltd</strong> holds
                            AFSL 491139.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                          <span>
                            <strong style={{ color: 'var(--sfp-ink)' }}>IG Australia Pty Ltd</strong> holds
                            AFSL 515106.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--sfp-navy)' }}>•</span>
                          <span>
                            <strong style={{ color: 'var(--sfp-ink)' }}>Interactive Brokers Australia Pty Ltd</strong> holds
                            AFSL 453554.
                          </span>
                        </li>
                      </ul>
                      <div
                        className="rounded-xl border border-amber-200 p-4 mt-3"
                        style={{ background: '#FEF5E7' }}
                      >
                        <p className="text-xs" style={{ color: 'var(--sfp-ink)' }}>
                          <strong style={{ color: 'var(--sfp-gold)' }}>General Advice Warning:</strong> The information on
                          SmartFinPro is general in nature and does not take into account
                          your personal objectives, financial situation, or needs. Before
                          acting on any information, consider its appropriateness to your
                          circumstances. You should read the relevant Product Disclosure
                          Statement (PDS) and Target Market Determination (TMD) before
                          making any financial decisions.
                        </p>
                      </div>
                    </DisclosureCard>

                    <DisclosureCard title="Home Loan Transparency" icon="🏠">
                      <p>
                        SmartFinPro compares home loan products from various Australian
                        lenders. We may earn referral fees from mortgage providers,
                        including Athena Home Loans and ubank. Comparison rates provided
                        on SmartFinPro are based on a secured loan amount of $150,000 over
                        25 years unless otherwise stated.
                      </p>
                      <p>
                        <strong style={{ color: 'var(--sfp-ink)' }}>WARNING:</strong> This
                        comparison rate applies only to the example given. Different
                        amounts and terms will result in different comparison rates.
                        Costs such as redraw fees or early repayment fees, and cost
                        savings such as fee waivers, are not included in the comparison
                        rate but may influence the cost of the loan. Rates are subject
                        to change. Check with your lender for the most current rates.
                      </p>
                      <p>
                        SmartFinPro is not a credit provider or credit intermediary.
                        Credit assessments, approvals, and terms are solely at the
                        discretion of the lender. Australian Credit Licence requirements
                        apply to credit providers under the National Consumer Credit
                        Protection Act 2009.
                      </p>
                    </DisclosureCard>

                    <DisclosureCard title="Australia Contact" icon="📬">
                      <p style={{ color: 'var(--sfp-ink)' }}>
                        SmartFinPro Media<br />
                        Email:{' '}
                        <a href="mailto:legal@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                          legal@smartfinpro.com
                        </a><br />
                        For Australian compliance inquiries:{' '}
                        <a href="mailto:compliance@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                          compliance@smartfinpro.com
                        </a>
                      </p>
                    </DisclosureCard>
                  </RegionBlock>
                </Section>

                {/* ================================================== */}
                {/*  4. CONTACT US                                      */}
                {/* ================================================== */}
                <Section id="contact" title="Contact Us">
                  <DisclosureCard title="General & Legal Inquiries" icon="📧">
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-2xl p-6"
                      style={{ background: 'var(--sfp-gray)' }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            color: '#555',
                            marginBottom: '4px',
                          }}
                        >
                          General Inquiries
                        </p>
                        <p>
                          <a href="mailto:hello@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                            hello@smartfinpro.com
                          </a>
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            color: '#555',
                            marginBottom: '4px',
                          }}
                        >
                          Legal &amp; Compliance
                        </p>
                        <p>
                          <a href="mailto:legal@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                            legal@smartfinpro.com
                          </a>
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            color: '#555',
                            marginBottom: '4px',
                          }}
                        >
                          Privacy Requests
                        </p>
                        <p>
                          <a href="mailto:privacy@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                            privacy@smartfinpro.com
                          </a>
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            color: '#555',
                            marginBottom: '4px',
                          }}
                        >
                          Press &amp; Partnerships
                        </p>
                        <p>
                          <a href="mailto:partnerships@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                            partnerships@smartfinpro.com
                          </a>
                        </p>
                      </div>
                    </div>
                  </DisclosureCard>

                  <div
                    className="rounded-2xl border p-6"
                    style={{ background: 'var(--sfp-sky)', borderColor: '#E2E8F0' }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                      <strong style={{ color: 'var(--sfp-ink)' }}>Important:</strong> SmartFinPro does
                      not provide financial advice. All content is for informational and
                      educational purposes only. For personalised financial guidance,
                      please consult a qualified, licensed financial adviser in your
                      jurisdiction. See our{' '}
                      <Link href="/terms" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>
                        Privacy Policy
                      </Link>{' '}
                      for more information.
                    </p>
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
