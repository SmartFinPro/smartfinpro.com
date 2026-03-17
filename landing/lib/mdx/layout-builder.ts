/**
 * Layout Builder — Conversion Pyramide Engine
 *
 * Generates optimal component placement plans for hub and review pages.
 * The 5-step pyramid: Solution → Compare → Analyse → Confirm → Close
 */

import type { Market, Category } from '@/lib/i18n/config';
import type { ContentMeta, ContentItem } from '@/lib/mdx';

// ── Types ───────────────────────────────────────────────────────

export type LayoutZone =
  | 'hero-above'       // Before first text content (WinnerAtGlance)
  | 'after-hero'       // After hero/intro (StickyTOC, TrustAuthority)
  | 'after-second-h2'  // After 2nd H2 heading (ComparisonHub)
  | 'mid-content'      // Mid-page content break (FrictionlessCTA)
  | 'before-faq'       // Just before FAQ section (ExpertVerifier)
  | 'page-footer';     // Fixed/sticky CTAs (StickyFooterCTA)

export interface LayoutComponent {
  component: string;
  zone: LayoutZone;
  props: Record<string, unknown>;
  priority: number;
}

export interface LayoutPlan {
  pageType: 'hub' | 'review' | 'article' | 'pillar';
  components: LayoutComponent[];
}

// ── Helpers ─────────────────────────────────────────────────────

function parseReviewedBy(reviewedBy?: string): { name: string; title: string; credentials: string[] } {
  if (!reviewedBy) {
    return { name: 'SmartFinPro Team', title: 'Editorial Team', credentials: [] };
  }
  const parts = reviewedBy.split(',').map((s) => s.trim());
  return {
    name: parts[0] || 'SmartFinPro Team',
    title: parts.slice(1).join(', ') || 'Expert Reviewer',
    credentials: parts.slice(1),
  };
}

function buildWinnerCards(reviews: ContentItem[]): Record<string, unknown>[] {
  const taglines = ['Best Overall', 'Runner Up', 'Best Value'];
  return reviews.slice(0, 3).map((r, i) => ({
    rank: i + 1,
    name: r.meta.title.replace(/\s*Review\s*\d{4}.*$/i, '').replace(/\s*:\s*.+$/, ''),
    tagline: taglines[i] || `#${i + 1}`,
    rating: r.meta.rating || 4.5,
    highlight: r.meta.bestFor || r.meta.description.slice(0, 80),
    affiliateUrl: r.meta.affiliateUrl || `/${r.meta.market === 'us' ? '' : r.meta.market + '/'}${r.meta.category}/${r.slug}`,
    badge: i === 0 ? "Editor's Choice" : undefined,
  }));
}

// ── Hub/Pillar Page Funnel ──────────────────────────────────────

export function buildHubFunnel(
  market: Market,
  category: Category,
  topReviews: ContentItem[],
  meta?: ContentMeta,
): LayoutComponent[] {
  const components: LayoutComponent[] = [];
  const expert = parseReviewedBy(meta?.reviewedBy);

  // 1. Direct Solution — WinnerAtGlance
  if (topReviews.length >= 3) {
    components.push({
      component: 'WinnerAtGlance',
      zone: 'hero-above',
      priority: 100,
      props: {
        picks: buildWinnerCards(topReviews),
        title: `Top 3 ${categoryLabel(category)} Picks for 2026`,
        subtitle: 'Based on expert analysis & testing',
      },
    });
  }

  // 2. Sticky TOC
  components.push({
    component: 'StickyTableOfContents',
    zone: 'after-hero',
    priority: 90,
    props: {
      items: [
        { id: 'top-picks', label: 'Top Picks' },
        { id: 'comparison', label: 'Comparison' },
        { id: 'guide', label: 'Guide' },
        { id: 'faq', label: 'FAQ' },
      ],
    },
  });

  // 3. Quick Comparison — ComparisonHub
  components.push({
    component: 'ComparisonHub',
    zone: 'after-second-h2',
    priority: 95,
    props: { category, market },
  });

  // 4. Mid-content FrictionlessCTA for #1 product
  if (topReviews.length > 0) {
    const top = topReviews[0];
    components.push({
      component: 'FrictionlessCTA',
      zone: 'mid-content',
      priority: 80,
      props: {
        productName: top.meta.title.replace(/\s*Review\s*\d{4}.*$/i, '').replace(/\s*:\s*.+$/, ''),
        affiliateUrl: top.meta.affiliateUrl || '#',
        headline: 'Ready to Get Started?',
        socialProof: 'Join 500K+ professionals',
        market,
      },
    });
  }

  // 5. Expert Verification
  components.push({
    component: 'ExpertVerifier',
    zone: 'before-faq',
    priority: 70,
    props: {
      name: expert.name,
      title: expert.title,
      credentials: expert.credentials.length > 0 ? expert.credentials : ['Expert Reviewer'],
      lastFactChecked: meta?.modifiedDate || new Date().toISOString().split('T')[0],
      variant: 'default',
    },
  });

  // 6. Sticky Footer CTA
  if (topReviews.length > 0) {
    const top = topReviews[0];
    components.push({
      component: 'StickyFooterCTA',
      zone: 'page-footer',
      priority: 100,
      props: {
        productName: top.meta.title.replace(/\s*Review\s*\d{4}.*$/i, '').replace(/\s*:\s*.+$/, ''),
        affiliateUrl: top.meta.affiliateUrl || '#',
        ctaText: 'Get Started Free',
        secondaryText: top.meta.rating ? `${top.meta.rating}/5 Rating` : undefined,
        market,
      },
    });
  }

  return components;
}

// ── Review Page Funnel ──────────────────────────────────────────

export function buildReviewFunnel(
  meta: ContentMeta,
  market: Market,
  category: Category,
): LayoutComponent[] {
  const components: LayoutComponent[] = [];
  const expert = parseReviewedBy(meta.reviewedBy);

  // 1. Sticky TOC from sections
  if (meta.sections && meta.sections.length > 0) {
    components.push({
      component: 'StickyTableOfContents',
      zone: 'after-hero',
      priority: 90,
      props: {
        items: meta.sections.map((s) => ({ id: s.id, label: s.title })),
      },
    });
  }

  // 2. FrictionlessCTA mid-content
  if (meta.affiliateUrl) {
    const productName = meta.title.replace(/\s*Review\s*\d{4}.*$/i, '').replace(/\s*:\s*.+$/, '');
    components.push({
      component: 'FrictionlessCTA',
      zone: 'mid-content',
      priority: 80,
      props: {
        productName,
        affiliateUrl: meta.affiliateUrl,
        headline: `Ready to Try ${productName}?`,
        market,
      },
    });
  }

  // 3. Expert Verifier before FAQ
  components.push({
    component: 'ExpertVerifier',
    zone: 'before-faq',
    priority: 70,
    props: {
      name: expert.name,
      title: expert.title,
      credentials: expert.credentials.length > 0 ? expert.credentials : ['Expert Reviewer'],
      lastFactChecked: meta.modifiedDate || new Date().toISOString().split('T')[0],
      variant: 'default',
    },
  });

  // 4. Sticky Footer CTA
  if (meta.affiliateUrl) {
    const productName = meta.title.replace(/\s*Review\s*\d{4}.*$/i, '').replace(/\s*:\s*.+$/, '');
    components.push({
      component: 'StickyFooterCTA',
      zone: 'page-footer',
      priority: 100,
      props: {
        productName,
        affiliateUrl: meta.affiliateUrl,
        ctaText: 'Visit Site',
        secondaryText: meta.rating ? `${meta.rating}/5 · ${meta.pricing || 'Free'}` : undefined,
        market,
      },
    });
  }

  return components;
}

// ── Query Helpers ───────────────────────────────────────────────

export function getComponentsForZone(
  components: LayoutComponent[],
  zone: LayoutZone,
): LayoutComponent[] {
  return components
    .filter((c) => c.zone === zone)
    .sort((a, b) => b.priority - a.priority);
}

// ── Internal ────────────────────────────────────────────────────

function categoryLabel(cat: Category): string {
  const labels: Record<string, string> = {
    'ai-tools': 'AI Tools',
    'cybersecurity': 'Cybersecurity',
    'trading': 'Trading',
    'forex': 'Forex',
    'personal-finance': 'Personal Finance',
    'business-banking': 'Business Banking',
  };
  return labels[cat] || cat.replace('-', ' ');
}
