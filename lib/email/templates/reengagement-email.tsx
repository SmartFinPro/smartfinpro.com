// lib/email/templates/reengagement-email.tsx
// Nurture Step 4 (Day 21) — "What's new + our best content this month"
// Re-engagement email with curated content picks

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface ReEngagementEmailProps {
  unsubscribeUrl: string;
  baseUrl: string;
  country: 'us' | 'uk' | 'ca' | 'au' | 'de';
}

const contentByMarket: Record<string, {
  intro: string;
  picks: Array<{ title: string; desc: string; url: string; tag: string }>;
  ctaLabel: string;
  ctaUrl: string;
}> = {
  us: {
    intro: 'Here\'s a quick roundup of our most-read guides this month for US finance professionals.',
    picks: [
      { title: 'Best AI Tools for Financial Advisors 2026', desc: 'We tested 11 tools. Only 4 pass FINRA compliance.', url: '/us/ai-tools', tag: 'AI Tools' },
      { title: 'IBKR vs eToro: Full Comparison', desc: 'Which broker wins on fees, margin, and platform quality?', url: '/us/trading', tag: 'Broker Comparison' },
      { title: 'Business Credit Cards for Finance Firms', desc: 'Amex vs Chase vs Brex — the definitive 2026 verdict.', url: '/us/personal-finance', tag: 'Credit Cards' },
    ],
    ctaLabel: 'Browse All US Reports',
    ctaUrl: '/us',
  },
  uk: {
    intro: 'Here\'s a roundup of our best FCA-regulated content this month for UK finance professionals.',
    picks: [
      { title: 'Best ISA Accounts UK 2026', desc: 'Vanguard vs Hargreaves Lansdown vs Trading 212 — we rank all 7.', url: '/uk/personal-finance', tag: 'ISA Investing' },
      { title: 'IG Group vs Spreadex: Full Comparison', desc: 'Which FCA broker wins on spreads, platform, and support?', url: '/uk/trading', tag: 'FCA Brokers' },
      { title: 'Best UK Business Accounts 2026', desc: 'Starling vs Tide vs HSBC — no-fees, real-time payments.', url: '/uk/business-banking', tag: 'Business Banking' },
    ],
    ctaLabel: 'Browse All UK Reports',
    ctaUrl: '/uk',
  },
  ca: {
    intro: 'Here\'s a roundup of our best CIRO-verified content this month for Canadian investors.',
    picks: [
      { title: 'Wealthsimple vs Questrade 2026', desc: 'TFSA, RRSP, and RESP — the definitive Canadian comparison.', url: '/ca/personal-finance/wealthsimple-vs-questrade', tag: 'CIRO Brokers' },
      { title: 'Best AI Tools for Canadian Advisors', desc: '11 tools tested for OSFI compliance and French language support.', url: '/ca/ai-tools', tag: 'AI Tools' },
      { title: 'Top Business Banking Canada 2026', desc: 'RBC vs TD vs EQ Bank — fees, rates, and integrations compared.', url: '/ca/business-banking', tag: 'Business Banking' },
    ],
    ctaLabel: 'Browse All Canada Reports',
    ctaUrl: '/ca',
  },
  au: {
    intro: 'Here\'s a roundup of our best ASIC-licensed content this month for Australian investors.',
    picks: [
      { title: 'Best Home Loan Rates Australia 2026', desc: 'Athena vs CommBank vs ubank — lowest rates ranked.', url: '/au/personal-finance', tag: 'Home Loans' },
      { title: 'IG Markets vs Pepperstone: Full Review', desc: 'ASIC-regulated CFD brokers compared on spreads and platform.', url: '/au/trading', tag: 'ASIC Brokers' },
      { title: 'Best Business Banking Australia 2026', desc: 'Airwallex vs ANZ vs Up Business — fees, features, verdict.', url: '/au/business-banking', tag: 'Business Banking' },
    ],
    ctaLabel: 'Browse All AU Reports',
    ctaUrl: '/au',
  },
  de: {
    intro: 'Here\'s a roundup of our best European finance content this month.',
    picks: [
      { title: 'Best European Brokers 2026', desc: 'eToro vs IBKR vs XTB — regulated, tested, ranked.', url: '/uk/trading', tag: 'EU Brokers' },
      { title: 'Best AI Tools for Finance 2026', desc: '11 AI tools ranked for compliance and productivity.', url: '/uk/ai-tools', tag: 'AI Tools' },
      { title: 'Business Banking Comparison', desc: 'Wise vs Revolut Business vs Starling — the 2026 verdict.', url: '/uk/business-banking', tag: 'Business Banking' },
    ],
    ctaLabel: 'Browse All Reports',
    ctaUrl: '/uk',
  },
};

export function ReEngagementEmail({ unsubscribeUrl, baseUrl, country }: ReEngagementEmailProps) {
  const content = contentByMarket[country] ?? contentByMarket.us;

  return (
    <Html>
      <Head />
      <Preview>3 reports your peers are reading this month — SmartFinPro</Preview>
      <Body style={{ backgroundColor: '#F2F4F8', fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: '40px 16px' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          {/* Header */}
          <Section style={{ background: 'linear-gradient(135deg, #1B4F8C 0%, #163D6E 100%)', padding: '32px 40px 28px' }}>
            <Text style={{ margin: 0, fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#F5A623' }}>
              SmartFinPro · Monthly Picks
            </Text>
            <Heading style={{ margin: '12px 0 0', fontSize: '23px', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
              What your peers are reading this month
            </Heading>
          </Section>

          {/* Intro */}
          <Section style={{ padding: '28px 40px 8px' }}>
            <Text style={{ margin: 0, fontSize: '15px', color: '#1A1A2E', lineHeight: 1.7 }}>
              {content.intro}
            </Text>
          </Section>

          {/* Content Picks */}
          {content.picks.map((pick, i) => (
            <Section key={i} style={{ padding: '8px 40px' }}>
              <div style={{
                borderLeft: '3px solid #F5A623',
                paddingLeft: '16px',
                marginBottom: '4px',
              }}>
                <Text style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 700, color: '#F5A623', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {pick.tag}
                </Text>
                <Link href={`${baseUrl}${pick.url}`} style={{ textDecoration: 'none' }}>
                  <Text style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#1B4F8C', lineHeight: 1.4 }}>
                    {pick.title}
                  </Text>
                </Link>
                <Text style={{ margin: 0, fontSize: '13px', color: '#555555', lineHeight: 1.5 }}>
                  {pick.desc}
                </Text>
                <Link
                  href={`${baseUrl}${pick.url}`}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#1B4F8C', textDecoration: 'none', display: 'block', marginTop: '8px' }}
                >
                  Read Report →
                </Link>
              </div>
            </Section>
          ))}

          {/* CTA */}
          <Section style={{ padding: '20px 40px 28px', textAlign: 'center' as const }}>
            <Button
              href={`${baseUrl}${content.ctaUrl}`}
              style={{
                backgroundColor: '#F5A623',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 700,
                padding: '14px 32px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {content.ctaLabel} →
            </Button>
          </Section>

          <Hr style={{ borderColor: '#E2E8F0', margin: '0 40px' }} />

          {/* Footer */}
          <Section style={{ padding: '20px 40px' }}>
            <Text style={{ margin: 0, fontSize: '11px', color: '#94A3B8', lineHeight: 1.6, textAlign: 'center' as const }}>
              You&apos;re receiving this because you subscribed to SmartFinPro.com.<br />
              We never share your email. All content is independently produced.
            </Text>
            <Text style={{ margin: '8px 0 0', fontSize: '11px', color: '#94A3B8', textAlign: 'center' as const }}>
              <Link href={unsubscribeUrl} style={{ color: '#64748B' }}>Unsubscribe</Link>
              {' · '}
              <Link href={`${baseUrl}/privacy`} style={{ color: '#64748B' }}>Privacy Policy</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
