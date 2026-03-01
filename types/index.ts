// Market Types
export type Market = 'us' | 'uk' | 'ca' | 'au';

export type Category =
  | 'ai-tools'
  | 'cybersecurity'
  | 'trading'
  | 'forex'
  | 'personal-finance'
  | 'business-banking'
  | 'credit-repair'
  | 'debt-relief'
  | 'credit-score'
  | 'remortgaging'
  | 'cost-of-living'
  | 'savings'
  | 'superannuation'
  | 'gold-investing'
  | 'tax-efficient-investing'
  | 'housing';

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
  // Registry extensions
  offer_expires_at?: string | null;
  last_health_check?: string | null;
  health_status?: 'healthy' | 'degraded' | 'dead' | 'unchecked';
  compliance_label?: string | null; // e.g. "Terms Apply", "Capital at Risk"
  network?: string | null; // e.g. "PartnerStack", "Awin", "Direct"
}

// Link health check result
export interface LinkHealthResult {
  link_id: string;
  slug: string;
  status_code: number | null;
  healthy: boolean;
  response_time_ms: number | null;
  checked_at: string;
  error?: string;
}

// Market-view matrix entry
export interface MarketPartnerEntry {
  partner_name: string;
  slug: string;
  category: Category;
  active: boolean;
  health_status: 'healthy' | 'degraded' | 'dead' | 'unchecked';
  clicks_30d: number;
  offer_expires_at: string | null;
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

// Expert Types (Supabase-backed)
export interface ExpertData {
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
  credentials: string[];
  linkedin_url: string | null;
  verified: boolean;
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
  readingTime?: string; // e.g. "8 min read"
  faqs: FAQ[];
  sections: Section[];
  testimonials: Testimonial[];
  competitors: Product[];
  content: string;
  /** When true, this is a guide/article — no rating stars, no CTA, no pros/cons */
  isGuide?: boolean;
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
