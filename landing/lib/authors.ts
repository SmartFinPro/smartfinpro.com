// lib/authors.ts

export interface Author {
  id: string;
  slug: string;
  name: string;
  title: string;
  certifications: string[];
  bio: string;
  photo: string;
  linkedin?: string;
  registrationNumber?: string;
  regulatorType?: string; // "FCA" | "NMLS" | "CFA Institute" | "CISI"
  yearsExperience: number;
  reviewCount: number;
  expertise: string[]; // Areas of expertise
  market: string[]; // "us" | "uk" | "ca" | "au"
}

export const authors: Record<string, Author> = {
  'sarah-mitchell': {
    id: '1',
    slug: 'sarah-mitchell',
    name: 'Sarah Mitchell',
    title: 'Certified Financial Planner (CFP®)',
    certifications: ['CFP®', 'ChFC'],
    bio: 'Sarah Mitchell is a CERTIFIED FINANCIAL PLANNER™ professional with 15 years of experience helping American families navigate credit repair, debt relief, and retirement planning. She holds the Chartered Financial Consultant (ChFC) designation and is a fiduciary advisor committed to acting in clients\' best interests.',
    photo: '/images/authors/sarah-mitchell.jpg',
    linkedin: 'https://linkedin.com/in/sarah-mitchell-cfp',
    registrationNumber: '12345678',
    regulatorType: 'NMLS',
    yearsExperience: 15,
    reviewCount: 47,
    expertise: [
      'Credit Repair',
      'Debt Relief',
      'Retirement Planning',
      'Tax Planning',
      'Personal Finance',
    ],
    market: ['us'],
  },

  'james-thornton': {
    id: '2',
    slug: 'james-thornton',
    name: 'James Thornton',
    title: 'FCA-Regulated Financial Adviser',
    certifications: ['CISI Level 6', 'CeMAP'],
    bio: 'James Thornton is an FCA-authorised financial adviser with 18 years of experience in the UK mortgage and savings market. He holds the CISI Level 6 Diploma in Financial Planning and the Certificate in Mortgage Advice and Practice (CeMAP). James specialises in remortgaging, ISA planning, and cost-of-living strategies for UK families.',
    photo: '/images/authors/james-thornton.jpg',
    linkedin: 'https://linkedin.com/in/james-thornton-fca',
    registrationNumber: '567890',
    regulatorType: 'FCA',
    yearsExperience: 18,
    reviewCount: 62,
    expertise: [
      'Remortgaging',
      'ISA Planning',
      'UK Savings',
      'Cost of Living Strategies',
      'Buy-to-Let Mortgages',
    ],
    market: ['uk'],
  },

  'elena-rodriguez': {
    id: '3',
    slug: 'elena-rodriguez',
    name: 'Dr. Elena Rodriguez',
    title: 'CFA Charterholder & Investment Strategist',
    certifications: ['CFA', 'PhD Economics'],
    bio: 'Dr. Elena Rodriguez is a CFA® charterholder with a PhD in Economics from the University of Toronto. With 20 years of experience across global markets, she advises on tax-efficient investing (TFSA/RRSP), superannuation strategies, and alternative assets including gold and commodities. Elena has published research on portfolio diversification and inflation hedging.',
    photo: '/images/authors/elena-rodriguez.jpg',
    linkedin: 'https://linkedin.com/in/elena-rodriguez-cfa',
    registrationNumber: '987654',
    regulatorType: 'CFA Institute',
    yearsExperience: 20,
    reviewCount: 83,
    expertise: [
      'Portfolio Management',
      'Tax-Efficient Investing',
      'Superannuation',
      'Gold & Commodities',
      'Global Markets',
      'Inflation Hedging',
    ],
    market: ['ca', 'au', 'us', 'uk'],
  },
};

export function getAuthorById(id: string): Author | undefined {
  return Object.values(authors).find((author) => author.id === id);
}

export function getAuthorBySlug(slug: string): Author | undefined {
  return authors[slug];
}

export function getAuthorsByMarket(market: string): Author[] {
  return Object.values(authors).filter((author) => author.market.includes(market));
}

export function getAuthorsByExpertise(expertise: string): Author[] {
  return Object.values(authors).filter((author) =>
    author.expertise.some((exp) => exp.toLowerCase().includes(expertise.toLowerCase()))
  );
}

// Default author for fallback
export const defaultAuthor = authors['elena-rodriguez'];
