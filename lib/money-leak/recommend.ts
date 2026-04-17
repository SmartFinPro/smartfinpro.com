// lib/money-leak/recommend.ts
// Matches scored leak categories to active affiliate products.

import type { Market, Category, AffiliateLink } from '@/types';
import {
  getLinksForMarketCategory,
  getComplianceLabel,
} from '@/lib/affiliate/link-registry';
import type { LeakResult, Recommendation, LeakCategoryId } from './types';
import { CATEGORY_DEFINITIONS } from './leak-categories';

/**
 * Rank a link by commission value, penalizing unhealthy links.
 * Not shown to user — affects order only.
 */
function rankScore(link: AffiliateLink): number {
  const healthy = link.health_status !== 'dead' && link.health_status !== 'degraded';
  const base = Number(link.commission_value) || 1;
  return base * (healthy ? 1 : 0.5);
}

/**
 * For each top leak category, fetch the best-ranked active link across
 * the category's candidate affiliate categories. Returns at most `max` picks,
 * deduped by slug.
 */
export async function matchRecommendations(
  result: LeakResult,
  market: Market,
  max = 3,
): Promise<Recommendation[]> {
  const picks: Recommendation[] = [];
  const seen = new Set<string>();

  for (const leakId of result.topLeaks) {
    if (picks.length >= max) break;

    const category = result.categories.find((c) => c.id === leakId);
    if (!category || category.potentialSavings <= 0) continue;

    const def = CATEGORY_DEFINITIONS[leakId];
    const best = await findBestLinkForCategory(market, def.affiliateCategories, seen);
    if (!best) continue;

    seen.add(best.slug);
    picks.push({
      slug: best.slug,
      partner_name: best.partner_name,
      trackUrl: `/go/${best.slug}`,
      matchedCategory: leakId as LeakCategoryId,
      affiliateCategory: best.category,
      projectedAnnualSavings: category.potentialSavings,
      complianceLabel: getComplianceLabel(market, best.category),
    });
  }

  return picks;
}

async function findBestLinkForCategory(
  market: Market,
  affiliateCategories: Category[],
  seen: Set<string>,
): Promise<AffiliateLink | null> {
  for (const cat of affiliateCategories) {
    const links = await getLinksForMarketCategory(market, cat);
    const eligible = links.filter((l) => !seen.has(l.slug));
    if (eligible.length === 0) continue;
    eligible.sort((a, b) => rankScore(b) - rankScore(a));
    return eligible[0];
  }
  return null;
}
