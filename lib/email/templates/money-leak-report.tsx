// lib/email/templates/money-leak-report.tsx
// React Email template: personalized Money Leak Report sent after email capture.

import {
  Body,
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
import type { LeakResult, Recommendation, LeakCategoryId } from '@/lib/money-leak/types';

interface MoneyLeakReportEmailProps {
  result: LeakResult;
  recommendations: Recommendation[];
  currency: string;
  baseUrl: string;
  scanId: string;
  unsubscribeUrl: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
};

const CATEGORY_LABELS: Record<LeakCategoryId, string> = {
  banking: 'Banking Fees',
  subscriptions: 'Subscriptions',
  creditCards: 'Credit Card Interest',
  insurance: 'Insurance Premiums',
  investing: 'Investment Fees',
  forex: 'FX & Remittance',
};

function fmt(amount: number, currency: string) {
  const sym = CURRENCY_SYMBOLS[currency] ?? '$';
  return `${sym}${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function MoneyLeakReportEmail({
  result,
  recommendations,
  currency,
  baseUrl,
  scanId,
  unsubscribeUrl,
}: MoneyLeakReportEmailProps) {
  const annualTotal = fmt(result.totalAnnualLeak, currency);

  return (
    <Html>
      <Head />
      <Preview>Your Money Leak Report — {annualTotal}/year in recoverable savings</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Your Money Leak Report</Heading>
            <Text style={headerSub}>
              We found {annualTotal} in annual savings opportunities
            </Text>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>
              Hi there,
            </Text>
            <Text style={paragraph}>
              Based on the information you shared, your household is leaking roughly
              <strong> {annualTotal} per year</strong> across fixable categories. Here is the
              full breakdown and the best-match products to plug each leak.
            </Text>

            <Section style={bigNumberBox}>
              <Text style={bigNumberLabel}>Annual Recoverable</Text>
              <Text style={bigNumber}>{annualTotal}</Text>
              <Text style={bigNumberSub}>Severity: {result.overallSeverity.toUpperCase()}</Text>
            </Section>

            <Heading as="h2" style={h2}>Category breakdown</Heading>
            {result.categories
              .filter((c) => c.potentialSavings > 0)
              .sort((a, b) => b.potentialSavings - a.potentialSavings)
              .map((cat) => (
                <Section key={cat.id} style={categoryRow}>
                  <Text style={categoryLabel}>{CATEGORY_LABELS[cat.id]}</Text>
                  <Text style={categorySavings}>
                    Save up to <strong>{fmt(cat.potentialSavings, currency)}</strong>/year
                  </Text>
                  <Text style={categoryReason}>{cat.reason}</Text>
                </Section>
              ))}

            {recommendations.length > 0 && (
              <>
                <Heading as="h2" style={h2}>Recommended next step</Heading>
                {recommendations.map((rec) => (
                  <Section key={rec.slug} style={recCard}>
                    <Text style={recPartner}>{rec.partner_name}</Text>
                    <Text style={recSavings}>
                      Projected savings: <strong>{fmt(rec.projectedAnnualSavings, currency)}/year</strong>
                    </Text>
                    <Link
                      href={`${baseUrl}${rec.trackUrl}?utm_source=email&utm_medium=money-leak&utm_campaign=${scanId}`}
                      style={recButton}
                    >
                      View {rec.partner_name} →
                    </Link>
                    <Text style={complianceText}>{rec.complianceLabel}</Text>
                  </Section>
                ))}
              </>
            )}

            <Hr style={hr} />
            <Text style={disclaimer}>
              SmartFinPro may earn a commission when you sign up through links in this email.
              This does not affect the independence of our tool results.{' '}
              <Link href={`${baseUrl}/affiliate-disclosure`} style={inlineLink}>
                Learn more
              </Link>
              .
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              SmartFinPro · Financial Intelligence for Modern Professionals
            </Text>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles (React Email inline styles, brand-aligned) ─────────────────────

const NAVY = '#1B4F8C';
const GOLD = '#F5A623';
const GREEN = '#1A6B3A';
const INK = '#1A1A2E';
const SLATE = '#64748B';
const SKY = '#E8F0FB';
const GRAY = '#F7F8FA';

const main = {
  backgroundColor: GRAY,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: 0,
};
const container = {
  backgroundColor: '#ffffff',
  maxWidth: '600px',
  margin: '40px auto',
  borderRadius: '16px',
  overflow: 'hidden' as const,
  boxShadow: '0 6px 24px rgba(27, 79, 140, 0.08)',
};
const header = {
  background: NAVY,
  padding: '32px 24px',
  textAlign: 'center' as const,
};
const headerTitle = {
  color: '#ffffff',
  fontSize: '24px',
  margin: '0 0 8px',
  fontWeight: 700,
};
const headerSub = {
  color: '#D5E5F5',
  fontSize: '14px',
  margin: 0,
};
const content = { padding: '28px 24px' };
const paragraph = {
  color: INK,
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
};
const bigNumberBox = {
  background: SKY,
  borderRadius: '12px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '20px 0 28px',
};
const bigNumberLabel = {
  color: SLATE,
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 6px',
};
const bigNumber = {
  color: NAVY,
  fontSize: '40px',
  fontWeight: 800,
  margin: '0 0 4px',
  lineHeight: '44px',
};
const bigNumberSub = {
  color: SLATE,
  fontSize: '12px',
  margin: 0,
};
const h2 = {
  color: INK,
  fontSize: '18px',
  margin: '24px 0 12px',
  fontWeight: 700,
};
const categoryRow = {
  borderLeft: `3px solid ${GOLD}`,
  paddingLeft: '12px',
  margin: '0 0 16px',
};
const categoryLabel = {
  color: INK,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 4px',
};
const categorySavings = {
  color: GREEN,
  fontSize: '13px',
  margin: '0 0 4px',
};
const categoryReason = {
  color: SLATE,
  fontSize: '13px',
  lineHeight: '20px',
  margin: 0,
};
const recCard = {
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  padding: '16px',
  margin: '0 0 12px',
  background: '#ffffff',
};
const recPartner = {
  color: INK,
  fontSize: '16px',
  fontWeight: 700,
  margin: '0 0 6px',
};
const recSavings = {
  color: SLATE,
  fontSize: '13px',
  margin: '0 0 12px',
};
const recButton = {
  display: 'inline-block',
  background: GOLD,
  color: '#ffffff',
  padding: '10px 18px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
};
const complianceText = {
  color: SLATE,
  fontSize: '11px',
  fontStyle: 'italic' as const,
  margin: '10px 0 0',
};
const hr = {
  borderTop: '1px solid #E5E7EB',
  borderBottom: 'none',
  margin: '24px 0',
};
const disclaimer = {
  color: SLATE,
  fontSize: '12px',
  lineHeight: '18px',
  margin: 0,
};
const inlineLink = {
  color: NAVY,
  textDecoration: 'underline',
};
const footer = {
  background: GRAY,
  padding: '16px 24px',
  textAlign: 'center' as const,
};
const footerText = {
  color: SLATE,
  fontSize: '12px',
  margin: '4px 0',
};
const footerLink = {
  color: SLATE,
  textDecoration: 'underline',
};
