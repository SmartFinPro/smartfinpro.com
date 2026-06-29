// lib/comparison/topics/manifest.ts
// Display manifest for the homepage "Best-X Compare Index" — the 10 money pages in
// display order. Plain data only (no functions) so it is client-safe and cheap.
// Runtime status (`live` | `legacy` | `coming_soon`) is DERIVED in getBestXIndex()
// from the registry + DB; `legacy: true` marks a page still on the old engine
// (the tile links to `/{market}/{category}/best`). `icon` is a key in the homepage
// iconMap (components/marketing/homepage-sections.tsx).

import type { Market, Category } from '@/lib/i18n/config';

export interface BestXManifestEntry {
  market: Market;
  category: Category;
  topic: string;
  label: string;
  blurb: string;
  icon: string;
  legacy?: boolean;
}

export const BEST_X_MANIFEST: BestXManifestEntry[] = [
  { market: 'us', category: 'personal-finance', topic: 'robo-advisors', label: 'Best Robo-Advisors', blurb: 'Automated investing, ranked by fees & features.', icon: 'Sparkles' },
  { market: 'us', category: 'business-banking', topic: 'business-bank-accounts', label: 'Best Business Bank Accounts', blurb: 'Fee-free business checking for startups & SMBs.', icon: 'Building', legacy: true },
  { market: 'us', category: 'trading', topic: 'trading-platforms', label: 'Best Trading Platforms', blurb: 'CFD & stock platforms by spreads and tools.', icon: 'TrendingUp' },
  { market: 'us', category: 'forex', topic: 'forex-brokers', label: 'Best Forex Brokers', blurb: 'Regulated FX brokers by spreads & execution.', icon: 'DollarSign' },
  { market: 'us', category: 'personal-finance', topic: 'high-yield-savings', label: 'Best High-Yield Savings', blurb: 'Top APY savings accounts, FDIC-insured.', icon: 'PiggyBank' },
  { market: 'us', category: 'personal-finance', topic: 'credit-monitoring', label: 'Best Credit Monitoring', blurb: 'Track your score & guard against fraud.', icon: 'Eye' },
  { market: 'us', category: 'credit-repair', topic: 'companies', label: 'Best Credit Repair', blurb: 'Dispute & rebuild services, compared.', icon: 'RefreshCw' },
  { market: 'us', category: 'ai-tools', topic: 'ai-tools-finance', label: 'Best AI Tools for Finance', blurb: 'AI software for finance professionals.', icon: 'Zap' },
  { market: 'us', category: 'cybersecurity', topic: 'cybersecurity-smb', label: 'Best Cybersecurity for SMBs', blurb: 'Security tools for small businesses.', icon: 'Shield' },
  { market: 'us', category: 'gold-investing', topic: 'platforms', label: 'Best Gold Investing Platforms', blurb: 'Buy & store gold, by fees & custody.', icon: 'Coins' },
];
