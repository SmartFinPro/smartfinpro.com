import type { Market } from '@/types';

/**
 * 10 Money-Keywords Seed Set
 * ─────────────────────────
 * These are the initial high-value keywords tracked across all 4 markets.
 * Used as the default seed set when no GSC data is available yet.
 */
export const MONEY_KEYWORDS: {
  keyword: string;
  market: Market;
  page: string;
  category: string;
}[] = [
  { keyword: 'best trading platform', market: 'us', page: '/us/trading', category: 'trading' },
  { keyword: 'best forex broker', market: 'us', page: '/us/forex', category: 'forex' },
  { keyword: 'best ai tools for finance', market: 'us', page: '/ai-tools', category: 'ai-tools' },
  { keyword: 'best business bank account', market: 'uk', page: '/uk/business-banking', category: 'business-banking' },
  { keyword: 'best trading app uk', market: 'uk', page: '/uk/trading', category: 'trading' },
  { keyword: 'best forex broker canada', market: 'ca', page: '/ca/forex', category: 'forex' },
  { keyword: 'best cybersecurity software', market: 'us', page: '/cybersecurity', category: 'cybersecurity' },
  { keyword: 'best personal finance app', market: 'us', page: '/personal-finance', category: 'personal-finance' },
  { keyword: 'best trading platform australia', market: 'au', page: '/au/trading', category: 'trading' },
  { keyword: 'etoro review', market: 'us', page: '/us/reviews/etoro', category: 'trading' },
];
