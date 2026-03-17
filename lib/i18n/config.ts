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
    'forex',
    'gold-investing',
  ],
  uk: [
    'ai-tools',
    'cybersecurity',
    'trading',
    'forex',
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
    summaryText?: string;
    detailsText?: string;
  }
> = {
  'ai-tools': {
    name: 'AI Tools',
    description: 'AI-powered software for finance professionals',
    icon: 'Sparkles',
    summaryText: 'Artificial intelligence is transforming the financial services industry, enabling professionals to automate complex workflows, generate predictive analytics, and streamline compliance processes. Our expert research covers the leading AI platforms purpose-built for finance — from portfolio optimization engines to intelligent document processing and fraud detection systems.',
    detailsText: 'Each report in this category evaluates pricing models, integration capabilities with existing fintech stacks, regulatory compliance features, and measurable ROI. Whether you are a wealth manager seeking AI-driven client insights or a CFO exploring automated reporting, our independent reviews help you identify the right solution for your specific use case and budget.',
  },
  cybersecurity: {
    name: 'Cybersecurity',
    description: 'Security solutions for financial services',
    icon: 'Shield',
    summaryText: 'Financial institutions face increasingly sophisticated cyber threats — from ransomware attacks targeting transaction systems to social engineering exploits aimed at customer data. Our cybersecurity research evaluates the most effective security platforms designed specifically for the financial sector, covering endpoint protection, threat intelligence, and regulatory compliance.',
    detailsText: 'Reports in this category assess deployment complexity, detection accuracy, incident response capabilities, and total cost of ownership. We benchmark each solution against frameworks like PCI DSS, SOC 2, and ISO 27001 to ensure your security infrastructure meets both operational needs and compliance mandates.',
  },
  trading: {
    name: 'Trading Platforms',
    description: 'CFD and stock trading platforms',
    icon: 'TrendingUp',
    summaryText: 'Selecting the right trading platform directly impacts execution speed, available instruments, and overall profitability. Our research covers the leading CFD, stock, and multi-asset platforms — evaluating spreads, commissions, charting tools, and regulatory protections across global markets.',
    detailsText: 'Each report includes hands-on testing of order execution, platform stability during volatile markets, mobile trading capabilities, and educational resources. We compare fee structures transparently and assess regulatory standing with bodies like the FCA, ASIC, and SEC to help traders at every level make informed decisions.',
  },
  forex: {
    name: 'Forex Brokers',
    description: 'Foreign exchange trading platforms',
    icon: 'DollarSign',
    summaryText: 'The foreign exchange market processes over $7.5 trillion in daily volume, making broker selection critical for both retail and institutional traders. Our expert reviews analyze forex brokers across key dimensions including spreads, leverage options, execution models, and multi-jurisdictional regulation.',
    detailsText: 'Reports cover currency pair availability, swap rates, copy trading features, and the quality of analytical tools provided. We verify regulatory licenses, test withdrawal processing times, and evaluate customer support responsiveness to give you a complete picture before you commit capital.',
  },
  'personal-finance': {
    name: 'Personal Finance',
    description: 'Loans, credit and personal finance solutions',
    icon: 'Wallet',
    summaryText: 'Managing personal finances effectively requires access to the right tools — from loan comparison engines and credit monitoring services to budgeting apps and robo-advisors. Our research covers platforms that help individuals optimize borrowing costs, build credit, and grow long-term wealth.',
    detailsText: 'Each report evaluates interest rates, fee transparency, user experience, and integration with banking ecosystems. We assess eligibility criteria, approval timelines, and customer support quality so you can confidently choose financial products that align with your goals and circumstances.',
  },
  'business-banking': {
    name: 'Business Banking',
    description: 'Banking solutions for businesses',
    icon: 'Building',
    summaryText: 'Modern business banking extends far beyond basic checking accounts — encompassing payroll integration, multi-currency capabilities, expense management, and API-driven financial infrastructure. Our reviews evaluate banking platforms tailored for startups, SMEs, and enterprise organizations across key global markets.',
    detailsText: 'Reports assess account fees, transaction limits, lending products, and the quality of accounting software integrations. We compare digital-first challengers against established banks, testing onboarding speed, customer support, and the availability of specialized features like invoice financing and international payments.',
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
