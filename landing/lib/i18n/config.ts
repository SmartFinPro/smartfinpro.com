export const markets = ['us', 'uk', 'ca', 'au'] as const;
export type Market = (typeof markets)[number];

export const defaultMarket: Market = 'us';

export const marketConfig: Record<
  Market,
  {
    locale: string;
    hreflang: string;
    name: string;
    currency: string;
    currencySymbol: string;
    flag: string;
  }
> = {
  us: {
    locale: 'en-US',
    hreflang: 'en-US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    flag: '🇺🇸',
  },
  uk: {
    locale: 'en-GB',
    hreflang: 'en-GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    flag: '🇬🇧',
  },
  ca: {
    locale: 'en-CA',
    hreflang: 'en-CA',
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: 'C$',
    flag: '🇨🇦',
  },
  au: {
    locale: 'en-AU',
    hreflang: 'en-AU',
    name: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    flag: '🇦🇺',
  },
};

export const categories = [
  'ai-tools',
  'cybersecurity',
  'trading',
  'forex',
  'personal-finance',
  'business-banking',
  'credit-repair',
  'debt-relief',
  'credit-score',
  'remortgaging',
  'cost-of-living',
  'savings',
  'superannuation',
  'gold-investing',
  'tax-efficient-investing',
  'housing',
] as const;
export type Category = (typeof categories)[number];

// Categories available per market
export const marketCategories: Record<Market, Category[]> = {
  us: [
    'ai-tools',
    'cybersecurity',
    'personal-finance',
    'trading',
    'business-banking',
    'credit-repair',
    'debt-relief',
    'credit-score',
  ],
  uk: [
    'ai-tools',
    'cybersecurity',
    'trading',
    'personal-finance',
    'business-banking',
    'remortgaging',
    'cost-of-living',
    'savings',
  ],
  ca: [
    'ai-tools',
    'cybersecurity',
    'forex',
    'personal-finance',
    'business-banking',
    'tax-efficient-investing',
    'housing',
  ],
  au: [
    'ai-tools',
    'cybersecurity',
    'trading',
    'forex',
    'personal-finance',
    'business-banking',
    'superannuation',
    'gold-investing',
    'savings',
  ],
};

export const categoryConfig: Record<
  Category,
  {
    name: string;
    description: string;
    icon: string;
  }
> = {
  'ai-tools': {
    name: 'AI Tools',
    description: 'AI-powered software for finance professionals',
    icon: 'Sparkles',
  },
  cybersecurity: {
    name: 'Cybersecurity',
    description: 'Security solutions for financial services',
    icon: 'Shield',
  },
  trading: {
    name: 'Trading Platforms',
    description: 'CFD and stock trading platforms',
    icon: 'TrendingUp',
  },
  forex: {
    name: 'Forex Brokers',
    description: 'Foreign exchange trading platforms',
    icon: 'DollarSign',
  },
  'personal-finance': {
    name: 'Personal Finance',
    description: 'Loans, credit and personal finance solutions',
    icon: 'Wallet',
  },
  'business-banking': {
    name: 'Business Banking',
    description: 'Banking solutions for businesses',
    icon: 'Building',
  },
  'credit-repair': {
    name: 'Credit Repair',
    description: 'Credit repair services and credit building solutions',
    icon: 'TrendingUp',
  },
  'debt-relief': {
    name: 'Debt Relief',
    description: 'Debt consolidation and relief programs',
    icon: 'DollarSign',
  },
  'credit-score': {
    name: 'Credit Score',
    description: 'Credit monitoring and score improvement tools',
    icon: 'BarChart',
  },
  remortgaging: {
    name: 'Remortgaging',
    description: 'UK mortgage refinancing and broker services',
    icon: 'Home',
  },
  'cost-of-living': {
    name: 'Cost of Living',
    description: 'Money-saving strategies for UK households',
    icon: 'PiggyBank',
  },
  savings: {
    name: 'Savings',
    description: 'High-yield savings accounts and products',
    icon: 'PiggyBank',
  },
  superannuation: {
    name: 'Superannuation',
    description: 'Australian retirement savings and super funds',
    icon: 'Wallet',
  },
  'gold-investing': {
    name: 'Gold Investing',
    description: 'Physical gold and precious metals investment',
    icon: 'Coins',
  },
  'tax-efficient-investing': {
    name: 'Tax-Efficient Investing',
    description: 'TFSA, RRSP and tax-optimized investment strategies',
    icon: 'TrendingUp',
  },
  housing: {
    name: 'Housing',
    description: 'First-time home buyers and mortgage solutions',
    icon: 'Home',
  },
};

// ── Navigation Group Config (Market-First Finance Structure) ──
export const navGroups = ['Investing', 'Banking', 'Trading', 'Tools'] as const;
export type NavGroup = (typeof navGroups)[number];

export const navGroupConfig: Record<
  NavGroup,
  {
    icon: string;
    categories: Category[];
    description: string;
  }
> = {
  Investing: {
    icon: 'TrendingUp',
    categories: ['personal-finance', 'ai-tools', 'tax-efficient-investing', 'superannuation', 'gold-investing', 'savings'],
    description: 'Personal finance, robo-advisors & AI tools',
  },
  Banking: {
    icon: 'Building',
    categories: ['business-banking', 'credit-repair', 'debt-relief', 'credit-score'],
    description: 'Business accounts, credit & debt solutions',
  },
  Trading: {
    icon: 'BarChart3',
    categories: ['trading', 'forex', 'cybersecurity'],
    description: 'CFD platforms, forex brokers & security',
  },
  Tools: {
    icon: 'Calculator',
    categories: ['remortgaging', 'cost-of-living', 'housing'],
    description: 'Calculators, comparison tools & quizzes',
  },
};

/**
 * Get nav groups with categories filtered for a specific market.
 * E.g. US doesn't have forex, so Trading group won't show forex for US.
 */
export function getNavGroupsForMarket(market: Market) {
  const available = new Set(marketCategories[market] || []);
  return navGroups
    .map((group) => ({
      group,
      ...navGroupConfig[group],
      categories: navGroupConfig[group].categories.filter((c) => available.has(c)),
    }))
    .filter((g) => g.group === 'Tools' || g.categories.length > 0);
}

export function isValidMarket(market: string): market is Market {
  return markets.includes(market as Market);
}

export function isValidCategory(category: string): category is Category {
  return categories.includes(category as Category);
}

export function getCategoryForMarket(market: Market): Category[] {
  return marketCategories[market] || [];
}
