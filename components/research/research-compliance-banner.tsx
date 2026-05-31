import Link from 'next/link';

interface ResearchComplianceBannerProps {
  asOf: string;
  nextReview: string;
}

const subCard = { borderColor: 'var(--sfp-sky)' } as const;

export function ResearchComplianceBanner({
  asOf,
  nextReview,
}: ResearchComplianceBannerProps) {
  return (
    <section
      id="compliance"
      className="rounded-2xl border p-5 shadow-sm"
      style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--sfp-gold-dark)' }}>
        General Financial Information Only
      </p>
      <p className="mt-2 text-sm leading-6" style={{ color: 'var(--sfp-ink)' }}>
        SmartFinPro Research publishes general market commentary for US and Canadian
        readers. This page is not personalized investment advice, not a broker
        recommendation, and not a solicitation to buy or sell any security.
      </p>
      <div className="mt-4 grid gap-3 text-sm leading-6 md:grid-cols-2" style={{ color: 'var(--sfp-ink)' }}>
        <div className="rounded-xl border bg-white p-4" style={subCard}>
          <p className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>Canada</p>
          <p className="mt-1">
            Commentary is framed under the NI 31-103 Section 8.25 general-advice
            exemption. SmartFinPro Research is not registered as a dealer, adviser,
            or portfolio manager in any Canadian province. Review the{' '}
            <a
              href="https://www.osc.ca/en/securities-law/instruments-rules-policies/3/31-103/unofficial-consolidation-national-instrument-31-103-registration-requirements-exemptions-and"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2"
              style={{ color: 'var(--sfp-navy)' }}
            >
              OSC text
            </a>{' '}
            before relying on this content.
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4" style={subCard}>
          <p className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>US readers</p>
          <p className="mt-1">
            This is not a FINRA Rule 2241 research report and SmartFinPro Research
            is not a FINRA member firm or SEC-registered investment adviser. Consult
            a registered adviser before acting on any information here.
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border bg-white p-4 text-sm leading-6" style={{ ...subCard, color: 'var(--sfp-ink)' }}>
        <p>
          Last reviewed: <span className="font-semibold">{asOf}</span>.
          Next review: <span className="font-semibold">{nextReview}</span>.
          Data may be stale after the review date and should be independently verified.
        </p>
        <p className="mt-2">
          Quebec note: a French version is in development for Q3 2026. A shorter
          French compliance summary is available on request at{' '}
          <a
            href="mailto:fr@smartfinpro.com"
            className="font-medium underline underline-offset-2"
            style={{ color: 'var(--sfp-navy)' }}
          >
            fr@smartfinpro.com
          </a>
          . Background on Loi 96:{' '}
          <a
            href="https://www.smartbiggar.ca/insights/publication/quebecs-french-language-requirements-for-commerce-and-business-reform-of-the-charter-of-the-french-language"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
            style={{ color: 'var(--sfp-navy)' }}
          >
            guidance summary
          </a>
          .
        </p>
        <p className="mt-2">
          See also SmartFinPro&apos;s{' '}
          <Link
            href="/editorial-policy"
            className="font-medium underline underline-offset-2"
            style={{ color: 'var(--sfp-navy)' }}
          >
            editorial policy
          </Link>{' '}
          and{' '}
          <Link
            href="/methodology"
            className="font-medium underline underline-offset-2"
            style={{ color: 'var(--sfp-navy)' }}
          >
            methodology
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
