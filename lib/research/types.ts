export interface ResearchFaq {
  question: string;
  answer: string;
}

export interface ResearchSection {
  id: string;
  title: string;
}

export interface ResearchMeta {
  type: 'research';
  title: string;
  seoTitle?: string;
  description: string;
  author: string;
  reviewedBy?: string;
  publishDate: string;
  modifiedDate: string;
  sector: string;
  slug: string;
  ticker: string;
  exchanges: string[];
  markets: string[];
  ratingSource: string;
  ratingLabel: string;
  consensusAnalysts?: number;
  currentPriceUsd?: number;
  currentPriceCad?: number;
  currentPriceEur?: number;
  priceTargetUsd?: number;
  priceTargetCad?: number;
  priceTargetEur?: number;
  upsidePotential?: number;
  marketCapUsd?: number;
  forwardPe?: number;
  dividendYield?: number;
  asOf: string;
  nextReview: string;
  dataSources: string[];
  brokers: string[];
  faqs?: ResearchFaq[];
  sections?: ResearchSection[];
  hasInvestmentContent?: boolean;
  summary?: string;
}

export interface ResearchItem {
  slug: string;
  meta: ResearchMeta;
  content: string;
  readingTime: {
    text: string;
    minutes: number;
    time: number;
    words: number;
  };
}
