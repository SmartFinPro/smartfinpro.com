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

interface CaseStudyEmailProps {
  unsubscribeUrl: string;
  baseUrl: string;
}

export function CaseStudyEmail({
  unsubscribeUrl,
  baseUrl,
}: CaseStudyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Case Study: How AI Automates 10h of Finance Work Weekly</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerSubtitle}>Day 5 - Real Results</Text>
            <Heading style={headerTitle}>
              Case Study: How One Finance Team Saved 10 Hours Per Week
            </Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>Hey!</Text>

            <Text style={paragraph}>
              Let me share a quick story that might change how you think about AI in finance.
            </Text>

            {/* The Challenge */}
            <Section style={caseSection}>
              <Heading as="h3" style={caseSectionTitle}>
                The Challenge
              </Heading>
              <Text style={caseText}>
                Sarah runs a 5-person finance consultancy. Every week, her team spent
                <strong> 15+ hours</strong> on:
              </Text>
              <Text style={bulletPoint}>Drafting client reports and proposals</Text>
              <Text style={bulletPoint}>Writing market analysis summaries</Text>
              <Text style={bulletPoint}>Creating compliant marketing content</Text>
              <Text style={bulletPoint}>Responding to routine client inquiries</Text>
            </Section>

            {/* The Solution */}
            <Section style={caseSection}>
              <Heading as="h3" style={caseSectionTitle}>
                The Solution: AI + Smart Workflows
              </Heading>
              <Text style={caseText}>
                After testing 12 different AI tools, Sarah&apos;s team settled on{' '}
                <strong>Jasper AI</strong> for one critical reason: <strong>compliance</strong>.
              </Text>
              <Text style={caseText}>
                Unlike generic AI tools, Jasper is:
              </Text>
              <Text style={checkPoint}>SOC 2 Type II certified</Text>
              <Text style={checkPoint}>Built for regulated industries</Text>
              <Text style={checkPoint}>Trained on business content (not random internet data)</Text>
            </Section>

            {/* The Results */}
            <Section style={resultsBox}>
              <Heading as="h3" style={resultsTitle}>
                The Results (After 90 Days)
              </Heading>

              <Section style={statsGrid}>
                <Section style={statItem}>
                  <Text style={statNumber}>10h</Text>
                  <Text style={statLabel}>Saved Weekly</Text>
                </Section>
                <Section style={statItem}>
                  <Text style={statNumber}>47%</Text>
                  <Text style={statLabel}>More Proposals</Text>
                </Section>
                <Section style={statItem}>
                  <Text style={statNumber}>$2,400</Text>
                  <Text style={statLabel}>Monthly ROI</Text>
                </Section>
              </Section>

              <Text style={resultsQuote}>
                &ldquo;We went from struggling to keep up with content demands to actually
                having time for strategic work. The ROI was obvious within the first month.&rdquo;
              </Text>
              <Text style={resultsAttribution}>- Sarah M., Finance Consultancy Owner</Text>
            </Section>

            <Hr style={hr} />

            {/* The Breakdown */}
            <Section style={breakdownSection}>
              <Heading as="h3" style={breakdownTitle}>
                How They Did It (Step by Step)
              </Heading>

              <Section style={stepBox}>
                <Text style={stepNumber}>1</Text>
                <Text style={stepTitle}>Started with Templates</Text>
                <Text style={stepText}>
                  Created 5 custom templates for recurring documents: proposals,
                  market updates, client emails, compliance disclosures, and reports.
                </Text>
              </Section>

              <Section style={stepBox}>
                <Text style={stepNumber}>2</Text>
                <Text style={stepTitle}>Brand Voice Training</Text>
                <Text style={stepText}>
                  Trained Jasper on their existing content to maintain consistent
                  tone and terminology across all outputs.
                </Text>
              </Section>

              <Section style={stepBox}>
                <Text style={stepNumber}>3</Text>
                <Text style={stepTitle}>Compliance Workflows</Text>
                <Text style={stepText}>
                  Set up review workflows where AI drafts first, humans verify
                  compliance, reducing revision cycles by 60%.
                </Text>
              </Section>
            </Section>

            <Hr style={hr} />

            {/* CTA */}
            <Section style={ctaBox}>
              <Heading as="h3" style={ctaTitle}>
                Want to Try This Yourself?
              </Heading>
              <Text style={ctaText}>
                Jasper offers a <strong>7-day free trial</strong> with full access.
                No credit card required to start.
              </Text>
              <Text style={ctaText}>
                Based on Sarah&apos;s results, even if you save just <strong>2 hours per week</strong>,
                the tool pays for itself in the first month.
              </Text>
              <Button style={ctaButton} href={`${baseUrl}/go/jasper-ai`}>
                Start Your Free Jasper Trial
              </Button>
              <Text style={ctaDisclaimer}>
                Full disclosure: We earn a commission if you subscribe, but we&apos;d
                recommend Jasper regardless - it&apos;s what we use ourselves.
              </Text>
            </Section>

            <Hr style={hr} />

            <Text style={paragraph}>
              Questions about implementing AI in your workflow? Just reply to this email -
              I read and respond to every message personally.
            </Text>

            <Text style={signature}>
              Here&apos;s to working smarter,
              <br />
              <strong>The SmartFinPro Team</strong>
            </Text>

            <Text style={psText}>
              <strong>P.S.</strong> If Jasper isn&apos;t the right fit, check out our{' '}
              <Link href={`${baseUrl}/us/ai-tools`} style={inlineLink}>
                complete AI tools comparison
              </Link>{' '}
              for alternatives.
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
  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
  padding: '40px 40px 30px',
  textAlign: 'center' as const,
};

const headerSubtitle = {
  color: '#ddd6fe',
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px',
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '22px',
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

const caseSection = {
  margin: '24px 0',
};

const caseSectionTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px',
};

const caseText = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const bulletPoint = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 4px',
  paddingLeft: '16px',
};

const checkPoint = {
  color: '#059669',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0 0 4px',
};

const resultsBox = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #e9d5ff',
};

const resultsTitle = {
  color: '#6d28d9',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const statsGrid = {
  display: 'flex' as const,
  justifyContent: 'space-around' as const,
  marginBottom: '20px',
};

const statItem = {
  textAlign: 'center' as const,
  flex: '1',
};

const statNumber = {
  color: '#7c3aed',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
};

const statLabel = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '4px 0 0',
};

const resultsQuote = {
  color: '#4b5563',
  fontSize: '14px',
  fontStyle: 'italic' as const,
  lineHeight: '1.6',
  margin: '16px 0 8px',
  borderLeft: '3px solid #7c3aed',
  paddingLeft: '16px',
};

const resultsAttribution = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0',
  paddingLeft: '19px',
};

const breakdownSection = {
  margin: '24px 0',
};

const breakdownTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 20px',
};

const stepBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px',
  margin: '12px 0',
  position: 'relative' as const,
};

const stepNumber = {
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '700',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  display: 'inline-block',
  textAlign: 'center' as const,
  lineHeight: '24px',
  margin: '0 8px 0 0',
};

const stepTitle = {
  color: '#1f2937',
  fontSize: '15px',
  fontWeight: '600',
  display: 'inline',
  margin: '0',
};

const stepText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '8px 0 0 32px',
};

const ctaBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #bfdbfe',
};

const ctaTitle = {
  color: '#1e40af',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 12px',
};

const ctaText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const ctaButton = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '14px 32px',
  display: 'inline-block',
  margin: '16px 0',
};

const ctaDisclaimer = {
  color: '#6b7280',
  fontSize: '11px',
  margin: '12px 0 0',
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

const psText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '20px 0 0',
  padding: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
};

const inlineLink = {
  color: '#2563eb',
  textDecoration: 'underline',
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

export default CaseStudyEmail;
