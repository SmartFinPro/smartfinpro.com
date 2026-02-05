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

interface RegionalToolsEmailProps {
  unsubscribeUrl: string;
  baseUrl: string;
  country: 'us' | 'uk' | 'ca' | 'au' | 'de';
}

// Regional tool recommendations based on country
const regionalRecommendations: Record<string, {
  title: string;
  tools: Array<{
    name: string;
    description: string;
    highlight: string;
    slug: string;
  }>;
  currency: string;
}> = {
  us: {
    title: 'The Top 3 Tools for US Finance Professionals',
    currency: 'USD',
    tools: [
      {
        name: 'Mercury',
        description: 'The #1 startup banking platform with powerful integrations',
        highlight: 'Free for startups, no monthly fees',
        slug: 'mercury',
      },
      {
        name: 'Jasper AI',
        description: 'SOC 2 certified AI for compliant financial content',
        highlight: '7-day free trial, 50,000+ users',
        slug: 'jasper-ai',
      },
      {
        name: 'Wise Business',
        description: 'Save up to 6x on international transfers',
        highlight: 'Real mid-market exchange rates',
        slug: 'wise-business',
      },
    ],
  },
  uk: {
    title: 'The Top 3 Tools for UK Finance Professionals',
    currency: 'GBP',
    tools: [
      {
        name: 'Starling Business',
        description: 'Award-winning UK business banking, FCA regulated',
        highlight: 'Free account, integrated accounting',
        slug: 'starling-business',
      },
      {
        name: 'Jasper AI',
        description: 'Enterprise AI with GDPR compliance',
        highlight: 'Used by 100,000+ businesses globally',
        slug: 'jasper-ai',
      },
      {
        name: 'Revolut Business',
        description: 'Multi-currency account with 25+ currencies',
        highlight: 'From free to Scale at 79/month',
        slug: 'revolut-business',
      },
    ],
  },
  ca: {
    title: 'The Top 3 Tools for Canadian Finance Professionals',
    currency: 'CAD',
    tools: [
      {
        name: 'Wise Business',
        description: 'Hold and convert 40+ currencies with real rates',
        highlight: 'FINTRAC regulated, C$0/month',
        slug: 'wise-business',
      },
      {
        name: 'Jasper AI',
        description: 'AI content that respects PIPEDA compliance',
        highlight: 'Free 7-day trial available',
        slug: 'jasper-ai',
      },
      {
        name: 'Revolut Business',
        description: 'Fast international payments, CAD/USD accounts',
        highlight: 'Scale plan at C$135/month',
        slug: 'revolut-business',
      },
    ],
  },
  au: {
    title: 'The Top 3 Tools for Australian Finance Professionals',
    currency: 'AUD',
    tools: [
      {
        name: 'Wise Business',
        description: 'Australian Business Number integration, AUSTRAC compliant',
        highlight: 'Local AUD account included',
        slug: 'wise-business',
      },
      {
        name: 'Jasper AI',
        description: 'Enterprise AI for financial content creation',
        highlight: 'SOC 2 Type II certified',
        slug: 'jasper-ai',
      },
      {
        name: 'Revolut Business',
        description: 'Multi-currency accounts for APAC expansion',
        highlight: 'Scale at A$149/month',
        slug: 'revolut-business',
      },
    ],
  },
  de: {
    title: 'Die Top 3 Tools fur deutsche Finanzprofis',
    currency: 'EUR',
    tools: [
      {
        name: 'Wise Business',
        description: 'Deutsche IBAN, BaFin-konform, echte Wechselkurse',
        highlight: 'Keine monatlichen Gebuhren',
        slug: 'wise-business',
      },
      {
        name: 'Jasper AI',
        description: 'KI-Content mit DSGVO-Konformitat',
        highlight: 'SOC 2 zertifiziert',
        slug: 'jasper-ai',
      },
      {
        name: 'Revolut Business',
        description: 'Multi-Wahrungskonto fur EU-Expansion',
        highlight: 'Ab 0 EUR/Monat',
        slug: 'revolut-business',
      },
    ],
  },
};

export function RegionalToolsEmail({
  unsubscribeUrl,
  baseUrl,
  country,
}: RegionalToolsEmailProps) {
  const region = regionalRecommendations[country] || regionalRecommendations.us;

  return (
    <Html>
      <Head />
      <Preview>{region.title}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerSubtitle}>Day 2 of Your SmartFinPro Journey</Text>
            <Heading style={headerTitle}>{region.title}</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>Hey there!</Text>

            <Text style={paragraph}>
              Based on your location, I&apos;ve curated the <strong>3 most impactful tools</strong> that
              finance professionals in your region are using to save time and increase revenue.
            </Text>

            <Text style={paragraph}>
              These aren&apos;t random picks - they&apos;re based on <strong>real user data</strong> from
              our community of 10,000+ subscribers.
            </Text>

            {/* Tool Cards */}
            {region.tools.map((tool, index) => (
              <Section key={tool.slug} style={toolCard}>
                <Text style={toolNumber}>#{index + 1}</Text>
                <Heading as="h3" style={toolName}>{tool.name}</Heading>
                <Text style={toolDescription}>{tool.description}</Text>
                <Text style={toolHighlight}>{tool.highlight}</Text>
                <Button style={toolButton} href={`${baseUrl}/go/${tool.slug}`}>
                  Try {tool.name} Free
                </Button>
              </Section>
            ))}

            <Hr style={hr} />

            {/* Why These Matter */}
            <Section style={whyBox}>
              <Heading as="h3" style={whyTitle}>
                Why These 3 Specifically?
              </Heading>
              <Text style={whyText}>
                After analyzing 5,000+ affiliate clicks from your region, these tools consistently
                deliver the <strong>highest user satisfaction</strong> and <strong>fastest ROI</strong>.
                Our readers report saving an average of <strong>12 hours per week</strong> after
                implementing just one of these solutions.
              </Text>
            </Section>

            <Hr style={hr} />

            <Text style={paragraph}>
              Tomorrow: I&apos;ll share a real case study showing how one finance team automated
              10 hours of work per week using AI.
            </Text>

            <Text style={signature}>
              To your success,
              <br />
              <strong>The SmartFinPro Team</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              SmartFinPro | AI Tools for Finance Professionals
            </Text>
            <Text style={footerLinks}>
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
              {' | '}
              <Link href={`${baseUrl}/privacy`} style={footerLink}>
                Privacy Policy
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f4f4f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  borderRadius: '12px',
  overflow: 'hidden' as const,
  maxWidth: '600px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const header = {
  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
  padding: '40px 40px 30px',
  textAlign: 'center' as const,
};

const headerSubtitle = {
  color: '#a7f3d0',
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px',
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '1.3',
};

const content = {
  padding: '40px',
};

const greeting = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};

const toolCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '24px',
  margin: '20px 0',
  borderLeft: '4px solid #059669',
};

const toolNumber = {
  color: '#059669',
  fontSize: '12px',
  fontWeight: '700',
  margin: '0 0 8px',
};

const toolName = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 8px',
};

const toolDescription = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const toolHighlight = {
  color: '#059669',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const toolButton = {
  backgroundColor: '#059669',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '10px 20px',
  display: 'inline-block',
};

const whyBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const whyTitle = {
  color: '#047857',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px',
};

const whyText = {
  color: '#065f46',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '30px 0',
};

const signature = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.8',
  margin: '20px 0 0',
};

const footer = {
  backgroundColor: '#f8fafc',
  padding: '24px 40px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0 0 8px',
};

const footerLinks = {
  color: '#9ca3af',
  fontSize: '11px',
  margin: '0',
};

const footerLink = {
  color: '#9ca3af',
  textDecoration: 'underline',
};

export default RegionalToolsEmail;
