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
] as const;
export type Category = (typeof categories)[number];

// Categories available per market
export const marketCategories: Record<Market, Category[]> = {
  us: ['ai-tools', 'cybersecurity', 'personal-finance', 'trading', 'business-banking'],
  uk: ['ai-tools', 'cybersecurity', 'trading', 'personal-finance', 'business-banking'],
  ca: ['ai-tools', 'cybersecurity', 'forex', 'personal-finance', 'business-banking'],
  au: ['ai-tools', 'cybersecurity', 'trading', 'forex', 'business-banking'],
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
};

export function isValidMarket(market: string): market is Market {
  return markets.includes(market as Market);
}

export function isValidCategory(category: string): category is Category {
  return categories.includes(category as Category);
}

export function getCategoryForMarket(market: Market): Category[] {
  return marketCategories[market] || [];
}
