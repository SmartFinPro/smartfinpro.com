import type { Category, Market } from "@/lib/i18n/config";

export type ResearchStatus = "audited" | "provisional";
export type ResearchConfidence = "high" | "medium" | "low";
export type DiscoveryKind = "review" | "dossier";
export type CockpitKey = `${Market}/${Category}/${string}`;

export interface ResearchContext {
  cockpitKey: CockpitKey;
  topic: string;
  topicLabel: string;
  manifestOrder: number;
  productSlug: string;
  displayName: string;
  tagline: string | null;
  bestFor: string | null;
  status: ResearchStatus;
  confidence: ResearchConfidence | null;
  dataVerifiedAt: string | null;
  auditedScore: number | null;
  auditedRank: number | null;
  dataPoints: number;
  compareBaseHref: string;
  keyFacts: Record<string, string>;
}

export interface DiscoveryReview {
  slug: string;
  href: string;
  title: string;
  description: string;
  editorialRating: number;
  publishDate: string;
  modifiedDate: string;
  readingWords: number;
  featured: boolean;
  pricing: string | null;
}

export interface DiscoveryDisplay {
  title: string;
  description: string;
  bestFor: string | null;
  searchText: string;
  sortDate: string | null;
}

export interface DiscoveryItem {
  id: string;
  market: Market;
  category: Category;
  review: DiscoveryReview | null;
  display: DiscoveryDisplay;
  researchContexts: ResearchContext[];
}

export type DiscoveryProjection =
  | { itemId: string; kind: "review"; item: DiscoveryItem; context: null }
  | {
      itemId: string;
      kind: "dossier";
      item: DiscoveryItem;
      context: ResearchContext;
    };

export interface DiscoveryFilters {
  query: string;
  category: Category | null;
  type: DiscoveryKind | null;
  status: ResearchStatus | null;
  confidence: ResearchConfidence | null;
  fresh: string | null;
  topic: string | null;
  specs: string[];
}

export interface DiscoveryCounts {
  reviewBackedCount: number;
  dossierCount: number;
  discoveryItemCount: number;
  auditedItemCount: number;
  verifiedDataPointCount: number;
}

export const researchBaseForMarket = (market: Market): string =>
  market === "us" ? "/research" : `/${market}/research`;

export const cockpitKeyFor = (
  market: Market,
  category: Category,
  topic: string,
): CockpitKey => `${market}/${category}/${topic}`;

export const reviewItemId = (href: string): string => `review:${href}`;

export const productItemId = (
  market: Market,
  category: Category,
  productSlug: string,
): string => `product:${market}:${category}:${productSlug}`;

export const projectionNodeKey = (
  itemId: string,
  cockpitKey: CockpitKey | null,
): string => `${itemId}${cockpitKey ?? "review"}`;
