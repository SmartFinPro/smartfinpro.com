import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | SmartFinPro',
  description:
    'Comprehensive Privacy Policy for SmartFinPro covering GDPR (UK/EU), CCPA/VCDPA (US), PIPEDA (Canada), and Australian Privacy Act 1988. Learn how we collect, use, and protect your data across all four markets.',
  openGraph: {
    title: 'Privacy Policy | SmartFinPro',
    description:
      'Learn how SmartFinPro collects, uses, and protects your data under GDPR, CCPA, PIPEDA, and Australian Privacy Act.',
  },
};

/* -- Reusable Components ------------------------------------------------- */

function SectionHeading({ id, number, title }: { id: string; number: string; title: string }) {
  return (
    <h2 id={id} className="text-2xl font-bold mb-4 scroll-mt-24" style={{ color: 'var(--sfp-ink)' }}>
      {number}. {title}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold mb-3 mt-6" style={{ color: 'var(--sfp-ink)' }}>{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>{children}</p>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1.5 text-xs shrink-0" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span>
      <span>{children}</span>
    </li>
  );
}

function BulletList({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-3 leading-relaxed mb-4" style={{ color: 'var(--sfp-ink)' }}>{children}</ul>;
}

function RegionBox({
  title,
  flag,
  children,
}: {
  title: string;
  flag: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 mb-4"
    >
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>
        {flag} {title}
      </h3>
      <div className="text-sm leading-relaxed space-y-3" style={{ color: 'var(--sfp-ink)' }}>{children}</div>
    </div>
  );
}

function ImportantBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border border-amber-200 p-5 mb-6"
      style={{ background: '#FEF5E7' }}
    >
      <div className="leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>{children}</div>
    </div>
  );
}

/* -- Table of Contents Data ---------------------------------------------- */

const tocSections = [
  { id: 'scope', number: '1', title: 'Scope and Applicability' },
  { id: 'controller', number: '2', title: 'Data Controller and Responsible Entity' },
  { id: 'information-collected', number: '3', title: 'Information We Collect' },
  { id: 'legal-bases', number: '4', title: 'Legal Bases for Processing' },
  { id: 'how-we-use', number: '5', title: 'How We Use Your Information' },
  { id: 'calculators-tools', number: '6', title: 'Calculators, Tools, and Interactive Features' },
  { id: 'cookies-tracking', number: '7', title: 'Cookies, Tracking, and Affiliate Attribution' },
  { id: 'affiliate-disclosure', number: '8', title: 'Affiliate Relationships and Financial Disclosures' },
  { id: 'third-party-sharing', number: '9', title: 'Third-Party Sharing and Disclosures' },
  { id: 'data-storage', number: '10', title: 'Data Storage, Security, and Retention' },
  { id: 'international-transfers', number: '11', title: 'International Data Transfers' },
  { id: 'rights-gdpr', number: '12', title: 'Your Rights — UK and EU (GDPR)' },
  { id: 'rights-us', number: '13', title: 'Your Rights — United States (CCPA, VCDPA, FTC)' },
  { id: 'rights-canada', number: '14', title: 'Your Rights — Canada (PIPEDA)' },
  { id: 'rights-australia', number: '15', title: 'Your Rights — Australia (Privacy Act 1988)' },
  { id: 'children', number: '16', title: 'Children\'s Privacy' },
  { id: 'third-party-links', number: '17', title: 'Third-Party Links and Services' },
  { id: 'changes', number: '18', title: 'Changes to This Policy' },
  { id: 'contact', number: '19', title: 'Contact Us and Complaints' },
];

/* -- Page Component ------------------------------------------------------ */

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Header */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Privacy Policy
            </h1>
            <p className="text-xl mb-4" style={{ color: 'var(--sfp-slate)' }}>
              Your privacy matters. This policy explains how SmartFinPro collects, uses, stores,
              and protects your personal data across all four markets we serve.
            </p>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              This policy complies with the UK GDPR, the EU General Data Protection Regulation,
              the California Consumer Privacy Act (CCPA), the Virginia Consumer Data Protection Act (VCDPA),
              FTC guidelines, Canada&apos;s Personal Information Protection and Electronic Documents Act (PIPEDA),
              and the Australian Privacy Act 1988 including the Australian Privacy Principles (APPs).
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div
            className="max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12"
          >
            <p className="text-sm mb-6" style={{ color: 'var(--sfp-slate)' }}>
              <strong style={{ color: 'var(--sfp-ink)' }}>Effective date:</strong> 11 February 2026
              &nbsp;|&nbsp;
              <strong style={{ color: 'var(--sfp-ink)' }}>Last updated:</strong> 11 February 2026
            </p>

            {/* -- Table of Contents ------------------------------------ */}
            <nav
              className="rounded-xl border border-gray-200 p-6 mb-12"
              style={{ background: 'var(--sfp-sky)' }}
              aria-label="Table of Contents"
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--sfp-ink)' }}>Table of Contents</h2>
              <ol className="grid md:grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                {tocSections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--sfp-navy)' }}
                    >
                      {s.number}. {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* -- 1. Scope -------------------------------------------- */}
            <div className="mb-12">
              <SectionHeading id="scope" number="1" title="Scope and Applicability" />
              <P>
                SmartFinPro (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website{' '}
                <strong style={{ color: 'var(--sfp-ink)' }}>smartfinpro.com</strong> (the &quot;Site&quot;). This Privacy
                Policy applies to all visitors and users of the Site, regardless of geographic location. It
                describes how we collect, use, disclose, and safeguard personal information when you:
              </P>
              <BulletList>
                <Bullet>Visit or browse any page on the Site, including market-specific sections (US, UK, Canada, Australia)</Bullet>
                <Bullet>Use our interactive tools and calculators (mortgage calculator, credit card rewards calculator, ISA tax savings calculator, trading cost calculator, broker comparison, and others)</Bullet>
                <Bullet>Subscribe to our newsletter or download lead magnets such as the Credit Card Optimization Guide</Bullet>
                <Bullet>Click on affiliate links that redirect you to third-party financial product providers</Bullet>
              </BulletList>
              <P>
                By using the Site, you acknowledge that you have read and understood this Privacy Policy. If
                you do not agree, please discontinue use of the Site.
              </P>
            </div>

            {/* -- 2. Data Controller ---------------------------------- */}
            <div className="mb-12">
              <SectionHeading id="controller" number="2" title="Data Controller and Responsible Entity" />
              <P>
                For the purposes of applicable data protection laws, the data controller responsible for
                your personal data is:
              </P>
              <div
                className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 mb-4"
              >
                <p className="font-semibold mb-1" style={{ color: 'var(--sfp-ink)' }}>SmartFinPro</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                  Email:{' '}
                  <a href="mailto:privacy@smartfinpro.com" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--sfp-navy)' }}>
                    privacy@smartfinpro.com
                  </a>
                  <br />
                  Data Protection Officer (DPO):{' '}
                  <a href="mailto:dpo@smartfinpro.com" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--sfp-navy)' }}>
                    dpo@smartfinpro.com
                  </a>
                </p>
              </div>
              <P>
                If you are located in the United Kingdom or European Economic Area, our designated Data
                Protection Officer can be reached at{' '}
                <a href="mailto:dpo@smartfinpro.com" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--sfp-navy)' }}>
                  dpo@smartfinpro.com
                </a>
                .
              </P>
            </div>

            {/* -- 3. Information We Collect ---------------------------- */}
            <div className="mb-12">
              <SectionHeading id="information-collected" number="3" title="Information We Collect" />

              <SubHeading>3.1 Information You Provide Voluntarily</SubHeading>
              <BulletList>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Email address</strong> — provided when you subscribe to our
                  newsletter, download lead magnets (such as the Credit Card Optimization Guide), or contact us
                  via our contact form.
                </Bullet>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Cookie consent preferences</strong> — your choice regarding
                  analytics and non-essential cookies, stored locally on your device.
                </Bullet>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>GDPR consent confirmation</strong> — when you tick the consent
                  checkbox before subscribing to our newsletter.
                </Bullet>
              </BulletList>

              <SubHeading>3.2 Information Collected Automatically</SubHeading>
              <BulletList>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Hashed IP addresses</strong> — we apply SHA-256 hashing to IP
                  addresses before storage. The original IP address is not retained. Hashed IPs are used solely
                  for aggregate analytics and cannot be traced back to individual users.
                </Bullet>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Page views and navigation data</strong> — which pages you visit,
                  time spent, referral source, and general browsing patterns.
                </Bullet>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Device and browser information</strong> — browser type and
                  version, operating system, screen resolution, and language preference, collected via
                  first-party analytics.
                </Bullet>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Affiliate click data</strong> — when you click an affiliate
                  link (via our <code className="text-sm" style={{ color: 'var(--sfp-navy)' }}>/go/</code> redirect routes), we record
                  the click event, timestamp, and destination for commission attribution purposes.
                </Bullet>
              </BulletList>

              <SubHeading>3.3 Information We Do Not Collect</SubHeading>
              <P>
                SmartFinPro does <strong style={{ color: 'var(--sfp-ink)' }}>not</strong> collect or store:
              </P>
              <BulletList>
                <Bullet>Financial account numbers, credit card details, Social Security numbers, or government identifiers</Bullet>
                <Bullet>Login credentials for any third-party service</Bullet>
                <Bullet>Health or biometric data</Bullet>
                <Bullet>Data entered into our calculators (see Section 6 below)</Bullet>
              </BulletList>
            </div>

            {/* -- 4. Legal Bases -------------------------------------- */}
            <div className="mb-12">
              <SectionHeading id="legal-bases" number="4" title="Legal Bases for Processing" />
              <P>
                Under the GDPR (applicable to UK and EU residents), we process personal data on the following
                legal bases:
              </P>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--sfp-sky)' }}>
                      <th className="text-left px-4 py-3 font-semibold border-b border-gray-200" style={{ color: 'var(--sfp-navy)' }}>Processing Activity</th>
                      <th className="text-left px-4 py-3 font-semibold border-b border-gray-200" style={{ color: 'var(--sfp-navy)' }}>Legal Basis (Art. 6 GDPR)</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: 'var(--sfp-ink)' }}>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">Sending newsletter emails</td>
                      <td className="px-4 py-3">Consent (Art. 6(1)(a))</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">First-party analytics (hashed IPs, page views)</td>
                      <td className="px-4 py-3">Legitimate interest (Art. 6(1)(f))</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">Affiliate click tracking</td>
                      <td className="px-4 py-3">Legitimate interest (Art. 6(1)(f))</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">Non-essential / analytics cookies</td>
                      <td className="px-4 py-3">Consent (via cookie banner)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Responding to data subject requests</td>
                      <td className="px-4 py-3">Legal obligation (Art. 6(1)(c))</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <P>
                For users in jurisdictions that do not require a specific legal basis (e.g. certain US states),
                we nonetheless apply the principle of data minimisation and collect only the information
                reasonably necessary for the stated purpose.
              </P>
            </div>

            {/* -- 5. How We Use --------------------------------------- */}
            <div className="mb-12">
              <SectionHeading id="how-we-use" number="5" title="How We Use Your Information" />
              <BulletList>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Newsletter and lead magnet delivery</strong> — to send financial
                  insights, product updates, and resources you have subscribed to receive, including the Credit
                  Card Optimization Guide and similar materials. Every email includes a one-click unsubscribe link.
                </Bullet>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Analytics and content improvement</strong> — to understand
                  which content is most useful so we can improve our reviews, guides, calculators, and tools
                  across all four markets.
                </Bullet>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Affiliate commission attribution</strong> — to record that a
                  click originated from our Site and to reconcile commission payments from affiliate partners.
                </Bullet>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Site security and abuse prevention</strong> — to detect and
                  prevent fraudulent or malicious activity on the Site.
                </Bullet>
              </BulletList>
              <ImportantBox>
                <p>
                  <strong style={{ color: 'var(--sfp-gold)' }}>We never sell your data.</strong> Your personal information
                  is never sold, rented, traded, or shared with third parties for their own marketing purposes
                  under any circumstances. This commitment applies regardless of your jurisdiction.
                </p>
              </ImportantBox>
            </div>

            {/* -- 6. Calculators & Tools ------------------------------ */}
            <div className="mb-12">
              <SectionHeading id="calculators-tools" number="6" title="Calculators, Tools, and Interactive Features" />
              <P>
                SmartFinPro provides several interactive financial calculators and tools, including but not
                limited to:
              </P>
              <BulletList>
                <Bullet>Mortgage / Home Loan Calculator (AU)</Bullet>
                <Bullet>Credit Card Rewards Calculator</Bullet>
                <Bullet>ISA Tax Savings Calculator (UK)</Bullet>
                <Bullet>Trading Cost Calculator</Bullet>
                <Bullet>Wealthsimple Calculator (CA)</Bullet>
                <Bullet>Broker Comparison and Broker Finder Tools</Bullet>
                <Bullet>AI ROI Calculator</Bullet>
                <Bullet>Loan Calculator</Bullet>
              </BulletList>
              <ImportantBox>
                <p>
                  <strong style={{ color: 'var(--sfp-gold)' }}>Calculator data is processed client-side only.</strong>{' '}
                  All data you enter into our calculators (income figures, spending amounts, loan balances,
                  interest rates, etc.) is processed entirely within your web browser. This data is{' '}
                  <strong style={{ color: 'var(--sfp-ink)' }}>not transmitted to our servers</strong> and is{' '}
                  <strong style={{ color: 'var(--sfp-ink)' }}>not stored, logged, or retained</strong> by SmartFinPro in any
                  form. When you close or navigate away from the calculator page, the data ceases to exist.
                </p>
              </ImportantBox>
              <P>
                Calculator results are for illustrative and educational purposes only and do not constitute
                financial advice. See our{' '}
                <Link href="/terms" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--sfp-navy)' }}>
                  Terms of Service
                </Link>{' '}
                for the full disclaimer.
              </P>
            </div>

            {/* -- 7. Cookies & Tracking ------------------------------- */}
            <div className="mb-12">
              <SectionHeading id="cookies-tracking" number="7" title="Cookies, Tracking, and Affiliate Attribution" />

              <SubHeading>7.1 Cookie Categories</SubHeading>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--sfp-sky)' }}>
                      <th className="text-left px-4 py-3 font-semibold border-b border-gray-200" style={{ color: 'var(--sfp-navy)' }}>Category</th>
                      <th className="text-left px-4 py-3 font-semibold border-b border-gray-200" style={{ color: 'var(--sfp-navy)' }}>Purpose</th>
                      <th className="text-left px-4 py-3 font-semibold border-b border-gray-200" style={{ color: 'var(--sfp-navy)' }}>Consent Required</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: 'var(--sfp-ink)' }}>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--sfp-ink)' }}>Essential</td>
                      <td className="px-4 py-3">Site functionality, cookie consent preference storage</td>
                      <td className="px-4 py-3">No (strictly necessary)</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--sfp-ink)' }}>Analytics</td>
                      <td className="px-4 py-3">First-party usage analytics (page views, navigation patterns)</td>
                      <td className="px-4 py-3">Yes (via cookie banner)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--sfp-ink)' }}>Affiliate Attribution</td>
                      <td className="px-4 py-3">Tracking clicks on affiliate links for commission reconciliation</td>
                      <td className="px-4 py-3">Yes (via cookie banner)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <SubHeading>7.2 Cookie Consent Mechanism</SubHeading>
              <P>
                When you first visit SmartFinPro, a cookie consent banner presents you with two options:
              </P>
              <BulletList>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Accept All</strong> — enables essential, analytics, and affiliate
                  attribution cookies.
                </Bullet>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Essential Only</strong> — limits cookies to those strictly
                  necessary for the Site to function. Analytics and affiliate tracking are disabled.
                </Bullet>
              </BulletList>
              <P>
                Your preference is stored in your browser&apos;s local storage (key:{' '}
                <code className="text-sm" style={{ color: 'var(--sfp-navy)' }}>cookie-consent</code>) and respected on all subsequent
                visits. You may change your preference at any time by clearing your browser data.
              </P>

              <SubHeading>7.3 Affiliate Tracking and Partner Cookies</SubHeading>
              <P>
                When you click an affiliate link on our Site (all such links use the{' '}
                <code className="text-sm" style={{ color: 'var(--sfp-navy)' }}>/go/</code> URL pattern), you are redirected through
                our server to the partner&apos;s website. During this process:
              </P>
              <BulletList>
                <Bullet>We record the click event (affiliate slug, timestamp, hashed session identifier) for commission attribution.</Bullet>
                <Bullet>The partner&apos;s website (e.g. eToro, American Express, Chase, Wealthsimple, Hargreaves Lansdown) may set its own cookies on your device for tracking purposes, subject to the partner&apos;s own privacy policy.</Bullet>
                <Bullet>We do not have access to or control over cookies set by third-party partners after you leave our Site.</Bullet>
              </BulletList>
              <P>
                We do not currently use third-party advertising networks, retargeting pixels, or social
                media tracking pixels on SmartFinPro.
              </P>
            </div>

            {/* -- 8. Affiliate Disclosure ----------------------------- */}
            <div className="mb-12">
              <SectionHeading id="affiliate-disclosure" number="8" title="Affiliate Relationships and Financial Disclosures" />
              <ImportantBox>
                <p>
                  <strong style={{ color: 'var(--sfp-gold)' }}>FTC Disclosure (United States):</strong> In accordance with
                  the Federal Trade Commission&apos;s guidelines concerning endorsements and testimonials (16
                  CFR Part 255), SmartFinPro discloses that we may receive compensation when users click on
                  affiliate links and sign up for financial products featured on our Site. This compensation does
                  not influence our ratings, rankings, or editorial content.
                </p>
              </ImportantBox>
              <P>
                SmartFinPro maintains affiliate relationships with regulated financial institutions and product
                providers across our four markets. These relationships are fully disclosed:
              </P>
              <BulletList>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>On-page disclosures</strong> — every review and comparison page
                  includes a clear affiliate disclosure at the top of the content, above the fold.
                </Bullet>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Link labelling</strong> — all affiliate links carry the{' '}
                  <code className="text-sm" style={{ color: 'var(--sfp-navy)' }}>rel=&quot;sponsored&quot;</code> attribute.
                </Bullet>
                <Bullet>
                  <strong style={{ color: 'var(--sfp-ink)' }}>Dedicated disclosure page</strong> — our{' '}
                  <Link href="/affiliate-disclosure" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--sfp-navy)' }}>
                    Affiliate Disclosure
                  </Link>{' '}
                  page provides full details of how we earn revenue and maintain editorial independence.
                </Bullet>
              </BulletList>
              <P>
                Affiliate commissions come at no additional cost to the user. Our ratings are determined by a
                consistent{' '}
                <Link href="/methodology" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--sfp-navy)' }}>
                  scoring methodology
                </Link>{' '}
                and are never influenced by commission rates.
              </P>
            </div>

            {/* -- 9. Third-Party Sharing ------------------------------ */}
            <div className="mb-12">
              <SectionHeading id="third-party-sharing" number="9" title="Third-Party Sharing and Disclosures" />
              <P>
                We share personal data with the following categories of recipients, and only to the extent
                necessary for the stated purpose:
              </P>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--sfp-sky)' }}>
                      <th className="text-left px-4 py-3 font-semibold border-b border-gray-200" style={{ color: 'var(--sfp-navy)' }}>Recipient</th>
                      <th className="text-left px-4 py-3 font-semibold border-b border-gray-200" style={{ color: 'var(--sfp-navy)' }}>Data Shared</th>
                      <th className="text-left px-4 py-3 font-semibold border-b border-gray-200" style={{ color: 'var(--sfp-navy)' }}>Purpose</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: 'var(--sfp-ink)' }}>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">Supabase (database provider)</td>
                      <td className="px-4 py-3">Email addresses, hashed IPs, analytics events</td>
                      <td className="px-4 py-3">Data storage and retrieval</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">Vercel (hosting provider)</td>
                      <td className="px-4 py-3">Server logs (IP addresses processed transiently)</td>
                      <td className="px-4 py-3">Website hosting and delivery</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">Email service provider</td>
                      <td className="px-4 py-3">Email addresses</td>
                      <td className="px-4 py-3">Newsletter delivery</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Affiliate partners</td>
                      <td className="px-4 py-3">Click event data (no personal identifiers)</td>
                      <td className="px-4 py-3">Commission attribution and reconciliation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <P>
                We do not sell, rent, or trade personal information to any third party. We may disclose
                personal data if required to do so by law, regulation, legal process, or governmental request.
              </P>
            </div>

            {/* -- 10. Data Storage & Security ------------------------- */}
            <div className="mb-12">
              <SectionHeading id="data-storage" number="10" title="Data Storage, Security, and Retention" />

              <SubHeading>10.1 Security Measures</SubHeading>
              <BulletList>
                <Bullet>All connections to the Site are encrypted via HTTPS/TLS.</Bullet>
                <Bullet>Data at rest is stored in Supabase with encryption at rest (AES-256).</Bullet>
                <Bullet>IP addresses are hashed using SHA-256 before storage; the raw IP is never persisted.</Bullet>
                <Bullet>The Site is hosted on Vercel, which provides enterprise-grade infrastructure security, DDoS protection, and automated security patching.</Bullet>
                <Bullet>Access to databases and administrative systems is restricted to authorised personnel with multi-factor authentication.</Bullet>
              </BulletList>

              <SubHeading>10.2 Retention Periods</SubHeading>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--sfp-sky)' }}>
                      <th className="text-left px-4 py-3 font-semibold border-b border-gray-200" style={{ color: 'var(--sfp-navy)' }}>Data Type</th>
                      <th className="text-left px-4 py-3 font-semibold border-b border-gray-200" style={{ color: 'var(--sfp-navy)' }}>Retention Period</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: 'var(--sfp-ink)' }}>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">Newsletter subscriber email</td>
                      <td className="px-4 py-3">Until unsubscribe or deletion request</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">Hashed IP analytics</td>
                      <td className="px-4 py-3">12 months, then automatically purged</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">Affiliate click events</td>
                      <td className="px-4 py-3">24 months (required for commission reconciliation)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Cookie consent preference</td>
                      <td className="px-4 py-3">Stored locally in your browser; no server-side retention</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <P>
                While no method of electronic storage is 100% secure, we implement commercially reasonable
                technical and organisational measures to protect your personal data from unauthorised access,
                loss, or destruction.
              </P>
            </div>

            {/* -- 11. International Transfers ------------------------- */}
            <div className="mb-12">
              <SectionHeading id="international-transfers" number="11" title="International Data Transfers" />
              <P>
                SmartFinPro operates globally and our service providers (including Supabase and Vercel) may
                process data in the United States. Where personal data is transferred outside the UK, EEA,
                Canada, or Australia, we ensure appropriate safeguards are in place, including:
              </P>
              <BulletList>
                <Bullet>Standard Contractual Clauses (SCCs) approved by the European Commission or UK ICO, as applicable.</Bullet>
                <Bullet>Data processing agreements with all sub-processors that include equivalent data protection obligations.</Bullet>
                <Bullet>Verification that recipients maintain adequate security standards consistent with this policy.</Bullet>
              </BulletList>
            </div>

            {/* -- 12. Rights -- GDPR ---------------------------------- */}
            <div className="mb-12">
              <SectionHeading id="rights-gdpr" number="12" title="Your Rights — UK and EU (GDPR)" />
              <RegionBox title="UK and EU Residents — General Data Protection Regulation" flag="🇬🇧🇪🇺">
                <p>
                  If you are located in the United Kingdom or European Economic Area, you have the following
                  rights under the UK GDPR and EU GDPR:
                </p>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right of access</strong> (Art. 15) — obtain a copy of your personal data we hold.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to rectification</strong> (Art. 16) — correct inaccurate personal data.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to erasure</strong> (Art. 17) — request deletion of your personal data (&quot;right to be forgotten&quot;).</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to restrict processing</strong> (Art. 18) — limit how we use your data.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to data portability</strong> (Art. 20) — receive your data in a structured, machine-readable format.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to object</strong> (Art. 21) — object to processing based on legitimate interests.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to withdraw consent</strong> (Art. 7(3)) — withdraw consent at any time without affecting the lawfulness of prior processing.</span></li>
                </ul>
                <p className="mt-3">
                  To exercise any of these rights, contact our DPO at{' '}
                  <a href="mailto:dpo@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>dpo@smartfinpro.com</a>.
                  We will respond within 30 days (extendable by a further 60 days for complex requests).
                </p>
                <p className="mt-3">
                  <strong style={{ color: 'var(--sfp-ink)' }}>Right to lodge a complaint:</strong> You have the right to lodge
                  a complaint with a supervisory authority. In the UK, this is the Information Commissioner&apos;s
                  Office (ICO) at{' '}
                  <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>ico.org.uk</a>.
                </p>
              </RegionBox>
            </div>

            {/* -- 13. Rights -- US ------------------------------------ */}
            <div className="mb-12">
              <SectionHeading id="rights-us" number="13" title="Your Rights — United States (CCPA, VCDPA, FTC)" />
              <RegionBox title="California Residents — California Consumer Privacy Act (CCPA)" flag="🇺🇸">
                <p>
                  If you are a California resident, the California Consumer Privacy Act (as amended by the CPRA)
                  grants you the following rights:
                </p>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to know</strong> — request disclosure of the categories and specific pieces of personal information we have collected about you.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to delete</strong> — request deletion of personal information we have collected.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to opt out of sale</strong> — SmartFinPro does not sell personal information. We do not engage in the &quot;sale&quot; or &quot;sharing&quot; of personal information as defined by the CCPA/CPRA.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to non-discrimination</strong> — we will not discriminate against you for exercising your privacy rights.</span></li>
                </ul>
                <p className="mt-3">
                  To submit a request, email{' '}
                  <a href="mailto:privacy@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>privacy@smartfinpro.com</a>{' '}
                  with the subject line &quot;CCPA Request.&quot; We will verify your identity and respond within
                  45 days.
                </p>
              </RegionBox>

              <RegionBox title="Virginia Residents — Virginia Consumer Data Protection Act (VCDPA)" flag="🇺🇸">
                <p>
                  Virginia residents have the right to access, correct, delete, and obtain a copy of personal
                  data. You may also opt out of profiling in furtherance of automated decisions and targeted
                  advertising. SmartFinPro does not engage in targeted advertising or profiling.
                </p>
              </RegionBox>

              <RegionBox title="Financial Privacy — FTC Guidelines" flag="🇺🇸">
                <p>
                  SmartFinPro is an independent financial information publisher, not a financial institution or
                  lender. We comply with the Federal Trade Commission&apos;s guidelines on endorsements,
                  testimonials, and online advertising disclosures. All affiliate relationships are clearly
                  disclosed in compliance with 16 CFR Part 255.
                </p>
                <p className="mt-2">
                  We are not subject to the Gramm-Leach-Bliley Act (GLBA) as we do not provide financial
                  products or services. However, we voluntarily apply equivalent privacy protections to all user
                  data collected through our Site.
                </p>
              </RegionBox>
            </div>

            {/* -- 14. Rights -- Canada -------------------------------- */}
            <div className="mb-12">
              <SectionHeading id="rights-canada" number="14" title="Your Rights — Canada (PIPEDA)" />
              <RegionBox title="Canadian Residents — Personal Information Protection and Electronic Documents Act" flag="🇨🇦">
                <p>
                  Under PIPEDA, Canadian residents have the following rights regarding personal information:
                </p>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to access</strong> — request access to the personal information we hold about you.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to challenge accuracy</strong> — request correction of personal information that is inaccurate or incomplete.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to withdraw consent</strong> — withdraw your consent for the collection, use, or disclosure of your personal information at any time, subject to legal or contractual restrictions.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to complain</strong> — file a complaint with the Office of the Privacy Commissioner of Canada (OPC) at <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>priv.gc.ca</a>.</span></li>
                </ul>
                <p className="mt-3">
                  We apply the ten fair information principles of PIPEDA: accountability, identifying purposes,
                  consent, limiting collection, limiting use/disclosure/retention, accuracy, safeguards,
                  openness, individual access, and challenging compliance.
                </p>
                <p className="mt-2">
                  To exercise your rights, contact{' '}
                  <a href="mailto:privacy@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>privacy@smartfinpro.com</a>.
                  We will respond within 30 days.
                </p>
              </RegionBox>
            </div>

            {/* -- 15. Rights -- Australia ----------------------------- */}
            <div className="mb-12">
              <SectionHeading id="rights-australia" number="15" title="Your Rights — Australia (Privacy Act 1988)" />
              <RegionBox title="Australian Residents — Privacy Act 1988 and Australian Privacy Principles (APPs)" flag="🇦🇺">
                <p>
                  Under the Australian Privacy Act 1988 and the 13 Australian Privacy Principles, Australian
                  residents have the following rights:
                </p>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to access</strong> (APP 12) — request access to personal information we hold about you.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to correction</strong> (APP 13) — request correction of inaccurate, out-of-date, incomplete, or misleading personal information.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to anonymity</strong> (APP 2) — in certain circumstances, you have the option of not identifying yourself when dealing with us.</span></li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-xs" style={{ color: 'var(--sfp-navy)' }}>&#9679;</span><span><strong style={{ color: 'var(--sfp-ink)' }}>Right to complain</strong> — you may make a complaint to us or directly to the Office of the Australian Information Commissioner (OAIC).</span></li>
                </ul>

                <div className="mt-4 p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--sfp-ink)' }}>Complaints Process</p>
                  <p>
                    If you believe we have breached your privacy, please contact us first at{' '}
                    <a href="mailto:privacy@smartfinpro.com" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>privacy@smartfinpro.com</a>.
                    We will investigate and respond within 30 days. If you are not satisfied with our response,
                    you may lodge a complaint with the OAIC:
                  </p>
                  <p className="mt-2">
                    <strong style={{ color: 'var(--sfp-ink)' }}>Office of the Australian Information Commissioner</strong><br />
                    Website:{' '}
                    <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>oaic.gov.au</a><br />
                    Phone: 1300 363 992
                  </p>
                </div>

                <p className="mt-3">
                  We collect, hold, use, and disclose personal information in accordance with APPs 1 through 13.
                  Where we disclose personal information to overseas recipients (APP 8), we take reasonable steps
                  to ensure the recipient complies with the APPs or is subject to a substantially similar law.
                </p>
              </RegionBox>
            </div>

            {/* -- 16. Children ---------------------------------------- */}
            <div className="mb-12">
              <SectionHeading id="children" number="16" title="Children&apos;s Privacy" />
              <P>
                SmartFinPro is not directed to individuals under the age of 18. We do not knowingly collect
                personal information from children. If you are a parent or guardian and believe your child has
                provided us with personal information, please contact us at{' '}
                <a href="mailto:privacy@smartfinpro.com" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--sfp-navy)' }}>
                  privacy@smartfinpro.com
                </a>{' '}
                and we will promptly delete such information.
              </P>
            </div>

            {/* -- 17. Third-Party Links ------------------------------- */}
            <div className="mb-12">
              <SectionHeading id="third-party-links" number="17" title="Third-Party Links and Services" />
              <P>
                Our Site contains links to third-party websites and financial products, including but not
                limited to broker platforms, credit card issuers, investment platforms, and banking services.
                All affiliate links use our{' '}
                <code className="text-sm" style={{ color: 'var(--sfp-navy)' }}>/go/</code> redirect pattern and carry the{' '}
                <code className="text-sm" style={{ color: 'var(--sfp-navy)' }}>rel=&quot;sponsored&quot;</code> attribute.
              </P>
              <P>
                Once you leave SmartFinPro by clicking any external link, you are subject to the privacy
                policy and terms of service of the destination website. We are not responsible for the privacy
                practices, content, or security of any third-party website. We encourage you to review the
                privacy policy of every website you visit.
              </P>
            </div>

            {/* -- 18. Changes ----------------------------------------- */}
            <div className="mb-12">
              <SectionHeading id="changes" number="18" title="Changes to This Policy" />
              <P>
                We may update this Privacy Policy from time to time to reflect changes in our practices,
                technology, legal requirements, or other factors. When we make material changes:
              </P>
              <BulletList>
                <Bullet>The &quot;Last updated&quot; date at the top of this page will be revised.</Bullet>
                <Bullet>For material changes, we will provide notice through a prominent banner on the Site or via email to newsletter subscribers.</Bullet>
                <Bullet>Previous versions of this policy will be made available upon request.</Bullet>
              </BulletList>
              <P>
                Your continued use of SmartFinPro after any changes constitutes acceptance of the revised
                Privacy Policy.
              </P>
            </div>

            {/* -- 19. Contact ----------------------------------------- */}
            <div>
              <SectionHeading id="contact" number="19" title="Contact Us and Complaints" />
              <P>
                If you have questions, concerns, or requests regarding this Privacy Policy or the handling of
                your personal data, please contact us through any of the following channels:
              </P>
              <div
                className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-6"
              >
                <div className="grid md:grid-cols-2 gap-6 text-sm" style={{ color: 'var(--sfp-ink)' }}>
                  <div>
                    <p className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>General Privacy Enquiries</p>
                    <a
                      href="mailto:privacy@smartfinpro.com"
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--sfp-navy)' }}
                    >
                      privacy@smartfinpro.com
                    </a>
                  </div>
                  <div>
                    <p className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>Data Protection Officer (UK/EU)</p>
                    <a
                      href="mailto:dpo@smartfinpro.com"
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--sfp-navy)' }}
                    >
                      dpo@smartfinpro.com
                    </a>
                  </div>
                  <div>
                    <p className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>CCPA / US Privacy Requests</p>
                    <a
                      href="mailto:privacy@smartfinpro.com"
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--sfp-navy)' }}
                    >
                      privacy@smartfinpro.com
                    </a>
                    <p className="mt-1" style={{ color: 'var(--sfp-slate)' }}>Subject line: &quot;CCPA Request&quot;</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>General Support</p>
                    <a
                      href="mailto:support@smartfinpro.com"
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--sfp-navy)' }}
                    >
                      support@smartfinpro.com
                    </a>
                  </div>
                </div>
              </div>

              <SubHeading>Supervisory Authorities and Regulators</SubHeading>
              <div className="space-y-3 mb-4">
                <RegionBox title="UK — Information Commissioner's Office (ICO)" flag="🇬🇧">
                  <p>
                    Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>ico.org.uk</a>
                    &nbsp;|&nbsp;Phone: 0303 123 1113
                  </p>
                </RegionBox>
                <RegionBox title="Canada — Office of the Privacy Commissioner (OPC)" flag="🇨🇦">
                  <p>
                    Website: <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>priv.gc.ca</a>
                    &nbsp;|&nbsp;Phone: 1-800-282-1376
                  </p>
                </RegionBox>
                <RegionBox title="Australia — Office of the Australian Information Commissioner (OAIC)" flag="🇦🇺">
                  <p>
                    Website: <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>oaic.gov.au</a>
                    &nbsp;|&nbsp;Phone: 1300 363 992
                  </p>
                </RegionBox>
                <RegionBox title="United States — Federal Trade Commission (FTC)" flag="🇺🇸">
                  <p>
                    Website: <a href="https://www.ftc.gov" target="_blank" rel="noopener noreferrer" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>ftc.gov</a>
                    &nbsp;|&nbsp;Consumer complaints: <a href="https://reportfraud.ftc.gov" target="_blank" rel="noopener noreferrer" className="hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>reportfraud.ftc.gov</a>
                  </p>
                </RegionBox>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
