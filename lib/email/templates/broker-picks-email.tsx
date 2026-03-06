// lib/email/templates/broker-picks-email.tsx
// Nurture Step 3 (Day 10) — "Top Regulated Brokers for [Market] 2026"
// Soft-sell: links to our broker comparison pages

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

interface BrokerPicksEmailProps {
  unsubscribeUrl: string;
  baseUrl: string;
  country: 'us' | 'uk' | 'ca' | 'au' | 'de';
}

const marketConfig: Record<string, {
  marketLabel: string;
  prefix: string;
  currency: string;
  regulator: string;
  brokers: Array<{ name: string; highlight: string; slug: string; category: string }>;
}> = {
  us: {
    marketLabel: 'US',
    prefix: '/us',
    currency: 'USD',
    regulator: 'SEC/FINRA',
    brokers: [
      { name: 'Interactive Brokers', highlight: 'Lowest margin rates, 150+ markets, SIPC insured', slug: 'ibkr', category: 'trading' },
      { name: 'eToro', highlight: 'Commission-free stocks, $50 minimum, copy trading', slug: 'etoro', category: 'trading' },
      { name: 'Mercury', highlight: '$0 monthly fee, API banking, ideal for startups', slug: 'mercury', category: 'business-banking' },
    ],
  },
  uk: {
    marketLabel: 'UK',
    prefix: '/uk',
    currency: 'GBP',
    regulator: 'FCA',
    brokers: [
      { name: 'IG Group', highlight: '70+ years track record, FCA regulated, 17,000+ markets', slug: 'ig', category: 'trading' },
      { name: 'Trading 212', highlight: 'Commission-free ISA, £1 minimum, FSCS protected', slug: 'trading-212-isa', category: 'personal-finance' },
      { name: 'Starling Bank', highlight: 'Award-winning business account, real-time notifications', slug: 'starling-bank', category: 'business-banking' },
    ],
  },
  ca: {
    marketLabel: 'Canada',
    prefix: '/ca',
    currency: 'CAD',
    regulator: 'CIRO',
    brokers: [
      { name: 'Wealthsimple', highlight: '$0 commission, CIPF protected, 4.5% HISA rate', slug: 'wealthsimple', category: 'personal-finance' },
      { name: 'Questrade', highlight: 'Free ETF buys, RRSP/TFSA/RESP accounts', slug: 'questrade', category: 'trading' },
      { name: 'EQ Bank', highlight: '3.5% everyday interest, no monthly fees', slug: 'eq-bank', category: 'business-banking' },
    ],
  },
  au: {
    marketLabel: 'Australia',
    prefix: '/au',
    currency: 'AUD',
    regulator: 'ASIC',
    brokers: [
      { name: 'IG Markets', highlight: 'Australia\'s #1 CFD broker, ASIC regulated since 2002', slug: 'ig', category: 'trading' },
      { name: 'CommSec', highlight: 'CBA backed, ASX direct access, CHESS sponsored', slug: 'commsec', category: 'trading' },
      { name: 'Up Bank', highlight: '4.5% savings, instant notifications, ASIC backed', slug: 'up-bank', category: 'business-banking' },
    ],
  },
  de: {
    marketLabel: 'Europe',
    prefix: '/uk',
    currency: 'EUR',
    regulator: 'BaFin/FCA',
    brokers: [
      { name: 'eToro', highlight: 'Commission-free stocks, €50 minimum, copy trading', slug: 'etoro', category: 'trading' },
      { name: 'IBKR', highlight: 'Lowest margin rates, 150+ markets, SIPC/FSCS insured', slug: 'ibkr', category: 'trading' },
      { name: 'Wise Business', highlight: 'Real mid-market rates, save up to 6x on transfers', slug: 'wise-business', category: 'business-banking' },
    ],
  },
};

export function BrokerPicksEmail({ unsubscribeUrl, baseUrl, country }: BrokerPicksEmailProps) {
  const market = marketConfig[country] ?? marketConfig.us;
  const comparisonUrl = `${baseUrl}${market.prefix}/trading`;

  return (
    <Html>
      <Head />
      <Preview>Our top-rated {market.regulator}-regulated brokers for {market.marketLabel} investors</Preview>
      <Body style={{ backgroundColor: '#F2F4F8', fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: '40px 16px' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          {/* Header */}
          <Section style={{ background: 'linear-gradient(135deg, #1B4F8C 0%, #163D6E 100%)', padding: '32px 40px 28px' }}>
            <Text style={{ margin: 0, fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#F5A623' }}>
              SmartFinPro
            </Text>
            <Heading style={{ margin: '12px 0 0', fontSize: '24px', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
              Our Top 3 Regulated Brokers for {market.marketLabel} 2026
            </Heading>
            <Text style={{ margin: '8px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
              90-day tested · {market.regulator} regulated · Independently reviewed
            </Text>
          </Section>

          {/* Intro */}
          <Section style={{ padding: '28px 40px 8px' }}>
            <Text style={{ margin: 0, fontSize: '15px', color: '#1A1A2E', lineHeight: 1.7 }}>
              Hi there,
            </Text>
            <Text style={{ margin: '12px 0 0', fontSize: '15px', color: '#1A1A2E', lineHeight: 1.7 }}>
              We&apos;ve spent 90 days testing brokers so you don&apos;t have to.
              Here are our top 3 picks for {market.marketLabel} investors — all <strong>regulated by {market.regulator}</strong>,
              verified for compliance, and independently scored.
            </Text>
          </Section>

          {/* Broker Cards */}
          {market.brokers.map((broker, i) => (
            <Section key={broker.slug} style={{ padding: '8px 40px' }}>
              <div style={{
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '18px 20px',
                backgroundColor: i === 0 ? '#EBF2FF' : '#F8FAFC',
                borderLeft: i === 0 ? '4px solid #F5A623' : '4px solid #E2E8F0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                  <Text style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: i === 0 ? '#D48B1A' : '#64748B', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    #{i + 1}{i === 0 ? ' · Editor\'s Choice' : ''}
                  </Text>
                </div>
                <Text style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700, color: '#1B4F8C' }}>
                  {broker.name}
                </Text>
                <Text style={{ margin: '0 0 12px', fontSize: '14px', color: '#555555', lineHeight: 1.5 }}>
                  {broker.highlight}
                </Text>
                <Link
                  href={`${baseUrl}${market.prefix}/${broker.category}/${broker.slug}-review`}
                  style={{ fontSize: '13px', fontWeight: 600, color: '#1B4F8C', textDecoration: 'none' }}
                >
                  Read Full Review →
                </Link>
              </div>
            </Section>
          ))}

          {/* CTA */}
          <Section style={{ padding: '20px 40px 28px', textAlign: 'center' as const }}>
            <Button
              href={comparisonUrl}
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
              Compare All {market.marketLabel} Brokers →
            </Button>
          </Section>

          <Hr style={{ borderColor: '#E2E8F0', margin: '0 40px' }} />

          {/* Footer */}
          <Section style={{ padding: '20px 40px' }}>
            <Text style={{ margin: 0, fontSize: '11px', color: '#94A3B8', lineHeight: 1.6, textAlign: 'center' as const }}>
              You&apos;re receiving this because you subscribed to SmartFinPro.com.<br />
              Capital at risk. Past performance is not indicative of future results.
              All brokers are independently reviewed and regulated by {market.regulator}.
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
