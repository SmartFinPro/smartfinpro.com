// lib/comparison/topics/manifest.ts
// Display manifest for the homepage "Best-X Compare Index" — the 10 money pages in
// display order. Plain data only (no functions) so it is client-safe and cheap.
// Runtime status (`live` | `legacy` | `coming_soon`) is DERIVED in getBestXIndex()
// from the registry + DB; `legacy: true` marks a page still on the old engine
// (the tile links to `/{market}/{category}/best`). `icon` is a key in the homepage
// iconMap (components/marketing/homepage-sections.tsx). `image` is the topic photo
// shown in the tile (served from public/images/comparison, optimized by next/image).

import type { Market, Category } from '@/lib/i18n/config';

export interface BestXManifestEntry {
  market: Market;
  category: Category;
  topic: string;
  label: string;
  blurb: string;
  icon: string;
  image: string;
  legacy?: boolean;
}

export const BEST_X_MANIFEST: BestXManifestEntry[] = [
  { market: 'us', category: 'personal-finance', topic: 'robo-advisors', label: 'Best Robo-Advisors', blurb: 'Automated investing, ranked by fees & features.', icon: 'Sparkles', image: '/images/comparison/robo-advisors.webp' },
  { market: 'us', category: 'business-banking', topic: 'business-bank-accounts', label: 'Best Business Bank Accounts', blurb: 'Fee-free business checking for startups & SMBs.', icon: 'Building', image: '/images/comparison/business-bank-accounts.webp' },
  { market: 'us', category: 'trading', topic: 'trading-platforms', label: 'Best Trading Platforms', blurb: 'US stock & options brokers, ranked by fees and features.', icon: 'TrendingUp', image: '/images/comparison/trading-platforms.webp' },
  { market: 'us', category: 'forex', topic: 'forex-brokers', label: 'Best Forex Brokers', blurb: 'Regulated FX brokers by spreads & execution.', icon: 'DollarSign', image: '/images/comparison/forex-brokers.webp' },
  { market: 'us', category: 'personal-finance', topic: 'high-yield-savings', label: 'Best High-Yield Savings', blurb: 'Top APY savings accounts, FDIC-insured.', icon: 'PiggyBank', image: '/images/comparison/high-yield-savings.webp' },
  { market: 'us', category: 'personal-finance', topic: 'credit-card-companies', label: 'Best Credit Card Companies', blurb: 'Top US card issuers ranked by bonus & rewards.', icon: 'CreditCard', image: '/images/comparison/credit-card-companies.webp' },
  { market: 'us', category: 'personal-finance', topic: 'credit-monitoring', label: 'Best Credit Monitoring', blurb: 'Track your score & guard against fraud.', icon: 'Eye', image: '/images/comparison/credit-monitoring.webp' },
  { market: 'us', category: 'credit-repair', topic: 'companies', label: 'Best Credit Repair', blurb: 'Dispute & rebuild services, compared.', icon: 'RefreshCw', image: '/images/comparison/credit-repair.webp' },
  { market: 'us', category: 'ai-tools', topic: 'ai-tools-finance', label: 'Best AI Tools for Finance', blurb: 'AI software for finance professionals.', icon: 'Zap', image: '/images/comparison/ai-tools-finance.webp' },
  { market: 'us', category: 'cybersecurity', topic: 'cybersecurity-smb', label: 'Best Cybersecurity for SMBs', blurb: 'Security tools for small businesses.', icon: 'Shield', image: '/images/comparison/cybersecurity-smb.webp' },
  { market: 'us', category: 'gold-investing', topic: 'platforms', label: 'Best Gold Investing Platforms', blurb: 'Buy & store gold, by fees & custody.', icon: 'Coins', image: '/images/comparison/gold-investing.webp' },
  { market: 'us', category: 'debt-relief', topic: 'companies', label: 'Best Debt Relief Companies', blurb: 'Settlement & debt management, by fees & accreditation.', icon: 'DollarSign', image: '/images/content/us/debt-relief/hero.webp' },

  // ── Australia (Stage 1 — AU/CA/UK rollout) ──
  // Tiles activate automatically once the topic's au: config is registered AND
  // prod rows exist (buildBestXIndex); until then they render "Launching soon".
  // Images reuse the US counterparts per the design-parity gate; super-funds
  // uses a documented editorial placeholder (no US counterpart exists).
  { market: 'au', category: 'personal-finance', topic: 'robo-advisors', label: 'Best Robo-Advisors & Micro-Investing', blurb: 'Australian robo-advice & micro-investing apps, ranked by fees.', icon: 'Sparkles', image: '/images/comparison/robo-advisors.webp' },
  { market: 'au', category: 'business-banking', topic: 'business-bank-accounts', label: 'Best Business Bank Accounts', blurb: 'Australian business accounts by monthly fee & FCS protection.', icon: 'Building', image: '/images/comparison/business-bank-accounts.webp' },
  { market: 'au', category: 'savings', topic: 'savings-accounts', label: 'Best High-Interest Savings', blurb: 'Top savings rates (p.a.) from APRA-regulated banks.', icon: 'PiggyBank', image: '/images/comparison/high-yield-savings.webp' },
  { market: 'au', category: 'trading', topic: 'cfd-brokers', label: 'Best CFD Trading Platforms', blurb: 'ASIC-regulated CFD brokers by spreads & platforms.', icon: 'TrendingUp', image: '/images/comparison/trading-platforms.webp' },
  { market: 'au', category: 'forex', topic: 'forex-brokers', label: 'Best Forex Brokers', blurb: 'ASIC-regulated FX brokers by all-in trading cost.', icon: 'DollarSign', image: '/images/comparison/forex-brokers.webp' },
  { market: 'au', category: 'gold-investing', topic: 'platforms', label: 'Best Gold Investing Platforms', blurb: 'Buy & store gold in Australia, by premiums & custody.', icon: 'Coins', image: '/images/comparison/gold-investing.webp' },
  { market: 'au', category: 'superannuation', topic: 'super-funds', label: 'Best Super Funds', blurb: 'APRA-regulated super funds by fees & long-term returns.', icon: 'Shield', image: '/images/content/au/personal-finance/hero.webp' },
  { market: 'au', category: 'ai-tools', topic: 'ai-tools-finance', label: 'Best AI Tools for Finance', blurb: 'AI software for Australian finance & business teams.', icon: 'Zap', image: '/images/comparison/ai-tools-finance.webp' },
  { market: 'au', category: 'cybersecurity', topic: 'cybersecurity-smb', label: 'Best Cybersecurity for SMBs', blurb: 'Security tools for Australian small businesses.', icon: 'Shield', image: '/images/comparison/cybersecurity-smb.webp' },

  // ── Canada (Stage 2 — AU/CA/UK rollout) ──
  // Tiles activate automatically once the topic's ca: config is registered AND
  // prod rows exist (buildBestXIndex); until then they render "Launching soon".
  // Images reuse the US counterparts per the design-parity gate where one
  // exists; tfsa-rrsp-platforms and mortgage-brokers reuse existing CA
  // content-hero images (debt-relief precedent for content-path manifest images).
  { market: 'ca', category: 'personal-finance', topic: 'robo-advisors', label: 'Best Robo-Advisors & Investing Apps', blurb: 'Canadian robo-advisors, ranked by fees & account types.', icon: 'Sparkles', image: '/images/comparison/robo-advisors.webp' },
  { market: 'ca', category: 'business-banking', topic: 'business-bank-accounts', label: 'Best Business Bank Accounts', blurb: 'Canadian business accounts by monthly fee & CDIC protection.', icon: 'Building', image: '/images/comparison/business-bank-accounts.webp' },
  { market: 'ca', category: 'tax-efficient-investing', topic: 'tfsa-rrsp-platforms', label: 'Best TFSA/RRSP Platforms', blurb: 'Self-directed discount brokerages by commission & fees.', icon: 'PiggyBank', image: '/images/content/ca/tax-efficient-investing/hero.webp' },
  { market: 'ca', category: 'forex', topic: 'forex-brokers', label: 'Best Forex Brokers', blurb: 'CIRO-regulated FX brokers by all-in trading cost.', icon: 'DollarSign', image: '/images/comparison/forex-brokers.webp' },
  { market: 'ca', category: 'housing', topic: 'mortgage-brokers', label: 'Best Mortgage Brokers', blurb: 'Rate-comparison platforms & brokers, by lender panel & rate.', icon: 'Building', image: '/images/content/ca/housing/hero.webp' },
  { market: 'ca', category: 'gold-investing', topic: 'platforms', label: 'Best Gold Investing Platforms', blurb: 'Buy & store gold in Canada, by premiums & accreditation.', icon: 'Coins', image: '/images/comparison/gold-investing.webp' },
  { market: 'ca', category: 'ai-tools', topic: 'ai-tools-finance', label: 'Best AI Tools for Finance', blurb: 'AI software for Canadian finance & business teams.', icon: 'Zap', image: '/images/comparison/ai-tools-finance.webp' },
  { market: 'ca', category: 'cybersecurity', topic: 'cybersecurity-smb', label: 'Best Cybersecurity for SMBs', blurb: 'Security tools for Canadian small businesses.', icon: 'Shield', image: '/images/comparison/cybersecurity-smb.webp' },
];
