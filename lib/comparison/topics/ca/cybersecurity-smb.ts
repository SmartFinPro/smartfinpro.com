// lib/comparison/topics/ca/cybersecurity-smb.ts
// TopicConfig for "Best Cybersecurity/VPN Tools for Canadian SMBs" —
// registered under 'ca:cybersecurity/cybersecurity-smb'. Shares the
// 'cybersecurity/cybersecurity-smb' slug with us/uk/au for hreflang
// clustering; fully independent CA-specific editorial content. Pure module —
// no React/server imports.
//
// Spans 3 genuinely different product categories (endpoint protection/EDR,
// password management, business VPN/network security) — never ranked on
// price alone; `product_category` filter lets readers compare like-for-like.
// Cost model 'banking' with monthly_fee seeded as a CAD-converted estimate
// where no native CAD price exists (none of the 7 publish CAD list pricing —
// disclosed explicitly in starting_price_note). Sophos and ESET publish NO
// public list price at all (quote-only via reseller) — seeded 0 with an
// explicit "contact for pricing" note, matching the au/cybersecurity-smb.ts
// and ai-tools-finance.ts precedent for null-safe honesty.
//
// Editorial disclosure (SEO addendum §14): every one of these 7 security
// vendors has a real, sourced 2024-2026 incident, vulnerability or
// regulatory matter — disclosed per row via `security_note` rather than
// presenting any vendor as incident-free by omission. This corrects an
// earlier "no material compliance red flags" assumption for Bitdefender
// (an April 2025 Romanian GDPR fine), Sophos (nation-state exploitation of
// its Firewall product line — a different product from Intercept X, still
// disclosed) and ESET (an actively-exploited 2024 CVE) found during fresh
// July 2026 research. 1Password's Toronto HQ is verified current — "Canadian
// -founded, Toronto-headquartered" is accurate, though "Canadian-owned"
// would overstate its later-stage US-led venture ownership.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const caCybersecuritySmbAttributesSchema = z
  .object({
    pricing_model: z.string(), // free text — per-device/month, per-user/year, quote-only, etc.
    starting_price_note: z.string(), // full pricing detail, incl. "estimated CAD via USD conversion" or "no public list price" caveats
    product_category: z.enum(['endpoint_protection', 'password_manager', 'vpn_network_security']),
    key_feature_note: z.string(),
    ca_presence_note: z.string(),
    review_score: z.number().nullable(),
    review_count: z.number().nullable(),
    review_source: z.string(),
    review_note: z.string().optional(),
    security_note: z.string(), // material, sourced incident/breach/vulnerability history — required, non-empty for every row on this page
  })
  .passthrough();

const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const cad = (n: number) => (n ? `~C$${n.toFixed(0)}/mo*` : 'Contact for pricing');

const CATEGORY_LABEL: Record<string, string> = {
  endpoint_protection: 'Endpoint protection (EDR/XDR)',
  password_manager: 'Password manager',
  vpn_network_security: 'Business VPN / network security',
};

export const caCybersecuritySmbConfig: TopicConfig = {
  slug: 'cybersecurity-smb',
  category: 'cybersecurity',
  label: 'Cybersecurity for SMBs',
  h1: (y) => `Best cybersecurity tools for small business in Canada (${y})`,
  metaTitle: (y) => `Best Cybersecurity for CA SMBs (${y})`,
  metaDescription: (y) =>
    `Compare cybersecurity tools for Canadian small businesses in ${y}: endpoint protection, password managers and business VPNs — independent, sourced.`,
  intro:
    'Independent, side-by-side comparison of cybersecurity tools for Canadian small businesses — spanning endpoint protection, password management and business VPN, three genuinely different categories never forced into one ranking.',
  publishedDate: '2026-07-11',
  attributesSchema: caCybersecuritySmbAttributesSchema,

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
      format: (v) => cad(Number(v)),
    },
    {
      key: 'caPresence',
      label: 'CA presence',
      accessor: (p) => (attrStr(p, 'ca_presence_note').toLowerCase().includes('no confirmed canadian') ? 0 : 1),
      format: (v) => (Number(v) ? 'Local office/distributor' : 'Global product only'),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'endpoint', label: 'Endpoint protection', predicate: (p) => attrStr(p, 'product_category') === 'endpoint_protection' },
    { key: 'password', label: 'Password manager', predicate: (p) => attrStr(p, 'product_category') === 'password_manager' },
    { key: 'vpn', label: 'Business VPN', predicate: (p) => attrStr(p, 'product_category') === 'vpn_network_security' },
    { key: 'caPresence', label: 'Local CA office/distributor', predicate: (p) => !attrStr(p, 'ca_presence_note').toLowerCase().includes('no confirmed canadian') },
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
      id: 'caSupport',
      label: 'Want a vendor with local CA support?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) =>
        a === 'yes'
          ? { matched: !attrStr(p, 'ca_presence_note').toLowerCase().includes('no confirmed canadian'), reason: 'Local CA office or distributor' }
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
    { key: 'price', label: 'Starting price', accessor: (p) => cad(p.monthlyFee) },
    { key: 'feature', label: 'Key SMB feature', accessor: (p) => attrStr(p, 'key_feature_note') || '—' },
    { key: 'caPresence', label: 'CA presence', accessor: (p) => attrStr(p, 'ca_presence_note') || '—' },
    {
      key: 'rating',
      label: 'Review score',
      accessor: (p) => {
        const score = attrNumOrNull(p, 'review_score');
        return score === null ? 'Not yet rated' : `${score}/5 (${attrStr(p, 'review_source')})`;
      },
      score: (p) => attrNumOrNull(p, 'review_score') ?? 0,
    },
  ],

  detailRows: [
    { key: 'priceNote', label: 'Pricing detail', accessor: (p) => attrStr(p, 'starting_price_note') || '—' },
    { key: 'reviewNote', label: 'Review detail', accessor: (p) => attrStr(p, 'review_note') || '—' },
    { key: 'security', label: 'Security/incident history', accessor: (p) => attrStr(p, 'security_note') || 'No material incident history found at research time.' },
  ],

  verdict: {
    intro:
      "1Password Business is our top pick — a genuine Canadian-founded company (Toronto HQ since 2005), transparent published pricing, and no confirmed platform-level breach of its own found. CrowdStrike remains the strongest enterprise-grade EDR pick despite its well-documented July 2024 outage, which hit Canada hard and which we disclose in full below. Malwarebytes has the cleanest disclosed security record of the 7 alongside the simplest tiered deployment for small teams.",
    picks: [
      { slug: '1password-business-ca', label: 'Best overall / Canadian-founded' },
      { slug: 'crowdstrike-ca-smb', label: 'Best enterprise-grade EDR' },
      { slug: 'malwarebytes-ca', label: 'Simplest deployment for small teams' },
    ],
  },
  methodology:
    "We compare each vendor's pricing model, Canadian market presence, SMB-relevant features and independent review score (G2, Capterra) from official sources, sorted into three genuinely different categories — endpoint protection, password management and business VPN — that are never ranked against each other on price alone. Every one of these 7 vendors has a real, sourced security-relevant incident, vulnerability or regulatory matter in its recent history; we disclose it in full for every row rather than presenting any vendor as incident-free by omission, since a security-tool comparison that hides this information would defeat its own purpose. Two vendors (Sophos, ESET) publish no public list price — we show \"contact for pricing\" rather than a fabricated number. None of the 7 publish native CAD pricing except where noted — CAD figures elsewhere are estimated conversions, disclosed as such. Rankings never depend on commissions — every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'Endpoint protection vs. password manager vs. VPN',
      body: "These are not interchangeable. Endpoint protection (CrowdStrike, Bitdefender, Sophos, ESET, Malwarebytes) stops malware/ransomware executing on a device. A password manager (1Password) stops credential reuse and phishing-driven account takeover. A business VPN (NordLayer) secures network access for remote or hybrid staff. Most SMBs need at least one from each category, not just the cheapest single tool.",
    },
    {
      h3: 'Most of these bill in USD, not CAD',
      body: "None of the 7 vendors publish native Canadian-dollar list pricing — every CAD figure shown here is an estimated conversion from the vendor's official USD price, disclosed explicitly in the detail view. Confirm the actual charge (and any GST/HST) directly with the vendor or your card issuer before budgeting.",
    },
    {
      h3: 'Reading disclosed security incidents honestly',
      body: "Every vendor in this comparison has a real, documented incident, vulnerability or regulatory matter in its recent history — CrowdStrike's July 2024 update caused a catastrophic global outage that disrupted Canadian airports, banks and hospitals; a threat actor claimed a January 2026 breach of NordVPN-adjacent infrastructure (NordVPN disputes production impact); Bitdefender was fined by Romania's data protection authority in April 2025; a CVE in ESET's own scanner was actively exploited by an APT group; Sophos's Firewall product line (a different product from the Intercept X endpoint tool featured here) has been targeted by a multi-year nation-state campaign. We disclose all of them because a security-product comparison that omits this information isn't a serious one — weigh severity, scope and resolution status, not just presence, when comparing.",
    },
    {
      h3: 'Why two vendors show "contact for pricing"',
      body: 'Sophos and ESET sell primarily through resellers with no public list price — genuinely the hardest of the 7 to comparison-shop. Both have real Canadian offices and distributors, so a local quote is realistic to obtain, but we won\'t publish a fabricated starting price where none exists.',
    },
  ],
  faq: [
    {
      q: 'What is the best cybersecurity tool for a small business in Canada?',
      a: '1Password Business is our top pick — a genuine Canadian-founded company (Toronto HQ) with transparent pricing and no confirmed platform-level breach found. CrowdStrike remains the strongest enterprise-grade EDR pick despite a well-documented 2024 outage, which we disclose in full. The right choice depends on which category — endpoint protection, password management or VPN — you actually need.',
    },
    {
      q: 'Is 1Password really a Canadian company?',
      a: "Yes — 1Password was founded in 2005 and remains headquartered in Toronto, Ontario. After 14 self-funded years it raised roughly $920M across three US-led venture rounds (2019-2022, valuing it at $6.8B), so while 'Canadian-founded, Toronto-headquartered' is accurate, 'Canadian-owned' would overstate its later-stage ownership structure.",
    },
    {
      q: 'Are any of these security vendors themselves safe to trust, given they\'ve had incidents?',
      a: "Every vendor on this page has a real, disclosed incident, vulnerability or regulatory matter in its recent history — that's true across the security industry, not unique to any one product. We disclose each one specifically (see the detail view per provider) so you can weigh severity and how it was handled, rather than assuming any vendor is risk-free.",
    },
    {
      q: 'Why do Sophos and ESET show "contact for pricing"?',
      a: "Both sell primarily through resellers with no public list price published anywhere, despite having real Canadian offices and distributors. We show \"contact for pricing\" rather than publish a fabricated number — get a direct quote if you're considering either.",
    },
    {
      q: 'How current is this data?',
      a: 'Every price, feature and security disclosure on this page was researched against official vendor sources, G2, Capterra and security-incident reporting on 11 July 2026. Pricing and incident status can change — confirm current terms on the vendor\'s own site before subscribing.',
    },
  ],
  compliance: {
    notice:
      'Not a substitute for a formal security assessment. Every vendor on this page has a disclosed security-relevant incident, vulnerability or regulatory matter in its recent history — review the detail view for each provider before choosing.',
    regulators: [],
  },

  sources: [
    { label: 'Canadian Centre for Cyber Security — small business guidance', url: 'https://www.cyber.gc.ca/en/guidance/cyber-security-small-businesses' },
    { label: 'Get Cyber Safe — Government of Canada', url: 'https://www.getcybersafe.gc.ca/en' },
  ],
  relatedLinks: [
    { label: 'Canada cybersecurity hub', href: '/ca/cybersecurity' },
    { label: 'Best AI tools for finance (Canada)', href: '/ca/ai-tools/best/ai-tools-finance' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};
