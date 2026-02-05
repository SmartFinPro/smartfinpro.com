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

interface WelcomeEmailProps {
  downloadUrl: string;
  unsubscribeUrl: string;
  baseUrl: string;
}

export function WelcomeEmail({
  downloadUrl,
  unsubscribeUrl,
  baseUrl,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Dein Download: Der 5-Minuten KI-Finanz-Workflow</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>
              🚀 Dein Download ist bereit!
            </Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>Hallo!</Text>

            <Text style={paragraph}>
              Willkommen bei <strong>SmartFinPro</strong>!
            </Text>

            <Text style={paragraph}>
              Wie versprochen findest du hier deinen Guide für mehr Effizienz im
              Finanz-Alltag:
            </Text>

            {/* Download Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={downloadUrl}>
                👉 Jetzt Guide öffnen
              </Button>
            </Section>

            {/* What's Inside Box */}
            <Section style={infoBox}>
              <Heading as="h3" style={infoBoxTitle}>
                Was dich erwartet:
              </Heading>
              <Text style={listItem}>
                ✅ <strong>Seite 1:</strong> 3 Copy-Paste Prompts für sofortige Ergebnisse
              </Text>
              <Text style={listItem}>
                ✅ <strong>Seite 2:</strong> Die Tool-Matrix – welches KI-Tool für welche Aufgabe
              </Text>
              <Text style={listItem}>
                ✅ <strong>Seite 3:</strong> Die Compliance-Checkliste für Profis
              </Text>
            </Section>

            <Hr style={hr} />

            <Text style={paragraph}>
              In den nächsten Tagen werde ich dir zeigen, wie du diese Workflows
              nutzt, um nicht nur Zeit zu sparen, sondern deine{' '}
              <strong>Conversion-Rates bei Finanzprodukten massiv zu steigern</strong>.
            </Text>

            {/* Recommendation Section */}
            <Section style={recommendationBox}>
              <Heading as="h3" style={recommendationTitle}>
                💡 Unser Tool-Tipp:
              </Heading>
              <Text style={recommendationText}>
                Für Finanz-Content empfehlen wir <strong>Jasper AI</strong>.
                SOC 2 zertifiziert, perfekt für Compliance.
              </Text>
              <Button style={secondaryButton} href={`${baseUrl}/go/jasper-ai`}>
                Jasper AI kostenlos testen →
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={paragraph}>
              Falls du Fragen zu Jasper, Krypto-Trading oder Automatisierung
              hast – <strong>antworte einfach auf diese Mail</strong>. Ich lese
              jede Nachricht persönlich.
            </Text>

            <Text style={signature}>
              Stay smart,
              <br />
              <strong>Dein Team von smartfinpro.com</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              SmartFinPro | AI Tools für Finance Professionals
            </Text>
            <Text style={footerLinks}>
              <Link href={unsubscribeUrl} style={footerLink}>
                Abmelden
              </Link>
              {' | '}
              <Link href={`${baseUrl}/privacy`} style={footerLink}>
                Datenschutz
              </Link>
              {' | '}
              <Link href={`${baseUrl}/impressum`} style={footerLink}>
                Impressum
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
  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
  padding: '40px 40px 30px',
  textAlign: 'center' as const,
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '16px 40px',
  display: 'inline-block',
};

const secondaryButton = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  color: '#2563eb',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
  display: 'inline-block',
  marginTop: '12px',
};

const infoBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const infoBoxTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const listItem = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0 0 8px',
};

const recommendationBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  borderLeft: '4px solid #2563eb',
};

const recommendationTitle = {
  color: '#1e40af',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const recommendationText = {
  color: '#1e40af',
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

export default WelcomeEmail;
