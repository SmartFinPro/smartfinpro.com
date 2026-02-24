// config/navigation.ts
// ============================================================
// SINGLE SOURCE OF TRUTH for Silo-Aware Navigation
// All Header, Footer, Breadcrumb, and Related-Articles components
// read from this file. Add new categories/pages here only.
// ============================================================

import type { Market, Category } from '@/lib/i18n/config';
import { marketCategories, categoryConfig, marketConfig } from '@/lib/i18n/config';

// ── Types ────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
}

export interface MarketSiloConfig {
  /** Primary categories shown in header navigation (max 6) */
  primaryNav: Category[];
  /** Featured content links per market (header sidebar + footer) */
  featured: NavLink[];
}

// ── Silo Configuration per Market ────────────────────────────
// RULE: Only categories belonging to this market appear.
// No cross-market links ever.

export const marketSiloConfig: Record<Market, MarketSiloConfig> = {
  us: {
    primaryNav: ['credit-repair', 'debt-relief', 'personal-finance', 'ai-tools', 'trading', 'business-banking'],
    featured: [
      { label: 'Best Robo-Advisors 2026', href: '/us/personal-finance/best-robo-advisors' },
      { label: 'Credit Card Comparison', href: '/us/personal-finance/credit-cards-comparison' },
      { label: 'Amex Gold Review', href: '/us/personal-finance/amex-gold-card-review' },
      { label: 'Chase Sapphire Preferred', href: '/us/personal-finance/chase-sapphire-preferred-review' },
    ],
  },
  uk: {
    primaryNav: ['remortgaging', 'savings', 'trading', 'personal-finance', 'business-banking', 'cybersecurity'],
    featured: [
      { label: 'Vanguard ISA Review', href: '/uk/personal-finance/vanguard-isa-review' },
      { label: 'Hargreaves Lansdown ISA', href: '/uk/personal-finance/hargreaves-lansdown-isa-review' },
      { label: 'Best Mortgage Brokers UK', href: '/uk/remortgaging/best-mortgage-brokers-uk' },
      { label: 'ISA Tax Calculator', href: '/uk/tools/isa-tax-savings-calculator' },
    ],
  },
  ca: {
    primaryNav: ['tax-efficient-investing', 'housing', 'personal-finance', 'forex', 'business-banking', 'cybersecurity'],
    featured: [
      { label: 'Wealthsimple Review', href: '/ca/personal-finance/wealthsimple-review' },
      { label: 'TFSA vs RRSP', href: '/ca/tax-efficient-investing/tfsa-vs-rrsp' },
      { label: 'Best Robo-Advisors Canada', href: '/ca/tax-efficient-investing/best-robo-advisors-canada' },
      { label: 'TFSA/RRSP Calculator', href: '/ca/tools/tfsa-rrsp-calculator' },
    ],
  },
  au: {
    primaryNav: ['superannuation', 'gold-investing', 'trading', 'personal-finance', 'forex', 'business-banking'],
    featured: [
      { label: 'Best Super Funds Australia', href: '/au/superannuation/best-super-funds-australia' },
      { label: 'Perth Mint Review', href: '/au/gold-investing/perth-mint-review' },
      { label: 'Athena Home Loans Review', href: '/au/personal-finance/athena-home-loans-review' },
      { label: 'Mortgage Calculator', href: '/au/tools/au-mortgage-calculator' },
    ],
  },
};

// ── Global Links (market-independent, always visible) ────────

export const trustLinks: NavLink[] = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Our Methodology', href: '/methodology' },
  { label: 'Editorial Policy', href: '/editorial-policy' },
  { label: 'Review Policy', href: '/review-policy' },
  { label: 'Corrections Policy', href: '/corrections-policy' },
  { label: 'Affiliate Disclosure', href: '/affiliate-disclosure' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Imprint', href: '/imprint' },
];

export const hubLinks: NavLink[] = [
  { label: 'AI Financial Coaching', href: '/ai-financial-coaching' },
  { label: 'Green Finance & ESG', href: '/green-finance' },
  { label: 'All Tools', href: '/tools' },
];

/** Global tools shown in every market's footer */
export const globalToolLinks: NavLink[] = [
  { label: 'Broker Finder Quiz', href: '/tools/broker-finder' },
  { label: 'Trading Cost Calculator', href: '/tools/trading-cost-calculator' },
  { label: 'AI ROI Calculator', href: '/tools/ai-roi-calculator' },
  { label: 'Loan Calculator', href: '/tools/loan-calculator' },
  { label: 'Credit Score Simulator', href: '/tools/credit-score-simulator' },
  { label: 'Debt Payoff Calculator', href: '/tools/debt-payoff-calculator' },
  { label: 'Broker Comparison', href: '/tools/broker-comparison' },
];

/** Market-specific tools — only shown in the matching market's footer */
const marketToolLinks: Record<Market, NavLink[]> = {
  us: [],
  uk: [
    { label: 'ISA Tax Savings Calculator', href: '/uk/tools/isa-tax-savings-calculator' },
    { label: 'Remortgage Calculator', href: '/uk/tools/remortgage-calculator' },
  ],
  ca: [
    { label: 'TFSA/RRSP Calculator', href: '/ca/tools/tfsa-rrsp-calculator' },
    { label: 'Fee Savings Calculator', href: '/ca/tools/wealthsimple-calculator' },
    { label: 'Mortgage Affordability Calculator', href: '/ca/tools/ca-mortgage-affordability-calculator' },
  ],
  au: [
    { label: 'Superannuation Calculator', href: '/au/tools/superannuation-calculator' },
    { label: 'Mortgage Calculator', href: '/au/tools/au-mortgage-calculator' },
  ],
};

/**
 * Get silo-isolated tool links for a market.
 * Returns global tools + market-specific tools, never cross-market.
 */
export function getSiloToolLinks(market: Market): NavLink[] {
  return [...globalToolLinks, ...(marketToolLinks[market] || [])];
}

/** @deprecated Use getSiloToolLinks(market) for silo isolation */
export const toolLinks: NavLink[] = globalToolLinks;

export const socialLinks: NavLink[] = [
  { label: 'LinkedIn', href: 'https://linkedin.com/company/smartfinpro' },
  { label: 'YouTube', href: 'https://youtube.com/@smartfinpro' },
  { label: 'Instagram', href: 'https://instagram.com/smartfinpro' },
  { label: 'X', href: 'https://twitter.com/smartfinpro' },
  { label: 'Facebook', href: 'https://facebook.com/smartfinpro' },
];

// ── Utility Functions ────────────────────────────────────────

/**
 * Detect market from a URL pathname.
 * All markets use /{market}/ prefix: /us/, /uk/, /ca/, /au/
 */
export function detectMarketFromPath(pathname: string): Market {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && ['us', 'uk', 'ca', 'au'].includes(first)) {
    return first as Market;
  }
  return 'us';
}

/**
 * Get URL prefix for a market. All markets use /{market} prefix.
 */
export function getMarketPrefix(market: Market): string {
  return `/${market}`;
}

/**
 * Get silo-isolated category links for a market (for header + footer nav).
 * Returns only categories that belong to this market, never cross-market.
 */
export function getSiloCategoryLinks(market: Market): NavLink[] {
  const prefix = getMarketPrefix(market);
  const available = new Set(marketCategories[market] || []);
  const primary = marketSiloConfig[market]?.primaryNav || [];

  return primary
    .filter((cat) => available.has(cat))
    .map((cat) => ({
      label: categoryConfig[cat].name,
      href: `${prefix}/${cat}`,
    }));
}

/**
 * Get all category links for a market (including non-primary ones).
 */
export function getAllSiloCategoryLinks(market: Market): NavLink[] {
  const prefix = getMarketPrefix(market);
  return (marketCategories[market] || []).map((cat) => ({
    label: categoryConfig[cat].name,
    href: `${prefix}/${cat}`,
  }));
}

/**
 * Human-readable label for a URL segment (slug → Title Case).
 */
export function slugToLabel(slug: string): string {
  // Check if it's a known category
  if (slug in categoryConfig) {
    return categoryConfig[slug as Category].name;
  }

  // Check if it's a known market
  if (slug in marketConfig) {
    return marketConfig[slug as Market].name;
  }

  // Fallback: Slug to Title Case
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bAi\b/g, 'AI')
    .replace(/\bUk\b/g, 'UK')
    .replace(/\bUsa\b/g, 'USA')
    .replace(/\bIsa\b/g, 'ISA')
    .replace(/\bEtoro\b/g, 'eToro')
    .replace(/\bEsg\b/g, 'ESG')
    .replace(/\bTfsa\b/g, 'TFSA')
    .replace(/\bRrsp\b/g, 'RRSP')
    .replace(/\bFhsa\b/g, 'FHSA')
    .replace(/\bSmsf\b/g, 'SMSF')
    .replace(/\bCmc\b/g, 'CMC')
    .replace(/\bNordvpn\b/g, 'NordVPN')
    .replace(/\bIbkr\b/g, 'IBKR');
}
