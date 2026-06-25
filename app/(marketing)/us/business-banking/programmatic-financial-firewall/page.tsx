// app/(marketing)/us/business-banking/programmatic-financial-firewall/page.tsx
import type { Metadata } from 'next';
import type { FAQ } from '@/types';
import { ArticleSchema, BreadcrumbSchema, FAQSchema, HowToSchema } from '@/components/seo';
import { EditorialBacklink } from '@/components/marketing/EditorialBacklink';
import FirewallClient from './firewall-client';
import { REVIEWER } from './firewall-content';

const PAGE_PATH = '/us/business-banking/programmatic-financial-firewall';
const PAGE_URL = `https://smartfinpro.com${PAGE_PATH}`;
// Kept ≤ ~54 chars incl. the " | SmartFinPro" template suffix so the SERP title
// doesn't truncate (was 63). "Cash Flow" lives in the description + H1.
const PAGE_TITLE = 'Programmatic Financial Firewall for LLCs';
const PAGE_DESCRIPTION =
  'Deploy Mercury as an API-driven LLC cash-flow firewall: isolate subscriptions, automate receipts, harden access, and claim the SmartFinPro bonus.';

// Single source of truth — the visible FAQ section and the FAQPage JSON-LD
// both render from this array so the structured data always matches the page.
const firewallFaqs: FAQ[] = [
  {
    question: 'Can I really create a separate Mercury card for every vendor for free?',
    answer:
      'Yes. Mercury lets you issue virtual and physical debit cards at no additional cost, each with its own spend limit, merchant controls, and receipt requirements. That is what makes per-vendor isolation practical — you give Ad Spend, Core Infrastructure, and Team SaaS their own dedicated card lanes instead of exposing one universal company card.',
  },
  {
    question: 'What happens to the rest of my money if one vendor is breached?',
    answer:
      'Nothing. Because each spend lane is its own card with its own ceiling, a compromised pixel partner, agency login, or SaaS vendor only exposes that single node. You freeze that one card and the operating balance, payroll, reserves, and every other lane keep running. The blast radius is one vendor lane, never the full account.',
  },
  {
    question: 'How does the automated receipt reconciliation actually work?',
    answer:
      "Mercury sends a signed webhook for each transaction. Your Next.js API route verifies the signature, then matches the event against Stripe invoices, server invoices, or Gmail/Google Workspace receipts by amount, merchant, card node, and timestamp. Matched items close automatically; low-confidence cases route to finance review. The page includes the production-ready code for this.",
  },
  {
    question: 'Why should I remove SMS 2FA?',
    answer:
      'SMS codes are a telecom dependency: a SIM swap turns account recovery into a phone-carrier support problem, and AI-driven phishing can proxy one-time codes in real time. Replace SMS with phishing-resistant FIDO2/WebAuthn hardware keys (e.g. YubiKeys) across every account that can reset finance access — email, password manager, domain registrar, and identity provider.',
  },
  {
    question: 'Can I monitor the account without logging into a browser?',
    answer:
      'Yes. Mercury exposes a CLI and API plus the Mercury Command natural-language layer, so you can check balances, transactions, invoices, and webhooks from a hardened terminal or CI job. Browser sessions become deliberate approval surfaces for moving money, not your everyday monitoring surface — which removes a large phishing attack window.',
  },
  {
    question: 'Is the $250 founder bonus guaranteed, and are there any fees?',
    answer:
      'Mercury core business banking has no monthly maintenance fees and no account minimums. The $250 cash bonus is an incentive for eligible founders after funding their entity through the verified SmartFinPro routing link, but bonus availability and qualification rules can change — always confirm the final offer screen before applying and treat approval, KYC, and funding requirements as binding.',
  },
];

// HowTo steps mirror the page's visible three-phase protocol (Phase 01 Cards →
// 02 API → 03 Access). Kept in sync with the on-page content so the markup
// reflects what the reader actually sees (Google HowTo policy).
const firewallHowToSteps = [
  {
    name: 'Isolate every vendor on its own virtual card',
    description:
      'Issue a dedicated Mercury virtual card for each spend lane — ad spend, core infrastructure, and team SaaS — each with its own hard monthly limit and merchant controls, so a compromised vendor only exposes that single card, never the full operating balance.',
  },
  {
    name: 'Automate receipt reconciliation with webhooks',
    description:
      "Verify Mercury's signed transaction webhooks in a Next.js API route, then match each event against Stripe, server, or Gmail/Workspace invoices by amount, merchant, card node, and timestamp. Matched items close automatically; low-confidence cases route to finance review.",
  },
  {
    name: 'Harden account access with FIDO2 hardware keys',
    description:
      'Remove SMS 2FA from every account that can reset finance access, mandate phishing-resistant FIDO2/WebAuthn hardware keys, split read-only monitoring from write authority with scoped API tokens, and monitor balances from the Mercury CLI instead of the browser.',
  },
];

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    type: 'article',
    url: PAGE_PATH,
    siteName: 'SmartFinPro',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    // article: dates (mirror the Article JSON-LD) so og parsers + AI get freshness.
    publishedTime: '2026-06-20',
    modifiedTime: '2026-06-23',
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    creator: '@smartfinpro',
  },
};

export default function ProgrammaticFinancialFirewallPage() {
  return (
    <>
      <ArticleSchema
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        publishDate="2026-06-20"
        modifiedDate="2026-06-23"
        author="SmartFinPro Editorial Team"
        // Named, credentialed reviewer in schema (matches the visible "Reviewed by
        // Robert Hayes, CFP" on the page) — E-E-A-T/GEO trust signal.
        reviewedBy={REVIEWER.name}
        reviewedByUrl="https://smartfinpro.com/about"
        // Page-specific image instead of the generic site og-image.
        image="https://smartfinpro.com/images/firewall/01-hero.webp"
        url={PAGE_URL}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://smartfinpro.com' },
          { name: 'Business Banking', url: 'https://smartfinpro.com/us/business-banking' },
          { name: 'Programmatic Financial Firewall', url: PAGE_URL },
        ]}
      />
      <FAQSchema faqs={firewallFaqs} />
      <HowToSchema
        name="How to Build a Programmatic Financial Firewall for an LLC"
        description="A three-phase protocol to isolate, automate, and harden a US LLC's cash flow with Mercury: per-vendor virtual cards, webhook-driven receipt reconciliation, and FIDO2 account hardening."
        estimatedTime="PT1H"
        image="https://smartfinpro.com/images/firewall/01-hero.webp"
        steps={firewallHowToSteps}
      />
      {/* Speakable — marks the question→answer definition block as voice/TTS-
          friendly for answer engines. Tied to the page entity via @id. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': PAGE_URL,
            url: PAGE_URL,
            speakable: {
              '@type': 'SpeakableSpecification',
              cssSelector: ['#what-is-a-financial-firewall'],
            },
          }),
        }}
      />
      <FirewallClient
        faqs={firewallFaqs}
        editorialBacklink={
          <EditorialBacklink reviewer={REVIEWER} reviewHref="/us/business-banking/mercury-review" />
        }
      />
    </>
  );
}
