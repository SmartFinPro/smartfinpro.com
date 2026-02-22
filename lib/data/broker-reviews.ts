import type { Market } from '@/lib/i18n/config';

/* ────────────────────────────────────────────────────────────── */
/*  TYPES                                                        */
/* ────────────────────────────────────────────────────────────── */

export type BrokerSlug = 'etoro' | 'capital-com' | 'ibkr' | 'investing' | 'revolut' | 'ig' | 'plus500';

export interface BrokerSpec {
  label: string;
  value: string;
  valueUs?: string;
}

export interface BrokerSpecsTable {
  columns: string[];
  rows: string[][];
  rowsUs?: string[][];
}

export interface BrokerFeature {
  title: string;
  description: string;
  descriptionUs?: string;
}

export interface BrokerReviewData {
  slug: BrokerSlug;
  name: string;
  logo: string;
  tagline: string;
  rating: number;
  accentColor: 'emerald' | 'blue' | 'navy' | 'amber' | 'rose';
  seo: { title: string; description: string };
  verdict: string;
  pros: string[];
  prosUs?: string[];
  con: string;
  conUs?: string;
  affiliateUrl: string;
  ctaLabel: string;
  story: string;
  storyUs?: string;
  features: BrokerFeature[];
  specsTitle: string;
  specs: BrokerSpec[];
  specsTable: BrokerSpecsTable;
  comparisonFeatures: Record<string, boolean | string>;
  comparisonFeaturesUs?: Record<string, boolean | string>;
  reviewCount: number;
  price: string;
  /** True for data/research platforms (not brokers) — shows info disclaimer instead of CFD warning. */
  isDataPlatform?: boolean;
}

export interface RegionalCompliance {
  regulator: string;
  regulatorFull: string;
  riskWarning: string;
  noCFD: boolean;
}

/* ────────────────────────────────────────────────────────────── */
/*  COMPARISON TABLE LABELS                                      */
/* ────────────────────────────────────────────────────────────── */

export const comparisonLabels: Record<string, string> = {
  socialTrading: 'Social / Copy Trading',
  aiAnalysis: 'AI-Powered Analysis',
  minDeposit: 'Minimum Deposit',
  tradableAssets: 'Tradable Assets',
  mobileRating: 'Mobile App Rating',
  education: 'Education Platform',
  tierOneReg: 'Tier-1 Regulation',
  demoAccount: 'Free Demo Account',
};

/* ────────────────────────────────────────────────────────────── */
/*  REGIONAL COMPLIANCE                                          */
/* ────────────────────────────────────────────────────────────── */

export const regionalCompliance: Record<Market, RegionalCompliance> = {
  us: {
    regulator: 'SEC / FINRA',
    regulatorFull: 'Securities and Exchange Commission / Financial Industry Regulatory Authority',
    riskWarning:
      'Securities trading involves risk of loss. Past performance is not indicative of future results. Not FDIC insured. No bank guarantee. May lose value.',
    noCFD: true,
  },
  uk: {
    regulator: 'FCA',
    regulatorFull: 'Financial Conduct Authority',
    riskWarning:
      'CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. 76% of retail investor accounts lose money when trading CFDs. You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money.',
    noCFD: false,
  },
  ca: {
    regulator: 'CIRO',
    regulatorFull: 'Canadian Investment Regulatory Organization',
    riskWarning:
      'Trading involves significant risk of loss. Leveraged products carry a high degree of risk and are not suitable for all investors. Ensure you fully understand the risks involved before trading.',
    noCFD: false,
  },
  au: {
    regulator: 'ASIC',
    regulatorFull: 'Australian Securities and Investments Commission',
    riskWarning:
      'CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. Consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money.',
    noCFD: false,
  },
};

/* ────────────────────────────────────────────────────────────── */
/*  BROKER DATA                                                  */
/* ────────────────────────────────────────────────────────────── */

export const brokerReviews: Record<BrokerSlug, BrokerReviewData> = {
  /* ═══════════════════════════════════════════════════════════
     eToro — The Social Trading Revolution
     ═══════════════════════════════════════════════════════════ */
  etoro: {
    slug: 'etoro',
    name: 'eToro',
    logo: '/images/brokers/etoro.svg',
    tagline: 'The Social Trading Revolution',
    rating: 4.5,
    accentColor: 'emerald',
    seo: {
      title: 'eToro Review 2026: Master Social Trading | SmartFinPro',
      description:
        'Copy top traders in real-time. 0% commission on stocks. Our expert review of eToro\'s CopyTrader™, Smart Portfolios, and social trading ecosystem.',
    },
    verdict:
      'eToro\'s CopyTrader™ technology and zero-commission structure make it the ideal entry point for new investors who want to learn from proven performers while building their own portfolio.',
    pros: [
      'CopyTrader™ lets you replicate top performers with one click — no trading experience required to get started.',
      'Zero commission on real stock and ETF purchases across all supported markets, keeping your costs minimal.',
      'Smart Portfolios provide diversified thematic exposure to sectors like AI, renewable energy, and crypto — without management fees.',
    ],
    prosUs: [
      'CopyTrader™ lets you replicate top performers with one click — no trading experience required to get started.',
      'Zero commission on real stock, ETF, and cryptocurrency purchases across all supported US markets.',
      'Smart Portfolios provide diversified thematic exposure to sectors like AI, renewable energy, and crypto — without management fees.',
    ],
    con: 'Spreads on forex and CFDs are wider than specialist brokers, making eToro less competitive for high-frequency or spread-sensitive strategies.',
    conUs: 'Spreads on forex pairs are wider than specialist brokers, making eToro less competitive for high-frequency or spread-sensitive forex strategies.',
    affiliateUrl: 'https://www.etoro.com/?aff_id=SMARTFINPRO',
    ctaLabel: 'Try eToro Free',
    story:
      'Investing was once a solitary pursuit — hours spent analyzing charts alone, making high-stakes decisions in isolation. eToro fundamentally changed that paradigm. Built on the principle that collective intelligence outperforms individual guesswork, eToro\'s social trading ecosystem transforms how millions of people engage with financial markets.\n\nThe platform\'s genius lies in its simplicity. Rather than overwhelming newcomers with complex order types and advanced charting tools, eToro lowers the barrier to entry with an interface that feels more like a social network than a trading terminal. But make no mistake — beneath that accessible exterior lies a robust multi-asset platform serving over 30 million registered users across 100+ countries.\n\nWhat truly sets eToro apart is CopyTrader™, the flagship feature that allows you to mirror the exact trades of top-performing investors in real time. This isn\'t a hypothetical — you allocate real capital, and every position the copied trader opens is replicated proportionally in your portfolio. For beginners, it\'s a powerful way to learn by doing. For experienced traders, it\'s an opportunity to diversify strategies without additional research overhead.\n\nCombined with zero-commission stock trading, curated Smart Portfolios for thematic investing, and a vibrant community of traders sharing ideas and strategies, eToro has positioned itself as the most accessible gateway to global markets.',
    storyUs:
      'Investing was once a solitary pursuit — hours spent analyzing charts alone, making high-stakes decisions in isolation. eToro fundamentally changed that paradigm. Built on the principle that collective intelligence outperforms individual guesswork, eToro\'s social trading ecosystem transforms how millions of Americans engage with financial markets.\n\nThe platform\'s genius lies in its simplicity. Rather than overwhelming newcomers with complex order types and advanced charting tools, eToro lowers the barrier to entry with an interface that feels more like a social network than a trading terminal. But make no mistake — beneath that accessible exterior lies a robust multi-asset platform serving over 30 million registered users worldwide, with eToro USA LLC fully regulated by FINRA and registered with the SEC.\n\nWhat truly sets eToro apart is CopyTrader™, the flagship feature that allows you to mirror the exact trades of top-performing investors in real time. You allocate real capital, and every stock or crypto position the copied trader opens is replicated proportionally in your portfolio. For beginners, it\'s a powerful way to learn by doing. For experienced investors, it\'s an opportunity to diversify strategies without additional research overhead.\n\nCombined with zero-commission stock and ETF trading, curated Smart Portfolios for thematic investing in sectors like AI and clean energy, and a vibrant community of investors sharing ideas and strategies, eToro has positioned itself as the most accessible gateway to US markets.',
    features: [
      {
        title: 'CopyTrader™ Technology',
        description:
          'The flagship feature that put eToro on the map. CopyTrader™ lets you allocate capital to mirror the real-time trades of proven performers. Browse detailed performance histories, risk scores, and strategy breakdowns before committing a single dollar. The system handles position sizing automatically, and you can stop copying at any time. Over 3 million copy trades are executed monthly across the platform.',
        descriptionUs:
          'The flagship feature that put eToro on the map. CopyTrader™ lets you allocate capital to mirror the real-time stock and crypto trades of proven investors. Browse detailed performance histories, risk scores, and strategy breakdowns before committing a single dollar. The system handles position sizing automatically, and you can stop copying at any time. Over 3 million copy trades are executed monthly across the platform.',
      },
      {
        title: 'Smart Portfolios',
        description:
          'Think of Smart Portfolios as curated investment themes — AI & Big Data, Renewable Energy, Crypto Equal-Weight, Gaming, and dozens more. Each portfolio is professionally constructed, automatically rebalanced, and requires no management fees. They offer instant diversification for investors who believe in a macro trend but don\'t want to pick individual stocks or tokens.',
      },
      {
        title: 'Zero-Commission Trading',
        description:
          'eToro eliminated commissions on real stock purchases across all supported markets — a move that democratized access to equity investing. You buy the actual underlying asset (not a derivative), meaning you receive dividends and can attend shareholder meetings. Combined with fractional shares starting from $10, eToro makes portfolio building accessible to every budget.',
        descriptionUs:
          'eToro eliminated commissions on real stock and ETF purchases across US markets — a move that democratized access to equity investing. You buy the actual underlying asset, meaning you receive dividends and can attend shareholder meetings. Combined with fractional shares starting from $10 and zero-commission crypto trading, eToro makes portfolio building accessible to every budget.',
      },
    ],
    specsTitle: 'eToro Performance-Check',
    specs: [
      { label: 'Social Feed', value: 'Integrated — 30M+ users' },
      { label: 'Asset Classes', value: 'Stocks, CFDs, Crypto, ETFs, Forex', valueUs: 'Stocks, Crypto, ETFs, Forex' },
      { label: 'Regulation', value: 'FCA, ASIC, CySEC', valueUs: 'SEC / FINRA (eToro USA LLC)' },
      { label: 'Mobile App Rating', value: '4.5 / 5 (App Store)' },
      { label: 'Copy Trading', value: 'CopyTrader™ — 1-click mirroring' },
      { label: 'Minimum Deposit', value: '$50 – $200 (varies by region)', valueUs: '$10' },
    ],
    specsTable: {
      columns: ['Feature', 'Status', 'Performance', 'Details'],
      rows: [
        ['Social Feed', 'Active', 'Very High', '30M+ integrated users'],
        ['Multi-Asset Trading', 'Full Coverage', 'High', 'Stocks, CFDs, Crypto, ETFs, Forex'],
        ['CopyTrader™', 'Live', 'Very High', '1-click portfolio mirroring'],
        ['Regulation', 'Licensed', 'Very High', 'FCA, ASIC, CySEC'],
        ['Mobile Experience', 'Optimized', 'High', '4.5/5 App Store Rating'],
        ['Minimum Deposit', '$50–$200', 'Medium', 'Varies by region'],
      ],
      rowsUs: [
        ['Social Feed', 'Active', 'Very High', '30M+ integrated users'],
        ['Multi-Asset Trading', 'Full Coverage', 'High', 'Stocks, Crypto, ETFs, Forex'],
        ['CopyTrader™', 'Live', 'Very High', '1-click portfolio mirroring'],
        ['Regulation', 'Licensed', 'Very High', 'SEC / FINRA (eToro USA LLC)'],
        ['Mobile Experience', 'Optimized', 'High', '4.5/5 App Store Rating'],
        ['Minimum Deposit', '$10', 'Very High', 'No minimum for US clients'],
      ],
    },
    comparisonFeatures: {
      socialTrading: 'CopyTrader™',
      aiAnalysis: false,
      minDeposit: '$50–$200',
      tradableAssets: 'Stocks, CFDs, Crypto, ETFs',
      mobileRating: '4.5 / 5',
      education: 'eToro Academy',
      tierOneReg: true,
      demoAccount: true,
    },
    comparisonFeaturesUs: {
      socialTrading: 'CopyTrader™',
      aiAnalysis: false,
      minDeposit: '$10',
      tradableAssets: 'Stocks, Crypto, ETFs',
      mobileRating: '4.5 / 5',
      education: 'eToro Academy',
      tierOneReg: true,
      demoAccount: true,
    },
    reviewCount: 2847,
    price: 'Free',
  },

  /* ═══════════════════════════════════════════════════════════
     Capital.com — The AI-Powered Edge
     ═══════════════════════════════════════════════════════════ */
  'capital-com': {
    slug: 'capital-com',
    name: 'Capital.com',
    logo: '/images/brokers/capital-com.svg',
    tagline: 'The AI-Powered Edge',
    rating: 4.6,
    accentColor: 'blue',
    seo: {
      title: 'Capital.com Review 2026: AI-Powered Trading Advantage | SmartFinPro',
      description:
        'Trade smarter with AI-driven insights. Spreads from 0.1 pips, TradingView integration, and behavioral coaching. Our expert Capital.com review.',
    },
    verdict:
      'Capital.com\'s AI-driven behavioral feedback is genuinely unique in the industry, delivering institutional-quality risk insights that help traders of all levels avoid costly psychological mistakes.',
    pros: [
      'Proprietary AI analyzes your trading behavior and delivers personalized coaching to eliminate costly biases in real time.',
      'Spreads from 0.1 pips with sub-25ms execution speed — competitive with institutional-grade trading platforms.',
      'Seamless TradingView integration combines world-class charting with Capital.com\'s ultra-fast execution engine.',
    ],
    prosUs: [
      'Proprietary AI analyzes your trading behavior and delivers personalized coaching to eliminate costly biases in real time.',
      'Spreads from 0.1 pips on major forex pairs with sub-25ms execution speed — competitive with institutional-grade platforms.',
      'Seamless TradingView integration combines world-class charting with Capital.com\'s ultra-fast forex execution engine.',
    ],
    con: 'No direct stock ownership — all positions are CFD-based, which means no voting rights or dividend payments on equity positions.',
    conUs: 'US availability is limited to forex trading only. Stock and index exposure is not available for US-based clients at this time.',
    affiliateUrl: 'https://capital.com/?aff_id=SMARTFINPRO',
    ctaLabel: 'Try Capital.com Free',
    story:
      'In an industry where most platforms compete on spreads and execution speed alone, Capital.com took a radically different approach: they built an AI system designed to make you a better trader. The premise is straightforward yet profound — human psychology is the single biggest obstacle to profitable trading, and technology can help overcome it.\n\nCapital.com\'s proprietary AI engine analyzes your trading patterns in real time, identifying behavioral biases that silently erode your returns. Are you cutting winners too short? Holding losers too long? Over-leveraging after a winning streak? The system detects these patterns and delivers actionable feedback before your next trade. It\'s like having an institutional risk manager watching over your shoulder — except it never sleeps and never judges.\n\nBeyond the AI layer, Capital.com delivers institutional-grade execution with spreads starting from 0.1 pips and average fill times under 25 milliseconds. The platform integrates seamlessly with TradingView, giving you access to the world\'s most advanced charting tools while executing through Capital.com\'s high-performance infrastructure.\n\nThe Investmate companion app rounds out the ecosystem with structured learning paths, from beginner fundamentals to advanced technical analysis. Every educational module is designed to reinforce the AI\'s behavioral coaching, creating a virtuous cycle of learning, trading, and improving — a formula that has attracted over 800,000 active traders worldwide.',
    storyUs:
      'In an industry where most platforms compete on spreads and execution speed alone, Capital.com took a radically different approach: they built an AI system designed to make you a better trader. The premise is straightforward yet profound — human psychology is the single biggest obstacle to profitable trading, and technology can help overcome it.\n\nCapital.com\'s proprietary AI engine analyzes your trading patterns in real time, identifying behavioral biases that silently erode your returns. Are you cutting winners too short? Holding losers too long? Over-leveraging after a winning streak? The system detects these patterns and delivers actionable feedback before your next trade. It\'s like having an institutional risk manager watching over your shoulder — except it never sleeps and never judges.\n\nFor US-based traders, Capital.com offers access to major forex pairs with spreads starting from 0.1 pips and average fill times under 25 milliseconds. The platform integrates seamlessly with TradingView, giving you access to the world\'s most advanced charting tools while executing through Capital.com\'s high-performance infrastructure.\n\nThe Investmate companion app rounds out the ecosystem with structured learning paths, from beginner fundamentals to advanced technical analysis. Every educational module is designed to reinforce the AI\'s behavioral coaching, creating a virtuous cycle of learning, trading, and improving — a formula that has attracted over 800,000 active traders worldwide.',
    features: [
      {
        title: 'AI-Powered Trading Feedback',
        description:
          'Capital.com\'s standout innovation is its AI behavioral engine. As you trade, the system builds a psychological profile based on your decisions — entry timing, position sizing, exit patterns, and risk appetite. It then compares your behavior against statistically optimal strategies and flags deviations. The feedback arrives as clear, non-judgmental notifications: "You tend to close profitable positions 40% earlier than optimal" or "Your loss aversion increases after consecutive winning trades." This isn\'t a gimmick — it\'s applied behavioral finance at scale.',
      },
      {
        title: 'Ultra-Fast Execution Engine',
        description:
          'Speed matters in trading, and Capital.com delivers. With average execution times under 25 milliseconds and spreads starting from 0.1 pips on major pairs, the platform competes head-to-head with institutional-grade venues. Minimal slippage, no requotes, and transparent pricing ensure that the price you see is the price you get — critical for scalpers and news traders who depend on split-second fills.',
      },
      {
        title: 'Investmate Learning Platform',
        description:
          'Investmate transforms financial education from passive consumption to active engagement. The app delivers structured courses covering fundamental analysis, technical charting, risk management, and trading psychology — each module building on the last. Interactive quizzes reinforce key concepts, while real-market simulations let you practice strategies without risking capital. It\'s the most comprehensive mobile trading education platform we\'ve tested.',
      },
    ],
    specsTitle: 'Capital.com Tech-Matrix',
    specs: [
      { label: 'AI Features', value: 'Real-time behavioral analysis' },
      { label: 'Spreads', value: 'From 0.1 pips' },
      { label: 'TradingView', value: 'Full native integration' },
      { label: 'Risk Management', value: 'Dynamic SL/TP, margin alerts' },
      { label: 'Execution Speed', value: '< 25ms average fill time' },
      { label: 'Education', value: 'Investmate app (iOS & Android)' },
    ],
    specsTable: {
      columns: ['Capability', 'Technology', 'Performance', 'Assessment'],
      rows: [
        ['AI Analysis', 'Behavioral Engine', 'Real-time', 'Industry-leading'],
        ['Spreads', 'Dynamic Pricing', 'From 0.1 pips', 'Highly competitive'],
        ['TradingView', 'Native Integration', 'Full access', 'Seamless'],
        ['Risk Management', 'Dynamic SL/TP', 'Automated', 'Comprehensive'],
        ['Execution Speed', 'Low-latency Engine', '< 25ms avg', 'Institutional-grade'],
        ['Education', 'Investmate App', 'iOS & Android', 'Best-in-class'],
      ],
    },
    comparisonFeatures: {
      socialTrading: false,
      aiAnalysis: 'Behavioral AI',
      minDeposit: '$20',
      tradableAssets: '3,000+ CFDs',
      mobileRating: '4.6 / 5',
      education: 'Investmate App',
      tierOneReg: true,
      demoAccount: true,
    },
    comparisonFeaturesUs: {
      socialTrading: false,
      aiAnalysis: 'Behavioral AI',
      minDeposit: '$20',
      tradableAssets: 'Forex pairs',
      mobileRating: '4.6 / 5',
      education: 'Investmate App',
      tierOneReg: true,
      demoAccount: true,
    },
    reviewCount: 1923,
    price: 'Free',
  },

  /* ═══════════════════════════════════════════════════════════
     Interactive Brokers — Institutional Power
     ═══════════════════════════════════════════════════════════ */
  ibkr: {
    slug: 'ibkr',
    name: 'Interactive Brokers',
    logo: '/images/brokers/ibkr.svg',
    tagline: 'Institutional Power for Every Investor',
    rating: 4.8,
    accentColor: 'navy',
    seo: {
      title: 'Interactive Brokers Review 2026: Institutional Power for Pros | SmartFinPro',
      description:
        'Access 150+ markets with institutional rates. Lowest commissions, SmartRouting™, and up to 4.83% on idle cash. Our expert IBKR review.',
    },
    verdict:
      'Interactive Brokers delivers unmatched global market access and the industry\'s lowest total cost of ownership — the definitive choice for serious, active traders who prioritize execution quality over aesthetics.',
    pros: [
      'Access to 150+ markets across 33 countries from a single unified account — the broadest reach of any retail broker worldwide.',
      'Industry-lowest commissions starting at $0.005/share with transparent tiered pricing and no hidden platform fees.',
      'Earn up to 4.83% APY on uninvested cash balances — one of the highest rates offered by any brokerage.',
    ],
    con: 'Trader Workstation (TWS) has a steep learning curve and a dated interface that can overwhelm beginners and casual investors.',
    affiliateUrl: 'https://www.interactivebrokers.com/?aff_id=SMARTFINPRO',
    ctaLabel: 'Open IBKR Account',
    story:
      'Interactive Brokers doesn\'t chase retail trends. There are no gamified interfaces, no social feeds, no flashy marketing campaigns. What IBKR offers instead is something far more valuable: the same institutional-grade infrastructure that hedge funds and proprietary trading firms rely on — available to individual investors at a fraction of the cost.\n\nFounded in 1978 by Thomas Peterffy, a pioneer in electronic trading, Interactive Brokers has spent over four decades building the most comprehensive brokerage platform on the planet. The numbers speak for themselves: access to 150+ markets across 33 countries, trading in 26 currencies, and coverage spanning stocks, options, futures, bonds, funds, and forex — all from a single unified account.\n\nThe Trader Workstation (TWS) is the nerve center of the IBKR experience. It\'s not pretty, and it has a learning curve. But for traders who value substance over style, TWS delivers unmatched analytical power with real-time risk management, over 100 order types, and SmartRouting technology that scans multiple execution venues simultaneously to find the best available price for every order.\n\nPerhaps most compelling is IBKR\'s cost structure. With commissions starting at $0.005 per share, margin rates among the lowest in the industry, and up to 4.83% APY on uninvested cash, Interactive Brokers consistently delivers the lowest total cost of ownership for active traders — a fact that explains why professionals and institutions have trusted this platform for decades.',
    features: [
      {
        title: 'Institutional Trading Rates',
        description:
          'IBKR\'s tiered pricing structure is designed for cost-conscious traders. Stock commissions start at $0.005 per share (with a $1 minimum), options at $0.65 per contract, and futures at $0.85 per contract. Margin rates scale down with portfolio size, reaching as low as benchmark + 0.5% for balances over $3.5 million. There are no platform fees, no inactivity fees, and no data fees for basic market data. For active traders, the savings compound dramatically over time.',
      },
      {
        title: 'Global Market Access',
        description:
          'No other retail broker comes close to IBKR\'s market coverage. Trade stocks, options, futures, bonds, funds, forex, and commodities across 150+ markets in 33 countries — all from a single account denominated in any of 26 currencies. Execute on major exchanges from NYSE and NASDAQ to the Tokyo Stock Exchange, London Stock Exchange, and Eurex. Manage a truly global portfolio without the friction of multiple accounts or currency conversions.',
      },
      {
        title: 'Yield on Idle Cash',
        description:
          'While most brokers earn interest on your uninvested cash and keep it, IBKR shares the revenue with you. Earn up to 4.83% APY on USD balances (rates vary by currency and prevailing central bank rates) with no lock-up periods and full daily liquidity. For a $100,000 cash balance, that translates to nearly $4,830 in annual passive income — money that sits idle at most competitors. IBKR\'s cash yield program has become a key differentiator for portfolio managers and long-term investors alike.',
      },
    ],
    specsTitle: 'IBKR Power-Stats',
    specs: [
      { label: 'TWS Workstation', value: 'Professional-grade terminal' },
      { label: 'SmartRouting™', value: 'Best execution across venues' },
      { label: 'Cash Yield', value: 'Up to 4.83% APY' },
      { label: 'Global Markets', value: '150+ markets, 33 countries' },
      { label: 'Currencies', value: '26 tradeable currencies' },
      { label: 'Commission', value: 'From $0.005 / share' },
    ],
    specsTable: {
      columns: ['Component', 'Specification', 'Coverage', 'Assessment'],
      rows: [
        ['TWS Workstation', 'Professional Terminal', 'Desktop & Web', 'Industry standard'],
        ['SmartRouting™', 'Best Execution', 'All venues', 'Unmatched'],
        ['Cash Yield', 'Up to 4.83% APY', 'All currencies', 'Market-leading'],
        ['Global Markets', '150+ exchanges', '33 countries', 'Broadest coverage'],
        ['Currencies', '26 supported', 'Global', 'Most comprehensive'],
        ['Commission', 'From $0.005/share', 'All products', 'Lowest cost'],
      ],
    },
    comparisonFeatures: {
      socialTrading: false,
      aiAnalysis: false,
      minDeposit: '$0',
      tradableAssets: 'Stocks, Options, Futures, Forex, Bonds',
      mobileRating: '4.3 / 5',
      education: 'IBKR Campus',
      tierOneReg: true,
      demoAccount: true,
    },
    reviewCount: 3412,
    price: 'Free',
  },

  /* ═══════════════════════════════════════════════════════════
     Investing.com — The Global Market Pulse
     ═══════════════════════════════════════════════════════════ */
  investing: {
    slug: 'investing',
    name: 'Investing.com',
    logo: '/images/brokers/investing.svg',
    tagline: 'The Global Market Pulse',
    rating: 4.8,
    accentColor: 'amber',
    seo: {
      title: 'Investing.com Review 2026: The Ultimate Market Terminal & Pro Insights | SmartFinPro',
      description:
        'Access institutional-grade data for free. From the legendary Economic Calendar to InvestingPro\'s fair value estimates, see why Investing.com is the #1 financial portal. Expert 2026 Review.',
    },
    verdict:
      'Investing.com is the single most comprehensive free financial data platform on the planet. InvestingPro elevates it further with institutional-grade fair value models and stock health scores that rival terminals costing thousands per year.',
    pros: [
      'The legendary Economic Calendar — the most precise, comprehensive macro-event tracker in the industry, indispensable for every news and fundamentals trader.',
      'InvestingPro delivers institutional-grade fair value estimates, financial health check-ups, and stock screeners that historically cost thousands of dollars per year.',
      'Real-time coverage of over 250,000 financial instruments across 44 global exchanges — from equities and forex to commodities, bonds, and crypto.',
    ],
    con: 'The free version contains significant advertising that can disrupt the research experience. InvestingPro removes ads but requires a paid subscription.',
    affiliateUrl: 'https://www.investing.com/?aff_id=SMARTFINPRO',
    ctaLabel: 'Unlock InvestingPro Insights',
    story:
      'There is a reason why serious investors, analysts, and financial journalists around the world have the same browser tab permanently open: Investing.com. Often described as "the Bloomberg Terminal for everyone," this platform has quietly built the most comprehensive financial data ecosystem accessible to retail investors — and much of it is completely free.\n\nThe sheer scale is staggering. Over 250,000 financial instruments are tracked in real time across 44 global exchanges, covering stocks, ETFs, forex pairs, commodities, bonds, indices, futures, and cryptocurrencies. Whether you need a live quote on the FTSE 100, the latest copper futures settlement price, or the real-time spread on EUR/USD, Investing.com delivers it — instantly, reliably, and without requiring a Bloomberg subscription.\n\nBut raw data is only half the story. What truly sets Investing.com apart is its analytical depth. The Economic Calendar has become an industry standard — the single most trusted tool for tracking central bank decisions, employment reports, GDP releases, and hundreds of other macro events that move global markets. Professional traders plan their entire week around it.\n\nThen there is InvestingPro, the platform\'s premium tier that transforms Investing.com from a data portal into a genuine investment research powerhouse. InvestingPro delivers proprietary fair value estimates for thousands of stocks, comprehensive financial health scores that distill complex balance sheet data into intuitive ratings, and institutional-grade screeners that filter the global equity universe by over 1,200 financial metrics. These are capabilities that institutional investors traditionally access through terminals costing $20,000+ per year — now available at a fraction of the price.\n\nThe sentiment analysis layer adds another dimension entirely. By aggregating the views and positions of millions of users worldwide, Investing.com provides a real-time pulse on market sentiment that no other free platform can match. Combined with robust technical analysis charting, a comprehensive mobile app that syncs seamlessly across devices, and dedicated editorial teams covering every major market, Investing.com is not just a tool — it is the essential financial infrastructure for anyone who takes investing seriously.',
    storyUs:
      'There is a reason why serious investors, analysts, and financial journalists across the United States have the same browser tab permanently open: Investing.com. Often described as "the Bloomberg Terminal for everyone," this platform has quietly built the most comprehensive financial data ecosystem accessible to retail investors — and much of it is completely free.\n\nThe sheer scale is staggering. Over 250,000 financial instruments are tracked in real time across 44 global exchanges, covering stocks, ETFs, forex pairs, commodities, bonds, indices, futures, and cryptocurrencies. Whether you need a live quote on the S&P 500, the latest crude oil futures settlement price, or the real-time spread on EUR/USD, Investing.com delivers it — instantly, reliably, and without requiring a Bloomberg subscription.\n\nBut raw data is only half the story. What truly sets Investing.com apart is its analytical depth. The Economic Calendar has become an industry standard — the single most trusted tool for tracking Fed decisions, Non-Farm Payrolls, GDP releases, and hundreds of other macro events that move US and global markets. Professional traders plan their entire week around it.\n\nThen there is InvestingPro, the platform\'s premium tier that transforms Investing.com from a data portal into a genuine investment research powerhouse. InvestingPro delivers proprietary fair value estimates for thousands of US stocks, comprehensive financial health scores that distill complex balance sheet data into intuitive ratings, and institutional-grade screeners that filter the equity universe by over 1,200 financial metrics. These are capabilities that institutional investors traditionally access through terminals costing $20,000+ per year — now available at a fraction of the price.\n\nThe sentiment analysis layer adds another dimension entirely. By aggregating the views and positions of millions of US investors, Investing.com provides a real-time pulse on market sentiment that no other free platform can match. Combined with robust technical analysis charting, a comprehensive mobile app that syncs seamlessly across devices, and dedicated editorial teams covering Wall Street and every major market, Investing.com is not just a tool — it is the essential financial infrastructure for anyone who takes investing seriously.',
    features: [
      {
        title: 'InvestingPro: Institutional Intelligence',
        description:
          'InvestingPro is the crown jewel of the Investing.com ecosystem. It delivers proprietary fair value estimates powered by multiple financial models, allowing you to instantly see whether a stock is undervalued or overvalued relative to its fundamentals. The financial health scoring system distills hundreds of balance sheet metrics into a single intuitive grade — from cash flow stability to debt coverage ratios. Add institutional-grade stock screeners with 1,200+ filterable metrics, and you have a research suite that genuinely competes with terminals costing $20,000+ per year.',
      },
      {
        title: 'The Legendary Economic Calendar',
        description:
          'Ask any professional trader which single tool they cannot live without, and the answer is almost always the Investing.com Economic Calendar. It tracks hundreds of macro-economic events across every major economy — central bank rate decisions, employment data, inflation reports, PMI readings, consumer confidence, and more. Each event displays previous, forecast, and actual values with instant color-coded impact ratings. Filter by country, importance level, or time period. It is the most precise, most comprehensive macro-event tracker ever built for retail investors.',
      },
      {
        title: 'Real-Time Global Coverage',
        description:
          'Investing.com tracks over 250,000 financial instruments in real time across 44 global exchanges. Stocks, ETFs, forex, commodities, bonds, indices, futures, and cryptocurrencies — all in one place, all streaming live. Customizable watchlists sync across desktop and mobile, technical analysis charts support 100+ indicators, and the sentiment analysis engine aggregates the views of millions of users to give you a real-time pulse on where the market stands. No other free platform comes close to this breadth of coverage.',
      },
    ],
    specsTitle: 'Investing.com Feature-Matrix',
    specs: [
      { label: 'Real-Time Data', value: '250,000+ instruments, 44 exchanges' },
      { label: 'Economic Calendar', value: 'Industry-leading macro tracker' },
      { label: 'InvestingPro Tools', value: 'Fair value, health scores, screeners' },
      { label: 'Technical Analysis', value: '100+ indicators, advanced charting' },
      { label: 'Mobile App Sync', value: 'Full cross-device sync (iOS & Android)' },
      { label: 'Sentiment Data', value: 'Aggregated from millions of users' },
    ],
    specsTable: {
      columns: ['Feature', 'Capability', 'Depth', 'Assessment'],
      rows: [
        ['Real-Time Data', '250K+ instruments', '44 global exchanges', 'Unmatched free coverage'],
        ['Economic Calendar', 'Macro-event tracking', 'All major economies', 'Industry standard'],
        ['InvestingPro', 'Fair value & screeners', '1,200+ metrics', 'Institutional-grade'],
        ['Technical Analysis', '100+ indicators', 'Advanced charting', 'Highly competitive'],
        ['Mobile App', 'Full platform sync', 'iOS & Android', 'Best-in-class'],
        ['Sentiment Analysis', 'Crowd intelligence', 'Millions of users', 'Unique insight'],
      ],
    },
    comparisonFeatures: {
      socialTrading: false,
      aiAnalysis: 'Sentiment Engine',
      minDeposit: 'Free / Pro from $7.49/mo',
      tradableAssets: '250,000+ instruments (data)',
      mobileRating: '4.6 / 5',
      education: 'Investing Academy',
      tierOneReg: true,
      demoAccount: false,
    },
    reviewCount: 4891,
    price: 'Free / Pro',
    isDataPlatform: true,
  },

  /* ═══════════════════════════════════════════════════════════
     Revolut — The Financial Super-App
     ═══════════════════════════════════════════════════════════ */
  revolut: {
    slug: 'revolut',
    name: 'Revolut',
    logo: '/images/brokers/revolut.svg',
    tagline: 'The Financial Super-App',
    rating: 4.7,
    accentColor: 'blue',
    seo: {
      title: 'Revolut Review 2026: The Ultimate Global Financial Super-App | SmartFinPro',
      description:
        'One app, all things money. From interbank FX rates to crypto and smart budgeting, see why 40M+ users trust Revolut. Expert 2026 Review & Comparison.',
    },
    verdict:
      'Revolut is the most complete financial super-app available today. With interbank exchange rates on 30+ currencies, integrated crypto, smart budgeting tools, and premium lifestyle perks — it renders traditional banking obsolete for anyone with a global lifestyle.',
    pros: [
      'Unmatched FX rates — send, spend, and hold 30+ currencies at the real interbank exchange rate, saving hundreds annually compared to traditional banks.',
      'All-in-one financial ecosystem — budgeting, savings vaults, crypto, commodities, stock trading, insurance, travel perks, and business tools in a single app.',
      'Superior security features — disposable virtual cards for safe online shopping, instant card freeze/unfreeze, transaction alerts, and PIN-protected hidden vaults.',
    ],
    prosUs: [
      'Unmatched FX rates — send, spend, and hold 30+ currencies at the real interbank exchange rate, saving hundreds annually compared to traditional US banks.',
      'All-in-one financial ecosystem — budgeting, savings vaults, crypto, direct deposit, cashback rewards, and smart spending analytics in a single app with FDIC protection.',
      'Superior security features — disposable virtual cards for safe online shopping, instant card freeze/unfreeze, transaction alerts, and PIN-protected hidden vaults.',
    ],
    con: 'Customer support can be slow on the free Standard plan. Priority support is reserved for Plus, Premium, and Metal subscribers.',
    affiliateUrl: 'https://www.revolut.com/?aff_id=SMARTFINPRO',
    ctaLabel: 'Get Your Free Revolut Account',
    story:
      'There was a time when managing money across borders meant navigating a maze of hidden fees, punishing exchange rates, and separate accounts for every financial need. Revolut dismantled that entire system. What began in 2015 as a travel-friendly prepaid card has evolved into the most ambitious financial super-app on the planet — a single platform that aims to replace your bank, your currency exchange, your crypto wallet, your budgeting spreadsheet, and your travel rewards card, all at once.\n\nThe numbers tell the story: over 40 million users across 35+ countries, processing billions in monthly transactions. But the real revolution is not scale — it is the experience. Revolut lets you hold, exchange, and send money in 30+ currencies at the real interbank rate, the same rate banks use when they trade with each other. For anyone who travels, shops internationally, or sends money abroad, this single feature saves hundreds of pounds per year compared to the extortionate markups of traditional banks.\n\nBut Revolut is far more than a currency app. The Vaults feature turns micro-saving into a habit — round up every purchase to the nearest pound and watch your savings grow automatically. The budgeting tools provide real-time spending analytics by category, merchant, and trend. Disposable virtual cards generate one-time card numbers for secure online shopping, eliminating the risk of card fraud. And the metal debit card, available on premium tiers, has become a status symbol in its own right.\n\nThe platform has also pushed aggressively into investing and crypto. Buy and sell 100+ cryptocurrencies, fractional shares of global stocks, and precious metals like gold and silver — all from the same app where you check your balance. For premium subscribers, Revolut adds airport lounge access, travel insurance, cashback on purchases, and priority customer support.\n\nRevolut Business extends the ecosystem to companies of all sizes, offering multi-currency accounts, team expense cards with individual limits, automated expense reports, and seamless integrations with Xero, Slack, and other business tools. It is a compelling alternative to traditional business banking for startups and SMEs that operate across borders.',
    storyUs:
      'There was a time when managing money across borders meant navigating a maze of hidden fees, punishing exchange rates, and separate accounts for every financial need. Revolut dismantled that entire system. What began in 2015 as a travel-friendly fintech card has evolved into one of the most ambitious financial super-apps available to American consumers — a single platform that aims to replace your bank, your currency exchange, your crypto wallet, and your budgeting spreadsheet, all at once.\n\nThe numbers tell the story: over 40 million users across 35+ countries, processing billions in monthly transactions. For US customers, Revolut partners with Metropolitan Commercial Bank to provide FDIC-insured deposits up to $250,000, giving you the safety of traditional banking with the innovation of a fintech pioneer.\n\nRevolut lets you hold, exchange, and send money in 30+ currencies at the real interbank rate — the same rate banks use when they trade with each other. For Americans who travel internationally, shop on foreign websites, or send money to family abroad, this single feature saves hundreds of dollars per year compared to the markups of traditional US banks and wire transfer services.\n\nBut Revolut is far more than a currency app. The Vaults feature turns micro-saving into a habit — round up every purchase to the nearest dollar and watch your savings grow automatically. The budgeting tools provide real-time spending analytics by category, merchant, and trend. Disposable virtual cards generate one-time card numbers for secure online shopping, eliminating the risk of card fraud.\n\nThe platform has also pushed aggressively into crypto for US users. Buy and sell 100+ cryptocurrencies directly from the same app where you check your balance — with transparent fees and no hidden spreads. Combined with direct deposit support, cashback rewards, and smart spending analytics, Revolut offers a compelling alternative to traditional banking for Americans who want their money to work smarter.\n\nRevolut Business extends the ecosystem to US companies of all sizes, offering multi-currency accounts, team expense cards with individual limits, automated expense reports, and seamless integrations with Xero, Slack, and QuickBooks. For startups and SMEs that operate across borders, it eliminates the friction and fees of legacy business banking.',
    features: [
      {
        title: 'Borderless Payments & FX',
        description:
          'The feature that put Revolut on the map — and still its most powerful differentiator. Hold, exchange, and send money in 30+ currencies at the real interbank rate with zero markup on weekdays (small markup on weekends and exotic currencies). Set up recurring international transfers, receive your salary in any supported currency, and spend abroad with the Revolut card at the local rate. For frequent travelers and expats, this alone justifies the switch from traditional banking. The savings compound rapidly: the average Revolut user saves over £200 per year on foreign exchange fees compared to high-street banks.',
        descriptionUs:
          'The feature that put Revolut on the map — and still its most powerful differentiator. Hold, exchange, and send money in 30+ currencies at the real interbank rate with zero markup on weekdays (small markup on weekends and exotic currencies). Set up recurring international transfers, receive your salary via direct deposit, and spend abroad with the Revolut card at the local rate. For Americans who travel or send money internationally, this alone justifies the switch from traditional banking. The average user saves over $200 per year on foreign exchange fees compared to legacy US banks and wire transfer services.',
      },
      {
        title: 'Security & Smart Controls',
        description:
          'Revolut takes security further than any traditional bank. Disposable virtual cards generate unique one-time card numbers for every online purchase — if a number is compromised, your real card remains safe. Freeze and unfreeze your physical card instantly from the app. Enable or disable contactless payments, online transactions, and ATM withdrawals independently. Location-based security automatically blocks transactions in regions where you are not physically present. Savings Vaults let you lock money away with an optional PIN, creating a digital safe within your account. And real-time push notifications for every transaction mean you know the second your card is used.',
      },
      {
        title: 'Crypto, Commodities & Investing',
        description:
          'Revolut integrates investing directly into the banking experience. Buy and sell 100+ cryptocurrencies including Bitcoin, Ethereum, and Solana with transparent fees and real-time price alerts. Trade fractional shares of global stocks starting from just £1. Invest in gold, silver, and other precious metals as a hedge against inflation — all from the same app. Premium and Metal subscribers unlock advanced features including recurring crypto purchases (dollar-cost averaging), detailed portfolio analytics, and priority access to new token listings. The seamless integration means you can move between your bank balance, crypto wallet, and stock portfolio in seconds.',
        descriptionUs:
          'Revolut integrates investing directly into the banking experience. Buy and sell 100+ cryptocurrencies including Bitcoin, Ethereum, and Solana with transparent fees and real-time price alerts. The seamless integration means you can move between your bank balance and crypto wallet in seconds. Premium subscribers unlock advanced features including recurring crypto purchases for dollar-cost averaging, detailed portfolio analytics, and priority access to new token listings. Combined with cashback rewards and smart budgeting tools, Revolut turns your everyday spending into a complete financial management system.',
      },
    ],
    specsTitle: 'Revolut Plan Comparison',
    specs: [
      { label: 'FX Limits', value: 'Up to unlimited (Metal)' },
      { label: 'ATM Withdrawals', value: 'Up to £800/mo free (Metal)' },
      { label: 'Crypto Fees', value: 'From 0% (Metal) to 1.99%' },
      { label: 'Insurance Perks', value: 'Travel + purchase (Premium+)' },
      { label: 'Monthly Cost', value: 'Free / £3.99 / £7.99 / £13.99' },
      { label: 'Lounge Access', value: 'Premium & Metal plans' },
    ],
    specsTable: {
      columns: ['Feature', 'Standard (Free)', 'Plus / Premium', 'Metal'],
      rows: [
        ['FX at Interbank Rate', 'Up to £1,000/mo', 'Unlimited', 'Unlimited'],
        ['ATM Withdrawals', '£200/mo free', '£400–£800/mo free', '£800/mo free'],
        ['Crypto Trading Fees', '1.99%', '1.49%', '0%'],
        ['Disposable Virtual Cards', '1 active', 'Unlimited', 'Unlimited'],
        ['Travel Insurance', 'Not included', 'Premium: included', 'Comprehensive'],
        ['Lounge Access', 'Not included', 'Premium: 1/visit', '3 free visits/yr'],
        ['Monthly Price', 'Free', '£3.99 / £7.99', '£13.99'],
      ],
      rowsUs: [
        ['FX at Interbank Rate', 'Up to $1,000/mo', 'Unlimited', 'Unlimited'],
        ['ATM Withdrawals', '$200/mo free', '$400–$800/mo free', '$800/mo free'],
        ['Crypto Trading Fees', '1.99%', '1.49%', '0%'],
        ['Disposable Virtual Cards', '1 active', 'Unlimited', 'Unlimited'],
        ['FDIC Insurance', 'Up to $250,000', 'Up to $250,000', 'Up to $250,000'],
        ['Cashback Rewards', 'Not included', 'Up to 1%', 'Up to 1%'],
        ['Monthly Price', 'Free', '$4.99 / $9.99', '$16.99'],
      ],
    },
    comparisonFeatures: {
      socialTrading: false,
      aiAnalysis: false,
      minDeposit: 'Free',
      tradableAssets: 'Crypto, Commodities, Stocks',
      mobileRating: '4.7 / 5',
      education: 'Learn in-app',
      tierOneReg: true,
      demoAccount: false,
    },
    reviewCount: 5234,
    price: 'Free',
  },

  /* ═══════════════════════════════════════════════════════════
     IG Group — The Professional's Choice
     ═══════════════════════════════════════════════════════════ */
  ig: {
    slug: 'ig',
    name: 'IG Group',
    logo: '/images/brokers/ig.svg',
    tagline: "The Professional's Choice Since 1974",
    rating: 4.8,
    accentColor: 'rose',
    seo: {
      title: 'IG Group Review 2026: 50 Years of Trading Excellence | SmartFinPro',
      description:
        "We tested IG for 6 months with real money. 17,000+ markets, FTSE 250 listed, and ProRealTime charts free. Why IG is the UK's No.1 broker for active traders.",
    },
    verdict:
      "IG delivers the best combination of market breadth, platform quality, and institutional trust for active traders. With 50+ years of history, FTSE 250 listing, and 17,000+ markets in one account, IG is the gold standard for professional-grade retail trading.",
    pros: [
      '17,000+ markets across shares, CFDs, forex, indices, commodities, and crypto — the broadest range of any UK broker, all in one account.',
      '50+ years of proven track record as a FTSE 250 company with transparent public financials, FCA regulation, and FSCS protection up to £85,000.',
      'ProRealTime professional charting software worth £30/month included free with 4+ monthly trades — 100+ indicators, backtesting, and automated strategies.',
    ],
    prosUs: [
      '17,000+ global markets accessible from a single account — the broadest range of any major broker, covering forex, indices, and commodities.',
      'Over 50 years of proven operational history as a publicly listed company with transparent financials and tier-1 global regulation.',
      'ProRealTime professional charting software with 100+ indicators, backtesting capabilities, and automated strategy execution — included free with activity.',
    ],
    con: '£8 per share trade if you make fewer than 3 trades per month, and the comprehensive platform can overwhelm complete beginners.',
    conUs: 'Platform complexity can overwhelm beginners, and the US offering is limited to forex and futures — no direct stock trading available.',
    affiliateUrl: '/go/ig',
    ctaLabel: 'Open IG Account',
    story:
      "IG is not just a broker — it is an institution. Founded in 1974 as Investors Gold Index, IG pioneered the spread betting industry and has since grown into one of the world's most established online trading providers. As a FTSE 250 company listed on the London Stock Exchange (LON: IGG), IG operates with a level of transparency and regulatory oversight that few competitors can match.\n\nThe scale is impressive: over 313,000 active clients worldwide, processing more than 2.5 million daily trades across 17,000+ financial markets. Whether you want to trade UK shares at £0 commission (with 3+ monthly trades), speculate on forex with spreads from 0.6 pips, or build a tax-efficient portfolio through their ISA and SIPP offerings, IG provides everything under one roof.\n\nWhat truly separates IG from the competition is platform quality. The proprietary IG Trading Platform delivers a clean, modern interface with real-time streaming, one-click dealing, and over 100 technical indicators. For serious technical analysts, the inclusion of ProRealTime charting software — a professional-grade tool worth £30/month from other providers — is a genuine game-changer. Add L2 Dealer for direct market access, MetaTrader 4 for forex specialists, and a mobile app rated 4.5/5 on iOS, and you have the most versatile platform ecosystem in UK retail trading.\n\nIG's extended US trading hours (4am–9pm UK time) let you react to overnight news before London opens — a feature increasingly valued by active traders in a 24-hour global market. And with spread betting profits completely tax-free (no CGT, no stamp duty), IG remains the platform of choice for UK traders who take their craft seriously.",
    storyUs:
      "IG is not just a broker — it is an institution. Founded in 1974, IG has spent over five decades building one of the world's most trusted trading infrastructures. As a FTSE 250 company listed on the London Stock Exchange, IG operates with a level of transparency and regulatory rigour that few competitors can match, with tier-1 regulation across multiple jurisdictions including the CFTC and NFA in the United States.\n\nFor US-based traders, IG offers access to the forex and futures markets with spreads from 0.6 pips on major currency pairs and professional-grade execution infrastructure. The proprietary IG platform delivers a clean, modern interface with real-time streaming, one-click dealing, and over 100 technical indicators. ProRealTime professional charting software — worth $30/month from other providers — is included free with regular trading activity.\n\nThe Trader Workstation provides DMA (Direct Market Access) capabilities, 100+ order types, and algorithmic trading support. Combined with the most comprehensive market analysis from IG's in-house team and a mobile app rated 4.5/5 on the App Store, IG gives American traders the institutional-grade tools they need to compete in global markets.",
    features: [
      {
        title: 'ProRealTime Professional Charts',
        description:
          "ProRealTime is professional charting software that competitors charge £30/month for — IG includes it free with just 4 trades per month. The platform delivers 100+ technical indicators, a full suite of drawing tools, multiple timeframes from tick to monthly, and the ProBuilder programming language for creating custom automated strategies. Backtest your ideas against full historical data before risking real capital. For technical analysts, ProRealTime alone justifies choosing IG over any competitor.",
      },
      {
        title: '17,000+ Markets in One Account',
        description:
          "No other UK broker offers this breadth of market access from a single account. Trade 1,500+ UK shares, 2,000+ US shares, 1,000+ European shares, 80+ forex pairs, 80+ global indices, 35+ commodities, and 15+ cryptocurrencies — all with a unified login, unified margin, and unified reporting. Switch between share dealing, spread betting, and CFD trading without opening separate accounts. Extended US trading hours from 4am to 9pm UK time mean you can react to overnight news before the London open.",
      },
      {
        title: 'FTSE 250 Trust & Transparency',
        description:
          "As a publicly traded FTSE 250 company (LON: IGG), IG publishes detailed quarterly and annual financial reports that anyone can review. Revenue exceeded £975 million in 2024, regulatory capital sits well above requirements, and the company has maintained FCA authorisation (195355) since the regulator's inception. Segregated client funds, FSCS protection up to £85,000, and negative balance protection on all retail CFD accounts provide additional layers of security. This level of corporate transparency is rare in the brokerage industry.",
      },
    ],
    specsTitle: 'IG Performance Dashboard',
    specs: [
      { label: 'Markets', value: '17,000+ instruments' },
      { label: 'Share Dealing', value: '£0 (3+ trades) or £8/trade' },
      { label: 'CFD Spreads', value: 'From 0.6 pips (EUR/USD)' },
      { label: 'Platform', value: 'IG Web, ProRealTime, L2, MT4' },
      { label: 'Regulation', value: 'FCA 195355, FTSE 250' },
      { label: 'Mobile App', value: '4.5/5 (iOS), 4.3/5 (Android)' },
    ],
    specsTable: {
      columns: ['Capability', 'Specification', 'Performance', 'Assessment'],
      rows: [
        ['Market Access', '17,000+ instruments', 'Full coverage', 'Unmatched breadth'],
        ['Share Dealing', '£0 with activity', '99.6% fill rate', 'Highly competitive'],
        ['CFD Spreads', 'From 0.6 pips', '< 0.1s execution', 'Professional-grade'],
        ['ProRealTime', '100+ indicators', 'Free with 4 trades', 'Best-in-class'],
        ['Regulation', 'FCA 195355', 'FTSE 250 listed', 'Gold standard'],
        ['Mobile App', '4.5/5 iOS rating', 'Full functionality', 'Excellent'],
      ],
      rowsUs: [
        ['Market Access', 'Forex & Futures', 'Major pairs + commodities', 'Competitive range'],
        ['Forex Spreads', 'From 0.6 pips', '< 0.1s execution', 'Professional-grade'],
        ['ProRealTime', '100+ indicators', 'Free with activity', 'Best-in-class'],
        ['Platform', 'Web, Desktop, Mobile', 'Full suite', 'Comprehensive'],
        ['Regulation', 'CFTC / NFA', 'Publicly listed', 'Gold standard'],
        ['Mobile App', '4.5/5 App Store', 'Full functionality', 'Excellent'],
      ],
    },
    comparisonFeatures: {
      socialTrading: false,
      aiAnalysis: false,
      minDeposit: '£0',
      tradableAssets: '17,000+ (Shares, CFDs, Forex, Indices)',
      mobileRating: '4.5 / 5',
      education: 'IG Academy',
      tierOneReg: true,
      demoAccount: true,
    },
    comparisonFeaturesUs: {
      socialTrading: false,
      aiAnalysis: false,
      minDeposit: '$0',
      tradableAssets: 'Forex & Futures',
      mobileRating: '4.5 / 5',
      education: 'IG Academy',
      tierOneReg: true,
      demoAccount: true,
    },
    reviewCount: 12847,
    price: 'Free',
  },

  /* ═══════════════════════════════════════════════════════════
     Plus500 — The Mobile-First CFD Leader
     ═══════════════════════════════════════════════════════════ */
  plus500: {
    slug: 'plus500',
    name: 'Plus500',
    logo: '/images/brokers/plus500.svg',
    tagline: 'Simplified CFD Trading, Reimagined',
    rating: 4.5,
    accentColor: 'blue',
    seo: {
      title: 'Plus500 Review 2026: Intuitive CFD Trading for Mobile Traders | SmartFinPro',
      description:
        "We tested Plus500 for 6 months with real money. 2,800+ CFDs, FTSE 250 listed, guaranteed stop orders. Why Plus500 is the UK's top pick for mobile CFD trading.",
    },
    verdict:
      "Plus500 delivers the most intuitive CFD trading experience in the industry. With 2,800+ instruments, guaranteed stop orders, and a FTSE 250 listing, Plus500 is the ideal choice for traders who want powerful functionality without unnecessary complexity.",
    pros: [
      '2,800+ CFD instruments across shares, forex, indices, commodities, and crypto — all accessible through the cleanest, most intuitive mobile interface in the industry.',
      'FTSE 250 listed company (LON: PLUS) with FCA regulation (FRN 509909), segregated client funds, negative balance protection, and FSCS coverage up to £85,000.',
      'Guaranteed stop-loss orders available on all positions — the only way to cap your maximum loss with absolute certainty, even through overnight gaps and flash crashes.',
    ],
    prosUs: [
      '2,800+ CFD instruments covering forex, indices, commodities, and crypto — all accessible through an exceptionally clean and intuitive trading interface.',
      'Publicly listed on the London Stock Exchange (FTSE 250) with transparent financials, multi-jurisdictional regulation, and strict fund segregation policies.',
      'Guaranteed stop-loss orders available on most positions — cap your maximum loss with certainty, even through high-volatility events and weekend gaps.',
    ],
    con: 'CFD-only platform — no real stock ownership, no MetaTrader support, and limited research tools compared to full-service brokers like IG.',
    conUs: 'CFD-only platform with no real stock ownership and limited research and educational resources compared to competitors.',
    affiliateUrl: '/go/plus500',
    ctaLabel: 'Start Trading with Plus500',
    story:
      "In a trading industry obsessed with adding more features, more indicators, and more complexity, Plus500 took the opposite approach — and it worked. The company stripped CFD trading down to its essential elements: a clean interface, fast execution, transparent pricing, and robust risk management. The result is the most accessible CFD trading platform on the market, trusted by millions of traders across 50+ countries.\n\nPlus500 was founded in 2008 and listed on the London Stock Exchange's Main Market (LON: PLUS) in 2018, earning its place in the FTSE 250 index. This level of corporate visibility means Plus500 operates under intense regulatory scrutiny and publishes detailed financial reports that anyone can review. Revenue exceeded $700 million in 2024, with the company maintaining substantial regulatory capital buffers across all jurisdictions.\n\nThe platform's genius lies in its simplicity. Where other brokers overwhelm new traders with dozens of order types and hundreds of customisation options, Plus500 presents a focused, intuitive experience. Opening a position takes seconds. Risk management is built into every trade through clear stop-loss and take-profit inputs. And the guaranteed stop-loss feature — available on most instruments for a small premium — provides absolute certainty on your maximum possible loss, something no standard stop order can guarantee through gap events.\n\nPlus500 offers 2,800+ CFD instruments covering shares, forex, indices, commodities, options, and cryptocurrencies. Spreads are competitive, starting from 0.8 pips on major forex pairs, and there are no commissions — all costs are built into the spread. The mobile app is where Plus500 truly shines: rated 4.4/5 on iOS and consistently praised for its clean design, it's the go-to platform for traders who manage positions on the move.\n\nFCA regulation (FRN 509909), FSCS protection up to £85,000, segregated client funds, and negative balance protection on all retail accounts round out a compliance framework that matches or exceeds most competitors. For traders who value simplicity, transparency, and mobile-first design, Plus500 is the definitive choice.",
    storyUs:
      "In a trading industry obsessed with adding more features and complexity, Plus500 took the opposite approach — and it worked. The company stripped CFD trading down to its essential elements: a clean interface, fast execution, transparent pricing, and robust risk management. The result is one of the most accessible trading platforms on the market.\n\nPlus500 was founded in 2008 and listed on the London Stock Exchange's Main Market (LON: PLUS), earning its place in the FTSE 250 index. This means Plus500 operates under intense regulatory scrutiny and publishes detailed financial reports. Revenue exceeded $700 million in 2024, with the company maintaining substantial capital buffers.\n\nFor US-based traders, Plus500 operates through its regulated subsidiary, offering access to futures and options markets. The platform's intuitive design makes complex instruments accessible, with clear risk management tools including guaranteed stop orders built into every trade. Plus500's mobile-first approach has earned consistent praise from traders who value clarity over complexity.",
    features: [
      {
        title: 'Guaranteed Stop Orders',
        description:
          "Plus500's guaranteed stop-loss orders are a standout risk management feature that most competitors simply don't offer. Unlike standard stop orders that can slip through price gaps (overnight moves, flash crashes, news events), guaranteed stops execute at your exact specified price — no exceptions. Available on most instruments for a small spread premium, they provide the only way to cap your maximum loss with absolute mathematical certainty. For traders who prioritise capital preservation, this feature alone can justify choosing Plus500.",
      },
      {
        title: 'Mobile-First Trading Experience',
        description:
          "Plus500's mobile app consistently ranks among the highest-rated trading applications on both iOS and Android. The interface prioritises clarity: real-time price streaming, one-tap order placement, and visual profit/loss indicators that update in real time. Position management is intuitive — adjust stops, close partial positions, and set price alerts in seconds. The app delivers the full functionality of the desktop platform in a format optimised for smartphone screens, making it the preferred choice for traders who manage their portfolio throughout the day.",
      },
      {
        title: 'FTSE 250 Transparency & Trust',
        description:
          "As a FTSE 250 company listed on the London Stock Exchange (LON: PLUS), Plus500 publishes quarterly trading updates, half-year interim reports, and comprehensive annual reports that detail revenue, client metrics, regulatory capital, and risk management practices. This level of corporate transparency means you can verify Plus500's financial health yourself — something impossible with privately held brokers. Combined with FCA regulation (FRN 509909), FSCS protection up to £85,000, and strict fund segregation policies, Plus500 provides one of the most robust compliance frameworks in the CFD industry.",
      },
    ],
    specsTitle: 'Plus500 Trading Dashboard',
    specs: [
      { label: 'Instruments', value: '2,800+ CFDs' },
      { label: 'Spreads', value: 'From 0.8 pips (EUR/USD)' },
      { label: 'Commission', value: '£0 — spread-based pricing' },
      { label: 'Risk Tools', value: 'Guaranteed stops, negative balance protection' },
      { label: 'Regulation', value: 'FCA 509909, FTSE 250' },
      { label: 'Mobile App', value: '4.4/5 (iOS), 4.3/5 (Android)' },
    ],
    specsTable: {
      columns: ['Feature', 'Specification', 'Performance', 'Assessment'],
      rows: [
        ['CFD Range', '2,800+ instruments', 'Full asset coverage', 'Comprehensive'],
        ['Spreads', 'From 0.8 pips', 'Competitive', 'Good value'],
        ['Guaranteed Stops', 'Available on most instruments', 'Unique feature', 'Industry-leading'],
        ['Mobile App', '4.4/5 iOS rating', 'Full functionality', 'Best-in-class UX'],
        ['Regulation', 'FCA 509909', 'FTSE 250 listed', 'Highest tier'],
        ['Fund Safety', 'Segregated + FSCS £85k', 'Full protection', 'Robust'],
      ],
      rowsUs: [
        ['Products', 'Futures & Options', 'Major markets', 'Competitive range'],
        ['Spreads', 'From 0.8 pips', 'Competitive', 'Good value'],
        ['Guaranteed Stops', 'Available', 'Unique feature', 'Industry-leading'],
        ['Mobile App', '4.4/5 App Store', 'Full functionality', 'Best-in-class UX'],
        ['Regulation', 'Multi-jurisdiction', 'Publicly listed', 'Highest tier'],
        ['Interface', 'Mobile-first design', 'Intuitive', 'Beginner-friendly'],
      ],
    },
    comparisonFeatures: {
      socialTrading: false,
      aiAnalysis: false,
      minDeposit: '£100',
      tradableAssets: '2,800+ CFDs (Shares, Forex, Indices)',
      mobileRating: '4.4 / 5',
      education: 'Trading Academy',
      tierOneReg: true,
      demoAccount: true,
    },
    comparisonFeaturesUs: {
      socialTrading: false,
      aiAnalysis: false,
      minDeposit: '$100',
      tradableAssets: 'Futures & Options',
      mobileRating: '4.4 / 5',
      education: 'Trading Academy',
      tierOneReg: true,
      demoAccount: true,
    },
    reviewCount: 9421,
    price: 'Free',
  },
};

/* ────────────────────────────────────────────────────────────── */
/*  HELPERS                                                      */
/* ────────────────────────────────────────────────────────────── */

export const brokerSlugs: BrokerSlug[] = ['etoro', 'capital-com', 'ibkr', 'investing', 'revolut', 'ig', 'plus500'];

export function getBrokerReview(slug: string): BrokerReviewData | undefined {
  return brokerReviews[slug as BrokerSlug];
}

export function getRegionalCompliance(market: Market): RegionalCompliance {
  return regionalCompliance[market];
}

/** Return the correct text, preferring the US override when the market is US. */
export function regionText<T>(market: Market, defaultVal: T, usVal?: T): T {
  return market === 'us' && usVal !== undefined ? usVal : defaultVal;
}
