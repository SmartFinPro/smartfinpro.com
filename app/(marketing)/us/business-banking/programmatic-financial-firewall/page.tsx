// app/(marketing)/us/business-banking/programmatic-financial-firewall/page.tsx
import type { Metadata } from 'next';
import type { FAQ } from '@/types';
import { ArticleSchema, BreadcrumbSchema, FAQSchema } from '@/components/seo';
import FirewallClient from './firewall-client';

const PAGE_PATH = '/us/business-banking/programmatic-financial-firewall';
const PAGE_URL = `https://smartfinpro.com${PAGE_PATH}`;
const PAGE_TITLE = 'Programmatic Financial Firewall for LLC Cash Flow';
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
      <FirewallClient faqs={firewallFaqs} />
    </>
  );
}
