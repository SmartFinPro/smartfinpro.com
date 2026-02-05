// Market Types
export type Market = 'us' | 'uk' | 'ca' | 'au';

export type Category =
  | 'ai-tools'
  | 'cybersecurity'
  | 'trading'
  | 'forex'
  | 'personal-finance'
  | 'business-banking';

// Affiliate Link Types
export interface AffiliateLink {
  id: string;
  slug: string;
  partner_name: string;
  destination_url: string;
  category: Category;
  market: Market;
  commission_type: 'cpa' | 'recurring' | 'hybrid';
  commission_value: number;
  active: boolean;
  created_at: string;
}

export interface LinkClick {
  id: string;
  link_id: string;
  clicked_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  country_code: string;
  referrer: string | null;
  user_agent: string | null;
}

export interface Conversion {
  id: string;
  link_id: string;
  converted_at: string;
  commission_earned: number;
  currency: string;
  network_reference: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Subscriber {
  id: string;
  email: string;
  lead_magnet: string | null;
  market: Market;
  subscribed_at: string;
  confirmed: boolean;
  unsubscribed_at: string | null;
}

// Content Types
export interface ReviewData {
  title: string;
  description: string;
  productName: string;
  category: Category;
  market: Market;
  rating: number;
  reviewCount: number;
  affiliateUrl: string;
  pros: string[];
  cons: string[];
  bestFor: string;
  pricing: string;
  currency?: string; // USD, GBP, CAD, AUD - used for Schema.org
  guarantee?: string;
  publishDate: string;
  modifiedDate: string;
  author: string;
  reviewedBy?: string;
  faqs: FAQ[];
  sections: Section[];
  testimonials: Testimonial[];
  competitors: Product[];
  content: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Section {
  id: string;
  title: string;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  image?: string;
}

export interface Product {
  name: string;
  rating: number;
  reviewCount: number;
  price: string;
  currency: string;
  features: Record<string, boolean | string>;
}

// Dashboard Types
export interface RevenueData {
  date: string;
  revenue: number;
  clicks: number;
  conversions: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalClicks: number;
  totalConversions: number;
  averageEPC: number;
  conversionRate: number;
  revenueChange: number;
}

// Lead Magnet Types
export interface LeadMagnet {
  id: string;
  title: string;
  description: string;
  downloadUrl: string;
  category: Category;
}

// SEO Types
export interface HreflangLink {
  rel: string;
  hreflang: string;
  href: string;
}

export interface SchemaOrg {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}
