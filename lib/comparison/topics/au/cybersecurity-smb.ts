// lib/comparison/topics/au/cybersecurity-smb.ts
// TopicConfig for "Best Cybersecurity for SMBs (Australia)" — registered
// under 'au:cybersecurity/cybersecurity-smb'. AU-specific editorial config
// sharing the slug with us/uk/ca for hreflang clustering. Pure module — no
// React/server imports.
//
// Spans 3 genuinely different product categories (endpoint protection/EDR,
// password management, business VPN/network security) — never ranked on
// price alone; `product_category` filter lets readers compare like-for-like.
// Cost model 'banking' — most vendors here have real per-seat/month or
// per-device/year AUD-convertible pricing (unlike ai-tools, a $ comparison is
// defensible), but 2 of 7 (Sophos, ESET) publish NO public list price at all
// — seeded 0 with an explicit "contact for pricing" note, never a fabricated
// number, matching the ai-tools-finance precedent for null-safe honesty.
//
// Editorial disclosure (SEO addendum §14): every one of these 7 security
// vendors has a real, sourced 2024-2026 incident or concern (CrowdStrike's
// catastrophic July 2024 global outage; NordVPN's Jan 2026 breach claim;
// ESET's actively-exploited CVE-2024-11859; Bitwarden's April 2026 CLI
// supply-chain compromise) — disclosed per row via `security_note` rather
// than presenting any vendor as incident-free by omission.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const auCybersecuritySmbAttributesSchema = z
  .object({
    pricing_model: z.string(), // free text — per-device/month, per-user/year, quote-only, etc.
    starting_price_note: z.string(), // full pricing detail, incl. "estimated AUD via USD conversion" or "no public list price" caveats
    product_category: z.enum(['endpoint_protection', 'password_manager', 'vpn_network_security']),
    key_feature_note: z.string(),
    au_presence_note: z.string(),
    review_score: z.number().nullable(),
    review_count: z.number().nullable(),
    review_source: z.string(),
    security_note: z.string(), // material, sourced incident/breach/vulnerability history — required, non-empty for every row on this page
  })
  .passthrough();

const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const aud = (n: number) => (n ? `~A$${n.toFixed(0)}/mo*` : 'Contact for pricing');

const CATEGORY_LABEL: Record<string, string> = {
  endpoint_protection: 'Endpoint protection (EDR/XDR)',
  password_manager: 'Password manager',
  vpn_network_security: 'Business VPN / network security',
};

export const auCybersecuritySmbConfig: TopicConfig = {
  slug: 'cybersecurity-smb',
  category: 'cybersecurity',
  label: 'Cybersecurity for SMBs',
  h1: (y) => `Best cybersecurity tools for small business in Australia (${y})`,
  metaTitle: (y) => `Best Cybersecurity for AU SMBs (${y})`,
  metaDescription: (y) =>
    `Compare cybersecurity tools for Australian small businesses in ${y}: endpoint protection, password managers and business VPNs — independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of cybersecurity tools for Australian small businesses — spanning endpoint protection, password management and business VPN, three genuinely different categories never forced into one ranking.',
  publishedDate: '2026-07-11',
  attributesSchema: auCybersecuritySmbAttributesSchema,

  specColumns: [
    {
      key: 'category',
      label: 'Category',
      accessor: (p) => attrStr(p, 'product_category'),
      format: (v) => CATEGORY_LABEL[String(v)] ?? String(v),
    },
    {
      key: 'price',
      label: 'Starting price',
      accessor: (p) => p.monthlyFee,
      format: (v) => aud(Number(v)),
    },
    {
      key: 'auPresence',
      label: 'AU presence',
      accessor: (p) => (attrStr(p, 'au_presence_note').toLowerCase().includes('no au-specific') ? 0 : 1),
      format: (v) => (Number(v) ? 'Local office/distributor' : 'Global product only'),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'endpoint', label: 'Endpoint protection', predicate: (p) => attrStr(p, 'product_category') === 'endpoint_protection' },
    { key: 'password', label: 'Password manager', predicate: (p) => attrStr(p, 'product_category') === 'password_manager' },
    { key: 'vpn', label: 'Business VPN', predicate: (p) => attrStr(p, 'product_category') === 'vpn_network_security' },
    { key: 'auPresence', label: 'Local AU office/distributor', predicate: (p) => !attrStr(p, 'au_presence_note').toLowerCase().includes('no au-specific') },
  ],

  priorityChips: [
    { id: 'endpoint', label: 'Endpoint protection', icon: 'Shield', sort: 'endpoint' },
    { id: 'password', label: 'Password manager', icon: 'Lock', sort: 'password' },
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'category',
      label: 'What kind of protection do you need?',
      weight: 16,
      options: [
        { value: 'endpoint', label: 'Device / malware protection' },
        { value: 'password', label: 'Password / credential management' },
        { value: 'vpn', label: 'Remote team network security' },
      ],
      award: (p, a) => {
        const map: Record<string, string> = { endpoint: 'endpoint_protection', password: 'password_manager', vpn: 'vpn_network_security' };
        return { matched: attrStr(p, 'product_category') === map[a], reason: 'Matches your security need' };
      },
    },
    {
      id: 'auSupport',
      label: 'Want a vendor with local AU support?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes'
          ? { matched: !attrStr(p, 'au_presence_note').toLowerCase().includes('no au-specific'), reason: 'Local AU office or distributor' }
          : { matched: true },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'endpoint', label: 'Endpoint protection first', metric: (p) => (attrStr(p, 'product_category') === 'endpoint_protection' ? 1000 : 0) + p.score },
    { value: 'password', label: 'Password managers first', metric: (p) => (attrStr(p, 'product_category') === 'password_manager' ? 1000 : 0) + p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'review_score') ?? 0) * 100 + p.score },
  ],

  costModel: {
    kind: 'banking',
    amountLabel: 'Representative usage',
    amountMin: 0,
    amountMax: 0,
    amountStep: 1,
    amountDefault: 0,
    yearsLabel: 'Years',
    yearsMin: 1,
    yearsMax: 3,
    yearsDefault: 1,
  },

  compareRows: [
    { key: 'category', label: 'Category', accessor: (p) => CATEGORY_LABEL[attrStr(p, 'product_category')] ?? '—' },
    { key: 'price', label: 'Starting price', accessor: (p) => aud(p.monthlyFee) },
    { key: 'feature', label: 'Key SMB feature', accessor: (p) => attrStr(p, 'key_feature_note') || '—' },
    { key: 'auPresence', label: 'AU presence', accessor: (p) => attrStr(p, 'au_presence_note') || '—' },
    {
      key: 'rating',
      label: 'Review score',
      accessor: (p) => {
        const score = attrNumOrNull(p, 'review_score');
        return score === null ? attrStr(p, 'review_source') : `${score}/5 (${attrStr(p, 'review_source')})`;
      },
      score: (p) => attrNumOrNull(p, 'review_score') ?? 0,
    },
  ],

  detailRows: [
    { key: 'priceNote', label: 'Pricing detail', accessor: (p) => attrStr(p, 'starting_price_note') || '—' },
    { key: 'security', label: 'Security/incident history', accessor: (p) => attrStr(p, 'security_note') || 'No material incident history found at research time.' },
  ],

  verdict: {
    intro:
      "No confirmed breach of its own platform, transparent published pricing, and the largest, most consistent review base of the seven vendors here — on those grounds, 1Password Business takes the top spot. Among endpoint-protection options specifically, Bitdefender stands out for having opened a genuine local office in Melbourne. CrowdStrike still earns a place as a top-tier EDR pick, though its well-documented July 2024 outage is disclosed in full below rather than glossed over.",
    picks: [
      { slug: '1password-business-au', label: 'Best overall' },
      { slug: 'bitdefender-au', label: 'Best endpoint protection with local AU support' },
      { slug: 'crowdstrike-au-smb', label: 'Best for enterprise-grade EDR' },
    ],
  },
  methodology:
    "We compare each vendor's pricing model, AU market presence, SMB-relevant features and independent review score (G2, Capterra, TrustRadius) from official sources, sorted into three genuinely different categories — endpoint protection, password management and business VPN — that are never ranked against each other on price alone. Every one of these 7 vendors has a real, sourced security-relevant incident or concern in its recent history; we disclose it in full for every row rather than presenting any vendor as incident-free by omission, since a security-tool comparison that hides this information would defeat its own purpose. Two vendors (Sophos, ESET) publish no public list price — we show \"contact for pricing\" rather than a fabricated number. Rankings never depend on commissions except where a provider already has a verified SmartFinPro affiliate relationship, disclosed via the CTA label.",
  buyerGuide: [
    {
      h3: 'The ACSC Essential Eight — Australia\'s baseline standard',
      body: "The Australian Cyber Security Centre recommends AU small businesses target Essential Eight Maturity Level One as a realistic starting point (not Level 2/3, aimed at higher-risk organisations). No single product on this page delivers the full Essential Eight — you typically need elements of endpoint protection, patching, backups and access control (including a password manager) together.",
    },
    {
      h3: 'Endpoint protection vs. password manager vs. VPN',
      body: "These are not interchangeable. Endpoint protection (CrowdStrike, Bitdefender, Sophos, ESET) stops malware/ransomware executing on a device. A password manager (1Password, Bitwarden) stops credential reuse and phishing-driven account takeover. A business VPN (NordLayer) secures network access for remote or hybrid staff. Most SMBs need at least one from each category, not just the cheapest single tool.",
    },
    {
      h3: 'Reading disclosed security incidents honestly',
      body: "Every vendor in this comparison has a real, documented incident or vulnerability in its recent history — CrowdStrike's July 2024 update caused a catastrophic global outage; a threat actor claimed a January 2026 breach of NordVPN-adjacent infrastructure (NordVPN disputes production impact); a CVE in ESET's own scanner was actively exploited by an APT group; a malicious Bitwarden CLI package was live for roughly 90 minutes in April 2026. We disclose all of them because a security-product comparison that omits this information isn't a serious one — weigh severity and resolution status, not just presence, when comparing.",
    },
    {
      h3: 'Why two vendors show "contact for pricing"',
      body: "Sophos and ESET sell exclusively through resellers with no public list price — genuinely the hardest of the 7 to comparison-shop. Both have real Australian offices and distributors, so a local quote is realistic to obtain, but we won't publish a fabricated starting price where none exists.",
    },
  ],
  faq: [
    {
      q: 'What is the best cybersecurity tool for a small business in Australia?',
      a: 'It depends on the category, but 1Password Business is the strongest all-round choice, thanks to transparent pricing and the most consistent review base of the seven. If endpoint protection is what you need, Bitdefender stands out with a genuine local Melbourne office. CrowdStrike remains a credible top-tier EDR option too, despite a well-documented 2024 outage that we disclose in full rather than omit.',
    },
    {
      q: 'What baseline cybersecurity standard should an Australian small business target?',
      a: "The Australian Cyber Security Centre's (ACSC) Essential Eight framework, starting at Maturity Level One for most small businesses. No single product here delivers the whole framework — typically you'll combine endpoint protection with a password manager and good backup/patching practices.",
    },
    {
      q: 'Are any of these security vendors themselves safe to trust, given they\'ve had incidents?',
      a: 'Every vendor on this page has a real, disclosed incident in its recent history — that\'s true across the security industry, not unique to any one product. We disclose each one specifically (see the detail view per provider) so you can weigh severity and how it was handled, rather than assuming any vendor is risk-free.',
    },
    {
      q: 'Why do Sophos and ESET show "contact for pricing"?',
      a: "Both sell exclusively through resellers with no public list price published anywhere, despite having real Australian offices and distributors. We show \"contact for pricing\" rather than publish a fabricated number — get a direct quote if you're considering either.",
    },
    {
      q: 'How current is this data?',
      a: 'Every price, feature and security disclosure on this page was researched against official vendor sources, G2, Capterra and security-incident reporting on 11 July 2026. Pricing and incident status can change — confirm current terms on the vendor\'s own site before subscribing.',
    },
  ],
  compliance: {
    notice:
      'Not a substitute for a formal security assessment. Every vendor on this page has a disclosed security-relevant incident in its recent history — review the detail view for each provider before choosing.',
    regulators: [],
  },

  sources: [
    { label: 'ACSC — Essential Eight', url: 'https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/essential-eight' },
    { label: 'ACSC — Small Business Cyber Security Guide', url: 'https://www.cyber.gov.au/business-government/small-business-cyber-security/small-business-hub' },
  ],
  relatedLinks: [
    { label: 'Australia cybersecurity hub', href: '/au/cybersecurity' },
    { label: 'Best AI tools for finance (Australia)', href: '/au/ai-tools/best/ai-tools-finance' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
